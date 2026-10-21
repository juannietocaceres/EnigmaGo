import { Link } from 'react-router-dom';
import { Icon, Logo, Polaroid, Tape } from '../lib/art';

const BOARD = [
  { n: 'El jardinero', x: 4, y: 6, k: 0 },
  { n: 'La cocinera', x: 52, y: 0, k: 1 },
  { n: 'El mayordomo', x: 62, y: 46, k: 2 },
  { n: 'La sobrina', x: 18, y: 50, k: 3 },
];

export default function Home() {
  return (
    <div className="lamp min-h-dvh overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Logo size={24} />
        <Link to="/unirse" className="btn btn-ghost btn-sm">Tengo un código</Link>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-28 pt-10 md:grid-cols-[1.05fr_.95fr] md:pt-16">
        <section>
          <h1 className="title text-[clamp(48px,8vw,96px)]">
            El próximo evento de tu empresa es un caso sin resolver.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink2">
            Arma equipos, reparte las pistas por la oficina y mira en una pantalla quién resuelve primero.
            Cada equipo juega desde su celular, sin instalar nada.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/organizar" className="btn btn-tape"><Icon n="building" s={20} />Organizar un evento</Link>
            <Link to="/unirse" className="btn btn-ghost"><Icon n="users" s={20} />Unirme a un equipo</Link>
          </div>
        </section>

        {/* tablero de evidencias */}
        <section aria-hidden className="relative mx-auto aspect-[1/1] w-full max-w-[520px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g stroke="#d8463c" strokeWidth=".5" fill="none" opacity=".9">
              <path d="M20 10 Q 45 18 68 6" /><path d="M20 10 Q 18 36 34 54" /><path d="M68 6 Q 82 28 78 50" /><path d="M34 54 Q 56 66 78 50" />
            </g>
          </svg>
          {BOARD.map(b => (
            <div key={b.n} className="absolute w-[34%]" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
              <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff8a80,#d8463c_60%,#7a1f19)] shadow-md" />
              <Polaroid name={b.n} k={b.k} seed={2} />
            </div>
          ))}
          <span className="stamp left-[36%] top-[40%] z-20 bg-bg/70 text-base !mix-blend-normal">¿Quién fue?</span>
        </section>
      </main>

      <section className="relative border-t border-white/5 bg-s1/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            ['building', 'Tú lo organizas', 'Eliges el caso según el tiempo del evento: de 15 a 75 minutos. Si quieres un recorrido, imprimes los QR y los pegas por la oficina.'],
            ['users', 'Ellos lo resuelven', 'Cada equipo entra con un código desde su celular. Para avanzar tienen que ponerse de acuerdo: una sola respuesta por pista.'],
            ['chart', 'Todos lo ven', 'El marcador se actualiza en vivo en la pantalla del evento. Al final se revela el culpable y gana quien sumó más puntos.'],
          ].map(([ic, t, d]) => (
            <div key={t}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tape/12 text-tape"><Icon n={ic} s={24} /></span>
              <h2 className="title mt-5 text-3xl">{t}</h2>
              <p className="mt-3 leading-relaxed text-ink2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative h-24 overflow-hidden"><Tape className="top-8 -rotate-2" /></div>
    </div>
  );
}
