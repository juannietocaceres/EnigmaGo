import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type Mode = 'app' | 'recorrido';
export type Status = 'lobby' | 'live' | 'finished';
export interface Clue { t: string; o: string[] }
export interface Case {
  key: string; title: string; minutes: number; difficulty: number;
  question: string; intro: string; suspects: string[]; clues: Clue[];
}
export interface EventRow {
  id: string; owner_id: string; code: string; company: string; case_key: string;
  mode: Mode; status: Status; started_at: string | null; finished_at: string | null; created_at: string;
}
export interface Team {
  id: string; event_id: string; device_id: string; name: string; color: string;
  score: number; correct: number; wrong: number; current_clue: number;
  accused: number | null; accused_ok: boolean | null; finished_at: string | null; created_at: string;
}
export interface AnswerRow { team_id: string; clue_index: number; option_index: number; is_correct: boolean; points: number }

const MESSAGES: Record<string, string> = {
  sin_sesion: 'No pudimos iniciar la sesión. Revisa tu conexión e inténtalo de nuevo.',
  datos_invalidos: 'Revisa los datos: hay algo incompleto o muy largo.',
  caso_no_existe: 'Ese caso ya no está disponible.',
  codigo_invalido: 'No encontramos un evento con ese código.',
  evento_cerrado: 'Este evento ya terminó.',
  evento_lleno: 'El evento ya tiene 12 equipos.',
  nombre_en_uso: 'Otro equipo ya usa ese nombre. Prueben con otro.',
  no_autorizado: 'No tienes permiso para hacer esto.',
  evento_no_activo: 'El caso no está en curso.',
  tiempo_agotado: 'Se acabó el tiempo del caso.',
  pista_fuera_de_orden: 'Esa pista ya se respondió.',
  opcion_invalida: 'Esa opción no es válida.',
  faltan_pistas: 'Primero resuelvan todas las pistas.',
  ya_acuso: 'Su equipo ya hizo la acusación.',
};
export class ApiError extends Error {
  code: string;
  constructor(code: string) { super(MESSAGES[code] || 'Algo salió mal. Inténtalo de nuevo.'); this.code = code; }
}
function fail(error: { message?: string } | null): never {
  const code = error?.message && MESSAGES[error.message] ? error.message : 'desconocido';
  throw new ApiError(code);
}
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  return data as T;
}

export const api = {
  async cases(): Promise<Case[]> {
    const { data, error } = await supabase.from('cases').select('*').order('minutes');
    if (error) fail(error);
    return data as Case[];
  },
  async caseByKey(key: string): Promise<Case> {
    const { data, error } = await supabase.from('cases').select('*').eq('key', key).single();
    if (error) fail(error);
    return data as Case;
  },
  async event(id: string): Promise<EventRow> {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) fail({ message: 'codigo_invalido' });
    return data as EventRow;
  },
  async teams(eventId: string): Promise<Team[]> {
    const { data, error } = await supabase.from('teams').select('*').eq('event_id', eventId);
    if (error) fail(error);
    return data as Team[];
  },
  async team(id: string): Promise<Team> {
    const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
    if (error) fail({ message: 'no_autorizado' });
    return data as Team;
  },
  async answers(teamId: string): Promise<AnswerRow[]> {
    const { data, error } = await supabase.from('answers').select('*').eq('team_id', teamId).order('clue_index');
    if (error) fail(error);
    return data as AnswerRow[];
  },
  createEvent: (company: string, caseKey: string, mode: Mode) =>
    rpc<EventRow>('create_event', { p_company: company, p_case_key: caseKey, p_mode: mode }),
  startEvent: (id: string) => rpc<EventRow>('start_event', { p_event: id }),
  finishEvent: (id: string) => rpc<{ culprit: number; solution: string }>('finish_event', { p_event: id }),
  joinEvent: (code: string, name: string, color: string) =>
    rpc<Team>('join_event', { p_code: code, p_name: name, p_color: color }),
  submitAnswer: (team: string, clue: number, option: number) =>
    rpc<{ is_correct: boolean; correct_index: number; points: number; score: number; current_clue: number }>(
      'submit_answer', { p_team: team, p_clue: clue, p_option: option }),
  accuse: (team: string, suspect: number) =>
    rpc<{ is_correct: boolean; culprit: number; solution: string; score: number }>('accuse', { p_team: team, p_suspect: suspect }),
};

/** Ranking: más puntos primero; en empate, quien terminó antes. */
export function rank(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => b.score - a.score
    || (a.finished_at ? +new Date(a.finished_at) : Infinity) - (b.finished_at ? +new Date(b.finished_at) : Infinity)
    || a.name.localeCompare(b.name));
}

/** Evento + equipos + caso, actualizados en vivo con Supabase Realtime. */
export function useLiveEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [kase, setKase] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const caseKey = useRef<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    (async () => {
      try {
        const ev = await api.event(eventId);
        if (!alive) return;
        setEvent(ev);
        if (caseKey.current !== ev.case_key){ caseKey.current = ev.case_key; setKase(await api.caseByKey(ev.case_key)); }
        setTeams(await api.teams(eventId));
      } catch (e) { if (alive) setError((e as Error).message); }
    })();
    const ch = supabase.channel(`event-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `event_id=eq.${eventId}` }, payload => {
        setTeams(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(t => t.id !== (payload.old as Team).id);
          const row = payload.new as Team;
          return prev.some(t => t.id === row.id) ? prev.map(t => t.id === row.id ? row : t) : [...prev, row];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, payload => {
        setEvent(payload.new as EventRow);
      })
      .subscribe();
    // Respaldo por si el tiempo real se cae (wifi de oficina, etc.)
    const poll = setInterval(async () => {
      try { const [ev, ts] = await Promise.all([api.event(eventId), api.teams(eventId)]); if (alive){ setEvent(ev); setTeams(ts); } } catch { /* reintenta */ }
    }, 8000);
    return () => { alive = false; clearInterval(poll); supabase.removeChannel(ch); };
  }, [eventId]);

  return { event, teams, kase, error, setEvent, setTeams };
}

/** Segundos restantes del caso (null si no ha empezado). */
export function useCountdown(startedAt: string | null | undefined, minutes: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!startedAt || !minutes) return null;
  return Math.max(0, Math.round((+new Date(startedAt) + minutes * 60000 - now) / 1000));
}
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const DIFF = ['', 'Fácil', 'Fácil', 'Media', 'Difícil', 'Experto'];
export const TEAM_COLORS = ['#f2c641', '#d8463c', '#5fc59b', '#6aa8ff', '#c08bff', '#ff8f5a', '#4fd1d9', '#f07ab8'];
export const qrPayload = (code: string, clue: number) => `EG:${code}:${clue}`;
