import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import QrScanner from 'qr-scanner';
import { api, mmss, qrPayload, rank, useCountdown, useLiveEvent, type AnswerRow, type Case, type EventRow, type Team } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Icon, Polaroid, Silhouette, splitName } from '../lib/art';
import { sfx } from '../lib/sound';
import { confetti, ErrorLine, Loader, MuteButton, Notice, Phone } from '../components/ui';

const store = {
  get: (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set: (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v)),
};
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function Play() {
  const { teamId = '' } = useParams();
  const [first, setFirst] = useState<Team | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    api.team(teamId).then(setFirst).catch(() => setLoadErr(true));
    supabase.auth.getUser().then(r => setUid(r.data.user?.id ?? null));
  }, [teamId]);

  const { event, teams, kase } = useLiveEvent(first?.event_id);
  const [me, setMe] = useState<Team | null>(null);
  // El equipo local solo avanza: ignora filas en vivo más viejas que lo que ya sabemos.
  useEffect(() => {
    const live = teams.find(t => t.id === teamId) || first;
    if (!live) return;
    setMe(cur => {
      if (!cur) return live;
      const newer = live.current_clue > cur.current_clue
        || (live.accused !== null && cur.accused === null)
        || (live.current_clue === cur.current_clue && live.score >= cur.score);
      return newer ? live : cur;
    });
  }, [teams, first, teamId]);

  const [introSeen, setIntroSeen] = useState<boolean>(() => !!store.get(`eg-intro-${teamId}`));
  const [busyClue, setBusyClue] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<{ is_correct: boolean; culprit: number; solution: string } | null>(() => store.get(`eg-verdict-${teamId}`));
  const [revealing, setRevealing] = useState(false);

  if (loadErr) return <Notice title="No encontramos tu equipo" text="Vuelve a unirte con el código del evento." action={<a className="btn btn-go" href="/unirse">Unirme con un código</a>} />;
  if (!me || !event || !kase || !uid) return <Loader label="Buscando tu expediente…" />;
  if (me.device_id !== uid) return <Notice title="Este equipo se juega desde otro celular" text="Para jugar, únete con el código del evento desde este dispositivo." action={<a className="btn btn-go" href={`/unirse?c=${event.code}`}>Unirme con el código</a>} />;

  const n = kase.clues.length;
  if (revealing && verdict) return <Reveal kase={kase} picked={me.accused ?? 0} verdict={verdict} onDone={() => setRevealing(false)} />;
  if (me.accused !== null || event.status === 'finished') return <Results me={me} teams={teams} kase={kase} event={event} verdict={verdict} />;
  if (event.status === 'lobby') return <Lobby me={me} teams={teams} kase={kase} event={event} />;
  if (!introSeen && me.current_clue === 0) return <Dossier kase={kase} event={event} onStart={() => { store.set(`eg-intro-${teamId}`, 1); setIntroSeen(true); }} />;

  const clue = busyClue ?? me.current_clue;
  if (clue < n) return <ClueStep key={clue} me={me} kase={kase} event={event} clue={clue}
    onBusy={setBusyClue} onAnswered={res => { setMe(m => m && ({ ...m, score: res.score, current_clue: res.current_clue, correct: m.correct + (res.is_correct ? 1 : 0), wrong: m.wrong + (res.is_correct ? 0 : 1) })); setBusyClue(null); }} />;
  return <Accuse me={me} kase={kase} event={event} onVerdict={(v, suspect) => {
    store.set(`eg-verdict-${teamId}`, v); setVerdict(v); setRevealing(true);
    setMe(m => m && ({ ...m, accused: suspect, accused_ok: v.is_correct, score: v.score, finished_at: new Date().toISOString() }));
  }} />;
}

