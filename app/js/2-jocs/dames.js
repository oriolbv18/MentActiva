'use strict';
// ==========================================================
//  DAMES
//  Captura obligatòria, captures encadenades, reina d'un pas.
//  Tauler: 64 enters (1 blanca, 2 reina blanca, -1 negra, -2 reina negra).
//  Les blanques (jugador 1 / tu) pugen cap a la fila 0.
// ==========================================================
(() => {
  const N = 8, BLANQUES = 1, NEGRES = -1, LIMIT_TAULES = 50;
  let b = [], torn = BLANQUES, nivell = 'mig', dos = false, passos = [], legals = [], fi = false, historial = [], sensePrise = 0, rellotgeIA = null, ultim = null;
  const casellaNom = (f, c) => 'ABCDEFGH'[c] + (N - f);   // notació d'escacs: columna A-H, fila 8-1

  const dins = (f, c) => f >= 0 && f < N && c >= 0 && c < N;
  const colorDe = v => Math.sign(v);
  const nomTorn = t => dos ? (t === BLANQUES ? 'Jugador 1 (blanques)' : 'Jugador 2 (negres)') : (t === BLANQUES ? 'Tu (blanques)' : 'Ordinador (negres)');
  const dirsDe = v => Math.abs(v) === 2 ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (v > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
  const ultimaFila = v => v > 0 ? 0 : N - 1;

  function inicial() {
    const t = Array(N * N).fill(0);
    for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if ((f + c) % 2 === 1) { if (f < 3) t[f * N + c] = NEGRES; else if (f > 4) t[f * N + c] = BLANQUES; }
    return t;
  }

  // ---------- Generador de moviments (funcions pures sobre un tauler) ----------
  function captures(t, f, c, v, cami, caps, sortida) {
    let esteses = false;
    for (const [df, dc] of dirsDe(v)) {
      const mf = f + df, mc = c + dc, tf = f + 2 * df, tc = c + 2 * dc;
      if (!dins(tf, tc)) continue;
      const mig = t[mf * N + mc];
      if (mig === 0 || colorDe(mig) === colorDe(v) || caps.includes(mf * N + mc) || t[tf * N + tc] !== 0) continue;
      esteses = true;
      const nCami = [...cami, [tf, tc]], nCaps = [...caps, mf * N + mc];
      if (Math.abs(v) === 1 && tf === ultimaFila(v)) sortida.push({ cami: nCami, caps: nCaps });   // en coronar-se, s'acaba el torn
      else captures(t, tf, tc, v, nCami, nCaps, sortida);
    }
    if (!esteses && caps.length) sortida.push({ cami, caps });
  }
  function moviments(t, color) {
    const caps = [], simples = [];
    for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
      const v = t[f * N + c]; if (!v || colorDe(v) !== color) continue;
      t[f * N + c] = 0;                                   // l'origen queda lliure durant la cerca
      captures(t, f, c, v, [[f, c]], [], caps);
      t[f * N + c] = v;
      for (const [df, dc] of dirsDe(v)) if (dins(f + df, c + dc) && t[(f + df) * N + c + dc] === 0) simples.push({ cami: [[f, c], [f + df, c + dc]], caps: [] });
    }
    return caps.length ? caps : simples;
  }
  function aplica(t, mv) {
    const [f0, c0] = mv.cami[0], [f1, c1] = mv.cami[mv.cami.length - 1];
    let v = t[f0 * N + c0]; t[f0 * N + c0] = 0;
    mv.caps.forEach(i => { t[i] = 0; });
    if (Math.abs(v) === 1 && f1 === ultimaFila(v)) v *= 2;
    t[f1 * N + c1] = v;
    return v;
  }

  // ---------- Intel·ligència artificial (minimax amb poda alfa-beta) ----------
  function avalua(t) {
    let s = 0;
    for (let i = 0; i < t.length; i++) {
      const v = t[i]; if (!v) continue; const f = i >> 3;
      s += v === 1 ? 100 + (7 - f) * 3 : v === -1 ? -(100 + f * 3) : v * 130;
    }
    return s;
  }
  function minimax(t, color, prof, alfa, beta) {
    const ms = moviments(t, color);
    if (!ms.length) return color === BLANQUES ? -10000 - prof : 10000 + prof;
    if (prof === 0) return avalua(t);
    let millor = color === BLANQUES ? -Infinity : Infinity;
    for (const mv of ms) {
      const c = t.slice(); aplica(c, mv);
      const v = minimax(c, -color, prof - 1, alfa, beta);
      if (color === BLANQUES) { millor = Math.max(millor, v); alfa = Math.max(alfa, v); } else { millor = Math.min(millor, v); beta = Math.min(beta, v); }
      if (beta <= alfa) break;
    }
    return millor;
  }
  function triaIA() {
    const ms = moviments(b, NEGRES);
    if (nivell === 'facil') return aleatori(ms);
    const prof = nivell === 'mig' ? 2 : 5;
    let millor = [], valor = Infinity;
    for (const mv of ms) {
      const c = b.slice(); aplica(c, mv);
      const v = minimax(c, BLANQUES, prof - 1, -Infinity, Infinity);
      if (v < valor) { valor = v; millor = [mv]; } else if (v === valor) millor.push(mv);
    }
    return aleatori(millor);
  }

  // ---------- Interfície ----------
  function reiniciar() {
    aturaTemps(rellotgeIA);
    b = inicial(); torn = BLANQUES; passos = []; fi = false; historial = []; sensePrise = 0; ultim = null;
    legals = moviments(b, torn);
    setText('dames-subtitol', dos ? 'Jugador 1 contra Jugador 2' : `Contra l'ordinador · ${{ facil: 'fàcil', mig: 'mig', dificil: 'difícil' }[nivell]}`);
    mostra('dames-desfer', !dos && nivell === 'facil', 'inline-flex');
    setFeedback('dames', dos ? 'Comença el Jugador 1 (blanques).' : 'Toca una peça blanca per començar.');
    pinta();
  }
  function pinta() {
    const sel = passos.length ? passos[passos.length - 1] : null;
    const possibles = new Set(candidats().map(m => m.cami[passos.length]).filter(Boolean).map(([f, c]) => f * N + c));
    const origens = new Set(passos.length ? [] : legals.map(m => m.cami[0][0] * N + m.cami[0][1]));
    // Rastre de l'última jugada: d'on ha sortit la peça, per on ha passat, on ha arribat i què s'ha menjat
    const rastre = new Map();
    if (ultim) {
      ultim.cami.forEach(([f, c], i) => rastre.set(f * N + c, i === 0 ? ' rastre-origen' : i === ultim.cami.length - 1 ? ' rastre-desti' : ' rastre-pas'));
      ultim.caps.forEach(i => rastre.set(i, ' rastre-capt'));
    }
    let h = '', nb = 0, nn = 0;
    for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
      const v = b[f * N + c], fosca = (f + c) % 2 === 1;
      if (v > 0) nb++; else if (v < 0) nn++;
      if (!fosca) { h += '<div class="casella clara"></div>'; continue; }
      const cls = 'casella fosca' + (sel && sel[0] === f && sel[1] === c ? ' seleccionada' : '') + (possibles.has(f * N + c) ? ' possible' : '') + (origens.has(f * N + c) && !fi ? ' movible' : '') + (rastre.get(f * N + c) || '');
      const peca = v ? `<span class="peca ${v > 0 ? 'blanca' : 'negra'}${Math.abs(v) === 2 ? ' rei' : ''}"></span>` : '';
      h += `<button type="button" class="${cls}" data-f="${f}" data-c="${c}" aria-label="Fila ${f + 1}, columna ${c + 1}">${peca}</button>`;
    }
    morph($('dames-tauler'), h);
    setText('dames-blanques', nb); setText('dames-negres', nn); setText('dames-torn', fi ? '—' : nomTorn(torn));
  }
  // moviments legals compatibles amb els passos ja fets
  const candidats = () => legals.filter(m => passos.every((p, i) => m.cami[i] && m.cami[i][0] === p[0] && m.cami[i][1] === p[1]));

  function clic(f, c) {
    if (fi || (!dos && torn !== BLANQUES)) return;
    if (!passos.length) {
      if (legals.some(m => m.cami[0][0] === f && m.cami[0][1] === c)) { soClic(); passos = [[f, c]]; setFeedback('dames', 'Tria on vols moure-la.'); }
      else if (b[f * N + c] && colorDe(b[f * N + c]) === torn) {
        setFeedback('dames', legals[0] && legals[0].caps.length ? 'Tens una captura obligatòria: has de menjar.' : 'Aquesta peça no es pot moure.', 'incorrecte'); soError();
      }
      pinta(); return;
    }
    const seg = candidats().filter(m => m.cami[passos.length] && m.cami[passos.length][0] === f && m.cami[passos.length][1] === c);
    if (seg.length) {
      passos.push([f, c]);
      const acabat = seg.find(m => m.cami.length === passos.length);
      if (acabat) { executa(acabat); return; }
      soClic(); setFeedback('dames', 'Pots seguir menjant: tria la propera casella.');
    } else if (legals.some(m => m.cami[0][0] === f && m.cami[0][1] === c) && passos.length === 1) {
      soClic(); passos = [[f, c]];                       // canvia de peça
    } else passos = [];
    pinta();
  }
  function executa(mv) {
    if (!dos && torn === BLANQUES && nivell === 'facil') historial.push({ b: b.slice(), sensePrise });
    const peca = Math.abs(b[mv.cami[0][0] * N + mv.cami[0][1]]), qui = torn;
    aplica(b, mv); passos = [];
    ultim = { cami: mv.cami, caps: mv.caps };
    const descMov = `${dos ? (qui === BLANQUES ? 'Jugador 1' : 'Jugador 2') : (qui === BLANQUES ? 'Has mogut' : "L'ordinador ha mogut")}${dos ? ' ha mogut' : ''} ${mv.cami.map(([f, c]) => casellaNom(f, c)).join(' → ')}${mv.caps.length ? ` i ha menjat ${mv.caps.length > 1 ? mv.caps.length + ' peces' : 'una peça'}` : ''}.`;
    if (mv.caps.length) { soEncert(); vibrar([30, 20, 30]); sensePrise = 0; } else { soClic(); vibrar(20); sensePrise = peca === 1 ? 0 : sensePrise + 1; }
    torn = -torn; legals = moviments(b, torn); pinta();
    if (comprovaFinal()) return;
    setFeedback('dames', `${descMov} ${dos ? `Torn de ${nomTorn(torn)}.` : (torn === NEGRES ? "Pensa l'ordinador…" : 'El teu torn.')}`);
    if (!dos && torn === NEGRES) rellotgeIA = temps(jugaIA, 700);
  }
  function jugaIA() { if (!fi && legals.length) executa(triaIA()); }

  function comprovaFinal() {
    const nb = b.filter(v => v > 0).length, nn = b.filter(v => v < 0).length;
    let guanyador = 0;
    if (!legals.length) guanyador = -torn;                 // qui no pot moure, perd
    else if (sensePrise >= LIMIT_TAULES) guanyador = 2;   // taules
    if (!guanyador) return false;
    fi = true; pinta();
    if (guanyador === 2) {
      setFeedback('dames', 'Taules: ningú pot avançar.', ''); if (dos) finalPartida2P(''); else finalitzarPartida('dames', 12 - nn, 12 - nb, 'Taules', metaResultat('taules', nn, nb)); return true;
    }
    if (dos) { setFeedback('dames', finalPartida2P(`Guanya el Jugador ${guanyador === BLANQUES ? 1 : 2}!`), 'correcte'); return true; }
    if (guanyador === BLANQUES) { setFeedback('dames', 'Has guanyat!', 'correcte'); soVictoria(); celebracioCompleta(); }
    else { setFeedback('dames', 'Has perdut. Torna-ho a provar!', 'incorrecte'); soError(); }
    finalitzarPartida('dames', 12 - nn, 12 - nb, `Has menjat ${12 - nn} peces i n'has perdut ${12 - nb}`, metaResultat(guanyador === BLANQUES ? 'victoria' : 'derrota', nn, nb));
    return true;
  }
  // Victòria = 100 %, taules = 50 %, derrota = fins a 40 % segons les peces menjades
  function metaResultat(res, nn, nb) {
    const menjades = 12 - nn, perdudes = 12 - nb;
    const pct = res === 'victoria' ? 100 : res === 'taules' ? 50 : Math.round(menjades / 12 * 40);
    return { resultat: res, pct, puntuacio: Math.max(0, menjades * 10 - perdudes * 3 + (res === 'victoria' ? 100 : 0)) };
  }

  $('dames-tauler').addEventListener('click', ev => { const s = ev.target.closest('[data-f]'); if (s) clic(+s.dataset.f, +s.dataset.c); });
  $('dames-desfer').addEventListener('click', () => {
    if (!historial.length) { setFeedback('dames', 'No hi ha res a desfer.', 'incorrecte'); return; }
    registraAjuda(); aturaTemps(rellotgeIA); const h = historial.pop();
    b = h.b; sensePrise = h.sensePrise; torn = BLANQUES; fi = false; passos = []; ultim = null; legals = moviments(b, torn);
    setFeedback('dames', ' Jugada desfeta'); soClic(); pinta();
  });

  // Pista: el millor moviment segons un càlcul de tres jugades (el mateix que fa servir l'ordinador mitjà) i per què
  function milloMoviment() {
    if (fi || dos || torn !== BLANQUES || !legals.length) return null;
    let millor = null, valor = -Infinity;
    for (const mv of legals) {
      const c = b.slice(); aplica(c, mv); const v = minimax(c, NEGRES, 2, -Infinity, Infinity);
      if (v > valor) { valor = v; millor = mv; }
    }
    return millor;
  }
  const casellaD = (f, c) => $('dames-tauler').querySelector(`[data-f="${f}"][data-c="${c}"]`);
  const pista = {
    obtenir(k) {
      const mv = milloMoviment(); if (!mv) return null;
      const o = mv.cami[0], d = mv.cami[mv.cami.length - 1];
      if (k === 1) return { text: legals[0].caps.length ? "Tens una captura obligatòria: mira quines peces poden menjar." : "Avança sense deixar cap peça sola davant d'una peça rival." };
      if (k === 2) return { text: `Mou aquesta peça (${casellaNom(o[0], o[1])}) cap a la casella ${casellaNom(d[0], d[1])}.`, objectiu: () => [casellaD(o[0], o[1]), casellaD(d[0], d[1])] };
      const motiu = mv.caps.length ? `menges ${mv.caps.length === 1 ? 'una peça' : mv.caps.length + ' peces'} del rival` : (Math.abs(b[o[0] * N + o[1]]) === 1 && d[0] === ultimaFila(1)) ? "arribes a l'última fila i la peça es corona" : "he mirat unes quantes jugades endavant i aquesta és la que et deixa en millor posició";
      return { text: `Millor jugada: ${casellaNom(o[0], o[1])} → ${casellaNom(d[0], d[1])}.`, explica: `Mou de ${casellaNom(o[0], o[1])} a ${casellaNom(d[0], d[1])}: ${motiu}.`, objectiu: () => [casellaD(o[0], o[1]), casellaD(d[0], d[1])], aplica: () => [casellaD(d[0], d[1])].forEach(el => { if (el) { el.classList.add('pista-flash'); setTimeout(() => el.classList.remove('pista-flash'), 6000); } }) };
    }
  };

  registrarJoc({
    id: 'dames', pista,
    tutorial: { titol: 'Dames', cos: '<p>Mou les teves peces <strong>blanques</strong> en diagonal cap endavant. Toca una peça i després la casella on vols anar.</p><div class="regles"><strong>Regles que fem servir</strong><ul><li>Una peça es mou una casella en diagonal cap endavant.</li><li>Si pots saltar una peça contrària, <strong>has de menjar</strong> (és obligatori) i pots encadenar salts.</li><li>Les peces no mengen cap enrere, però les dames sí.</li><li>En arribar a l\'últim costat, la peça es corona i es converteix en <strong>dama</strong>: es mou una casella en qualsevol diagonal.</li><li>Guanya qui deixa l\'altre sense moviments o sense peces. Si passen 50 jugades sense menjar ni avançar, són taules.</li></ul></div><p>Nivells: <strong>fàcil</strong> mou a l\'atzar (i et deixa desfer); <strong>mig</strong> pensa 2 jugades; <strong>difícil</strong> en pensa 5.</p>' },
    obrir: ds => {
      dos = ds;
      if (ds) { nivell = 'mig'; reiniciar(); mostrarPantalla('joc-dames'); return; }
      triaDificultat('dames', 'Dames', 'Contra qui vols jugar?', ['Ordinador fluix · amb ajuda i desfer', 'Pensa un parell de jugades', 'Pensa diverses jugades endavant'],
        n => { nivell = n; reiniciar(); mostrarPantalla('joc-dames'); });
    },
    reiniciar
  });
})();
