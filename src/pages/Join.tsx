import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, TEAM_COLORS } from '../lib/api';
import { Icon, Logo, Silhouette } from '../lib/art';
import { sfx } from '../lib/sound';
import { ErrorLine, Phone } from '../components/ui';

const LAST = 'eg-last-team';

export default function Join() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('c') || '').toUpperCase().slice(0, 6));
  const [name, setName] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const last = (() => { try { return JSON.parse(localStorage.getItem(LAST) || 'null') as { id: string; name: string } | null; } catch { return null; } })();

  const ok = code.length === 6 && name.trim().length >= 2;
  async function join() {
    if (!ok || busy) return;
    setBusy(true); setErr(null);
    try {
      const t = await api.joinEvent(code, name.trim(), color);
      localStorage.setItem(LAST, JSON.stringify({ id: t.id, name: t.name }));
      sfx.join(); nav(`/jugar/${t.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <Phone>
      <div className="flex items-center justify-between"><Link to="/"><Logo size={22} /></Link></div>
      <h1 className="title mt-10 text-5xl">Únete al caso</h1>
      <p className="mt-3 text-ink2">Un celular por equipo. El código está en la pantalla del evento.</p>

      <label htmlFor="code" className="mt-9 block font-bold">Código del evento</label>
      <div className="relative mt-3" onClick={() => document.getElementById('code')?.focus()}>
        <div className="flex justify-between gap-2" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`grid h-16 flex-1 place-items-center rounded-xl text-3xl font-black transition-colors
              ${code[i] ? 'bg-paper text-[#17130a] shadow-[0_6px_0_#c9ad75]' : 'border border-white/10 bg-s2 text-ink3'} ${i === code.length ? 'ring-2 ring-tape' : ''}`}>{code[i] || ''}</span>
          ))}
        </div>
        <input id="code" value={code} autoComplete="off" autoCapitalize="characters" inputMode="text" maxLength={6}
          onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); sfx.key(); }}
          className="absolute inset-0 w-full cursor-text opacity-0" aria-label="Código de 6 caracteres" />
      </div>

      <label htmlFor="team" className="mt-8 block font-bold">Nombre del equipo</label>
      <input id="team" className="field mt-3" maxLength={24} placeholder="Ej. Los Sabuesos" value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && join()} />

      <p className="mt-8 font-bold">Color</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {TEAM_COLORS.map(c => <button key={c} className={`swatch ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={c === color} />)}
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/8 bg-s1 p-4">
        <div className="flex gap-0.5" style={{ color }}>{[0, 1, 2].map(i => <Silhouette key={i} />)}</div>
        <div className="min-w-0"><b className="block truncate">{name.trim() || 'Tu equipo'}</b><span className="text-sm text-ink3">Así los verán en el marcador</span></div>
      </div>

      <button className="btn btn-tape mt-8 w-full" disabled={!ok || busy} onClick={join}><Icon n="lens" s={20} />{busy ? 'Entrando…' : 'Entrar al caso'}</button>
      <ErrorLine msg={err} />
      {last && <Link to={`/jugar/${last.id}`} className="mt-6 block text-center text-sm text-ink2 underline underline-offset-4">Volver a mi equipo: {last.name}</Link>}
    </Phone>
  );
}
