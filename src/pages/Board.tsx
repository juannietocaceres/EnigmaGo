import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { api, mmss, rank, useCountdown, useLiveEvent } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Icon, Logo, Polaroid, splitName, Tape } from '../lib/art';
import { sfx } from '../lib/sound';
import { confetti, Loader, Notice, QrImage } from '../components/ui';
import { CodeBoxes, joinUrl } from './Console';

/** Pantalla para proyectar en el evento. Se actualiza sola. */
export default function Board() {
  const { id } = useParams();
  const { event, teams, kase, error } = useLiveEvent(id);
  const left = useCountdown(event?.started_at, kase?.minutes);
  const [solution, setSolution] = useState<{ culprit: number; solution: string } | null>(null);
  const prev = useRef<Record<string, number>>({});
  const [bumped, setBumped] = useState<Record<string, number>>({});

  useEffect(() => {
    const b: Record<string, number> = {};
    teams.forEach(t => { if (prev.current[t.id] !== undefined && t.score > prev.current[t.id]) b[t.id] = t.score - prev.current[t.id]; prev.current[t.id] = t.score; });
    if (Object.keys(b).length) { setBumped(b); sfx.tick(); const tm = setTimeout(() => setBumped({}), 1600); return () => clearTimeout(tm); }
  }, [teams]);
  useEffect(() => {
    if (event?.status !== 'finished' || solution) return;
    supabase.auth.getUser().then(r => { if (r.data.user?.id === event.owner_id) api.finishEvent(event.id).then(s => { setSolution(s); confetti(); sfx.hit(true); }).catch(() => {}); });
  }, [event?.status]);

  if (error) return <Notice title="No encontramos este evento" text="Revisa el enlace del marcador." home />;
  if (!event || !kase) return <Loader label="Encendiendo el marcador…" />;
  const n = kase.clues.length, ranked = rank(teams), max = Math.max(1, ...teams.map(t => t.score));

  return (
    <div className="lamp relative min-h-dvh overflow-hidden px-[4vw] py-[3.5vh]">
      <header className="flex items-start justify-between gap-6">
        <div>
          <Logo size={26} />
          <p className="mt-5 text-[1.4vw] text-ink2">{event.company}</p>
          <h1 className="title text-[3.6vw]">{kase.title}</h1>
        </div>
        <div className="text-right">
          {event.status === 'live' && left !== null && <>
            <p className="text-[1.1vw] text-ink3">Tiempo restante</p>
            <p className={`font-black tabular-nums leading-none text-[6vw] ${left < 300 ? 'text-red' : 'text-ink'}`}>{mmss(left)}</p>
          </>}
          {event.status === 'finished' && <span className="stamp stamp-in relative inline-block text-[1.6vw] !mix-blend-normal">Caso cerrado</span>}
        </div>
      </header>

      {event.status === 'lobby' ? (
        <section className="mt-[5vh] grid items-center gap-[4vw] lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-start gap-6">
            <p className="text-[1.6vw] text-ink2">Entren con este código</p>
            <CodeBoxes code={event.code} big />
            <div className="mt-4 flex items-center gap-5">
              <div className="rounded-2xl bg-white p-3"><QrImage text={joinUrl(event.code)} size={170} /></div>
              <p className="text-[1.3vw] text-ink2">o escaneen el QR<br /><b className="text-ink">{location.host}/unirse</b></p>
            </div>
          </div>
          <div>
            <p className="text-[1.4vw] text-ink2">{teams.length ? `${teams.length} equipo${teams.length > 1 ? 's' : ''} en la escena` : 'Esperando al primer equipo…'}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AnimatePresence>{teams.map(t => (
                <motion.span key={t.id} initial={{ scale: .4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: .5 }}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-s2 px-5 py-3 text-[1.5vw] font-bold">
                  <span className="team-dot" style={{ color: t.color, background: t.color }} />{t.name}</motion.span>
              ))}</AnimatePresence>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-[4vh] grid gap-[3vw] xl:grid-cols-[1fr_28vw]">
          <ol className="flex flex-col gap-[1.2vh]">
            <AnimatePresence>{ranked.map((t, i) => {
              const done = t.accused !== null;
              return (
                <motion.li key={t.id} layout transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  className={`relative flex items-center gap-[1.6vw] rounded-[1.4vw] border px-[1.6vw] py-[1.5vh] ${i === 0 && t.score > 0 ? 'border-tape/50 bg-tape/8' : 'border-white/8 bg-s1'}`}>
                  <span className={`title w-[3vw] text-center text-[3vw] ${i === 0 ? 'text-tape' : 'text-ink3'}`}>{i + 1}</span>
                  <span className="team-dot !h-[1.2vw] !w-[1.2vw]" style={{ color: t.color, background: t.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <b className="truncate text-[1.8vw]">{t.name}</b>
                      {done && <span className={`stamp stamp-in relative !rotate-[-4deg] text-[.8vw] !mix-blend-normal ${t.accused_ok ? 'ok' : ''}`}>{t.accused_ok ? 'Resuelto' : 'Falló'}</span>}
                    </div>
                    <div className="mt-[1vh] h-[.9vh] overflow-hidden rounded-full bg-s3">
                      <motion.div className="h-full rounded-full" style={{ background: t.color }} animate={{ width: `${(t.score / max) * 100}%` }} transition={{ duration: .8 }} />
                    </div>
                  </div>
                  <span className="w-[9vw] text-right text-[1.1vw] text-ink3">{done ? '' : t.current_clue >= n ? 'Acusando' : `Pista ${t.current_clue + 1}/${n}`}</span>
                  <span className="w-[7vw] text-right font-black tabular-nums text-[2.6vw]">{t.score}</span>
                  <AnimatePresence>{bumped[t.id] && (
                    <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -18 }} exit={{ opacity: 0 }}
                      className="absolute right-[1.6vw] top-0 font-black text-[1.5vw] text-tape">+{bumped[t.id]}</motion.span>)}</AnimatePresence>
                </motion.li>
              );
            })}</AnimatePresence>
          </ol>

          <aside className="hidden xl:block">
            {event.status === 'finished' && solution ? (
              <div className="folder">
                <span className="tab">EL CULPABLE</span>
                <div className="relative mx-auto w-[55%]"><Polaroid name={kase.suspects[solution.culprit]} k={solution.culprit} />
                  <span className="stamp stamp-in left-1/2 top-[40%] -translate-x-1/2 bg-paper/80 text-[1vw] !mix-blend-normal">Culpable</span></div>
                <h2 className="title mt-4 text-center text-[2.2vw]">{splitName(kase.suspects[solution.culprit])[0]}</h2>
                <p className="mt-3 font-type text-[1vw] leading-snug text-[#3b2f1f]">{solution.solution}</p>
              </div>
            ) : (
              <div className="card p-[1.6vw]">
                <p className="text-[1.1vw] text-ink3">Los sospechosos</p>
                <div className="mt-4 grid grid-cols-2 gap-[1vw]">{kase.suspects.map((s, k) => <Polaroid key={s} name={s} k={k} />)}</div>
                <p className="mt-5 flex items-center gap-2 text-[1vw] text-ink3"><Icon n="users" s={18} />Código para entrar: <b className="text-ink">{event.code}</b></p>
              </div>
            )}
          </aside>
        </section>
      )}
      <Tape className="bottom-[3vh] -rotate-1" />
    </div>
  );
}
