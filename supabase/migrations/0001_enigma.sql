-- Enigma Go para empresas — esquema inicial.
-- Toda escritura pasa por funciones security definer; las tablas solo se leen.

-- ---------- catálogo de casos ----------
create table public.cases (
  key         text primary key check (key ~ '^[a-z0-9-]{3,40}$'),
  title       text not null check (char_length(title) between 3 and 80),
  minutes     int  not null check (minutes between 10 and 120),
  difficulty  int  not null check (difficulty between 1 and 5),
  question    text not null,
  intro       text not null,
  suspects    jsonb not null check (jsonb_typeof(suspects) = 'array'),
  clues       jsonb not null check (jsonb_typeof(clues) = 'array'),
  created_at  timestamptz not null default now()
);

create table public.case_secrets (
  case_key  text primary key references public.cases(key) on delete cascade,
  answers   int[] not null,
  culprit   int  not null check (culprit >= 0),
  solution  text not null
);

-- ---------- eventos y equipos ----------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code         text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  company      text not null check (char_length(btrim(company)) between 2 and 60),
  case_key     text not null references public.cases(key),
  mode         text not null check (mode in ('app', 'recorrido')),
  status       text not null default 'lobby' check (status in ('lobby', 'live', 'finished')),
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index events_owner_idx on public.events (owner_id);

create table public.teams (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  device_id     uuid not null default auth.uid(),
  name          text not null check (char_length(btrim(name)) between 2 and 24),
  color         text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  score         int  not null default 0 check (score >= 0),
  correct       int  not null default 0 check (correct >= 0),
  wrong         int  not null default 0 check (wrong >= 0),
  current_clue  int  not null default 0 check (current_clue >= 0),
  accused       int,
  accused_ok    boolean,
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (event_id, name)
);
create index teams_event_idx on public.teams (event_id);

create table public.answers (
  team_id       uuid not null references public.teams(id) on delete cascade,
  clue_index    int  not null check (clue_index >= 0),
  option_index  int  not null check (option_index between 0 and 5),
  is_correct    boolean not null,
  points        int  not null,
  created_at    timestamptz not null default now(),
  primary key (team_id, clue_index)
);

-- ---------- reglas de acceso ----------
alter table public.cases        enable row level security;
alter table public.case_secrets enable row level security;  -- sin políticas: nadie lee por la API
alter table public.events       enable row level security;
alter table public.teams        enable row level security;
alter table public.answers      enable row level security;

create policy "casos visibles con sesión"   on public.cases  for select to authenticated using (true);
create policy "eventos visibles con sesión" on public.events for select to authenticated using (true);
create policy "equipos visibles con sesión" on public.teams  for select to authenticated using (true);
create policy "respuestas del equipo o del organizador" on public.answers for select to authenticated using (
  exists (select 1 from public.teams t where t.id = answers.team_id and t.device_id = auth.uid())
  or exists (select 1 from public.teams t join public.events e on e.id = t.event_id
             where t.id = answers.team_id and e.owner_id = auth.uid())
);

-- ---------- funciones ----------
create or replace function public.gen_event_code() returns text
language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.events where code = c);
  end loop;
  return c;
end $$;

create or replace function public.create_event(p_company text, p_case_key text, p_mode text)
returns public.events
language plpgsql security definer set search_path = public as $$
declare ev public.events;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_company is null or char_length(btrim(p_company)) not between 2 and 60
     or p_mode not in ('app', 'recorrido') then
    raise exception 'datos_invalidos';
  end if;
  if not exists (select 1 from public.cases where key = p_case_key) then
    raise exception 'caso_no_existe';
  end if;
  insert into public.events (owner_id, code, company, case_key, mode)
  values (auth.uid(), public.gen_event_code(), btrim(p_company), p_case_key, p_mode)
  returning * into ev;
  return ev;
end $$;

create or replace function public.start_event(p_event uuid)
returns public.events
language plpgsql security definer set search_path = public as $$
declare ev public.events;
begin
  update public.events set status = 'live', started_at = now()
   where id = p_event and owner_id = auth.uid() and status = 'lobby'
  returning * into ev;
  if ev.id is null then raise exception 'no_autorizado'; end if;
  return ev;
end $$;

