// Genera supabase/seed.sql (casos) y supabase/setup.sql (migración + casos)
// a partir de supabase/cases.json. Mezcla el orden de las opciones de forma
// determinista para que la respuesta correcta no sea siempre la primera.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../supabase/', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('cases.json', root), 'utf8'));

function rnd(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const q = s => `'${String(s).replace(/'/g, "''")}'`;

const rows = cases.map((c, ci) => {
  const r = rnd(1000 + ci * 17);
  const answers = [];
  const clues = c.clues.map(cl => {
    const right = cl.o[cl.a];
    const o = [...cl.o];
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    answers.push(o.indexOf(right));
    return { t: cl.t, o };
  });
  return `insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  ${q(c.key)}, ${q(c.title)}, ${c.minutes}, ${c.difficulty}, ${q(c.question)}, ${q(c.intro)},
  ${q(JSON.stringify(c.suspects))}::jsonb, ${q(JSON.stringify(clues))}::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  ${q(c.key)}, array[${answers.join(',')}], ${c.culprit}, ${q(c.solution)})
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;`;
});

const seed = `-- Generado por scripts/build-seed.mjs. No editar a mano: editar supabase/cases.json.\n${rows.join('\n\n')}\n`;
writeFileSync(new URL('seed.sql', root), seed);

const migDir = new URL('migrations/', root);
const migrations = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort()
  .map(f => `-- ===== ${f} =====\n` + readFileSync(new URL(f, migDir), 'utf8'));
writeFileSync(new URL('setup.sql', root),
  `-- Pegar completo en Supabase → SQL Editor → Run. Generado por scripts/build-seed.mjs.\n\n${migrations.join('\n')}\n-- ===== seed.sql =====\n${seed}`);
console.log(`ok: ${cases.length} casos → seed.sql y setup.sql`);
