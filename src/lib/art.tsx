import type { CSSProperties, ReactNode } from 'react';

/* ---------- íconos ---------- */
const IC: Record<string, string> = {
  lens: '<circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 21v-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5M8 7h8M8 11h6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  gavel: '<path d="M14 4l6 6M11 7l6 6M12.5 5.5l-5 5M18.5 11.5l-5 5M10 13l-7 7"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M15.5 14.2A5.5 5.5 0 0 1 21.5 20"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
  screen: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  building: '<path d="M4 21V5l8-2v18M12 8l8 2v11M8 8h0M8 12h0M8 16h0M16 13h0M16 17h0M2 21h20"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h0M10 10h0M14 10h0M18 10h0M7 14h10"/>',
  refresh: '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/>',
};
export function Icon({ n, s = 20, className = '' }: { n: string; s?: number; className?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}
    strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: IC[n] }} />;
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="brand" style={{ fontSize: size }}>
      <Icon n="lens" s={size + 4} className="text-tape" />
      <b>Enigma <span className="text-tape">Go</span></b>
    </span>
  );
}

export function Tape({ text = 'ENIGMA GO · NO PASAR · ESCENA DEL CRIMEN', className = '', style }: { text?: string; className?: string; style?: CSSProperties }) {
  const line = Array.from({ length: 8 }, () => text).join(' · ') + ' · ';
  return <div className={`tape ${className}`} style={style}><span>{line}{line}</span></div>;
}

