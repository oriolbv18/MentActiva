'use strict';
// ==========================================================
//  BINGO (v1.8): bingo tradicional de 90 boles
//  Cartró de 3 files × 9 columnes amb 15 números (5 per fila). Premis: LÍNIA i després BINGO.
//  Un jugador (amb rivals virtuals) o dos jugadors. Tres nivells d'ajuda. Sense diners ni apostes.
// ==========================================================
(() => {
  const FILES = 3, COLS = 9, PER_FILA = 5, TOTAL_BOLES = 90;
  const VELOCITATS = { lenta: 8000, normal: 5000, rapida: 3000, manual: 0 };
  const NOMS_RIVALS = [['La Dolors', '#a14f7a'], ['En Pere', '#c9771f'], ['La Montse', '#0f7770'], ['En Josep', '#2b6fb3']];
  const CLAU_OPCIONS = 'mentA_bingo_opcions';
  const UNITATS = ['', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou'];
  const DEUS = ['deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou'];
  const DECENES = ['', '', 'vint', 'trenta', 'quaranta', 'cinquanta', 'seixanta', 'setanta', 'vuitanta', 'noranta'];

  // ---------- Utilitats exportades per a les proves ----------
  function numeroCatala(n) {
    if (n < 10) return UNITATS[n];
    if (n < 20) return DEUS[n - 10];
    const d = Math.floor(n / 10), u = n % 10;
    if (!u) return DECENES[d];
    return d === 2 ? 'vint-i-' + UNITATS[u] : DECENES[d] + '-' + UNITATS[u];
  }
  // Cartró: matriu 3×9 (0 = buit). Columna c: 1–9, 10–19, …, 70–79, 80–90. Cada fila té 5 números; cada columna 1–3, ordenats de menor a major.
  function generaCartro() {
    for (let intent = 0; intent < 500; intent++) {
      const comptes = Array(COLS).fill(1);
      for (let rest = 15 - COLS; rest > 0;) { const c = enter(0, COLS - 1); if (comptes[c] < FILES) { comptes[c]++; rest--; } }
      const files = Array.from({ length: COLS }, (_, c) => barreja([0, 1, 2]).slice(0, comptes[c]));
      const perFila = [0, 0, 0]; files.forEach(fs => fs.forEach(f => perFila[f]++));
      if (perFila.some(x => x !== PER_FILA)) continue;
      const cartro = [Array(COLS).fill(0), Array(COLS).fill(0), Array(COLS).fill(0)];
      for (let c = 0; c < COLS; c++) {
        const ini = c === 0 ? 1 : c * 10, fi = c === 8 ? 90 : c * 10 + 9, pool = [];
        for (let n = ini; n <= fi; n++) pool.push(n);
        const nums = barreja(pool).slice(0, comptes[c]).sort((a, b) => a - b), fs = files[c].slice().sort((a, b) => a - b);
        fs.forEach((f, i) => { cartro[f][c] = nums[i]; });
      }
      return cartro;
    }
    throw new Error('No s\'ha pogut generar el cartró');
  }
  const numerosDe = cartro => cartro.flat().filter(Boolean);
  const filesCompletes = (cartro, cantats) => cartro.filter(f => f.filter(Boolean).every(n => cantats.has(n)));
  const filaFeta = (fila, cantats) => fila.filter(Boolean).length === PER_FILA && fila.filter(Boolean).every(n => cantats.has(n));
  const teLinia = (cartro, cantats) => cartro.some(f => filaFeta(f, cantats));
  const teBingo = (cartro, cantats) => numerosDe(cartro).every(n => cantats.has(n));
  const U_ES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'], D_ES = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const V_ES = ['', 'diez', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  function numeroCastella(n) {
    if (n < 10) return U_ES[n]; if (n < 20) return D_ES[n - 10];
    const d = Math.floor(n / 10), u = n % 10;
    if (d === 2) return u ? 'veinti' + ({ 1: 'uno', 2: 'dós', 3: 'trés', 6: 'séis' }[u] || U_ES[u]) : 'veinte';
    return u ? V_ES[d] + ' y ' + U_ES[u] : V_ES[d];
  }
  const numeroParlat = n => (I18N.llengua === 'es' ? numeroCastella(n) : numeroCatala(n));
  const cantDe = n => { const c = I18N.llengua === 'es' ? (window.BANCS_ES && BANCS_ES.cants) : window.BINGO_CANTS; return c && c[n]; };
  window.BINGO = { generaCartro, numerosDe, teLinia, teBingo, numeroCatala, numeroCastella };

  // ---------- Estat ----------
  let opcions = Object.assign({ ajuda: 'ajuda', velocitat: 'normal', cartrons: 1, rivals: 1, cants: false, dificultat: 'mig' }, lsGet(CLAU_OPCIONS, {}));
  let dos = false, jugadors = [], bombo = [], cantats = new Set(), ordre = [], ultim = null, fase = 'config', premiLinia = null, rivals = [], cartroVist = 0;
  let encerts = 0, errors = 0, falses = 0, omissions = 0, rellotge = null, tBola = 0, fi = false, jocActiu = false;

  // ---------- Configuració ----------
  function pintaConfig() {
    const grup = (id, valors, actual, fn) => $(id).innerHTML = valors.map(([v, t]) => `<button type="button" role="radio" aria-checked="${v === actual}" class="${v === actual ? 'sel' : ''}" onclick="${fn}('${v}')">${t}</button>`).join('');
    grup('bingo-op-ajuda', [['sol', 'Jo marco tot'], ['ajuda', 'Amb ajuda'], ['auto', 'Automàtic']], opcions.ajuda, 'bingoOpcio.ajuda');
    grup('bingo-op-vel', [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Ràpida'], ['manual', 'Manual']], opcions.velocitat, 'bingoOpcio.velocitat');
    grup('bingo-op-cartrons', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], String(opcions.cartrons), 'bingoOpcio.cartrons');
    grup('bingo-op-rivals', [['0', 'Cap'], ['1', '1'], ['2', '2'], ['3', '3']], String(opcions.rivals), 'bingoOpcio.rivals');
    $('bingo-op-cants').setAttribute('aria-pressed', !!opcions.cants);
    mostra('bingo-fila-cartrons', !dos, 'block'); mostra('bingo-fila-rivals', !dos, 'block');
    const nomA = { sol: 'Jo marco tot', ajuda: 'Amb ajuda', auto: 'Automàtic' }[opcions.ajuda];
    setText('bingo-resum-op', nomA + ' · bola ' + { lenta: 'lenta', normal: 'normal', rapida: 'ràpida', manual: 'manual' }[opcions.velocitat] + (dos ? '' : ' · ' + opcions.cartrons + (opcions.cartrons > 1 ? ' cartrons' : ' cartró') + (opcions.rivals ? ' · ' + opcions.rivals + (opcions.rivals > 1 ? ' rivals' : ' rival') : '')));
  }
  window.bingoOpcio = {
    ajuda: v => { opcions.ajuda = v; guardaOp(); }, velocitat: v => { opcions.velocitat = v; guardaOp(); },
    cartrons: v => { opcions.cartrons = +v; guardaOp(); }, rivals: v => { opcions.rivals = +v; guardaOp(); },
    cants: () => { opcions.cants = !opcions.cants; guardaOp(); }
  };
  function guardaOp() { soClic(); lsSet(CLAU_OPCIONS, opcions); pintaConfig(); }

  function reiniciar() {
    aturaTemps(rellotge); window.__bingoAvis = null; dos = modeActual === '2vs2'; fase = 'config'; fi = false; jocActiu = false; ultim = null; cantats = new Set(); ordre = []; premiLinia = null;
    encerts = errors = falses = omissions = 0; cartroVist = 0; rivals = []; jugadors = [];
    $('bingo-taulell').hidden = true; $('bingo-config').hidden = false; $('bingo-joc').hidden = true;
    setText('bingo-sub', dos ? 'Qui fa bingo primer guanya' : 'Línia i bingo');
    pintaConfig();
  }

  function comenca() {
    soClic(); aturaTemps(rellotge);
    const nums = Array.from({ length: TOTAL_BOLES }, (_, i) => i + 1);
    bombo = barreja(nums); cantats = new Set(); ordre = []; ultim = null; premiLinia = null; fi = false; jocActiu = true; fase = 'linia';
    const nCart = dos ? 1 : opcions.cartrons;
    jugadors = dos ? [0, 1].map(() => ({ cartrons: [generaCartro()], marcats: [new Set()] })) : [{ cartrons: Array.from({ length: nCart }, generaCartro), marcats: Array.from({ length: nCart }, () => new Set()) }];
    rivals = dos ? [] : NOMS_RIVALS.slice(0, opcions.rivals).map(([nom, color]) => ({ nom, color, cartro: generaCartro() }));
    encerts = errors = falses = omissions = 0; cartroVist = 0;
    $('bingo-config').hidden = true; $('bingo-joc').hidden = false; $('bingo-joc').classList.toggle('dos', dos);
    mostra('bingo-botons-un', !dos, 'grid'); mostra('bingo-seguent', opcions.velocitat === 'manual', 'inline-flex');
    setText('bingo-numero', '—'); setFeedback('bingo', opcions.velocitat === 'manual' ? 'Prem «Següent bola» quan vulguis.' : 'Atent! Ara surt la primera bola.');
    pinta(); pintaEstat();
    if (opcions.velocitat !== 'manual') rellotge = temps(treuBola, 1500);
  }

  // ---------- Bombo ----------
  function treuBola() {
    if (fi || !jocActiu) return;
    if (!bombo.length) { acaba(null, 'S\'han acabat les boles.'); return; }
    // omissions: la bola anterior era en algun cartró del jugador i no s'ha marcat
    if (!dos && ultim !== null && opcions.ajuda !== 'auto') jugadors[0].cartrons.forEach((c, k) => { if (numerosDe(c).includes(ultim) && !jugadors[0].marcats[k].has(ultim)) omissions++; });
    ultim = bombo.pop(); cantats.add(ultim); ordre.push(ultim); tBola = ara(); if (ordre.length === 1) setFeedback('bingo', '');
    setText('bingo-numero', ultim); animaBola(); soClic();
    const cant = opcions.cants && cantDe(ultim);
    llegirText(cant ? `${numeroParlat(ultim)}, ${cant}` : numeroParlat(ultim));
    if (opcions.ajuda === 'auto') jugadors.forEach(j => j.cartrons.forEach((c, k) => numerosDe(c).forEach(n => { if (cantats.has(n)) j.marcats[k].add(n); })));
    pinta(); pintaEstat(); programaRivals();
    if (typeof elefantBingoBola === 'function' && !dos) {
      const tens = opcions.ajuda !== 'sol' && jugadors[0].cartrons.some(c => numerosDe(c).includes(ultim));
      elefantBingoBola(ultim, { tens, compte: ordre.length, interval: VELOCITATS[opcions.velocitat] || 5000 });
      if (opcions.ajuda !== 'sol' && premiDisponible()) { const clau = fase + ':' + ordre.length; if (!window.__bingoAvis || window.__bingoAvis.fase !== fase) { window.__bingoAvis = { fase }; setTimeout(() => { if (jocActiu && !fi && typeof elefantBingoPremi === 'function') elefantBingoPremi(fase); }, 900); } }
    }
    if (opcions.velocitat !== 'manual') { aturaTemps(rellotge); rellotge = temps(treuBola, VELOCITATS[opcions.velocitat]); }
  }
  function animaBola() { const b = $('bingo-numero'); b.classList.remove('surt'); void b.offsetWidth; b.classList.add('surt'); }
  function seguent() { if (!jocActiu || fi) return; if (opcions.velocitat === 'manual') treuBola(); }
  function repeteix() { if (ultim !== null) { soClic(); llegirText(numeroParlat(ultim)); } }

  // ---------- Rivals virtuals ----------
  function programaRivals() {
    const lent = { facil: [3500, 7000], mig: [1500, 4000], dificil: [800, 2500] }[opcions.dificultat] || [1500, 4000];
    rivals.forEach(r => {
      if (r.reclama) return;
      const tipus = fase === 'linia' ? (teLinia(r.cartro, cantats) ? 'linia' : null) : (teBingo(r.cartro, cantats) ? 'bingo' : null);
      if (!tipus) return;
      r.reclama = true; temps(() => { r.reclama = false; if (fi || !jocActiu) return; if (tipus === 'linia' && fase === 'linia') premiLinia = { qui: r.nom }, avancaFase(`${r.nom} ha cantat línia!`); else if (tipus === 'bingo' && fase === 'bingo') acaba({ rival: r.nom }, `${r.nom} ha cantat BINGO!`); }, lent[0] + rng() * (lent[1] - lent[0]));
    });
  }
  function avancaFase(missatge) { fase = 'bingo'; setFeedback('bingo', missatge + ' Ara, a per tot el cartró: BINGO!', 'correcte'); soEstrella(); pintaEstat(); }

  // ---------- Accions del jugador ----------
  function toca(p, k, n) {
    if (!jocActiu || fi || !n) return;
    const j = jugadors[p], marcats = j.marcats[k];
    if (!cantats.has(n)) { setFeedback('bingo', 'Aquest número encara no ha sortit!', 'incorrecte'); soError(); vibrar(80); if (!dos) errors++; return; }
    soClic(); vibrar(30);
    if (marcats.has(n)) { marcats.delete(n); return pinta(); }
    marcats.add(n);
    if (!dos) { encerts++; if (n === ultim) registraTR(ara() - tBola); }
    pinta(); pintaEstat();
  }
  function reclama(p, tipus) {
    if (!jocActiu || fi) return;
    const j = jugadors[p], cart = j.cartrons.find(c => tipus === 'linia' ? teLinia(c, cantats) : teBingo(c, cantats));
    if (tipus === 'linia' && fase !== 'linia') { setFeedback('bingo', 'La línia ja està cantada. Ara toca el BINGO!', ''); return; }
    if (!cart) { falses++; if (!dos) errors++; setFeedback('bingo', 'Encara no, continua!', 'incorrecte'); soError(); vibrar(80); return; }
    j.cartrons.forEach((c, k) => numerosDe(c).forEach(n => { if (cantats.has(n)) j.marcats[k].add(n); }));
    if (tipus === 'linia') { premiLinia = { qui: dos ? nomsParella('Jugador ' + (p + 1)) : 'Tu' }; soVictoria(); pinta(); avancaFase(dos ? `Línia per ${premiLinia.qui}!` : 'Línia! Molt bé!'); if (!dos && typeof elefantBingoFi === 'function') elefantBingoFi('linia'); }
    else { acaba({ jugador: p }, dos ? `BINGO! Guanya el Jugador ${p + 1}!` : 'BINGO! Molt bé!'); }
  }

  function acaba(guanyador, missatge) {
    fi = true; jocActiu = false; aturaTemps(rellotge); pintaEstat();
    const claim = $('bingo-joc'); claim.classList.add('acabat');
    if (dos) { setFeedback('bingo', finalPartida2P(missatge), 'correcte'); return; }
    setFeedback('bingo', missatge, guanyador && guanyador.jugador === 0 ? 'correcte' : '');
    if (guanyador && guanyador.jugador === 0) { soVictoria(); celebracioCompleta(); if (typeof elefantBingoFi === 'function') elefantBingoFi('bingo'); }
    const total = encerts + errors + omissions, pct = total ? Math.round(encerts / total * 100) : 0;
    finalitzarPartida('bingo', Math.max(encerts, 1), errors + omissions, `${ordre.length} boles cantades · ${falses} falses cantades · ${omissions} números sense marcar`, { pct });
  }

  // ---------- Pintat ----------
  function htmlCartro(p, k, cartro, marcats) {
    const celles = [];
    for (let f = 0; f < FILES; f++) for (let c = 0; c < COLS; c++) {      // ordre de lectura per files; el CSS gira el cartró en vertical
      const n = cartro[f][c];
      const mostraHint = opcions.ajuda === 'ajuda' && n && n === ultim && !marcats.has(n);
      celles.push(n ? `<button type="button" class="bingo-casella${marcats.has(n) ? ' marcada' : ''}${mostraHint ? ' sortit' : ''}" data-p="${p}" data-k="${k}" data-n="${n}" style="--f:${f + 1};--c:${c + 1}" aria-label="${n}${marcats.has(n) ? ', marcat' : ''}"><span class="bn">${n}</span></button>`
        : `<span class="bingo-buida" style="--f:${f + 1};--c:${c + 1}" aria-hidden="true"></span>`);
    }
    return celles.join('');
  }
  function pinta() {
    const cont = $('bingo-cartrons'); if (!jugadors.length) return;
    const parts = [];
    jugadors.forEach((j, p) => {
      const visibles = dos ? [0] : [cartroVist];
      visibles.forEach(k => {
        parts.push(`<div class="bingo-cartro j${p + 1}" data-p="${p}"><p class="bingo-et">${dos ? esc(nomsParella('Jugador ' + (p + 1))) : 'El teu cartró' + (j.cartrons.length > 1 ? ' ' + (k + 1) + '/' + j.cartrons.length : '')}</p>
          <div class="zona-tauler"><div class="bingo-grid" data-p="${p}" data-k="${k}">${htmlCartro(p, k, j.cartrons[k], j.marcats[k])}</div></div>
          ${dos ? `<button type="button" class="boto-principal boto-joc bingo-canto" data-canto="${p}">CANTO!</button>` : ''}</div>`);
      });
    });
    morph(cont, parts.join(''));
    const tabs = $('bingo-tabs');
    if (!dos && jugadors[0].cartrons.length > 1) {
      tabs.hidden = false;
      tabs.innerHTML = jugadors[0].cartrons.map((c, k) => { const avis = k !== cartroVist && ultim !== null && numerosDe(c).includes(ultim) && !jugadors[0].marcats[k].has(ultim); return `<button type="button" role="tab" aria-selected="${k === cartroVist}" class="${k === cartroVist ? 'sel' : ''}${avis ? ' avis' : ''}" data-tab="${k}">Cartró ${k + 1}${avis ? '<i class="punt-avis" aria-label="Té el número"></i>' : ''}</button>`; }).join('');
    } else { tabs.hidden = true; tabs.innerHTML = ''; }
    // Ajuda automàtica: avisa subtilment quan hi ha premi
    const j0 = jugadors[0], hiHaPremi = j0 && !fi && (fase === 'linia' ? j0.cartrons.some(c => teLinia(c, cantats)) : j0.cartrons.some(c => teBingo(c, cantats)));
    $('bingo-linia').classList.toggle('pista', opcions.ajuda === 'auto' && hiHaPremi && fase === 'linia');
    $('bingo-bingo').classList.toggle('pista', opcions.ajuda === 'auto' && hiHaPremi && fase === 'bingo');
    $('bingo-linia').disabled = fase !== 'linia' || fi; $('bingo-bingo').disabled = fi;
  }
  function pintaEstat() {
    setText('bingo-premi', fi ? 'Fi de la partida' : fase === 'linia' ? 'En joc: LÍNIA' : 'En joc: BINGO');
    $('bingo-ultimes').innerHTML = ordre.slice(-5, -1).reverse().map(n => `<span class="bola-petita">${n}</span>`).join('');
    $('bingo-rivals').innerHTML = rivals.map(r => `<span class="bingo-rival" style="--rc:${r.color}"><i aria-hidden="true">${esc(r.nom.split(' ')[1][0])}</i>${esc(r.nom)}</span>`).join('');
    setText('bingo-compte', ordre.length + '/' + TOTAL_BOLES);
    pintaTaulell();
  }
  function pintaTaulell() {
    morph($('bingo-taulell-graella'), Array.from({ length: TOTAL_BOLES }, (_, i) => i + 1).map(n => `<span class="tau-n${cantats.has(n) ? ' sortit' : ''}${n === ultim ? ' ultim' : ''}">${n}</span>`).join(''));
  }
  const obreTaulell = () => { soClic(); pintaTaulell(); $('bingo-taulell').hidden = false; };
  const tancaTaulell = () => { soClic(); $('bingo-taulell').hidden = true; };

  // ---------- Esdeveniments ----------
  $('bingo-comencar').addEventListener('click', comenca);
  $('bingo-linia').addEventListener('click', () => reclama(0, 'linia'));
  $('bingo-bingo').addEventListener('click', () => reclama(0, 'bingo'));
  $('bingo-seguent').addEventListener('click', seguent);
  $('bingo-repeteix').addEventListener('click', repeteix);
  $('bingo-btn-taulell').addEventListener('click', obreTaulell);
  $('bingo-taulell-tanca').addEventListener('click', tancaTaulell);
  $('bingo-op-cants').addEventListener('click', () => window.bingoOpcio.cants());
  $('bingo-cartrons').addEventListener('click', e => {
    const c = e.target.closest('[data-canto]'); if (c) { reclama(+c.dataset.canto, fase); return; }
    const b = e.target.closest('[data-n]'); if (b) toca(+b.dataset.p, +b.dataset.k, +b.dataset.n);
  });
  $('bingo-tabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { soClic(); cartroVist = +t.dataset.tab; pinta(); } });

  // Pista: el número cantat al cartró, recordar cantar LÍNIA o BINGO i marcar-lo
  function pendents() {
    const j = jugadors[0]; if (!j) return [];
    const r = [];
    j.cartrons.forEach((c, k) => numerosDe(c).forEach(num => { if (cantats.has(num) && !j.marcats[k].has(num)) r.push({ k, n: num }); }));
    return r.sort((a, b) => (b.n === ultim) - (a.n === ultim));
  }
  const premiDisponible = () => !!jugadors[0] && (fase === 'linia' ? jugadors[0].cartrons.some(c => teLinia(c, cantats)) : jugadors[0].cartrons.some(c => teBingo(c, cantats)));
  const casellaB = (k, num) => $('bingo-cartrons').querySelector(`[data-p="0"][data-k="${k}"][data-n="${num}"]`);
  const pista = {
    proactiva: false,
    obtenir(n_) {
      if (!jocActiu || fi || dos || !jugadors.length) return null;
      if (premiDisponible()) {
        const boto = () => $(fase === 'linia' ? 'bingo-linia' : 'bingo-bingo'), nom = fase === 'linia' ? 'LÍNIA' : 'BINGO';
        if (n_ === 1) return { text: `Mira el teu cartró: potser ja tens ${nom}!` };
        return { text: `Tens ${nom}! Toca el botó.`, explica: `Tens ${fase === 'linia' ? 'una fila completa' : 'el cartró sencer'}. Toca ${nom} perquè ho sàpiguen tots.`, objectiu: () => boto() };
      }
      const p = pendents();
      if (n_ === 1) return { text: ultim == null ? "Encara no ha sortit cap bola. Estigues atent!" : p.length ? `L'última bola és el ${ultim}. Mira si el tens al cartró.` : `L'última bola és el ${ultim}. Ara mateix no tens res per marcar.` };
      if (!p.length) return null;
      if (n_ === 2) return { text: `Tens el ${p[0].n} al cartró. Encara no el tens marcat.`, objectiu: () => casellaB(p[0].k, p[0].n) };
      return { text: `El ${p[0].n}: marcat!`, explica: `T'he marcat el ${p[0].n}. Recorda cantar LÍNIA quan tinguis una fila completa.`, objectiu: () => casellaB(p[0].k, p[0].n), aplica: () => { toca(0, p[0].k, p[0].n); } };
    }
  };

  registrarJoc({
    id: 'bingo', pista,
    tutorial: { titol: 'Bingo', cos: '<p>Surten <strong>boles</strong> amb un número. Si el tens al cartró, <strong>toca\'l</strong> per marcar-lo.</p><p>Quan tinguis una <strong>fila</strong> sencera, prem <strong>LÍNIA!</strong>. Quan ho tinguis <strong>tot</strong>, prem <strong>BINGO!</strong>.</p><p>Pots triar que et marqui els números tot sol. Sense diners: només per passar-ho bé.</p>' },
    obrir: ds => { modeActual = ds ? '2vs2' : 'individual'; reiniciar(); mostrarPantalla('joc-bingo'); },
    reiniciar
  });
})();
