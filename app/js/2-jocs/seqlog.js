'use strict';
// ==========================================================
//  COMPLETA LA SÈRIE
//  Sèries de números, però també de dies, mesos, lletres, hores i euros.
//  Set esglaons: el nivell fàcil comença comptant d'un en un i cada partida puja a poc a poc.
//  Cada patró retorna { serie: [...], regla, univers? } i el joc n'amaga un element.
// ==========================================================
const SERIES_ES = { dies: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'], mesos: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] };
const SERIES_CA = { dies: ['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge'], mesos: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'] };
const SERIES_TXT = () => (I18N.llengua === 'es' ? SERIES_ES : SERIES_CA);
const LLETRES_SERIE = 'ABCDEFGHIJKLMNOPRSTUV'.split('');
const pasSerie = (a, n, p = 1) => Array.from({ length: n }, (_, k) => a + k * p);
const tallSerie = (u, i, n, p = 1) => Array.from({ length: n }, (_, k) => u[(i + k * p) % u.length]);

const ESGLAONS_SEQLOG = [
  [ // 1: comptar, el més senzill del món
    () => ({ serie: pasSerie(enter(1, 5), 5), regla: 'Es compta d\'un en un' }),
    () => ({ serie: pasSerie(2, 5, 2), regla: 'Es compta de 2 en 2' }),
    () => ({ serie: pasSerie(10, 5, 10), regla: 'Es compta de 10 en 10' }),
    () => { const u = SERIES_TXT().dies; return { serie: tallSerie(u, enter(0, 2), 4), regla: 'Són els dies de la setmana, en ordre', univers: u }; }
  ],
  [ // 2: també enrere i amb lletres i mesos
    () => ({ serie: pasSerie(enter(6, 10), 5, -1), regla: 'Es compta enrere, d\'un en un' }),
    () => ({ serie: pasSerie(5, 5, 5), regla: 'Es compta de 5 en 5' }),
    () => { const i = enter(0, 6); return { serie: LLETRES_SERIE.slice(i, i + 5), regla: 'Són les lletres de l\'abecedari, en ordre', univers: LLETRES_SERIE }; },
    () => { const u = SERIES_TXT().mesos; return { serie: tallSerie(u, enter(0, 7), 4), regla: 'Són els mesos de l\'any, en ordre', univers: u }; }
  ],
  [ // 3: salts petits, hores i euros
    () => ({ serie: pasSerie(enter(1, 4), 5, 2), regla: 'Se sumen 2 cada vegada' }),
    () => ({ serie: pasSerie(enter(1, 5), 5, 3), regla: 'Se sumen 3 cada vegada' }),
    () => ({ serie: pasSerie(enter(5, 9) * 10, 5, -10), regla: 'Es compta enrere, de 10 en 10' }),
    () => { const h = enter(8, 12); return { serie: pasSerie(h, 5).map(x => x + ':00'), regla: 'Passa una hora cada vegada', format: x => x + ':00', num: h + 2 }; },
    () => ({ serie: pasSerie(5, 5, 5).map(x => x + ' €'), regla: 'Se sumen 5 euros cada vegada', format: x => x + ' €', num: 15, pas: 5 })
  ],
  [ // 4: salts més grans, dobles i «saltant-ne un»
    () => { const p = enter(4, 6); return { serie: pasSerie(enter(2, 9), 6, p), regla: `Se sumen ${p} cada vegada` }; },
    () => { const p = enter(2, 4); return { serie: pasSerie(enter(25, 40), 6, -p), regla: `Es resten ${p} cada vegada` }; },
    () => ({ serie: [1, 2, 4, 8, 16, 32], regla: 'Cada número és el doble de l\'anterior' }),
    () => { const u = SERIES_TXT().dies; return { serie: tallSerie(u, 0, 4, 2), regla: 'Són els dies de la setmana, saltant-ne un', univers: u }; },
    () => { const i = enter(0, 3); return { serie: [0, 2, 4, 6, 8].map(k => LLETRES_SERIE[i + k]), regla: 'Són lletres de l\'abecedari, saltant-ne una', univers: LLETRES_SERIE }; }
  ],
  [ // 5: una mica de càlcul
    () => { const p = enter(7, 9); return { serie: pasSerie(enter(10, 30), 6, p), regla: `Se sumen ${p} cada vegada` }; },
    () => { const a = enter(2, 5); return { serie: [0, 1, 2, 3, 4, 5].map(k => a * 2 ** k), regla: 'Cada número és el doble de l\'anterior' }; },
    () => { const a = enter(1, 5); return { serie: [a, a + 1, a + 3, a + 6, a + 10, a + 15], regla: 'Se suma 1, després 2, després 3… (un més cada vegada)' }; },
    () => { const a = enter(1, 3) * 32; return { serie: [0, 1, 2, 3, 4, 5].map(k => a / 2 ** k), regla: 'Cada número és la meitat de l\'anterior' }; }
  ],
  [ // 6: patrons menys evidents
    () => { const a = enter(1, 3); return { serie: [0, 1, 2, 3, 4].map(k => a * 3 ** k), regla: 'Cada número és el triple de l\'anterior' }; },
    () => ({ serie: [1, 4, 9, 16, 25, 36, 49], regla: 'Són els quadrats: 1×1, 2×2, 3×3, 4×4…' }),
    () => { const a = enter(30, 60); return { serie: [a, a - 1, a - 3, a - 6, a - 10, a - 15], regla: 'Es resta 1, després 2, després 3… (un més cada vegada)' }; },
    () => { const u = SERIES_TXT().mesos; return { serie: tallSerie(u, enter(0, 2), 4, 3), regla: 'Són els mesos de l\'any, de 3 en 3', univers: u }; }
  ],
  [ // 7: per als qui en volen més
    () => { const a = enter(1, 4); return { serie: [1, 1, 2, 3, 5, 8, 13].map(v => v * a), regla: 'Cada número és la suma dels dos anteriors' }; },
    () => ({ serie: [2, 3, 5, 7, 11, 13, 17], regla: 'Són els nombres primers (només es divideixen per 1 i per ells mateixos)' }),
    () => { const a = enter(2, 5), b = enter(7, 10); return { serie: [a, b, 2 * a, 2 * b, 3 * a, 3 * b, 4 * a], regla: `Hi ha dues sèries barrejades: una puja de ${a} en ${a} i l'altra de ${b} en ${b}` }; },
    () => { const a = enter(2, 5); return { serie: [1, 2, 3, 4, 5, 6].map(k => k * k * a), regla: `Els quadrats (1, 4, 9, 16…) multiplicats per ${a}` }; }
  ]
];
// Dins d'una partida, l'esglaó puja a poc a poc
const RAMPA_SEQLOG = { facil: [0, 0, 0, 1, 1, 1, 2, 2], mig: [2, 2, 3, 3, 3, 4, 4, 4], dificil: [4, 4, 5, 5, 5, 6, 6, 6] };

function seqlogGenerar(esglao = 0) {
  const p = aleatori(ESGLAONS_SEQLOG[clamp(esglao, 0, ESGLAONS_SEQLOG.length - 1)])(), serie = p.serie.map(String);
  // Als primers esglaons, el forat és a prop del final i la sèrie és curta; després, pot ser a qualsevol lloc menys al primer
  const amaga = esglao < 2 ? enter(Math.max(1, serie.length - 2), serie.length - 1) : enter(1, serie.length - 1), resposta = serie[amaga];
  const text = serie.map((v, i) => (i === amaga ? '?' : v)).join('   ');
  const falses = new Set();
  if (p.univers) { barreja(p.univers.filter(x => !serie.includes(x))).slice(0, 3).forEach(x => falses.add(x)); }
  else {
    const num = parseInt(resposta, 10), fmt = p.format || String, pas = Math.max(1, Math.abs((parseInt(serie[1], 10) || 0) - (parseInt(serie[0], 10) || 0))), marge = Math.max(4, Math.round(Math.abs(num) * 0.2));
    [num + pas, num - pas, num + 1, num - 1, num + 2].forEach(f => { if (falses.size < 3 && f > 0 && fmt(f) !== resposta && !serie.includes(fmt(f))) falses.add(fmt(f)); });
    let g = 0; while (falses.size < 3 && g++ < 200) { const f = num + enter(-marge, marge); if (f > 0 && fmt(f) !== resposta) falses.add(fmt(f)); }
    while (falses.size < 3) falses.add(fmt(num + falses.size + 3));
  }
  const { o, c } = opcionsBarrejades(resposta, [...falses]);
  return { q: text, veu: 'Què falta a la sèrie?', err: text, o, c, expl: p.regla, h1: 'Mira com canvia cada element respecte de l\'anterior.', h2: p.univers ? 'Digues la sèrie en veu alta i fixa\'t en què ve després.' : 'Mira què passa d\'un element al següent: quant puja o quant baixa?', h3: 'Aplica la mateixa regla al lloc del «?».' };
}

crearQuiz({
  id: 'seqlog',
  pista: { mode: 'estrategia' },
  nivells: { titol: 'Completa la sèrie', subtitol: 'Tria la dificultat', descripcions: ['Comptar, dies, mesos i lletres', 'Salts una mica més grans', 'Sèries amb truc'] },
  tutorial: { titol: 'Completa la sèrie', cos: '<p>Hi ha una fila amb un <strong>«?»</strong>: pot ser de números, dies, mesos, lletres, hores…</p><div class="exemple"><span>2</span><span>4</span><span>6</span><span>?</span><span>10</span></div><p>Descobreix la regla (aquí, de 2 en 2) i toca el que hi falta: el <strong>8</strong>. Quan falles, t\'expliquem la regla.</p>' },
  preparar: (dos, nivell) => (RAMPA_SEQLOG[nivell] || RAMPA_SEQLOG.facil).map(seqlogGenerar)
});