/* ---------- barra superior ---------- */
function Hud({ me, kase, event, clue }: { me: Team; kase: Case; event: EventRow; clue: number }) {
  const left = useCountdown(event.started_at, kase.minutes);
  const [notes, setNotes] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="team-dot" style={{ color: me.color, background: me.color }} />
        <b className="min-w-0 flex-1 truncate">{me.name}</b>
        {left !== null && <span className={`pill ${left < 300 ? 'text-red' : ''}`}><Icon n="clock" s={14} className="text-tape" />{mmss(left)}</span>}
        <span className="pill"><Icon n="star" s={13} className="text-tape" />{me.score}</span>
        <button className="pill" onClick={() => setNotes(true)} aria-label="Libreta del equipo"><Icon n="book" s={15} /></button>
        <MuteButton />
      </div>
      <div className="slots mt-4">{kase.clues.map((_, k) => <i key={k} className={k < clue ? 'ok' : k === clue ? 'now' : ''} />)}</div>
      <AnimatePresence>{notes && <Notebook me={me} kase={kase} onClose={() => setNotes(false)} />}</AnimatePresence>
    </>
  );
}

function Notebook({ me, kase, onClose }: { me: Team; kase: Case; onClose: () => void }) {
  const [rows, setRows] = useState<AnswerRow[] | null>(null);
  useEffect(() => { api.answers(me.id).then(setRows).catch(() => setRows([])); }, [me.id]);
  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div className="sheet-panel absolute inset-x-0 bottom-0 mx-auto max-h-[78dvh] max-w-[460px] overflow-auto rounded-t-[28px] px-6 pb-10 pt-4"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#2a2116]/25" />
        <h3 className="title text-3xl">Libreta del equipo</h3>
        {!rows ? <p className="mt-4 font-hand text-2xl text-[#7a6a50]">Abriendo…</p>
          : rows.length === 0 ? <p className="mt-4 font-hand text-2xl text-[#7a6a50]">Todavía no hay deducciones.</p>
          : <ul className="mt-3">{rows.map(r => (
              <li key={r.clue_index} className="flex gap-3 py-2 font-hand text-[23px] leading-tight">
                <b className={`mt-1 grid h-6 w-6 flex-none place-items-center rounded-md font-sans text-sm text-white ${r.is_correct ? 'bg-[#1f7a55]' : 'bg-red'}`}>{r.is_correct ? '✓' : '✗'}</b>
                <span><span className="text-[#7a6a50]">Pista {r.clue_index + 1}:</span> {kase.clues[r.clue_index]?.o[r.option_index]}{r.is_correct ? '' : ' (pista falsa)'}</span>
              </li>))}</ul>}
      </motion.div>
    </motion.div>
  );
}

/* ---------- sala de espera ---------- */
function Lobby({ me, teams, kase, event }: { me: Team; teams: Team[]; kase: Case; event: EventRow }) {
  return (
    <Phone>
      <p className="text-ink3">{event.company}</p>
      <h1 className="title mt-1 text-4xl">{kase.title}</h1>
      <div className="mt-14 flex flex-col items-center text-center">
        <motion.div className="flex gap-1" style={{ color: me.color }} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
          {[0, 1, 2].map(i => <Silhouette key={i} />)}
        </motion.div>
        <h2 className="title mt-6 text-3xl">{me.name} está en la escena</h2>
        <p className="mt-3 max-w-[30ch] text-ink2">El caso se abre cuando el organizador lo inicie. No cierren esta pantalla.</p>
        <span className="mt-6 flex items-center gap-2 text-sm text-ink3"><span className="h-2 w-2 animate-pulse rounded-full bg-tape" />Esperando a que empiece</span>
      </div>
      <div className="card mt-12 p-5">
        <p className="text-sm text-ink3">{teams.length} equipo{teams.length === 1 ? ' conectado' : 's conectados'}</p>
        <ul className="mt-3 flex flex-wrap gap-2">{teams.map(t => (
          <li key={t.id} className="flex items-center gap-2 rounded-full bg-s2 px-3 py-1.5 text-sm font-bold"><span className="team-dot !h-2.5 !w-2.5" style={{ color: t.color, background: t.color }} />{t.name}</li>))}</ul>
      </div>
    </Phone>
  );
}

