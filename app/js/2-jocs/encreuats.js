'use strict';
// ==========================================================
//  MOTS ENCREUATS (v2.0)
//  El passatemps de paper que més surt a les entrevistes (P03, P04, P07), en petit i amb lletra gran.
//  Graelles noves cada vegada, fetes amb les paraules i les pistes d'«Endevina la paraula».
//  Fàcil: 3 paraules amb la primera lletra posada. Mig: 4. Difícil: 5, sense cap lletra posada.
// ==========================================================
(() => {
  const MAX_COL = 8, MAX_FIL = 7;   // perquè graella, pista i teclat càpiguen sense desplaçar la pantalla al mòbil
  let nivell = 'facil', g = null, sel = 0, pos = 0, errors = 0, donades = 0, acabat = false;
  const lletraBase = l => base(l).toUpperCase();
  const clau = (f, c) => f + ',' + c;
  const bancEnc = () => (I18N.llengua === 'es' && window.BANCS_ES ? BANCS_ES.paraules.map(([paraula, pista]) => ({ paraula, pista })) : BARALLA_PARAULES).filter(p => /^\p{Lu}{3,7}$/u.test(p.paraula));

  // Construeix una graella petita: cada paraula nova ha de creuar-ne una altra i no pot tocar-ne cap de costat
  function construeix(n) {
    for (let intent = 0; intent < 80; intent++) {
      const cand = barreja(bancEnc()), cel = new Map(), paraules = [];
      const posa = (p, f, c, dir) => { [...p.paraula].forEach((l, i) => cel.set(clau(dir ? f + i : f, dir ? c : c + i), l)); paraules.push({ paraula: p.paraula, pista: p.pista, f, c, dir }); };
      const dinsLimit = (f, c, dir, len) => { const fs = [f, dir ? f + len - 1 : f], cs = [c, dir ? c : c + len - 1]; [...cel.keys()].forEach(k => { const [a, b] = k.split(',').map(Number); fs.push(a); cs.push(b); }); return Math.max(...fs) - Math.min(...fs) < MAX_FIL && Math.max(...cs) - Math.min(...cs) < MAX_COL; };
      const encaixa = (w, f, c, dir) => {
        const lletra = (a, b) => cel.get(clau(a, b)), df = dir ? 1 : 0, dc = dir ? 0 : 1;
        if (lletra(f - df, c - dc) || lletra(f + df * w.length, c + dc * w.length)) return false;
        let creua = 0;
        for (let i = 0; i < w.length; i++) {
          const a = f + df * i, b = c + dc * i, ex = lletra(a, b);
          if (ex) { if (lletraBase(ex) !== lletraBase(w[i])) return false; creua++; continue; }
          if (lletra(a + dc, b + df) || lletra(a - dc, b - df)) return false;
        }
        return creua >= 1 && creua < w.length;
      };
      posa(cand[0], 0, 0, 0);
      for (const p of cand.slice(1)) {
        if (paraules.length >= n) break;
        if (paraules.some(x => x.paraula === p.paraula)) continue;
        const w = [...p.paraula]; let feta = false;
        for (const q of barreja(paraules)) {
          const lq = [...q.paraula];
          for (let i = 0; i < w.length && !feta; i++) for (let j = 0; j < lq.length && !feta; j++) {
            if (lletraBase(w[i]) !== lletraBase(lq[j])) continue;
            const dir = q.dir ? 0 : 1, f = q.dir ? q.f + j : q.f - i, c = q.dir ? q.c - i : q.c + j;
            if (encaixa(w, f, c, dir) && dinsLimit(f, c, dir, w.length)) { posa(p, f, c, dir); feta = true; }
          }
          if (feta) break;
        }
      }
      if (paraules.length < n) continue;
      const fmin = Math.min(...[...cel.keys()].map(k => +k.split(',')[0])), cmin = Math.min(...[...cel.keys()].map(k => +k.split(',')[1]));
      paraules.forEach((p, i) => { p.f -= fmin; p.c -= cmin; p.num = i + 1; });
      const cells = {}; let fils = 0, cols = 0;
      paraules.forEach((p, wi) => [...p.paraula].forEach((l, i) => { const f = p.dir ? p.f + i : p.f, c = p.dir ? p.c : p.c + i, k = clau(f, c); fils = Math.max(fils, f + 1); cols = Math.max(cols, c + 1); (cells[k] = cells[k] || { f, c, sol: lletraBase(l), real: l, val: '', fix: false, words: [] }).words.push(wi); }));
      return { paraules, cells, fils, cols };
    }
    return null;
  }
  const celsParaula = i => { const p = g.paraules[i]; return [...p.paraula].map((_, k) => g.cells[clau(p.dir ? p.f + k : p.f, p.dir ? p.c : p.c + k)]); };
  const resolta = i => celsParaula(i).every(x => x.val === x.sol);
  const blocada = x => x.fix || x.words.some(w => w !== sel && resolta(w));
  const primeraBuida = i => { const c = celsParaula(i), k = c.findIndex(x => !x.val); return k < 0 ? 0 : k; };

  function pinta() {
    const act = celsParaula(sel), actual = act[pos], es = I18N.llengua === 'es';
    let h = '';
    for (let f = 0; f < g.fils; f++) for (let c = 0; c < g.cols; c++) {
      const x = g.cells[clau(f, c)];
      if (!x) { h += '<span class="enc-buit" aria-hidden="true"></span>'; continue; }
      const num = g.paraules.find(p => p.f === f && p.c === c), fet = x.words.some(resolta);
      h += `<button type="button" class="enc-cel${act.includes(x) ? ' sel' : ''}${x === actual ? ' cursor' : ''}${fet ? ' feta' : ''}" data-k="${f},${c}" aria-label="${esc((es ? 'Casilla' : 'Casella') + ' ' + (x.val || (es ? 'vacía' : 'buida')))}">${num ? `<small>${num.num}</small>` : ''}${esc(fet ? x.real : x.val)}</button>`;
    }
    const gr = $('enc-graella'); gr.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, min(2.8rem, 5.1vh)))`; gr.innerHTML = h;
    const fl = n => (es ? `${n} letras` : `${n} lletres`);
    $('enc-pistes').innerHTML = g.paraules.map((p, i) => `<button type="button" class="enc-pista${i === sel ? ' sel' : ''}${resolta(i) ? ' feta' : ''}" data-w="${i}" aria-pressed="${i === sel}"><b>${p.num}</b><span>${esc(p.pista)} <small>(${fl([...p.paraula].length)})</small></span>${resolta(i) ? ico('check') : ''}${i === sel && g.paraules.length > 1 ? `<span class="enc-seg" aria-hidden="true">${ico('fletxa')}</span>` : ''}</button>`).join('');
    setText('enc-fetes', g.paraules.filter((_, i) => resolta(i)).length); setText('enc-total', g.paraules.length);
  }
  function tria(i, k) { sel = i; pos = k == null ? primeraBuida(i) : k; soClic(); pinta(); llegirText(g.paraules[i].pista); }
  function escriu(l) {
    if (acabat || !g || resolta(sel)) return;
    const cs = celsParaula(sel); let x = cs[pos];
    if (blocada(x)) { pos = cs.findIndex(y => !blocada(y) && !y.val); if (pos < 0) return; x = cs[pos]; }
    x.val = l; soClic(); vibrar(15);
    const seg = cs.findIndex((y, i) => i > pos && !y.val);
    if (cs.every(y => y.val)) { comprova(); return; }
    if (seg >= 0) pos = seg; else pos = cs.findIndex(y => !y.val);
    pinta();
  }
  function esborra() {
    if (acabat || !g || resolta(sel)) return;
    const cs = celsParaula(sel);
    for (let k = cs.length - 1; k >= 0; k--) if (cs[k].val && !blocada(cs[k])) { cs[k].val = ''; pos = k; break; }
    soClic(); pinta();
  }
  function comprova() {
    const es = I18N.llengua === 'es';
    registraTR(ara() - tempsIniciPregunta); iniciTemps();
    if (resolta(sel)) {
      soEncert(); vibrar([40, 30, 40]); setFeedback('encreuats', es ? '¡Muy bien!' : 'Molt bé!', 'correcte');
      if (g.paraules.every((_, i) => resolta(i))) { acabat = true; pinta(); temps(() => finalitzarPartida('encreuats', g.paraules.length, errors, '', { pct: Math.max(30, 100 - errors * 10 - donades * 8) }), 900); return; }
      const i = g.paraules.findIndex((_, k) => !resolta(k)); sel = i; pos = primeraBuida(i); pinta(); return;
    }
    errors++; soError(); vibrar(150);
    guardarError(g.paraules[sel].pista, g.paraules[sel].paraula, celsParaula(sel).map(x => x.val).join(''));
    setFeedback('encreuats', es ? 'Esta palabra no encaja. Prueba otra vez, sin prisa.' : 'Aquesta paraula no hi encaixa. Torna-ho a provar, sense pressa.', 'incorrecte');
    celsParaula(sel).forEach(x => { if (!blocada(x)) x.val = ''; }); pos = primeraBuida(sel); pinta();
  }
  function donaLletra() {
    if (acabat || !g || resolta(sel)) return;
    const x = celsParaula(sel).find(y => y.val !== y.sol); if (!x) return;
    x.val = x.sol; x.fix = true; donades++; registraAjuda(); soClic();
    if (celsParaula(sel).every(y => y.val)) comprova(); else { pos = primeraBuida(sel); pinta(); }
  }
  function reiniciar() {
    g = construeix(nivell === 'facil' ? 3 : nivell === 'mig' ? 4 : 5); sel = 0; errors = 0; donades = 0; acabat = false;
    if (nivell === 'facil') g.paraules.forEach((_, i) => { const c = celsParaula(i)[0]; c.val = c.sol; c.fix = true; });
    pos = primeraBuida(0); setFeedback('encreuats', ''); iniciTemps();
    $('enc-teclat').innerHTML = LLETRES.map(l => `<button type="button" class="tecla" data-enc="${l}">${l}</button>`).join('') + `<button type="button" class="tecla enc-esborra" data-enc="x" aria-label="${I18N.llengua === 'es' ? 'Borrar la última letra' : 'Esborrar l\'última lletra'}">${ico('desfer')}</button>`;
    pinta();
  }
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    const t = e.target.closest('#enc-teclat [data-enc]'); if (t) { if (t.dataset.enc === 'x') esborra(); else escriu(t.dataset.enc); return; }
    if (e.target.closest('#enc-lletra')) { donaLletra(); return; }
    const w = e.target.closest('#enc-pistes [data-w]');
    if (w) { const i = +w.dataset.w, nomesUna = getComputedStyle(w.parentElement.querySelector('.enc-pista:not(.sel)') || w).display === 'none'; tria(nomesUna && i === sel ? (i + 1) % g.paraules.length : i); return; }   // al mòbil només es veu la pista triada: tocar-la passa a la següent
    const c = e.target.closest('#enc-graella [data-k]');
    if (c && g) { const x = g.cells[c.dataset.k], i = x.words.includes(sel) && x.words.length > 1 ? x.words.find(v => v !== sel) : x.words[0]; tria(i, celsParaula(i).indexOf(x)); }
  });
  document.addEventListener('keydown', e => {
    if (!pantallaActiva('joc-encreuats') || document.querySelector('.modal-fons.actiu, #tutorialOverlay.actiu') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') { e.preventDefault(); esborra(); return; }
    if (/^\p{L}$/u.test(e.key)) { const l = lletraBase(e.key); if (LLETRES.includes(l)) escriu(l); }
  });
  const pista = {
    obtenir(n) {
      if (acabat || !g) return null;
      const p = g.paraules[sel], es = I18N.llengua === 'es', primera = [...p.paraula][0];
      if (n === 1) return { text: `${es ? 'Pista' : 'Pista'}: ${p.pista}.` };
      if (n === 2) return { text: es ? `Empieza por «${primera}».` : `Comença per «${primera}».`, objectiu: () => $('enc-graella') };
      return { text: es ? 'Te pongo una letra.' : 'Et poso una lletra.', aplica: donaLletra, objectiu: () => $('enc-graella') };
    }
  };
  registrarJoc({
    id: 'encreuats', pista,
    tutorial: { titol: 'Mots encreuats', cos: '<p>Toca una <strong>pista</strong> i escriu la paraula amb les lletres de sota.</p><p>Si et quedes encallat, toca <strong>«Posa\'m una lletra»</strong>. Cap pressa.</p>' },
    obrir: () => triaDificultat('encreuats', 'Mots encreuats', 'Tria la dificultat', ['3 paraules, amb la primera lletra posada', '4 paraules', '5 paraules, sense cap lletra posada'], v => { nivell = v; reiniciar(); mostrarPantalla('joc-encreuats'); }),
    reiniciar,
    _sol: () => (g ? g.paraules.map((p, i) => celsParaula(i).map(x => x.sol)) : null),
    _graella: () => g,
    _estat: () => { if (!g || acabat) return null; const c = celsParaula(sel); if (blocada(c[pos]) || c[pos].val) { const k = c.findIndex(y => !blocada(y) && !y.val); return k < 0 ? null : c[k].sol; } return c[pos].sol; }
  });
})();
