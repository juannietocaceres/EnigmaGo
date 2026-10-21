import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Icon, Logo } from '../lib/art';
import { sfx } from '../lib/sound';

export function Loader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="lamp min-h-dvh grid place-items-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <span className="absolute inset-0 rounded-full border-2 border-tape/25" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-tape animate-spin" />
          <span className="absolute inset-0 grid place-items-center text-tape"><Icon n="lens" s={26} /></span>
        </div>
        <p className="eyebrow">{label}</p>
      </div>
    </div>
  );
}

export function Notice({ title, text, home, action }: { title: string; text: string; home?: boolean; action?: ReactNode }) {
  return (
    <div className="lamp min-h-dvh grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center"><Logo size={26} /></div>
        <h1 className="title text-4xl">{title}</h1>
        <p className="mt-4 text-ink2 leading-relaxed">{text}</p>
        <div className="mt-8 flex flex-col gap-3 items-center">
          {action}
          {home && <Link to="/" className="btn btn-ghost">Ir al inicio</Link>}
        </div>
      </div>
    </div>
  );
}

export function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red/40 bg-red/10 px-3 py-2.5 text-sm text-[#ffb4ad]">
    <Icon n="x" s={16} className="mt-0.5 flex-none" />{msg}</p>;
}

/** Columna centrada para pantallas de celular (jugadores). */
export function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`lamp min-h-dvh ${className}`}><div className="mx-auto w-full max-w-[460px] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))]">{children}</div></div>;
}

export function QrImage({ text, size = 220, dark = '#0e0f12', light = '#ffffff', className = '' }: { text: string; size?: number; dark?: string; light?: string; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark, light } }).then(setSvg); }, [text, dark, light]);
  return <div className={className} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg.replace('<svg', `<svg width="${size}" height="${size}"`) }} />;
}

export function MuteButton() {
  const [m, setM] = useState(sfx.muted);
  return <button className="pill" onClick={() => setM(sfx.toggle())} aria-label={m ? 'Activar sonido' : 'Silenciar'}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6 9H3v6h3l5 4z" />{m ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />}</svg>
  </button>;
}

export function confetti() {
  const cols = ['#f2c641', '#efe6d2', '#d8463c', '#5fc59b', '#ffffff'];
  for (let i = 0; i < 80; i++) {
    const d = document.createElement('i'); d.className = 'confetti';
    d.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 5]};animation-duration:${1.8 + Math.random() * 1.8}s;animation-delay:${Math.random() * .5}s`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 4500);
  }
}

export function CaseDiff({ d }: { d: number }) {
  return <span className="diff">{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= d ? 'on' : ''} />)}</span>;
}
