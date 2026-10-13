'use strict';
// ==========================================================
//  SOPA DE LLETRES
//  Es pot seleccionar arrossegant el dit/ratolí o tocant la
//  primera i l'última lletra de la paraula.
// ==========================================================
(() => {
  const PARAULES = ['TAULA', 'CADIRA', 'LLIBRE', 'JARDI', 'PLATJA', 'MUNTANYA', 'ELEFANT', 'GUITARRA', 'CAMISA', 'RELLOTGE', 'FINESTRA', 'BICICLETA', 'AEROPORT', 'CUINA', 'PARAIGUA', 'BUFANDA', 'GALLINA', 'CAVALL', 'ESTRELLA', 'TARONJA', 'CIRERA', 'TORTUGA', 'MERCAT', 'ESCOLA', 'CASTELL', 'TELEFON', 'MALETA', 'VAIXELL', 'CORTINA', 'CULLERA', 'PASTANAGA', 'CONILL'];
  const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  // mida, paraules, direccions permeses
  const NIVELLS = { facil: { n: 8, p: 5, dirs: 2 }, mig: { n: 10, p: 6, dirs: 3 }, dificil: { n: 12, p: 8, dirs: 8 } };
  let n = 10, cfg = NIVELLS.mig, graella = [], llista = [], trobades = new Map(), inici = 0, rellotge = null, fallades = 0;
  let origen = null, final = null, arrossegant = false, acabada = false;

  function coloca(paraula) {
    const dirs = DIRS.slice(0, cfg.dirs);
    for (let intent = 0; intent < 400; intent++) {
      const [df, dc] = aleatori(dirs), f0 = enter(0, n - 1), c0 = enter(0, n - 1);
      const fN = f0 + df * (paraula.length - 1), cN = c0 + dc * (paraula.length - 1);
      if (fN < 0 || fN >= n || cN < 0 || cN >= n) continue;
      let ok = true;
      for (let i = 0; i < paraula.length && ok; i++) { const ch = graella[f0 + df * i][c0 + dc * i]; if (ch && ch !== paraula[i]) ok = false; }
      if (!ok) continue;
      for (let i = 0; i < paraula.length; i++) graella[f0 + df * i][c0 + dc * i] = paraula[i];
      return true;
    }
    return false;
  }
  function genera() {
    const candidates = bancIdioma('sopa', PARAULES).filter(p => p.length <= n);
    for (let intent = 0; intent < 20; intent++) {
      graella = Array.from({ length: n }, () => Array(n).fill(''));
      llista = barreja(candidates).slice(0, cfg.p).filter(coloca);
      if (llista.length === cfg.p) break;             // totes colocades
    }
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (!graella[f][c]) graella[f][c] = ABC[enter(0, 25)];
  }

  function reiniciar() {
    aturaTemps(rellotge); cfg = NIVELLS[nivellSopa]; n = cfg.n;
    genera(); trobades = new Map(); fallades = 0; origen = final = null; arrossegant = false; acabada = false;
    setText('sopa-total', llista.length); setText('sopa-count', 0); setText('sopa-temps', '0s');
    setFeedback('sopa', 'Arrossega o toca la primera i l\'última lletra de cada paraula.');
    mostra('sopa-reiniciar', false); mostra('sopa-ajuda', nivellSopa === 'facil', 'inline-flex');
    $('sopa-grid').style.setProperty('--n', n);
    inici = ara(); rellotge = interval(() => setText('sopa-temps', Math.floor((ara() - inici) / 1000) + 's'), 1000);
    pinta();
  }
  let nivellSopa = 'mig', foc = { f: 0, c: 0 }, teclat = false;

  // línia de cel·les entre dos punts, o null si no estan alineats
  function linia(a, b) {
    if (!a || !b) return null;
    const df = b.f - a.f, dc = b.c - a.c;
    if (df !== 0 && dc !== 0 && Math.abs(df) !== Math.abs(dc)) return null;
    const len = Math.max(Math.abs(df), Math.abs(dc)) + 1, sf = Math.sign(df), sc = Math.sign(dc);
    return Array.from({ length: len }, (_, i) => ({ f: a.f + sf * i, c: a.c + sc * i }));
  }
  const clau = (f, c) => f * n + c;
  function pinta(pista) {
    const sel = new Set((linia(origen, final || origen) || (origen ? [origen] : [])).map(x => clau(x.f, x.c)));
    const trob = new Set([...trobades.values()].flat());
    let h = '';
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) {
      const k = clau(f, c);
      h += `<div class="sopa-casella${sel.has(k) ? ' sel' : ''}${trob.has(k) ? ' trobada' : ''}${pista === k ? ' pista' : ''}" data-f="${f}" data-c="${c}" tabindex="${foc.f === f && foc.c === c ? 0 : -1}" aria-label="${graella[f][c]}, fila ${f + 1}, columna ${c + 1}${trob.has(k) ? ', part de paraula trobada' : ''}${origen && origen.f === f && origen.c === c ? ', inici de la selecció' : ''}">${graella[f][c]}</div>`;
    }
    morph($('sopa-grid'), h);
    if (teclat) { const x = $('sopa-grid').querySelector(`[data-f="${foc.f}"][data-c="${foc.c}"]`); if (x) x.focus({ preventScroll: true }); }
    morph($('sopa-paraules'), llista.map(p => `<span class="sopa-paraula${trobades.has(p) ? ' trobada' : ''}">${p}</span>`).join(''));
  }
  function celaDe(ev) {
    const el = document.elementFromPoint(ev.clientX, ev.clientY), cel = el && el.closest && el.closest('[data-f]');
    return cel && $('sopa-grid').contains(cel) ? { f: +cel.dataset.f, c: +cel.dataset.c } : null;
  }
  function resol() {
    const cami = linia(origen, final);
    origen = final = null; arrossegant = false;
    if (!cami || cami.length < 2) { pinta(); return; }
    const text = cami.map(x => graella[x.f][x.c]).join(''), rev = [...text].reverse().join('');
    const paraula = llista.find(p => !trobades.has(p) && (p === text || p === rev));
    if (paraula) {
      trobades.set(paraula, cami.map(x => clau(x.f, x.c))); soEncert(); vibrar([40, 30, 40]);
      setFeedback('sopa', '' + paraula, 'correcte'); setText('sopa-count', trobades.size);
      if (trobades.size === llista.length) { guanya(); return; }
    } else { fallades++; soError(); setFeedback('sopa', 'Aquí no hi ha cap paraula', 'incorrecte'); }
    pinta();
  }
  function guanya() {
    acabada = true; aturaTemps(rellotge); pinta();
    const s = Math.floor((ara() - inici) / 1000);
    soVictoria(); celebracioCompleta(); setFeedback('sopa', `Les has trobades totes! (${s}s)`, 'correcte'); mostra('sopa-reiniciar', true);
    finalitzarPartida('sopa', llista.length, fallades, `En ${s}s`);
  }

  const grid = $('sopa-grid');
  // Teclat: fletxes per moure's; Enter o espai per marcar el principi i, després, el final d'una paraula
  grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', "Graella de lletres. Fletxes per moure't; Enter per marcar el principi i el final d'una paraula.");
  grid.addEventListener('keydown', ev => {
    if (acabada) return;
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
    if (d) { ev.preventDefault(); teclat = true; foc = { f: clamp(foc.f + d[0], 0, n - 1), c: clamp(foc.c + d[1], 0, n - 1) }; pinta(); return; }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault(); teclat = true;
      if (origen && (origen.f !== foc.f || origen.c !== foc.c)) { final = { ...foc }; resol(); }
      else { soClic(); origen = { ...foc }; final = { ...foc }; pinta(); }
    } else if (ev.key === 'Escape' && origen) { origen = final = null; pinta(); }
  });
  grid.addEventListener('pointerdown', ev => {
    teclat = false;
    if (acabada) return;
    const c = celaDe(ev); if (!c) return;
    ev.preventDefault();
    if (origen && !arrossegant && origen.f === c.f && origen.c === c.c) {      // tocar de nou la mateixa lletra desfà la selecció
      soClic(); origen = final = null; pinta(); setFeedback('sopa', ''); return;
    }
    if (origen && !arrossegant && (origen.f !== c.f || origen.c !== c.c)) {    // segon toc = final de la paraula
      final = c; resol(); return;
    }
    soClic(); origen = c; final = c; arrossegant = true; pinta();
  });
  grid.addEventListener('pointermove', ev => {
    if (!arrossegant) return;
    const c = celaDe(ev); if (!c || (final && final.f === c.f && final.c === c.c)) return;
    final = c; pinta();
  });
  const solta = () => {
    if (!arrossegant) return;
    arrossegant = false;
    if (final && origen && (final.f !== origen.f || final.c !== origen.c)) resol();   // s'ha arrossegat
    else { final = null; pinta(); }                                                  // només un toc: queda marcada la primera lletra
  };
  grid.addEventListener('pointerup', solta); grid.addEventListener('pointercancel', solta);

  $('sopa-ajuda').addEventListener('click', () => {
    const p = llista.find(x => !trobades.has(x)); if (!p || acabada) return; registraAjuda();
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) for (const [df, dc] of DIRS) {
      let ok = true;
      for (let i = 0; i < p.length && ok; i++) { const a = f + df * i, b = c + dc * i; ok = a >= 0 && a < n && b >= 0 && b < n && graella[a][b] === p[i]; }
      if (ok) { soClic(); pinta(clau(f, c)); setFeedback('sopa', `«${p}» comença a la lletra marcada.`); temps(() => pinta(), 2500); return; }
    }
  });

  // Pista: la paraula que queda per trobar, la casella on comença i la paraula sencera
  function ubicaParaula(p) {
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) for (const [df, dc] of DIRS) {
      let ok = true;
      for (let i = 0; i < p.length && ok; i++) { const a = f + df * i, b = c + dc * i; ok = a >= 0 && a < n && b >= 0 && b < n && graella[a][b] === p[i]; }
      if (ok) return { f, c, df, dc, p };
    }
    return null;
  }
  const casellaEl = (f, c) => $('sopa-grid').querySelector(`[data-f="${f}"][data-c="${c}"]`);
  const pista = {
    obtenir(k) {
      if (acabada) return null;
      const p = llista.find(x => !trobades.has(x)); if (!p) return null;
      const u = ubicaParaula(p); if (!u) return null;
      if (k === 1) return { text: `Busca «${p}». Mira la llista de sota i recorre la graella lletra a lletra, també en vertical i en diagonal.` };
      if (k === 2) return { text: `«${p}» comença en aquesta zona: busca la ${p[0]}.`, objectiu: () => casellaEl(u.f, u.c) };
      const celles = () => Array.from({ length: p.length }, (_, i) => casellaEl(u.f + u.df * i, u.c + u.dc * i)).filter(Boolean);
      return { text: `«${p}» és aquí.`, explica: `«${p}» comença aquí i va ${u.df === 0 ? 'en horitzontal' : u.dc === 0 ? 'en vertical' : 'en diagonal'}${(u.df < 0 || u.dc < 0) ? ' (al revés)' : ''}. Arrossega o toca la primera i l'última lletra.`, objectiu: () => celles(), aplica: () => celles().forEach(el => { el.classList.add('pista-flash'); setTimeout(() => el.classList.remove('pista-flash'), 6000); }) };
    }
  };

  registrarJoc({
    id: 'sopa', pista,
    tutorial: { titol: 'Sopa de lletres', cos: '<p>Busca les paraules de la llista. Pots <strong>arrossegar</strong> el dit sobre les lletres, o tocar la primera i l\'última lletra.</p><p>Les paraules poden estar escrites en diverses direccions (al nivell difícil, també al revés).</p>' },
    obrir: () => triaDificultat('sopa', 'Sopa de lletres', 'Tria la dificultat', ['8×8 · 5 paraules · amb ajuda', '10×10 · 6 paraules', '12×12 · 8 paraules · totes les direccions'],
      nv => { nivellSopa = nv; reiniciar(); mostrarPantalla('joc-sopa'); }),
    reiniciar
  });
})();