/* ---------- expediente ---------- */
function Dossier({ kase, event, onStart }: { kase: Case; event: EventRow; onStart: () => void }) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    sfx.stamp(); let i = 0;
    const t = setInterval(() => { i++; setTyped(kase.intro.slice(0, i)); if (i % 2 === 0) sfx.key(); if (i >= kase.intro.length) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [kase.intro]);
  const done = typed.length >= kase.intro.length;
  return (
    <Phone>
      <motion.div className="folder mt-8 origin-top" initial={{ rotateX: -70, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: .9, ease: [.2, .8, .2, 1] }} style={{ transformPerspective: 900 }}>
        <span className="tab">EXPEDIENTE Nº 0{kase.minutes}</span>
        <span className="stamp stamp-in right-4 top-5" style={{ animationDelay: '.7s' }}>Confidencial</span>
        <h1 className="title mt-8 pr-16 text-[34px]">{kase.title}</h1>
        <div className="mt-4 grid grid-cols-3 border-y border-dashed border-[#2a2116]/35 py-3 text-center">
          {[[kase.clues.length, 'pistas'], [kase.suspects.length, 'sospechosos'], [kase.minutes, 'minutos']].map(([v, l]) => (
            <div key={l}><b className="block text-xl font-black">{v}</b><span className="text-[10px] font-bold text-[#6b5634]">{l}</span></div>))}
        </div>
        <p className={`typed mt-4 min-h-[88px] font-type text-[16.5px] leading-snug text-[#2f2518] ${done ? 'done' : ''}`}>{typed}</p>
      </motion.div>
      <p className="mt-8 text-sm text-ink3">Los sospechosos. Uno de ellos miente.</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {kase.suspects.map((s, k) => (
          <motion.div key={s} initial={{ opacity: 0, y: 30, rotate: -12 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: .9 + k * .08 }}>
            <Polaroid name={s} k={k} />
          </motion.div>))}
      </div>
      {event.mode === 'recorrido' && <p className="mt-6 flex gap-2 rounded-xl bg-s1 p-3 text-sm text-ink2"><Icon n="qr" s={18} className="flex-none text-tape" />Cada pista está escondida en un QR. Búsquenlo, escanéenlo y se abre la pregunta.</p>}
      <button className="btn btn-go mt-6 w-full" onClick={onStart}>Empezar la investigación<Icon n="next" s={18} /></button>
    </Phone>
  );
}

