import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, DIFF, type Case, type Mode } from '../lib/api';
import { Icon, Logo } from '../lib/art';
import { CaseDiff, ErrorLine, Loader } from '../components/ui';

export default function Organize() {
  const nav = useNavigate();
  const [cases, setCases] = useState<Case[] | null>(null);
  const [company, setCompany] = useState('');
  const [caseKey, setCaseKey] = useState('collar-valdes');
  const [mode, setMode] = useState<Mode>('app');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.cases().then(setCases).catch(e => setErr(e.message)); }, []);
  if (!cases && !err) return <Loader label="Buscando casos…" />;

  const ok = company.trim().length >= 2 && !!caseKey;
  async function create() {
    if (!ok) return;
    setBusy(true); setErr(null);
    try { const ev = await api.createEvent(company.trim(), caseKey, mode); nav(`/evento/${ev.id}`); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="lamp min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
        <Link to="/"><Logo size={22} /></Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="title text-5xl md:text-6xl">Nuevo evento</h1>
        <p className="mt-3 text-ink2">Tres decisiones y queda listo para que entren los equipos.</p>

        <section className="mt-10">
          <label htmlFor="company" className="block text-lg font-bold">¿Para qué empresa o área es?</label>
          <input id="company" className="field mt-3 max-w-lg" maxLength={60} autoFocus placeholder="Ej. Equipo de Tecnología"
            value={company} onChange={e => setCompany(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold">¿Cuánto tiempo tienen?</h2>
          <p className="mt-1 text-sm text-ink3">El caso define la duración: más tiempo trae más pistas y más dificultad.</p>
          <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {cases?.map(c => (
              <button key={c.key} onClick={() => setCaseKey(c.key)} aria-pressed={caseKey === c.key}
                className={`folder text-left transition-transform hover:-translate-y-1 ${caseKey === c.key ? 'sel' : ''}`}>
                <span className="tab">EXPEDIENTE Nº 0{c.minutes}</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-5xl font-black tracking-tight">{c.minutes}<small className="ml-1 text-lg">min</small></span>
                  <span className="text-xs font-extrabold text-[#5a4a30]">{DIFF[c.difficulty]} <CaseDiff d={c.difficulty} /></span>
                </div>
                <h3 className="title mt-3 text-2xl">{c.title}</h3>
                <p className="mt-2 font-type text-[15px] leading-snug text-[#3b2f1f]">{c.intro}</p>
                <p className="mt-4 border-t border-dashed border-[#2a2116]/30 pt-3 text-xs font-extrabold text-[#5a4a30]">{c.clues.length} pistas y {c.suspects.length} sospechosos</p>
                {caseKey === c.key && <span className="stamp stamp-in right-4 top-5">Elegido</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold">¿Cómo se juega?</h2>
          <div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2">
            {([['app', 'phone', 'En el celular', 'Las pistas aparecen solas. Ideal para un salón o una reunión.'],
               ['recorrido', 'qr', 'Recorrido con QR', 'Cada pista se desbloquea escaneando un QR pegado en la oficina.']] as const).map(([m, ic, t, d]) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                className={`card p-5 text-left transition-colors ${mode === m ? '!border-tape bg-tape/8' : 'hover:border-white/15'}`}>
                <Icon n={ic} s={26} className={mode === m ? 'text-tape' : 'text-ink3'} />
                <b className="mt-3 block text-lg">{t}</b>
                <span className="mt-1 block text-sm leading-relaxed text-ink2">{d}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-lg">
          <button className="btn btn-tape w-full" disabled={!ok || busy} onClick={create}>
            <Icon n="lens" s={20} />{busy ? 'Creando…' : 'Crear evento'}
          </button>
          {!company.trim() && <p className="mt-2 text-sm text-ink3">Escribe el nombre de la empresa para continuar.</p>}
          <ErrorLine msg={err} />
        </div>
      </main>
    </div>
  );
}
