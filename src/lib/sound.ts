// Efectos de sonido sintetizados con Web Audio (sin archivos).
let ctx: AudioContext | null = null, out: GainNode, nb: AudioBuffer;
let muted = localStorage.getItem('eg-mute') === '1';

function init(): number | null {
  if (muted) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext(); out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination);
      nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    ctx.resume(); return ctx.currentTime;
  } catch { return null; }
}
function tone(f: number, t: number, d: number, type: OscillatorType = 'sine', v = .2) {
  const o = ctx!.createOscillator(), g = ctx!.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .05);
}
function noise(t: number, d: number, v = .3, hp = 800) {
  const s = ctx!.createBufferSource(), f = ctx!.createBiquadFilter(), g = ctx!.createGain();
  s.buffer = nb; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * .5); s.stop(t + d + .02);
}
const play = (fn: (t: number) => void) => { const t = init(); if (t !== null) fn(t); };

export const sfx = {
  get muted() { return muted; },
  toggle() { muted = !muted; localStorage.setItem('eg-mute', muted ? '1' : '0'); return muted; },
  key: () => play(t => noise(t, .03, .07, 2500)),
  tap: () => play(t => tone(900, t, .06, 'triangle', .08)),
  ok: () => play(t => [659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .4, 'triangle', .16))),
  bad: () => play(t => { tone(155, t, .3, 'sawtooth', .1); tone(110, t + .14, .45, 'sawtooth', .1); }),
  stamp: () => play(t => { noise(t, .14, .55, 150); tone(80, t, .22, 'sine', .45); }),
  scan: () => play(t => { tone(1800, t, .07, 'square', .05); tone(2400, t + .09, .14, 'square', .05); }),
  tick: () => play(t => noise(t, .04, .25, 1200)),
  join: () => play(t => [523, 784].forEach((f, i) => tone(f, t + i * .1, .35, 'triangle', .12))),
  hit: (win: boolean) => play(t => { tone(55, t, 1.4, 'sine', .6); noise(t, .5, .4, 90); (win ? [523, 659, 784, 1047] : [294, 349, 415]).forEach(f => tone(f, t + .05, 1.8, 'triangle', .1)); }),
};