/* ---------- escáner QR ---------- */
function Scanner({ event, clue, onUnlock }: { event: EventRow; clue: number; onUnlock: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [camErr, setCamErr] = useState(false);
  const [found, setFound] = useState(false);
  const [manual, setManual] = useState('');
  const expected = qrPayload(event.code, clue + 1), manualCode = `${event.code}-${clue + 1}`;

  const unlock = async () => { setFound(true); sfx.scan(); await wait(800); onUnlock(); };
  useEffect(() => {
    if (!video.current) return;
    const sc = new QrScanner(video.current, r => {
      if (found) return;
      if (r.data === expected) { sc.stop(); unlock(); }
      else if (r.data.startsWith(`EG:${event.code}:`)) setMsg(`Ese QR es de la pista ${r.data.split(':')[2]}. Busquen la pista ${clue + 1}.`);
      else setMsg('Ese no es un QR de este caso.');
    }, { returnDetailedScanResult: true, preferredCamera: 'environment', maxScansPerSecond: 6 });
    sc.start().catch(() => setCamErr(true));
    return () => sc.destroy();
  }, [expected]);

  return (
    <div className={`mt-6 ${found ? 'found' : ''}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-[#14161a]">
        <video ref={video} className="h-full w-full object-cover" playsInline muted />
        {camErr && <div className="absolute inset-0 grid place-items-center p-8 text-center text-ink2">
          <div><Icon n="qr" s={36} className="mx-auto text-ink3" /><p className="mt-3">No pudimos abrir la cámara. Den permiso en el navegador o escriban el código que aparece debajo del QR.</p></div></div>}
        <div className="finder"><i /><i /><i /><i /><div className="laser" /></div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-center">
          <b className="block text-lg">{found ? 'Pista desbloqueada' : `Busquen el QR de la pista ${clue + 1}`}</b>
          {msg && !found && <span className="text-sm text-[#ffb4ad]">{msg}</span>}
        </div>
      </div>
      <details className="mt-4 rounded-2xl bg-s1 p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink2"><Icon n="keyboard" s={17} />¿No lee el QR? Escriban el código</summary>
        <div className="mt-3 flex gap-2">
          <input className="field !h-12 flex-1 uppercase" placeholder={`${event.code}-${clue + 1}`} value={manual} onChange={e => setManual(e.target.value.toUpperCase())} />
          <button className="btn btn-go btn-sm !h-12" onClick={() => manual.trim() === manualCode ? unlock() : setMsg('Ese código no corresponde a esta pista.')}>Abrir</button>
        </div>
        {msg && <p className="mt-2 text-sm text-[#ffb4ad]">{msg}</p>}
      </details>
    </div>
  );
}

/* ---------- una pista ---------- */
type AnswerRes = { is_correct: boolean; correct_index: number; points: number; score: number; current_clue: number };
function ClueStep({ me, kase, event, clue, onBusy, onAnswered }: {
  me: Team; kase: Case; event: EventRow; clue: number; onBusy: (c: number | null) => void; onAnswered: (r: AnswerRes) => void;
}) {
  const unlockKey = `eg-unlock-${me.id}`;
  const [unlocked, setUnlocked] = useState<boolean>(() => event.mode !== 'recorrido' || (store.get(unlockKey) || []).includes(clue));
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerRes | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const c = kase.clues[clue];

  async function answer(k: number) {
    if (picked !== null) return;
    setPicked(k); setErr(null); onBusy(clue);
    try {
      const r = await api.submitAnswer(me.id, clue, k);
      setRes(r); r.is_correct ? sfx.ok() : sfx.bad(); setTimeout(() => sfx.stamp(), 120);
      await wait(1800); onAnswered(r);
    } catch (e) { setErr((e as Error).message); setPicked(null); onBusy(null); }
  }

  return (
    <Phone>
      <Hud me={me} kase={kase} event={event} clue={clue} />
      {!unlocked ? (
        <Scanner event={event} clue={clue} onUnlock={() => { store.set(unlockKey, [...(store.get(unlockKey) || []), clue]); setUnlocked(true); }} />
      ) : (
        <>
          <motion.div className="evidence mx-1 mt-8" initial={{ opacity: 0, y: 40, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: -1.2 }} transition={{ duration: .7, ease: [.2, .8, .2, 1] }}>
            <span className="inline-block border-[1.5px] border-[#2a2116] px-2 py-0.5 text-[10px] font-extrabold tracking-[.18em]">EVIDENCIA Nº {String(clue + 1).padStart(2, '0')}</span>
            <p className="mt-4 font-type text-[19px] leading-[1.38]">{c.t}</p>
            {res && <span className={`stamp stamp-in ${res.is_correct ? 'ok' : ''}`}>{res.is_correct ? 'Deducción correcta' : 'Pista falsa'}</span>}
          </motion.div>
          <div className="mt-6 grid gap-2.5">
            {c.o.map((o, k) => {
              const state = res ? (k === res.correct_index ? 'ok' : k === picked ? 'bad' : 'dim') : picked === k ? 'wait' : '';
              return (
                <motion.button key={k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 + k * .07 }}
                  disabled={picked !== null} onClick={() => answer(k)}
                  className={`flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-left font-semibold leading-snug transition-colors
                    ${state === 'ok' ? 'border-ok bg-ok/12' : state === 'bad' ? 'border-red bg-red/12' : state === 'wait' ? 'border-tape bg-tape/8' : state === 'dim' ? 'border-white/5 bg-s1 opacity-50' : 'border-white/8 bg-s1 hover:border-white/20'}`}>
                  <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-black ${state === 'ok' ? 'bg-ok text-bg' : state === 'bad' ? 'bg-red text-white' : 'bg-s3'}`}>{'ABCDEF'[k]}</span>{o}
                </motion.button>);
            })}
          </div>
          <ErrorLine msg={err} />
          <p className="mt-5 text-center text-xs text-ink3">Pónganse de acuerdo antes de tocar: solo hay una respuesta por pista.</p>
          <AnimatePresence>{res && <motion.div className="float" initial={false}>+{res.points}</motion.div>}</AnimatePresence>
        </>
      )}
    </Phone>
  );
}

