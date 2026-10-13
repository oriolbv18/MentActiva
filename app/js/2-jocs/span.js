'use strict';
// ==========================================================
//  SPAN DE DÍGITS
//  Memoritza una seqüència de números i repeteix-la.
//  Cada encert n'afegeix un més.
// ==========================================================
(() => {
  const NIVELL_INICIAL = 3, PAUSA_DIGIT = 800;
  let seq = [], entrada = [], nivell = NIVELL_INICIAL, millor = 0, bloquejat = true;

  function pintaTeclat() {
    $('span-input').innerHTML = Array.from({ length: 10 }, (_, i) => `<button type="button" class="span-tap" data-d="${i}">${i}</button>`).join('');
  }
  const pintaEntrada = () => { morph($('span-display'), entrada.map(d => `<div class="span-digit">${d}</div>`).join('')); };

  function reiniciar() {
    seq = []; entrada = []; nivell = NIVELL_INICIAL; bloquejat = true;
    millor = parseInt(lsRawGet('mentA_spanMillor') || '0', 10) || 0;
    setText('span-nivell', nivell); setText('span-millor', millor);
    $('span-display').innerHTML = ''; $('span-input').innerHTML = ''; setFeedback('span', '');
    $('span-iniciar').textContent = 'Començar'; mostra('span-iniciar', true);
  }
  function comencar() { soClic(); mostra('span-iniciar', false); nouNivell(); }
  function nouNivell() {
    setText('span-nivell', nivell);
    seq = Array.from({ length: nivell }, () => enter(0, 9)); entrada = []; bloquejat = true;
    $('span-input').innerHTML = ''; setFeedback('span', 'Memoritza…');
    const disp = $('span-display');
    seq.forEach((d, i) => temps(() => {
      disp.innerHTML = `<div class="span-digit gran">${d}</div>`; tocarTo(500 + d * 30, 0.2, 'sine', 0.15);
      if (i === seq.length - 1) temps(() => {
        disp.innerHTML = '<div class="span-pista">Ara escriu-los en ordre!</div>';
        setFeedback('span', ''); pintaTeclat(); bloquejat = false; iniciTemps();
      }, PAUSA_DIGIT);
    }, i * PAUSA_DIGIT));
  }
  function tecla(d) {
    if (bloquejat) return;
    soClic(); vibrar(20); registraTR(ara() - tempsIniciPregunta); tempsIniciPregunta = ara(); entrada.push(d); pintaEntrada();
    if (entrada.length === seq.length) comprova();
  }
  function comprova() {
    bloquejat = true;
    if (entrada.every((v, i) => v === seq[i])) {
      soEncert(); vibrar([40, 30, 40]); setFeedback('span', 'Correcte! Pugem de nivell!', 'correcte');
      if (nivell > millor) { millor = nivell; lsRawSet('mentA_spanMillor', millor); setText('span-millor', millor); }
      nivell++; temps(nouNivell, 1200);
    } else {
      soError(); vibrar(200); elefantTrist();
      setFeedback('span', `Era ${seq.join(' ')}. Has arribat al nivell ${nivell}.`, 'incorrecte');
      const arribat = nivell;
      $('span-input').innerHTML = ''; $('span-iniciar').textContent = 'Tornar a jugar'; mostra('span-iniciar', true);
      nivell = NIVELL_INICIAL;
      // objectiu orientatiu: recordar 8 dígits
      const assolit = arribat - 1;
      finalitzarPartida('span', Math.max(0, assolit - NIVELL_INICIAL + 1), 1, `Has recordat fins a ${assolit} dígits`, { pct: Math.min(100, assolit / 8 * 100), puntuacio: assolit * 10 });
    }
  }
  $('span-iniciar').addEventListener('click', comencar);
  $('span-input').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) tecla(+b.dataset.d); });

  const pista = {
    proactiva: true,
    obtenir(n) {
      if (!seq.length) return null;
      if (bloquejat) return n === 1 ? { text: `Són ${seq.length} números. Repeteix-los mentalment mentre surten.` } : null;
      if (n === 1) return { text: `Toca els ${seq.length} números en el mateix ordre. Ja en portes ${entrada.length}.` };
      if (n === 2) return { text: `Falten ${seq.length - entrada.length} números per posar.`, objectiu: () => $('span-display') };
      const d = seq[entrada.length];
      return { text: `El següent és el ${d}.`, explica: `El següent número era el ${d}. Toca'l i continua tu.`, objectiu: () => $('span-input').querySelector(`[data-d="${d}"]`) };
    }
  };

  registrarJoc({
    id: 'span', pista,
    tutorial: { titol: 'Quants en recordes?', cos: '<p>Veuràs uns números un a un. <strong>Memoritza\'ls</strong> i després toca\'ls en el mateix ordre.</p><div class="exemple"><span>4</span><span>7</span><span>2</span></div><p>Cada vegada n\'hi haurà un de més. Cap pressa: no hi ha límit de temps per respondre.</p>' },
    obrir: obrirSenzill('span', reiniciar),
    reiniciar
  });
})();