/* ---------- retratos generados ---------- */
function rnd(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function portraitSVG(name: string, seed: number) {
  const r = rnd(seed * 97 + name.length), pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const bg = ['#3e4a57', '#5a3e3b', '#3d5548', '#5c5139', '#4a3d5c', '#2f4c5a'][seed % 6];
  const skin = pick(['#f1c8a5', '#e0ad86', '#c08a63', '#8d5a3b']);
  const hair = pick(['#1d1410', '#4a3020', '#9a6a35', '#2b2b2b', '#7d7d7d']);
  const n = name.toLowerCase();
  let shirt = pick(['#22262e', '#6b2e2e', '#2e4a6b', '#4b4b2e', '#d9d2c0']);
  const fem = /^(la |camila|sofía)/.test(n) || /vecina|sobrina|curadora|guía|ingeniera|conductora|cocinera|señora/.test(n);
  const id = `sh${seed}${name.length}`;
  const shade = `<defs><radialGradient id="${id}" cx=".5" cy=".3" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs><rect width="100" height="120" fill="url(#${id})"/>`;
  if (/perro/.test(n)) {
    return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="120" fill="${bg}"/>
      <ellipse cx="50" cy="118" rx="40" ry="26" fill="#8a5a2b"/>
      <path d="M22 40c-8 6-10 30-2 36 6-4 10-20 10-30z" fill="#5e3b1c"/><path d="M78 40c8 6 10 30 2 36-6-4-10-20-10-30z" fill="#5e3b1c"/>
      <ellipse cx="50" cy="58" rx="26" ry="28" fill="#a06a35"/><ellipse cx="50" cy="74" rx="14" ry="11" fill="#d9b48a"/>
      <ellipse cx="50" cy="68" rx="6" ry="4.5" fill="#1d1410"/><circle cx="40" cy="52" r="3.4" fill="#1d1410"/><circle cx="60" cy="52" r="3.4" fill="#1d1410"/>
      <path d="M44 80q6 5 12 0" stroke="#1d1410" stroke-width="2" fill="none"/><rect x="34" y="92" width="32" height="7" rx="3" fill="#d8463c"/>${shade}</svg>`;
  }
  let top = '', extra = '';
  const shortHair = `<path d="M31 42c0-17 8-24 19-24s19 7 19 24c-4-9-10-12-19-12s-15 3-19 12z" fill="${hair}"/>`;
  if (/jardin/.test(n)) { shirt = '#3f6b3a'; top = `<ellipse cx="50" cy="34" rx="34" ry="7" fill="#d8b56a"/><path d="M33 34c0-14 7-20 17-20s17 6 17 20z" fill="#e2c27a"/><rect x="33" y="28" width="34" height="4" fill="#8a5a2b"/>`; }
  else if (/cocin/.test(n)) { shirt = '#efe9dc'; top = `<rect x="35" y="18" width="30" height="20" rx="4" fill="#fff"/><circle cx="38" cy="18" r="8" fill="#fff"/><circle cx="50" cy="13" r="9" fill="#fff"/><circle cx="62" cy="18" r="8" fill="#fff"/>`; }
  else if (/guardia|portero|conductora/.test(n)) { shirt = '#2e3f5c'; top = `<path d="M30 36c0-14 9-20 20-20s20 6 20 20z" fill="#1f2b40"/><rect x="28" y="33" width="44" height="6" rx="3" fill="#141c2b"/><circle cx="50" cy="26" r="3" fill="#f2c641"/>`; }
  else if (/mayordomo|camarero/.test(n)) { shirt = '#15171c'; extra = `<path d="M44 92l6 4 6-4-6 9z" fill="#d8d0bd"/><path d="M45 96l5 3 5-3v4l-5-2-5 2z" fill="#d8463c"/>`; top = shortHair; }
  else if (/mensajero/.test(n)) { shirt = '#c4572e'; top = `<path d="M30 38c0-14 9-21 20-21s20 7 20 21z" fill="#e0e0e0"/><path d="M48 18h4v18h-4z" fill="#c4572e"/>`; }
  else if (/restaurador/.test(n)) { top = `<path d="M31 42c0-17 8-24 19-24s19 7 19 24c-3-6-8-9-11-9-6 2-12 2-17 0-4 2-8 5-10 9z" fill="#9a9a9a"/>`; }
  else if (fem) {
    top = r() > .45
      ? `<path d="M27 74c-4-30 4-56 23-56s27 26 23 56c-3-12-5-30-8-36-6 4-24 4-30 0-3 6-5 24-8 36z" fill="${hair}"/>`
      : `<circle cx="50" cy="16" r="9" fill="${hair}"/><path d="M31 44c0-17 8-25 19-25s19 8 19 25c-4-10-10-13-19-13s-15 3-19 13z" fill="${hair}"/>`;
    if (/señora|curadora/.test(n)) extra = `<path d="M38 92q12 10 24 0" stroke="#f2c641" stroke-width="2.5" fill="none"/><circle cx="50" cy="99" r="3" fill="#f2c641"/>`;
  } else top = r() > .5
    ? `<path d="M26 36h48l-5-3-3-13c-1-4-5-5-8-4l-8 3-8-3c-3-1-7 0-8 4l-3 13z" fill="#2a241c"/><rect x="31" y="31" width="38" height="4" fill="#5a3a22"/>`
    : shortHair;
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="120" fill="${bg}"/>
    <path d="M10 120c0-22 17-34 40-34s40 12 40 34z" fill="${shirt}"/><rect x="43" y="68" width="14" height="18" fill="${skin}"/>
    <ellipse cx="50" cy="52" rx="18" ry="21" fill="${skin}"/>
    <circle cx="43" cy="52" r="2" fill="#1d1410"/><circle cx="57" cy="52" r="2" fill="#1d1410"/><path d="M45 63q5 3 10 0" stroke="#1d1410" stroke-width="1.6" fill="none" opacity=".7"/>
    ${top}${extra}${shade}</svg>`;
}
export const splitName = (s: string) => { const p = s.split(','); return [p[0].trim(), (p[1] || '').trim()] as const; };

export function Polaroid({ name, k, seed = 0, className = '', onClick, children, style }: {
  name: string; k: number; seed?: number; className?: string; onClick?: () => void; children?: ReactNode; style?: CSSProperties;
}) {
  const [a, b] = splitName(name);
  return (
    <div className={`pol ${className}`} onClick={onClick} role={onClick ? 'button' : undefined}
      style={{ ['--r' as string]: `${[-3, 2.5, -1.5, 3][k % 4]}deg`, ...style }}>
      <div dangerouslySetInnerHTML={{ __html: portraitSVG(name, k + seed * 4) }} />
      <span className="pol-n">{a}</span><span className="pol-r">{b}</span>
      {children}
    </div>
  );
}

export function Silhouette({ color = 'currentColor' }: { color?: string }) {
  return <svg viewBox="0 0 26 40" fill={color} width={26} height={40}><path d="M4 13.5h18l-2.2-1.6-1.3-6.4c-.3-1.5-1.8-2.3-3.2-1.8l-2.3.8-2.3-.8c-1.4-.5-2.9.3-3.2 1.8L6.2 11.9z" /><circle cx="13" cy="18.5" r="5" /><path d="M2 40c0-9 4.5-14 11-14s11 5 11 14z" /></svg>;
}
