'use strict';
// ==========================================================
//  SUDOKU (6×6 i 9×9)
//  Els trencaclosques tenen SOLUCIÓ ÚNICA: es treuen caselles
//  una a una comprovant que només hi hagi una solució.
// ==========================================================
(() => {
  // mida, files i columnes per caixa, caselles a buidar, descripció
  const NIVELLS = { facil: { n: 6, br: 2, bc: 3, buits: 12 }, mig: { n: 6, br: 2, bc: 3, buits: 18 }, dificil: { n: 9, br: 3, bc: 3, buits: 46 } };
  const MAX_ERRORS = 3, PISTES = 3;
  let cfg = NIVELLS.mig, solucio = [], graella = [], fixes = [], sel = null, errors = 0, pistes = PISTES, bloquejat = false, inici = 0, rellotge = null, buitsTotals = 0;

  // ---------- Generador i solucionador ----------
  const usats = (g, f, c) => {
    let m = 0;
    for (let i = 0; i < cfg.n; i++) { m |= 1 << g[f][i]; m |= 1 << g[i][c]; }
    const f0 = f - f % cfg.br, c0 = c - c % cfg.bc;
    for (let i = 0; i < cfg.br; i++) for (let j = 0; j < cfg.bc; j++) m |= 1 << g[f0 + i][c0 + j];
    return m;   // el bit 0 (casella buida) es descarta després
  };
  // Compta solucions (fins a «limit»). Si «alea», deixa la primera solució trobada dins de g.
  function compta(g, limit, alea) {
    let bf = -1, bc = -1, millor = null;
    for (let f = 0; f < cfg.n; f++) for (let c = 0; c < cfg.n; c++) {
      if (g[f][c]) continue;
      const m = usats(g, f, c), lliures = [];
      for (let d = 1; d <= cfg.n; d++) if (!(m & (1 << d))) lliures.push(d);
      if (!millor || lliures.length < millor.length) { millor = lliures; bf = f; bc = c; if (!lliures.length) return 0; }
    }
    if (!millor) return 1;                                  // graella plena
    let total = 0;
    for (const d of (alea ? barreja(millor) : millor)) {
      g[bf][bc] = d;
      total += compta(g, limit - total, alea);
      if (alea && total) return total;
      g[bf][bc] = 0;
      if (total >= limit) return total;
    }
    return total;
  }
  function genera() {
    const plena = Array.from({ length: cfg.n }, () => Array(cfg.n).fill(0));
    compta(plena, 1, true);
    const puzzle = plena.map(f => f.slice());
    const cel = barreja(Array.from({ length: cfg.n * cfg.n }, (_, i) => i));
    let tretes = 0;
    for (const i of cel) {
      if (tretes >= cfg.buits) break;
      const f = Math.floor(i / cfg.n), c = i % cfg.n, v = puzzle[f][c];
      puzzle[f][c] = 0;
      if (compta(puzzle.map(r => r.slice()), 2, false) === 1) tretes++; else puzzle[f][c] = v;
    }
    return { plena, puzzle, tretes };
  }

  // ---------- Joc ----------
  function reiniciar() {
    aturaTemps(rellotge);
    const { plena, puzzle, tretes } = genera();
    solucio = plena; graella = puzzle; buitsTotals = tretes;
    fixes = puzzle.map(f => f.map(v => v !== 0));
    sel = null; errors = 0; pistes = PISTES; bloquejat = false;
    setText('sudoku-errors', 0); setText('sudoku-pistes', pistes); setText('sudoku-temps', '0s'); setFeedback('sudoku', '');
    setText('sudoku-subtitol', `${cfg.n}×${cfg.n} · ${NOMS_NIVELL[nivellActual]}`);
    inici = ara(); rellotge = interval(() => setText('sudoku-temps', Math.floor((ara() - inici) / 1000) + 's'), 1000);
    const g = $('sudoku-grid'); g.style.setProperty('--n', cfg.n);
    pintaTeclat(); pinta();
  }
  const NOMS_NIVELL = { facil: 'Fàcil', mig: 'Mig', dificil: 'Difícil' };
  let nivellActual = 'mig';

  function pinta() {
    const n = cfg.n, s = sel;
    const valSel = s ? graella[s.f][s.c] : 0;
    let h = '';
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) {
      const v = graella[f][c];
      let cls = 'sudoku-cell';
      if (fixes[f][c]) cls += ' fixa';
      if ((c + 1) % cfg.bc === 0 && c < n - 1) cls += ' bd-dret';
      if ((f + 1) % cfg.br === 0 && f < n - 1) cls += ' bd-baix';
      if (s) {
        if (s.f === f && s.c === c) cls += ' seleccionada';
        else if (s.f === f || s.c === c || (Math.floor(s.f / cfg.br) === Math.floor(f / cfg.br) && Math.floor(s.c / cfg.bc) === Math.floor(c / cfg.bc))) cls += ' relacionada';
        if (valSel && v === valSel && !(s.f === f && s.c === c)) cls += ' igual';
      }
      if (err && err.f === f && err.c === c) cls += ' error';
      h += `<button type="button" class="${cls}" data-f="${f}" data-c="${c}" aria-label="Fila ${f + 1}, columna ${c + 1}">${err && err.f === f && err.c === c ? err.v : (v || '')}</button>`;
    }
    morph($('sudoku-grid'), h);
  }
  let err = null;
  function pintaTeclat() {
    let h = '';
    for (let i = 1; i <= cfg.n; i++) h += `<button type="button" class="sudoku-num" data-n="${i}">${i}</button>`;
    $('sudoku-numpad').innerHTML = h + '<button type="button" class="sudoku-num borrar" data-n="0" aria-label="Esborrar">⌫</button>';
  }
  function seleccionaCasella(f, c) {
    if (bloquejat) return;
    soClic(); sel = { f, c }; pinta();
  }
  function posa(n) {
    if (bloquejat || !sel || fixes[sel.f][sel.c] || err) return;
    const { f, c } = sel;
    if (n === 0) { graella[f][c] = 0; soClic(); pinta(); return; }
    if (n !== solucio[f][c]) {                          // numero equivocat: es mostra un moment en vermell i no es queda
      errors++; setText('sudoku-errors', errors); err = { f, c, v: n }; soError(); vibrar(150); elefantTrist();
      setFeedback('sudoku', 'Aquest número no hi va!', 'incorrecte'); pinta();
      temps(() => { err = null; pinta(); }, 700);
      if (errors >= MAX_ERRORS) perd();
      return;
    }
    graella[f][c] = n; soEncert(); setFeedback('sudoku', 'Bona!', 'correcte'); pinta();
    if (completa()) guanya();
  }
  const completa = () => graella.every((fila, f) => fila.every((v, c) => v === solucio[f][c]));
  const omplertes = () => graella.reduce((s, fila, f) => s + fila.filter((v, c) => v && !fixes[f][c]).length, 0);
  function perd() {
    bloquejat = true; aturaTemps(rellotge);
    setFeedback('sudoku', 'Has arribat als 3 errors. No passa res: pots tornar-ho a provar.', 'incorrecte');
    finalitzarPartida('sudoku', omplertes(), errors);
  }
  function guanya() {
    bloquejat = true; aturaTemps(rellotge);
    const t = Math.floor((ara() - inici) / 1000);
    soVictoria(); celebracioCompleta(); setFeedback('sudoku', `Sudoku completat en ${t}s!`, 'correcte');
    finalitzarPartida('sudoku', buitsTotals, errors, `En ${t}s`);
  }
  function pista() {
    if (bloquejat || pistes <= 0) { if (pistes <= 0) toast('Ja has gastat les 3 pistes'); return; }
    registraAjuda(); let objectiu = null;
    if (sel && !fixes[sel.f][sel.c] && graella[sel.f][sel.c] !== solucio[sel.f][sel.c]) objectiu = sel;
    for (let f = 0; f < cfg.n && !objectiu; f++) for (let c = 0; c < cfg.n; c++) if (graella[f][c] !== solucio[f][c]) { objectiu = { f, c }; break; }
    if (!objectiu) return;
    graella[objectiu.f][objectiu.c] = solucio[objectiu.f][objectiu.c]; sel = objectiu;
    pistes--; setText('sudoku-pistes', pistes); soEncert(); setFeedback('sudoku', 'Pista utilitzada', 'correcte'); pinta();
    if (completa()) guanya();
  }
  $('sudoku-grid').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) seleccionaCasella(+b.dataset.f, +b.dataset.c); });
  $('sudoku-numpad').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) posa(+b.dataset.n); });
  $('sudoku-ajuda').addEventListener('click', pista);
  document.addEventListener('keydown', e => {
    if (!$('joc-sudoku').classList.contains('active')) return;
    if (/^[0-9]$/.test(e.key) && +e.key <= cfg.n) posa(+e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') posa(0);
    else if (sel && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      sel = { f: Math.min(cfg.n - 1, Math.max(0, sel.f + d[0])), c: Math.min(cfg.n - 1, Math.max(0, sel.c + d[1])) }; pinta();
    }
  });

  // Pista: la casella amb menys candidats, i la regla que ho justifica
  function candidatsDe(f, c) { const m = usats(graella, f, c), r = []; for (let d = 1; d <= cfg.n; d++) if (!(m & (1 << d))) r.push(d); return r; }
  function milloCasella() {
    let millor = null;
    for (let f = 0; f < cfg.n; f++) for (let c = 0; c < cfg.n; c++) {
      if (graella[f][c]) continue; const cands = candidatsDe(f, c);
      if (!millor || cands.length < millor.cands.length) millor = { f, c, cands };
    }
    return millor;
  }
  const llistaNums = a => a.length <= 1 ? String(a[0] || '') : a.slice(0, -1).join(', ') + ' i ' + a[a.length - 1];
  function justificacio(f, c, v) {
    const fila = new Set(), col = new Set(), caixa = new Set(), f0 = f - f % cfg.br, c0 = c - c % cfg.bc;
    for (let i = 0; i < cfg.n; i++) { if (graella[f][i]) fila.add(graella[f][i]); if (graella[i][c]) col.add(graella[i][c]); }
    for (let i = 0; i < cfg.br; i++) for (let j = 0; j < cfg.bc; j++) if (graella[f0 + i][c0 + j]) caixa.add(graella[f0 + i][c0 + j]);
    const parts = []; const ja = new Set();
    [[fila, 'a la fila'], [col, 'a la columna'], [caixa, 'a la regió']].forEach(([s, t]) => { const nous = [...s].filter(x => !ja.has(x)).sort((a, b) => a - b); nous.forEach(x => ja.add(x)); if (nous.length) parts.push(`${t} ja hi ha ${llistaNums(nous)}`); });
    return `Aquí només hi cap el ${v}: ${parts.join('; ')}.`;
  }
  const casellaDom = (f, c) => $('sudoku-grid').querySelector(`[data-f="${f}"][data-c="${c}"]`);
  const pistaElefant = {
    obtenir(k) {
      if (bloquejat) return null; const m = milloCasella(); if (!m) return null;
      if (k === 1) return { text: "Busca una casella on només hi càpiga un número. Mira què hi ha a la seva fila, a la seva columna i a la seva regió." };
      if (k === 2) return { text: m.cands.length === 1 ? "Aquesta casella només admet un número." : `Aquesta casella només admet ${m.cands.length} números: mira quins queden lliures.`, objectiu: () => casellaDom(m.f, m.c) };
      const v = solucio[m.f][m.c];
      return { text: `Aquí va el ${v}.`, explica: m.cands.length === 1 ? justificacio(m.f, m.c, v) : `Aquí podrien anar ${llistaNums(m.cands)}, però mirant la resta de la graella el que hi va és el ${v}.`, objectiu: () => casellaDom(m.f, m.c), aplica: () => { sel = { f: m.f, c: m.c }; pinta(); } };
    }
  };

  registrarJoc({
    id: 'sudoku', pista: pistaElefant,
    tutorial: { titol: 'Sudoku', cos: '<p>Omple la graella perquè <strong>cada fila, cada columna i cada regió</strong> tingui tots els números sense repetir-ne cap.</p><div class="exemple"><span>1</span><span>2</span><span>?</span><span>4</span></div><p>Toca una casella i després un número (o fes servir el teclat). Tens 3 errors i 3 pistes.</p>' },
    obrir: () => triaDificultat('sudoku', 'Sudoku', 'Tria la dificultat', ['6×6 · moltes caselles ja posades', '6×6 · equilibri', '9×9 · repte complet'],
      n => { nivellActual = n; cfg = NIVELLS[n]; reiniciar(); mostrarPantalla('joc-sudoku'); }),
    reiniciar
  });
})();
