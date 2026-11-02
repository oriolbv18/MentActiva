'use strict';
// ==========================================================
//  COMPTES DE CADA DIA
//  Comptes molt senzills i de la vida real, sense cèntims ni percentatges.
//  Fàcil: sumes i restes petites · Mig: la compra amb euros rodons · Difícil: una mica més llargs, però sempre de cap.
// ==========================================================
const PRODUCTES_CALCUL = [['El pa', 1, 2], ['La llet', 1, 2], ['El cafè', 1, 2], ['Una poma', 1, 1], ['El formatge', 3, 6], ['El peix', 5, 9], ['La capsa de galetes', 2, 3], ['L\'oli', 4, 7], ['La fruita', 2, 4], ['El diari', 1, 2]];
const COSES_CALCUL = ['pomes', 'taronges', 'ous', 'galetes', 'flors', 'llibres'];

const CALCUL_TIPUS = {
  facil: [
    () => { const a = enter(1, 6), b = enter(1, 4); return { q: `${a} + ${b} = ?`, r: a + b, h: `Compta ${b} més a partir del ${a}.` }; },
    () => { const a = enter(2, 9), b = enter(1, a - 1); return { q: `${a} − ${b} = ?`, r: a - b, h: `Compta enrere ${b} des del ${a}.` }; },
    () => { const a = enter(2, 6), b = enter(1, 3), c = aleatori(COSES_CALCUL); return { q: `Tens ${a} ${c} i en compres ${b}. Quantes en tens ara?`.replace('Quantes', c === 'ous' || c === 'llibres' ? 'Quants' : 'Quantes'), r: a + b, h: `Suma: ${a} + ${b}.` }; },
    () => { const a = aleatori([5, 10]), b = enter(1, a === 5 ? 3 : 6); return { q: `Tens ${a} € i gastes ${b} €. Quants te'n queden?`, r: a - b, e: true, h: `Resta: ${a} − ${b}.` }; },
    () => { const a = aleatori([10, 20, 30]), b = 10; return { q: `${a} + ${b} = ?`, r: a + b, h: 'Suma les desenes: és com sumar d\'un en un, però de 10 en 10.' }; }
  ],
  mig: [
    () => { const [p1, p2] = barreja(PRODUCTES_CALCUL).slice(0, 2), a = enter(p1[1], p1[2]), b = enter(p2[1], p2[2]); return { q: `${p1[0]} val ${a} € i ${p2[0].charAt(0).toLowerCase() + p2[0].slice(1)} val ${b} €. Quant és tot?`, r: a + b, e: true, h: `Suma els dos preus: ${a} + ${b}.` }; },
    () => { const b = enter(2, 8); return { q: `Pagues ${b} € amb un bitllet de 10 €. Quant et tornen?`, r: 10 - b, e: true, h: `Compta des de ${b} fins a 10.` }; },
    () => { const u = enter(2, 3), p = enter(1, 3); return { q: `Compres ${u} barres de pa a ${p} € cadascuna. Quant pagues?`, r: u * p, e: true, h: `Suma ${p} € tantes vegades com barres: ${u}.` }; },
    () => { const a = enter(2, 8) * 10, b = enter(1, 3) * 10; return { q: `${a} + ${b} = ?`, r: a + b, h: 'Suma primer les desenes.' }; },
    () => { const a = enter(11, 18), b = enter(2, 7); return { q: `${a} − ${b} = ?`, r: a - b, h: `Compta enrere ${b} des del ${a}.` }; }
  ],
  dificil: [
    () => { const b = enter(11, 18); return { q: `Pagues ${b} € amb un bitllet de 20 €. Quant et tornen?`, r: 20 - b, e: true, h: `Compta des de ${b} fins a 20.` }; },
    () => { const u = enter(3, 5), p = enter(2, 4); return { q: `Compres ${u} cafès a ${p} € cadascun. Quant pagues?`, r: u * p, e: true, h: `Suma ${p} € ${u} vegades.` }; },
    () => { const a = aleatori([10, 20, 30, 40, 50]); return { q: `Quina és la meitat de ${a}?`, r: a / 2, h: 'La meitat és dividir en dues parts iguals.' }; },
    () => { const a = enter(21, 45), b = aleatori([5, 10, 20]); return { q: `${a} + ${b} = ?`, r: a + b, h: 'Suma primer les desenes i després les unitats.' }; },
    () => { const a = enter(8, 10), b = enter(a + 2, 13); return { q: `Són les ${a} i has quedat a les ${b}. Quantes hores falten?`, r: b - a, h: `Compta les hores des de les ${a} fins a les ${b}.` }; }
  ]
};

function calculGenerar(nivell = 'facil') {
  const p = aleatori(CALCUL_TIPUS[nivell] || CALCUL_TIPUS.facil)(), fmt = n => p.e ? `${n} €` : String(n);
  // Pocs distractors i ben a prop: es tracta de fer el compte, no de resoldre un trencaclosques
  const falses = new Set(), nf = nivell === 'facil' ? 2 : 3; let g = 0;
  while (falses.size < nf && g++ < 100) { const f = p.r + enter(-3, 3) * (p.r >= 30 && p.r % 10 === 0 ? 10 : 1); if (f >= 0 && f !== p.r) falses.add(f); }
  while (falses.size < nf) falses.add(p.r + falses.size + 1);
  const { o, c } = opcionsBarrejades(fmt(p.r), [...falses].map(fmt));
  return { q: p.q, o, c, res: p.r, h1: 'Sense pressa. Si vols, fes-ho amb els dits.', h2: p.h };
}

crearQuiz({
  id: 'calcul',
  pista: { mode: 'estrategia' },
  nivells: { titol: 'Comptes de cada dia', subtitol: 'Tria la dificultat', descripcions: ['Sumes i restes petites', 'La compra, amb euros rodons', 'Comptes una mica més llargs'] },
  tutorial: { titol: 'Comptes de cada dia', cos: '<p>Comptes senzills del dia a dia: sumar, restar, el canvi de la compra.</p><p>Pensa-ho sense pressa i <strong>toca el resultat correcte</strong>.</p>' },
  preparar: (dos, nivell) => Array.from({ length: 10 }, () => calculGenerar(nivell))
});
