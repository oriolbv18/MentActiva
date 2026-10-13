'use strict';
// ==========================================================
//  SEQÜÈNCIES LÒGIQUES
//  Cada patró retorna { serie: [...], regla } i el joc amaga un dels números.
// ==========================================================
const PATRONS_SEQLOG = [
  () => { const a = enter(2, 6); return { serie: [1, 2, 3, 4, 5, 6].map(k => k * a), regla: `Es compta de ${a} en ${a}` }; },
  () => { const a = enter(10, 40), p = enter(2, 5); return { serie: [0, 1, 2, 3, 4, 5].map(k => a + k * p), regla: `Se sumen ${p} cada vegada` }; },
  () => { const a = enter(60, 120), p = enter(3, 9); return { serie: [0, 1, 2, 3, 4, 5].map(k => a - k * p), regla: `Es resten ${p} cada vegada` }; },
  () => { const a = enter(2, 4); return { serie: [0, 1, 2, 3, 4, 5].map(k => a * 2 ** k), regla: 'Cada número és el doble de l\'anterior' }; },
  () => { const a = enter(1, 3); return { serie: [0, 1, 2, 3, 4].map(k => a * 3 ** k), regla: 'Cada número és el triple de l\'anterior' }; },
  () => { const a = enter(1, 9) * 32; return { serie: [0, 1, 2, 3, 4, 5].map(k => a / 2 ** k).filter(Number.isInteger), regla: 'Cada número és la meitat de l\'anterior' }; },
  () => ({ serie: [1, 4, 9, 16, 25, 36, 49], regla: 'Són els quadrats: 1×1, 2×2, 3×3, 4×4…' }),
  () => ({ serie: [1, 3, 6, 10, 15, 21, 28], regla: 'Se suma 2, després 3, després 4, 5… (un més cada vegada)' }),
  () => { const a = enter(1, 5); return { serie: [a, a + 1, a + 3, a + 6, a + 10, a + 15, a + 21], regla: 'Se suma 1, després 2, després 3… (un més cada vegada)' }; },
  () => { const a = enter(1, 4); return { serie: [1, 1, 2, 3, 5, 8, 13].map(v => v * a), regla: 'Cada número és la suma dels dos anteriors' }; },
  () => ({ serie: [2, 3, 5, 7, 11, 13, 17], regla: 'Són els nombres primers (només es divideixen per 1 i per ells mateixos)' }),
  () => { const a = enter(2, 5), b = enter(1, 4) + (a === 2 ? 1 : 0) * 0 + 6; return { serie: [a, b, 2 * a, 2 * b, 3 * a, 3 * b, 4 * a], regla: `Hi ha dues sèries barrejades: una puja de ${a} en ${a} i l'altra de ${b} en ${b}` }; },
  () => { const a = enter(30, 60); return { serie: [a, a - 1, a - 3, a - 6, a - 10, a - 15], regla: 'Es resta 1, després 2, després 3… (un més cada vegada)' }; },
  () => { const a = enter(2, 5); return { serie: [1, 2, 3, 4, 5, 6].map(k => k * k * a), regla: `Els quadrats (1, 4, 9, 16…) multiplicats per ${a}` }; }
];

function seqlogGenerar() {
  const p = aleatori(PATRONS_SEQLOG)(), serie = p.serie.slice(0, 7), amaga = enter(2, serie.length - 1), resposta = serie[amaga];
  const text = serie.map((v, i) => i === amaga ? '?' : v).join('   ');
  const falses = new Set();
  const marge = Math.max(4, Math.round(Math.abs(resposta) * 0.2));
  let guard = 0;
  while (falses.size < 3 && guard++ < 200) { const f = resposta + enter(-marge, marge); if (f > 0 && f !== resposta) falses.add(f); }
  while (falses.size < 3) falses.add(resposta + falses.size + 1);
  const { o, c } = opcionsBarrejades(String(resposta), [...falses].map(String));
  return { q: text, veu: 'Quin número falta?', err: text, o, c, expl: p.regla, h1: 'Mira com canvia cada número respecte de l\'anterior.', h2: 'Calcula la diferència entre dos números seguits (o si es multipliquen). Mira què passa al voltant del «?».', h3: 'Aplica la regla del patró al lloc del «?».' };
}

crearQuiz({
  id: 'seqlog',
  pista: { mode: 'estrategia' },
  tutorial: { titol: 'Quin número falta?', cos: '<p>Hi ha una fila de números amb un <strong>«?»</strong>.</p><div class="exemple"><span>2</span><span>4</span><span>6</span><span>?</span><span>10</span></div><p>Descobreix la regla (aquí, de 2 en 2) i toca el número que hi falta: el <strong>8</strong>. Quan falles, t\'expliquem la regla.</p>' },
  preparar: () => Array.from({ length: 8 }, seqlogGenerar)
});
