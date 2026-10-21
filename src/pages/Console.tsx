import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { api, mmss, rank, useCountdown, useLiveEvent, type Team } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Icon, Logo, Polaroid, splitName } from '../lib/art';
import { sfx } from '../lib/sound';
import { ErrorLine, Loader, Notice, QrImage } from '../components/ui';

export const joinUrl = (code: string) => `${location.origin}/unirse?c=${code}`;

export function CodeBoxes({ code, big }: { code: string; big?: boolean }) {
  return <div className="flex gap-2">{code.split('').map((ch, i) => (
    <span key={i} className={`grid place-items-center rounded-xl bg-paper font-black text-[#17130a] shadow-[0_8px_0_#c9ad75] ${big ? 'h-28 w-20 text-7xl' : 'h-16 w-12 text-4xl'}`}>{ch}</span>
  ))}</div>;
}

function TeamRow({ t, n, live }: { t: Team; n: number; live: boolean }) {
  const done = t.accused !== null;
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="card flex items-center gap-4 px-4 py-3.5">
      <span className="team-dot" style={{ color: t.color, background: t.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <b className="truncate text-[15px]">{t.name}</b>
          {live && <span className="font-black tabular-nums text-tape">{t.score}</span>}
        </div>
        {live && <div className="slots mt-2">{Array.from({ length: n }, (_, k) => <i key={k} className={k < t.current_clue ? 'ok' : k === t.current_clue && !done ? 'now' : ''} />)}</div>}
      </div>
      {live && <span className={`text-xs font-extrabold ${done ? (t.accused_ok ? 'text-ok' : 'text-red') : 'text-ink3'}`}>
        {done ? (t.accused_ok ? 'Resolvió el caso' : 'Falló la acusación') : t.current_clue >= n ? 'Acusando' : `Pista ${t.current_clue + 1} de ${n}`}</span>}
    </motion.li>
  );
}

export default function Console() {
  const { id } = useParams();
  const { event, teams, kase, error, setEvent } = useLiveEvent(id);
  const [uid, setUid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [solution, setSolution] = useState<{ culprit: number; solution: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const left = useCountdown(event?.started_at, kase?.minutes);

  useEffect(() => { supabase.auth.getUser().then(r => setUid(r.data.user?.id ?? null)); }, []);
  useEffect(() => { if (teams.length) sfx.join(); }, [teams.length]);
  useEffect(() => {
    if (event?.status === 'finished' && !solution && uid === event.owner_id) api.finishEvent(event.id).then(setSolution).catch(() => {});
  }, [event?.status, uid]);

  if (error) return <Notice title="No encontramos este evento" text="Revisa el enlace o crea un evento nuevo." home />;
  if (!event || !kase || !uid) return <Loader label="Abriendo el expediente…" />;
  if (uid !== event.owner_id) return <Notice title="Este panel es del organizador"
    text="Si eres parte de un equipo, únete con el código del evento." action={<Link className="btn btn-go" to={`/unirse?c=${event.code}`}>Unirme con el código</Link>} />;

  const n = kase.clues.length, ranked = rank(teams), live = event.status !== 'lobby';
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(null); try { await fn(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  const start = () => act(async () => { setEvent(await api.startEvent(event.id)); sfx.stamp(); });
  const finish = () => { if (confirm('¿Terminar el evento? Los equipos ya no podrán responder.')) act(async () => { setSolution(await api.finishEvent(event.id)); setEvent({ ...event, status: 'finished' }); }); };
  const copy = async () => { await navigator.clipboard.writeText(joinUrl(event.code)); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const statusLabel = { lobby: 'Esperando equipos', live: 'Caso en curso', finished: 'Caso cerrado' }[event.status];

  return (
    <div className="lamp min-h-dvh">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <Link to="/"><Logo size={22} /></Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`pill ${event.status === 'live' ? '!border-tape/50 text-tape' : ''}`}>
            {event.status === 'live' && <span className="h-2 w-2 animate-pulse rounded-full bg-tape" />}{statusLabel}</span>
          {left !== null && event.status === 'live' && <span className={`pill ${left < 300 ? 'text-red' : ''}`}><Icon n="clock" s={15} />{mmss(left)}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <p className="text-ink3">{event.company}</p>
        <h1 className="title mt-1 text-4xl md:text-5xl">{kase.title}</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
          <aside className="flex flex-col gap-5">
            <div className="card p-6">
              <p className="text-sm text-ink2">Código para entrar</p>
              <div className="mt-3"><CodeBoxes code={event.code} /></div>
              <div className="mt-6 flex items-center gap-4">
                <div className="rounded-xl bg-white p-2"><QrImage text={joinUrl(event.code)} size={112} /></div>
                <div className="min-w-0 text-sm text-ink2">
                  <p>Escaneen este QR o entren a</p>
                  <p className="mt-1 break-all font-bold text-ink">{location.host}/unirse</p>
                  <button className="btn btn-ghost btn-sm mt-3" onClick={copy}><Icon n={copied ? 'check' : 'copy'} s={16} />{copied ? 'Copiado' : 'Copiar enlace'}</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {event.status === 'lobby' && <button className="btn btn-tape" disabled={busy || teams.length === 0} onClick={start}><Icon n="play" s={18} />Iniciar el caso</button>}
              {event.status === 'lobby' && teams.length === 0 && <p className="-mt-1 text-sm text-ink3">Se puede iniciar cuando entre al menos un equipo.</p>}
              <a className="btn btn-ghost" href={`/evento/${event.id}/marcador`} target="_blank" rel="noreferrer"><Icon n="screen" s={18} />Abrir marcador para proyectar</a>
              {event.mode === 'recorrido' && <a className="btn btn-ghost" href={`/evento/${event.id}/qr`} target="_blank" rel="noreferrer"><Icon n="print" s={18} />Imprimir los QR del recorrido</a>}
              {event.status === 'live' && <button className="btn btn-red" disabled={busy} onClick={finish}><Icon n="flag" s={18} />Terminar el evento</button>}
              <ErrorLine msg={err} />
            </div>
          </aside>

          <section>
            {event.status === 'finished' && solution && (
              <div className="folder mb-8 grid gap-5 sm:grid-cols-[150px_1fr]">
                <span className="tab">CASO CERRADO</span>
                <div className="relative"><Polaroid name={kase.suspects[solution.culprit]} k={solution.culprit} />
                  <span className="stamp stamp-in left-1/2 top-[40%] -translate-x-1/2 bg-paper/80 !mix-blend-normal">Culpable</span></div>
                <div>
                  <h2 className="title text-3xl">{splitName(kase.suspects[solution.culprit])[0]}</h2>
                  <p className="mt-3 font-type leading-snug text-[#3b2f1f]">{solution.solution}</p>
                  {ranked[0] && <p className="mt-4 font-bold">Ganó <span style={{ color: '#2a2116' }}>{ranked[0].name}</span> con {ranked[0].score} puntos.</p>}
                </div>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">{live ? 'Ranking en vivo' : 'Equipos'}</h2>
              <span className="text-sm text-ink3">{teams.length} de 12</span>
            </div>
            {teams.length === 0
              ? <div className="mt-4 rounded-[22px] border border-dashed border-white/15 px-6 py-14 text-center text-ink2">
                  Cuando los equipos entren con el código, aparecerán aquí.</div>
              : <ul className="mt-4 flex flex-col gap-2.5"><AnimatePresence>{ranked.map(t => <TeamRow key={t.id} t={t} n={n} live={live} />)}</AnimatePresence></ul>}
          </section>
        </div>
      </main>
    </div>
  );
}
