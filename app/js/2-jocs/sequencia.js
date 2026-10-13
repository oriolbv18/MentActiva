'use strict';
// ==========================================================
//  RECORDA LA SEQÜÈNCIA
//  Un sol jugador: s'acaba amb el primer error.
//  Dos jugadors: cadascú juga un torn i guanya la ratxa més llarga.
// ==========================================================
(() => {
  const TONS = [440, 550, 660, 770];
  let patro = [], pos = 0, nivell = 1, ratxa = 0, mostrant = false, dos = false, torn = 1, punts = [0, 0], fase = 'inici';

  const boto = i => $('seq-area').children[i];
  const activaBotons = on => { [...$('seq-area').children].forEach(b => { b.disabled = !on; }); };
  const marcador = () => renderMarcador2P('sequencia', punts[0], punts[1], dos && fase !== 'fi' ? torn : null);
  function texteBoto(t) { $('seq-iniciar').textContent = t; mostra('seq-iniciar', true); }

  function reiniciar() {
    dos = modeActual === '2vs2'; patro = []; pos = 0; nivell = 1; ratxa = 0; torn = 1; punts = [0, 0]; fase = 'inici';
    setText('seq-nivell', 1); setText('seq-ratxa', 0); setFeedback('seq', dos ? 'Jugador 1: prem «Començar»' : '');
    activaBotons(false); marcador(); texteBoto(dos ? 'Començar torn' : 'Començar');
  }
  function comencar() {
    soClic(); if (fase === 'fi') { reiniciar(); }
    patro = []; nivell = 1; ratxa = 0; fase = 'jugant';
    setText('seq-nivell', 1); setText('seq-ratxa', 0); setFeedback('seq', ''); mostra('seq-iniciar', false);
    nouNivell();
  }
  function nouNivell() { patro.push(enter(0, 3)); setText('seq-nivell', nivell); mostrarPatro(); }
  function illumina(i, ms) {
    boto(i).classList.add('encesa'); tocarTo(TONS[i], Math.min(0.5, ms / 1000), 'sine', 0.2);
    temps(() => boto(i).classList.remove('encesa'), ms);
  }
  function mostrarPatro() {
    mostrant = true; pos = 0; activaBotons(false); setFeedback('seq', 'Observa…');
    $('seq-area').classList.add('mostrant');
    patro.forEach((v, k) => temps(() => illumina(v, 650), 800 + k * 1000));
    temps(() => { mostrant = false; $('seq-area').classList.remove('mostrant'); activaBotons(true); setFeedback('seq', 'Ara repeteix!'); iniciTemps(); }, 800 + patro.length * 1000);
  }
  function tocaBoto(i) {
    if (mostrant || fase !== 'jugant') return;
    illumina(i, 260); vibrar(15); registraTR(ara() - tempsIniciPregunta); tempsIniciPregunta = ara();
    if (patro[pos] === i) {
      if (++pos < patro.length) return;
      ratxa++; nivell++; setText('seq-ratxa', ratxa); activaBotons(false);
      if (dos) { punts[torn - 1] = ratxa; marcador(); }
      soEncert(); vibrar([40, 30, 40]); setFeedback('seq', 'Molt bé!', 'correcte'); temps(nouNivell, 1200);
    } else fallo();
  }
  function fallo() {
    activaBotons(false); $('seq-area').classList.remove('mostrant'); soError(); vibrar(200); elefantTrist();
    if (!dos) {
      fase = 'fi'; setFeedback('seq', `Has fallat! Has arribat al nivell ${nivell} amb ratxa ${ratxa}.`, 'incorrecte');
      texteBoto('Tornar a jugar');
      // objectiu orientatiu: arribar a 10 seqüències correctes
      finalitzarPartida('sequencia', ratxa, 1, `Has repetit ${ratxa} ${ratxa === 1 ? 'seqüència' : 'seqüències'} seguides`, { pct: Math.min(100, ratxa * 10), puntuacio: ratxa * 10 }); return;
    }
    punts[torn - 1] = ratxa;
    if (torn === 1) {
      setFeedback('seq', `Jugador 1 ha arribat a ${ratxa}.`, 'incorrecte'); torn = 2; fase = 'inici'; marcador();
      temps(() => { setFeedback('seq', 'Ara juga el Jugador 2'); texteBoto('Començar torn'); }, 1800);
    } else {
      fase = 'fi'; marcador();
      setFeedback('seq', finalPartida2P(textGuanyador2P(punts[0], punts[1])), 'correcte'); texteBoto('Tornar a jugar');
    }
  }
  $('seq-iniciar').addEventListener('click', comencar);
  $('seq-area').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) tocaBoto(+b.dataset.i); });

  // Pista: repeteix la seqüència; l'Elefant assenyala el color que toca
  const nomBoto = i => (boto(i).getAttribute('aria-label') || 'aquest color').toLowerCase();
  const pista = {
    proactiva: true,
    obtenir(n) {
      if (dos || fase !== 'jugant') return null;
      if (mostrant) return n === 1 ? { text: "Mira els colors amb calma: després els hauràs de repetir en el mateix ordre." } : null;
      if (!patro.length) return null;
      if (n === 1) return { text: pos === 0 ? `Són ${patro.length} colors. Repeteix-los en el mateix ordre en què s'han il·luminat.` : `Ja en portes ${pos} de ${patro.length}. Continua amb el següent.` };
      if (n === 2) return pos === 0 ? { text: "La seqüència comença per aquest color.", objectiu: () => boto(patro[0]) } : { text: "L'últim que has fet bé és aquest. El següent va després.", objectiu: () => boto(patro[pos - 1]) };
      return { text: `El següent és el ${nomBoto(patro[pos])}.`, explica: `El següent de la seqüència és el ${nomBoto(patro[pos])}. Toca'l i continua tu.`, objectiu: () => boto(patro[pos]), aplica: () => illumina(patro[pos], 650) };
    }
  };

  registrarJoc({
    id: 'sequencia', pista,
    tutorial: { titol: 'Recorda la seqüència', cos: '<p>S\'il·luminaran uns colors (amb un símbol i un so cadascun) en un ordre. <strong>Repeteix-lo</strong> tocant-los igual.</p><div class="exemple"><span>●</span><span>▲</span><span>●</span></div><p>Cada ronda s\'hi afegeix un color nou. Quan falles, s\'acaba la partida.</p>' },
    obrir: ds => { modeActual = ds ? '2vs2' : 'individual'; reiniciar(); mostrarPantalla('joc-sequencia'); },
    reiniciar
  });
})();
