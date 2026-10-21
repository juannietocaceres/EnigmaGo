import { useParams } from 'react-router-dom';
import { qrPayload, useLiveEvent } from '../lib/api';
import { Icon } from '../lib/art';
import { Loader, Notice, QrImage } from '../components/ui';
import { joinUrl } from './Console';

/** Hojas imprimibles: un QR por pista, más el QR para unirse. */
export default function QrSheet() {
  const { id } = useParams();
  const { event, kase, error } = useLiveEvent(id);
  if (error) return <Notice title="No encontramos este evento" text="Revisa el enlace." home />;
  if (!event || !kase) return <Loader />;

  const cards = [
    { title: 'Únete al caso', sub: `Código ${event.code}`, text: joinUrl(event.code), hint: 'Escanea con la cámara del celular', manual: '' },
    ...kase.clues.map((_, i) => ({ title: `Pista ${i + 1}`, sub: kase.title, text: qrPayload(event.code, i + 1), hint: 'Escanea desde la app de Enigma Go', manual: `${event.code}-${i + 1}` })),
  ];

  return (
    <div className="min-h-dvh bg-[#e9e3d6] text-[#17130a] print:bg-white">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-bg px-6 py-4 text-ink">
        <p className="text-sm text-ink2">Imprime estas hojas y pega cada pista en un lugar distinto de la oficina. Recorta por la línea punteada.</p>
        <button className="btn btn-go btn-sm" onClick={() => print()}><Icon n="print" s={16} />Imprimir</button>
      </div>
      <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-6 p-6 sm:grid-cols-2 print:max-w-none print:gap-0 print:p-0">
        {cards.map((c, i) => (
          <div key={i} className="print-page relative flex flex-col items-center border-2 border-dashed border-[#17130a]/30 bg-white px-8 py-10 text-center print:h-[50vh] print:justify-center print:border-x-0 print:border-t-0">
            <div className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(-45deg,#f2c641_0_14px,#17130a_14px_28px)]" />
            <p className="font-sans text-xs font-extrabold tracking-[.2em] text-[#6b5634]">ENIGMA GO</p>
            <h2 className="title mt-2 text-5xl">{c.title}</h2>
            <p className="mt-2 font-type text-sm text-[#3b2f1f]">{c.sub}</p>
            <div className="mt-6"><QrImage text={c.text} size={220} dark="#17130a" /></div>
            <p className="mt-5 text-sm font-bold">{c.hint}</p>
            {c.manual && <p className="mt-1 font-type text-xs text-[#6b5634]">Si no lee el QR, escriban: {c.manual}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
