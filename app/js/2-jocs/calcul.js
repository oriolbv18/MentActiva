'use strict';
// ==========================================================
//  CÀLCUL MENTAL
// ==========================================================
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const centims = () => enter(1, 99) / 100;

function calculGenerar() {
  let q, correcte, esDecimal = true, h2 = '';
  switch (enter(0, 3)) {
    case 0: {
      const preu = enter(1, 6) + centims(), unitats = enter(2, 4);
      q = `Si un producte costa ${eur(preu)}, quant costen ${unitats} unitats?`; correcte = preu * unitats;
      h2 = `Multiplica per separat els euros (${Math.floor(preu)} × ${unitats}) i els cèntims, i després suma-ho.`; break;
    }
    case 1: {
      const pagat = aleatori([10, 20, 50]), preu = enter(1, pagat - 1) + centims();
      q = `Pagues amb ${pagat} € un producte de ${eur(preu)}. Quant et tornen?`; correcte = pagat - preu;
      h2 = `Compta cap amunt des del preu fins a ${pagat} €: primer fins a l'euro rodó i després fins al final.`; break;
    }
    case 2: {
      const preu = enter(2, 8) * 10, desc = aleatori([10, 20, 25, 50]);
      q = `Un producte de ${preu} € té un ${desc}% de descompte. Quant pagues?`; correcte = preu * (100 - desc) / 100;
      h2 = desc === 50 ? 'El 50% és la meitat: divideix el preu entre 2.' : desc === 25 ? 'El 25% és la quarta part: divideix entre 4 i resta-ho del preu.' : `Calcula primer el ${desc}% (el 10% és dividir entre 10) i resta'l del preu.`; break;
    }
    default: {
      const a = enter(10, 60), b = enter(10, 60);
      q = `${a} + ${b} = ?`; correcte = a + b; esDecimal = false;
      h2 = `Descompon el ${b} en ${Math.floor(b / 10) * 10} + ${b % 10}: suma primer ${Math.floor(b / 10) * 10} a ${a} i després ${b % 10}.`;
    }
  }
  correcte = Math.round(correcte * 100) / 100;
  const fmt = n => esDecimal ? eur(n) : String(n);
  const falses = new Set();
  while (falses.size < 3) {
    // Distractors a prop de la resposta, sempre positius i diferents de la correcta
    const f = Math.round((correcte + (esDecimal ? enter(-500, 500) / 100 : enter(-10, 10))) * 100) / 100;
    if (f > 0 && f !== correcte) falses.add(f);
  }
  const { o, c } = opcionsBarrejades(fmt(correcte), [...falses].map(fmt));
  return { q, o, c, h1: 'Fes-ho per parts i sense pressa. Primer pensa quina operació cal.', h2 };
}

crearQuiz({
  id: 'calcul',
  pista: { mode: 'estrategia' },
  tutorial: { titol: 'Comptes de cada dia', cos: '<p>Resol petits problemes del dia a dia: preus, canvi, descomptes…</p><p>Pensa-ho sense pressa i <strong>toca el resultat correcte</strong>.</p>' },
  preparar: () => Array.from({ length: 10 }, calculGenerar)
});
