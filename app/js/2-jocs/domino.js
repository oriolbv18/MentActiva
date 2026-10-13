'use strict';
// ==========================================================
//  DÒMINO (7 fitxes per jugador + pou per robar)
//  Contra l'ordinador o 1 contra 1 al mateix dispositiu.
// ==========================================================
(() => {
  const PUNTS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];   // posició dels punts en una graella 3×3
  const mitat = n => `<span class="meitat">${Array.from({ length: 9 }, (_, i) => `<i${PUNTS[n].includes(i) ? ' class="on"' : ''}></i>`).join('')}</span>`;
  const htmlFitxa = (t, cls = '') => `${mitat(t[0])}${mitat(t[1])}`;
  const suma = t => t[0] + t[1];
  const idFitxa = t => Math.min(t[0], t[1]) + '-' + Math.max(t[0], t[1]);

  let nivell = 'mig', dos = false, e = null, pendent = null, historial = [], ocult = false, rellotgeIA = null;
  const nom = j => dos ? `Jugador ${j + 1}` : (j === 0 ? 'Tu' : "L'ordinador");
  const encaixa = t => t.includes(e.esq) || t.includes(e.dret);
  function costats(t) { const r = []; if (t.includes(e.esq)) r.push('esq'); if (t.includes(e.dret) && !(r.length && e.esq === e.dret)) r.push('dret'); return r; }
  // retorna la fitxa orientada perquè la meitat que toca el tauler coincideixi
  const orientada = (t, costat) => costat === 'esq' ? (t[1] === e.esq ? t : [t[1], t[0]]) : (t[0] === e.dret ? t : [t[1], t[0]]);

  function reiniciar() {
    aturaTemps(rellotgeIA);
    const fitxes = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) fitxes.push([a, b]);
    const b = barreja(fitxes), mans = [b.slice(0, 7), b.slice(7, 14)];
    // Comença qui té el doble més alt (o, si no n'hi ha, la fitxa de més punts)
    let millor = null;
    mans.forEach((m, j) => m.forEach((t, i) => { const p = (t[0] === t[1] ? 100 : 0) + suma(t); if (!millor || p > millor.p) millor = { p, j, i }; }));
    const inicial = mans[millor.j].splice(millor.i, 1)[0];
    // noTe[j]: números que el jugador j no ha pogut posar (només l'ordinador difícil ho fa servir per bloquejar l'humà)
    e = { tauler: [inicial], esq: inicial[0], dret: inicial[1], mans, pou: b.slice(14), torn: 1 - millor.j, passes: 0, fi: false, ultima: idFitxa(inicial), noTe: [[], []] };
    pendent = null; historial = []; ocult = false;
    setText('domino-subtitol', dos ? 'Dos jugadors humans' : `Contra l'ordinador · ${{ facil: 'fàcil', mig: 'mig', dificil: 'difícil' }[nivell]}`);
    setText('domino-oponent-label', dos ? 'Jugador 2' : 'Ordinador'); setText('domino-tu-label', dos ? 'Jugador 1' : 'Tu'); setText('domino-ma-titol', dos ? 'Mà del jugador' : 'La teva mà');
    mostra('domino-desfer', !dos && nivell === 'facil', 'inline-flex');
    setFeedback('domino', `${nom(millor.j)} ${dos ? 'comença' : (millor.j === 0 ? 'comences' : 'comença')} amb la fitxa ${inicial[0]}-${inicial[1]}.`);
    pinta(); rellotgeIA = temps(iniciaTorn, 1100);
  }

  function pinta() {
    morph($('domino-tauler'), e.tauler.map(t => `<span class="fitxa${idFitxa(t) === e.ultima ? ' ultima' : ''}">${htmlFitxa(t)}</span>`).join(''));
    const j = dos ? e.torn : 0, huma = !e.fi && e.torn === j && (dos || e.torn === 0);
    const ma = e.mans[j];
    if (dos && ocult && !e.fi) {
      morph($('domino-ma'), `<button type="button" class="boto-principal" data-mostrar>${nom(e.torn)}: toca per veure la teva mà</button>`);
    } else {
      morph($('domino-ma'), ma.map((t, i) => {
        const juga = huma && encaixa(t);
        return `<button type="button" class="fitxa${juga ? '' : ' disabled'}${juga && nivell === 'facil' && !dos ? ' hint-highlight' : ''}${pendent === i ? ' seleccionada' : ''}" data-i="${i}" ${juga ? '' : 'aria-disabled="true"'}>${htmlFitxa(t)}</button>`;
      }).join(''));
    }
    setText('domino-ma-count', e.mans[0].length); setText('domino-ia-count', e.mans[1].length);
    setText('domino-pou', e.pou.length); setText('domino-torn', e.fi ? '—' : nom(e.torn));
    setText('domino-extrems', e.esq + ' · ' + e.dret);
    $('domino-costats').classList.toggle('visible', pendent !== null);
    ajustaFitxes();
  }

  // Totes les fitxes (tauler i mà) tenen exactament la mateixa mida, calculada perquè càpiguen sense scroll
  function ajustaFitxes() {
    const tau = $('domino-tauler-area'), ma = $('domino-ma'); if (!tau || !ma || !tau.clientWidth) return;
    const cap = (area, n, t) => { const g = Math.max(3, t * 0.14), perFila = Math.max(1, Math.floor((area.clientWidth - 8 + g) / (2 * t + g))); return Math.ceil(n / perFila) * (t + g) - g <= area.clientHeight - 8; };
    const nT = e.tauler.length, nM = Math.max(e.mans[dos ? e.torn : 0].length, 1);
    let t = 56; while (t > 16 && !(cap(tau, nT, t) && cap(ma, nM, t))) t--;
    $('joc-domino').style.setProperty('--ft', t + 'px');
  }
  new ResizeObserver(() => { if (e) ajustaFitxes(); }).observe($('domino-tauler-area'));

  function iniciaTorn() {
    if (e.fi) return;
    const j = e.torn, m = e.mans[j];
    let robades = 0;
    if (!m.some(encaixa)) { [e.esq, e.dret].forEach(x => { if (!e.noTe[j].includes(x)) e.noTe[j].push(x); }); }
    while (!m.some(encaixa) && e.pou.length) { m.push(e.pou.pop()); robades++; }
    if (robades) { setFeedback('domino', `${nom(j)} ha robat ${robades} fitxa${robades > 1 ? 'es' : ''}.`); soClic(); }
    if (!m.some(encaixa)) {
      if (++e.passes >= 2) { acabaBloqueig(); return; }
      setFeedback('domino', `${nom(j)} no pot jugar i passa.`); e.torn = 1 - j; pinta();
      rellotgeIA = temps(iniciaTorn, 1300); return;
    }
    if (dos) ocult = true;
    pinta();
    if (!dos && j === 1) rellotgeIA = temps(jugaIA, 1000);
    else if (!robades && !dos) setFeedback('domino', 'El teu torn: toca una fitxa que encaixi.');
  }

  function juga(j, i, costat) {
    if (!dos && j === 0 && nivell === 'facil') historial.push(JSON.stringify(e));
    const t = e.mans[j].splice(i, 1)[0], o = orientada(t, costat);
    if (costat === 'esq') { e.tauler.unshift(o); e.esq = o[0]; } else { e.tauler.push(o); e.dret = o[1]; }
    e.passes = 0; pendent = null; e.ultima = idFitxa(t); soEncert(); vibrar(30);
    if (!e.mans[j].length) {
      e.fi = true; pinta();
      const guanya = j === 0;
      if (dos) setFeedback('domino', finalPartida2P(`Guanya el ${nom(j)}!`), 'correcte');
      else if (guanya) { setFeedback('domino', 'Has guanyat!', 'correcte'); soVictoria(); celebracioCompleta(); finalitzarPartida('domino', 1, 0, '', metaResultat('victoria')); }
      else { setFeedback('domino', "Ha guanyat l'ordinador.", 'incorrecte'); soError(); finalitzarPartida('domino', 0, 1, '', metaResultat('derrota')); }
      return;
    }
    e.torn = 1 - j; ocult = false; setFeedback('domino', j === 0 && !dos ? 'Bona jugada!' : `${nom(j)} ha jugat.`, 'correcte');
    pinta(); rellotgeIA = temps(iniciaTorn, 700);
  }

  function jugaIA() {
    if (e.fi) return;
    const m = e.mans[1], ops = [];
    m.forEach((t, i) => costats(t).forEach(c => ops.push({ i, c, t })));
    if (!ops.length) { iniciaTorn(); return; }
    const puntua = o => {
      let p = suma(o.t) + (o.t[0] === o.t[1] ? 3 : 0);
      if (nivell === 'dificil') {          // prefereix deixar extrems on encara té fitxes per jugar
        const or = orientada(o.t, o.c), esq = o.c === 'esq' ? or[0] : e.esq, dret = o.c === 'dret' ? or[1] : e.dret;
        p += 2 * m.filter((x, k) => k !== o.i && (x.includes(esq) || x.includes(dret))).length;
        // deixar extrems que l'humà no ha pogut cobrir (i que jo domino) el pot fer passar o robar
        [esq, dret].forEach(x => { if (e.noTe[0].includes(x)) p += 6; });
        if (e.mans[0].length <= 2) p += suma(o.t) * 1.5;      // si l'humà està a punt d'acabar, es desfà primer de les fitxes pesades
      }
      return p;
    };
    const tria = nivell === 'facil' ? aleatori(ops) : ops.reduce((a, b) => puntua(b) > puntua(a) ? b : a);
    juga(1, tria.i, tria.c);
  }

  function acabaBloqueig() {
    e.fi = true; const p = e.mans.map(m => m.reduce((s, t) => s + suma(t), 0)); pinta();
    if (dos) {
      setFeedback('domino', finalPartida2P(p[0] === p[1] ? `Empat! (${p[0]} punts)` : `Joc bloquejat. Guanya el ${nom(p[0] < p[1] ? 0 : 1)}! (${p[0]} vs ${p[1]})`), 'correcte'); return;
    }
    if (p[0] < p[1]) { setFeedback('domino', `Joc bloquejat. Has guanyat! (${p[0]} vs ${p[1]} punts)`, 'correcte'); soVictoria(); celebracioCompleta(); finalitzarPartida('domino', 1, 0, 'Joc bloquejat: guanya qui té menys punts a la mà', metaResultat('victoria')); }
    else if (p[0] > p[1]) { setFeedback('domino', `Joc bloquejat. Ha guanyat l'ordinador (${p[0]} vs ${p[1]})`, 'incorrecte'); soError(); finalitzarPartida('domino', 0, 1, 'Joc bloquejat: guanya qui té menys punts a la mà', metaResultat('derrota')); }
    else { setFeedback('domino', `Empat! (${p[0]} punts)`, ''); finalitzarPartida('domino', 1, 1, 'Empat', metaResultat('taules')); }
  }
  // Victòria = 100 %, taules = 50 %, derrota = 0 %; la puntuació suma els punts que queden a la mà de l'ordinador
  function metaResultat(res) {
    const rival = e.mans[1].reduce((s, t) => s + suma(t), 0);
    return { resultat: res, pct: res === 'victoria' ? 100 : res === 'taules' ? 50 : 0, puntuacio: res === 'victoria' ? 100 + rival : res === 'taules' ? 50 : 0 };
  }

  function clicFitxa(i) {
    if (e.fi || (!dos && e.torn !== 0) || ocult) return;
    const t = e.mans[e.torn][i];
    if (!t || !encaixa(t)) { setFeedback('domino', 'Aquesta fitxa no encaixa.', 'incorrecte'); soError(); return; }
    soClic(); const c = costats(t);
    if (c.length === 1) juga(e.torn, i, c[0]);
    else { pendent = i; setFeedback('domino', 'Per quin costat la vols posar?'); pinta(); }
  }
  $('domino-ma').addEventListener('click', ev => {
    if (ev.target.closest('[data-mostrar]')) { soClic(); ocult = false; pinta(); return; }
    const b = ev.target.closest('[data-i]'); if (b) clicFitxa(+b.dataset.i);
  });
  $('domino-costats').addEventListener('click', ev => { const b = ev.target.closest('[data-costat]'); if (b && pendent !== null) juga(e.torn, pendent, b.dataset.costat); });
  $('domino-desfer').addEventListener('click', () => {
    if (!historial.length) { setFeedback('domino', 'No hi ha res a desfer.', 'incorrecte'); return; }
    registraAjuda(); aturaTemps(rellotgeIA); e = JSON.parse(historial.pop()); pendent = null;
    setFeedback('domino', ' Jugada desfeta'); soClic(); pinta();
  });

  // Pista: la fitxa que s'hauria de jugar (la que sumaria més punts i deixa més opcions) i per què
  function milloJugada() {
    if (!e || e.fi || dos || e.torn !== 0 || ocult) return null;
    const m = e.mans[0], ops = [];
    m.forEach((t, i) => costats(t).forEach(c => ops.push({ i, c, t })));
    if (!ops.length) return null;
    const punts = o => {
      const or = orientada(o.t, o.c), esq = o.c === 'esq' ? or[0] : e.esq, dret = o.c === 'dret' ? or[1] : e.dret;
      const opcionsDesprés = m.filter((x, k) => k !== o.i && (x.includes(esq) || x.includes(dret))).length;
      return suma(o.t) + (o.t[0] === o.t[1] ? 3 : 0) + 2 * opcionsDesprés;
    };
    const millor = ops.reduce((a, b) => punts(b) > punts(a) ? b : a), dobla = millor.t[0] === millor.t[1];
    return { millor, dobla, n: ops.length };
  }
  const pista = {
    obtenir(k) {
      const j = milloJugada(); if (!j) return null;
      if (k === 1) return { text: `Busca una fitxa amb un ${e.esq}${e.esq === e.dret ? '' : ' o un ' + e.dret} (els extrems del tauler).` };
      const fitxa = () => $('domino-ma').querySelector(`[data-i="${j.millor.i}"]`);
      if (k === 2) return { text: j.n === 1 ? "Només pots jugar aquesta fitxa." : "Aquesta fitxa encaixa i és una bona jugada.", objectiu: () => fitxa() };
      const t = j.millor.t, motiu = j.dobla ? "els dobles són difícils de col·locar més tard, així que convé jugar-los quan es pot" : suma(t) >= 8 ? "és una fitxa de molts punts, i si el joc es bloqueja els punts de la mà compten en contra teva" : "et deixa extrems on encara tens fitxes per jugar el pròxim torn";
      return { text: `Juga la ${t[0]}-${t[1]} per ${j.millor.c === 'esq' ? 'l\'esquerra' : 'la dreta'}.`, explica: `Juga la fitxa ${t[0]}-${t[1]} per ${j.millor.c === 'esq' ? "l'esquerra" : 'la dreta'}: ${motiu}.`, objectiu: () => fitxa(), aplica: () => { const el = fitxa(); if (el) { el.classList.add('pista-flash'); setTimeout(() => el.classList.remove('pista-flash'), 6000); } } };
    }
  };

  registrarJoc({
    id: 'domino', pista,
    tutorial: { titol: 'Dòmino', cos: '<p>Toca una fitxa de la teva mà que <strong>encaixi amb un dels extrems</strong> del tauler (el mateix nombre de punts).</p><div class="regles"><strong>Regles que fem servir</strong><ul><li>Cada jugador té 7 fitxes. Comença qui té el doble més alt.</li><li>Si no pots posar cap fitxa, <strong>robes</strong> del pou fins que en tinguis una que encaixi.</li><li>Si el pou és buit i no pots jugar, <strong>passes</strong>.</li><li>Guanya qui es queda sense fitxes. Si el joc es bloqueja, guanya qui té <strong>menys punts</strong> a la mà.</li></ul></div><p>Nivells: <strong>fàcil</strong> juga a l\'atzar (amb ajuda i desfer); <strong>mig</strong> posa la fitxa de més punts; <strong>difícil</strong> a més recorda els números que no has pogut posar i intenta bloquejar-te.</p>' },
    obrir: ds => {
      dos = ds;
      if (ds) { nivell = 'mig'; reiniciar(); mostrarPantalla('joc-domino'); return; }
      triaDificultat('domino', 'Dòmino', 'Contra qui vols jugar?', ['Ordinador fluix · amb ajuda i desfer', 'Estratègia bàsica', 'Estratègia avançada'],
        n => { nivell = n; reiniciar(); mostrarPantalla('joc-domino'); });
    },
    reiniciar
  });
})();