create or replace function public.finish_event(p_event uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare ev public.events; s public.case_secrets;
begin
  update public.events set status = 'finished', finished_at = coalesce(finished_at, now())
   where id = p_event and owner_id = auth.uid()
  returning * into ev;
  if ev.id is null then raise exception 'no_autorizado'; end if;
  select * into s from public.case_secrets where case_key = ev.case_key;
  return json_build_object('culprit', s.culprit, 'solution', s.solution);
end $$;

create or replace function public.join_event(p_code text, p_name text, p_color text)
returns public.teams
language plpgsql security definer set search_path = public as $$
declare ev public.events; tm public.teams;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into ev from public.events where code = upper(btrim(p_code));
  if ev.id is null then raise exception 'codigo_invalido'; end if;
  if ev.status = 'finished' then raise exception 'evento_cerrado'; end if;
  if (select count(*) from public.teams where event_id = ev.id) >= 12 then raise exception 'evento_lleno'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 24
     or p_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'datos_invalidos';
  end if;
  begin
    insert into public.teams (event_id, device_id, name, color)
    values (ev.id, auth.uid(), btrim(p_name), p_color)
    returning * into tm;
  exception when unique_violation then
    raise exception 'nombre_en_uso';
  end;
  return tm;
end $$;

create or replace function public.submit_answer(p_team uuid, p_clue int, p_option int)
returns json
language plpgsql security definer set search_path = public as $$
declare tm public.teams; ev public.events; cs public.cases; s public.case_secrets;
        ok boolean; pts int;
begin
  select * into tm from public.teams where id = p_team for update;
  if tm.id is null or tm.device_id <> auth.uid() then raise exception 'no_autorizado'; end if;
  select * into ev from public.events where id = tm.event_id;
  if ev.status <> 'live' then raise exception 'evento_no_activo'; end if;
  select * into cs from public.cases where key = ev.case_key;
  -- 5 minutos de gracia sobre el tiempo del caso
  if now() > ev.started_at + make_interval(mins => cs.minutes + 5) then raise exception 'tiempo_agotado'; end if;
  if p_clue <> tm.current_clue or p_clue >= jsonb_array_length(cs.clues) then raise exception 'pista_fuera_de_orden'; end if;
  if p_option < 0 or p_option >= jsonb_array_length(cs.clues -> p_clue -> 'o') then raise exception 'opcion_invalida'; end if;
  select * into s from public.case_secrets where case_key = ev.case_key;
  ok  := (s.answers[p_clue + 1] = p_option);
  pts := case when ok then 30 else 10 end;
  insert into public.answers (team_id, clue_index, option_index, is_correct, points)
  values (tm.id, p_clue, p_option, ok, pts);
  update public.teams set
    score = score + pts,
    correct = correct + (case when ok then 1 else 0 end),
    wrong = wrong + (case when ok then 0 else 1 end),
    current_clue = current_clue + 1
  where id = tm.id returning * into tm;
  return json_build_object('is_correct', ok, 'correct_index', s.answers[p_clue + 1],
                           'points', pts, 'score', tm.score, 'current_clue', tm.current_clue);
end $$;

create or replace function public.accuse(p_team uuid, p_suspect int)
returns json
language plpgsql security definer set search_path = public as $$
declare tm public.teams; ev public.events; cs public.cases; s public.case_secrets; ok boolean;
begin
  select * into tm from public.teams where id = p_team for update;
  if tm.id is null or tm.device_id <> auth.uid() then raise exception 'no_autorizado'; end if;
  select * into ev from public.events where id = tm.event_id;
  if ev.status <> 'live' then raise exception 'evento_no_activo'; end if;
  select * into cs from public.cases where key = ev.case_key;
  if tm.current_clue < jsonb_array_length(cs.clues) then raise exception 'faltan_pistas'; end if;
  if tm.accused is not null then raise exception 'ya_acuso'; end if;
  if p_suspect < 0 or p_suspect >= jsonb_array_length(cs.suspects) then raise exception 'opcion_invalida'; end if;
  select * into s from public.case_secrets where case_key = ev.case_key;
  ok := (s.culprit = p_suspect);
  update public.teams set
    accused = p_suspect, accused_ok = ok, finished_at = now(),
    score = score + (case when ok then 50 else 0 end)
  where id = tm.id returning * into tm;
  return json_build_object('is_correct', ok, 'culprit', s.culprit, 'solution', s.solution, 'score', tm.score);
end $$;

-- Solo usuarios con sesión ejecutan las funciones públicas.
revoke all on function public.gen_event_code() from public, anon, authenticated;
revoke all on function public.create_event(text, text, text)  from public, anon;
revoke all on function public.start_event(uuid)               from public, anon;
revoke all on function public.finish_event(uuid)              from public, anon;
revoke all on function public.join_event(text, text, text)    from public, anon;
revoke all on function public.submit_answer(uuid, int, int)   from public, anon;
revoke all on function public.accuse(uuid, int)               from public, anon;
grant execute on function public.create_event(text, text, text)  to authenticated;
grant execute on function public.start_event(uuid)               to authenticated;
grant execute on function public.finish_event(uuid)              to authenticated;
grant execute on function public.join_event(text, text, text)    to authenticated;
grant execute on function public.submit_answer(uuid, int, int)   to authenticated;
grant execute on function public.accuse(uuid, int)               to authenticated;

-- ---------- tiempo real ----------
alter publication supabase_realtime add table public.events, public.teams;