/* ---------- acusación ---------- */
function Accuse({ me, kase, event, onVerdict }: { me: Team; kase: Case; event: EventRow; onVerdict: (v: { is_correct: boolean; culprit: number; solution: string; score: number }, suspect: number) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function accuse() {
    if (pick === null) return;
    setBusy(true); setErr(null);
    try { onVerdict(await api.accuse(me.id, pick), pick); } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  const who = pick === null ? '' : splitName(kase.suspects[pick])[0].replace(/^(El|La|Un|Una) /, m => m.toLowerCase());
  return (
    <Phone>
      <Hud me={me} kase={kase} event={event} clue={kase.clues.length} />
      <h1 className="title mt-8 text-[34px]">{kase.question}</h1>
      <p className="mt-2 text-ink2">Revisen la libreta y pónganse de acuerdo. Solo hay una oportunidad.</p>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
        {kase.suspects.map((s, k) => (
          <Polaroid key={s} name={s} k={k} className={`cursor-pointer !p-2 ${pick === k ? 'sel !rotate-0 scale-[1.03]' : ''}`} onClick={() => { setPick(k); sfx.tap(); }}>
            <svg className="circle" viewBox="0 0 200 240" preserveAspectRatio="none"><path d="M100 8C40 6 6 50 8 120s40 112 96 112 90-50 88-118S150 6 92 14" /></svg>
          </Polaroid>))}
      </div>
      <button className="btn btn-red mt-8 w-full" disabled={pick === null || busy} onClick={accuse}>
        <Icon n="gavel" s={20} />{pick === null ? 'Elijan a un sospechoso' : busy ? 'Acusando…' : `Acusar a ${who}`}</button>
      <ErrorLine msg={err} />
    </Phone>
  );
}

/* ---------- revelación ---------- */
function Reveal({ kase, picked, verdict, onDone }: { kase: Case; picked: number; verdict: { is_correct: boolean; culprit: number }; onDone: () => void }) {
  const [lit, setLit] = useState(-1);
  const [final, setFinal] = useState(false);
  useEffect(() => {
    let off = false;
    (async () => {
      await wait(700);
      let delay = 90;
      for (let s = 0; s < 13 + verdict.culprit; s++) { if (off) return; setLit(s % 4); sfx.tick(); await wait(delay); delay *= 1.09; }
      await wait(450); if (off) return;
      setFinal(true); sfx.stamp(); sfx.hit(verdict.is_correct); if (verdict.is_correct) confetti();
    })();
    return () => { off = true; };
  }, []);
  const name = splitName(kase.suspects[verdict.culprit])[0];
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#060607] px-5 pb-10 pt-[max(70px,env(safe-area-inset-top))]">
      <div className="spot" style={{ transform: `rotate(${-(lit - 1.5) * 22}deg)` }} />
      <div className="relative mx-auto flex max-w-[460px] flex-col items-center text-center">
        <h1 className="title min-h-[88px] text-[40px]">{!final ? 'El culpable es…' : verdict.is_correct ? '¡Lo atraparon!' : 'Fallaron la acusación'}</h1>
        <div className="rv mt-6 grid w-full grid-cols-4 gap-2">
          {kase.suspects.map((s, k) => (
            <Polaroid key={s} name={s} k={k} className={final ? (k === verdict.culprit ? 'lit' : k === picked ? 'picked' : 'out') : lit === k ? 'lit' : ''}>
              {final && k === verdict.culprit && <span className="stamp">Culpable</span>}
              {final && !verdict.is_correct && k === picked && <span className="stamp ok">Inocente</span>}
            </Polaroid>))}
        </div>
        <AnimatePresence>{final && (
          <motion.div className="mt-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <b className={`title block text-[46px] ${verdict.is_correct ? 'text-tape' : 'text-red'}`}>{name}</b>
            <p className="mt-3 text-ink2">{verdict.is_correct ? 'Su deducción fue correcta. +50 puntos para el equipo.' : 'No era quien señalaron. Igual suman los puntos de las pistas.'}</p>
            <button className="btn btn-go mt-10 w-full" onClick={onDone}>Ver resultados<Icon n="next" s={18} /></button>
          </motion.div>)}</AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- resultados ---------- */
function Results({ me, teams, kase, event, verdict }: { me: Team; teams: Team[]; kase: Case; event: EventRow; verdict: { is_correct: boolean; culprit: number; solution: string } | null }) {
  const ranked = rank(teams.some(t => t.id === me.id) ? teams.map(t => t.id === me.id ? { ...t, ...me } : t) : [...teams, me]);
  const pos = ranked.findIndex(t => t.id === me.id) + 1;
  const accused = me.accused !== null;
  return (
    <Phone>
      <p className="text-ink3">{kase.title}</p>
      <h1 className="title mt-1 text-[42px]">{!accused ? 'Se acabó el tiempo.' : me.accused_ok ? 'Caso resuelto.' : 'Se les escapó.'}</h1>
      <p className="mt-3 text-lg text-ink2">{me.name} {ranked.length > 1 ? <>va de <b className="text-tape">{pos}º</b> entre {ranked.length} equipos.</> : <>es el único equipo por ahora.</>}</p>

      <div className="card mt-7 p-5">
        {[[`Pistas acertadas, ${me.correct} × 30`, me.correct * 30], [`Pistas falladas, ${me.wrong} × 10`, me.wrong * 10], [accused ? `Acusación ${me.accused_ok ? 'correcta' : 'fallida'}` : 'Sin acusación', me.accused_ok ? 50 : 0]].map(([l, v]) => (
          <div key={l as string} className="flex justify-between border-b border-dashed border-white/12 py-2.5 text-ink2"><span>{l}</span><b className="text-ink">{v}</b></div>))}
        <div className="flex items-baseline justify-between pt-3"><span className="text-sm text-ink3">Total</span><b className="text-5xl font-black tabular-nums text-tape">{me.score}</b></div>
      </div>

      {verdict && <div className="mt-5 rotate-[.8deg] rounded bg-paper p-5 text-[#2a2116]">
        <p className="text-xs font-extrabold text-[#6b5634]">Cómo se resolvía</p>
        <p className="mt-2 font-type leading-snug">{verdict.solution}</p></div>}

      <h2 className="mt-9 font-bold">Ranking {event.status === 'finished' ? 'final' : 'en vivo'}</h2>
      <ol className="mt-3 flex flex-col gap-2">
        {ranked.map((t, i) => (
          <motion.li layout key={t.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${t.id === me.id ? 'border-tape/50 bg-tape/8' : 'border-white/8 bg-s1'}`}>
            <span className="title w-6 text-xl text-ink3">{i + 1}</span>
            <span className="team-dot" style={{ color: t.color, background: t.color }} />
            <b className="min-w-0 flex-1 truncate">{t.name}</b>
            <span className="font-black tabular-nums">{t.score}</span>
          </motion.li>))}
      </ol>
      {event.status !== 'finished' && <p className="mt-4 text-center text-sm text-ink3">Otros equipos siguen jugando. El ranking se actualiza solo.</p>}
    </Phone>
  );
}
