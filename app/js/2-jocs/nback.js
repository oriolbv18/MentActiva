'use strict';
// ==========================================================
//  N-BACK
//  Surten lletres una a una. Cal dir si la lletra actual és
//  la mateixa que fa N posicions.
// ==========================================================
(() => {
  const LLETRES_NB = 'ABCDEFGHIJKL'.split('');
  const TOTAL = 20, PROB_COINCIDENCIA = 0.35, TEMPS_RESPOSTA = 3000, TEMPS_PAUSA = 1500;
  let n = 1, patro = [], encerts = 0, errors = 0, esperant = false, rellotge = null, actiu = false;

  const botons = habilitats => { $('nback-btn-igual').disabled = $('nback-btn-diferent').disabled = !habilitats; };

  function reiniciar() {
    aturaTemps(rellotge); actiu = false; esperant = false; patro = []; encerts = 0; errors = 0;
    setText('nback-nivell', n); setText('nback-encerts', 0); setText('nback-errors', 0);
    setText('nback-display', '?'); setFeedback('nback', '');
    setText('nback-info-n', n === 1 ? 'Recorda la lletra anterior' : `Recorda la lletra de fa ${n} posicions`);
    botons(false); $('nback-iniciar').textContent = 'Començar'; mostra('nback-iniciar', true);
  }
  function comencar() {
    soClic(); if (actiu) return;
    if (patro.length) reiniciar();
    actiu = true; mostra('nback-iniciar', false); setFeedback('nback', ''); seguent();
  }
  function novaLletra() {
    const i = patro.length, anterior = patro[i - n];
    if (anterior && rng() < PROB_COINCIDENCIA) return anterior;
    return aleatori(LLETRES_NB.filter(l => l !== anterior));
  }
  function seguent() {
    if (patro.length >= TOTAL) { acabar(); return; }
    const lletra = novaLletra(); patro.push(lletra);
    setText('nback-display', lletra); llegirText(lletra); iniciTemps();
    esperant = patro.length - 1 >= n;           // les primeres N lletres només cal memoritzar-les
    botons(esperant);
    rellotge = temps(esperant ? tempsEsgotat : seguent, esperant ? TEMPS_RESPOSTA : TEMPS_PAUSA);
  }
  function tempsEsgotat() {
    esperant = false; botons(false); errors++; setText('nback-errors', errors);
    setFeedback('nback', '⏱Temps esgotat', 'incorrecte'); soError(); vibrar(100);
    rellotge = temps(seguent, 800);
  }
  function respondre(diuIgual) {
    if (!esperant) return;
    registraTR(ara() - tempsIniciPregunta); aturaTemps(rellotge); esperant = false; botons(false);
    const i = patro.length - 1, esIgual = patro[i] === patro[i - n];
    if (diuIgual === esIgual) {
      encerts++; setText('nback-encerts', encerts); soEncert(); vibrar([40, 30, 40]);
      setFeedback('nback', 'Correcte!', 'correcte'); mostrarMissatgeElefant('encert');
    } else {
      errors++; setText('nback-errors', errors); soError(); vibrar(150); elefantTrist();
      setFeedback('nback', esIgual ? 'Era igual!' : 'Era diferent!', 'incorrecte');
    }
    rellotge = temps(seguent, 800);
  }
  function acabar() {
    actiu = false; botons(false);
    const total = encerts + errors, pct = total ? Math.round(encerts / total * 100) : 0;
    setText('nback-display', '—');
    setFeedback('nback', `Has encertat ${encerts} de ${total} (${pct}%)`, 'correcte');
    $('nback-iniciar').textContent = 'Tornar a jugar'; mostra('nback-iniciar', true);
    finalitzarPartida('nback', encerts, errors, pct <= 50 ? 'Practica una mica més' : '');
  }
  $('nback-iniciar').addEventListener('click', comencar);
  $('nback-btn-igual').addEventListener('click', () => respondre(true));
  $('nback-btn-diferent').addEventListener('click', () => respondre(false));

  const pista = {
    proactiva: false,
    obtenir(n_) {
      if (!actiu || !patro.length) return null;
      const regla = n === 1 ? "Compara la lletra de la pantalla amb l'anterior. Si és la mateixa, SÍ; si no, NO." : `Compara la lletra de la pantalla amb la de fa ${n} posicions. Si és la mateixa, SÍ; si no, NO.`;
      if (n_ === 1) return { text: regla };
      if (!esperant) return n_ === 2 ? { text: "Ara toca memoritzar: encara no cal respondre.", objectiu: () => $('nback-display') } : null;
      const i = patro.length - 1, igual = patro[i] === patro[i - n];
      if (n_ === 2) return { text: "Aquesta és la lletra actual. Compara-la amb l'anterior que recordes.", objectiu: () => $('nback-display') };
      return { text: igual ? 'És igual!' : 'És diferent!', explica: `Fa ${n === 1 ? 'una posició' : n + ' posicions'} hi havia la ${patro[i - n]}, i ara hi ha la ${patro[i]}: ${igual ? 'és igual, SÍ' : 'és diferent, NO'}. T'he donat més temps per respondre.`, objectiu: () => $(igual ? 'nback-btn-igual' : 'nback-btn-diferent'), aplica: () => { aturaTemps(rellotge); rellotge = temps(tempsEsgotat, 7000); } };
    }
  };

  registrarJoc({
    id: 'nback', pista,
    tutorial: { titol: 'Recorda la lletra', cos: '<p>Veuràs lletres una a una. Prem <strong>SÍ</strong> si la lletra és igual a la de fa <em>N</em> posicions, i <strong>NO</strong> si és diferent.</p><div class="exemple"><span>B</span><span>K</span><span>K</span></div><p>Al nivell fàcil compares amb l\'anterior: aquí, la segona K és igual a l\'anterior, així que és un <strong>SÍ</strong>.</p>' },
    obrir: () => triaDificultat('nback', 'Recorda la lletra', 'Tria la dificultat', ['Compara amb la lletra anterior', 'Compara amb la de fa 2 posicions', 'Compara amb la de fa 3 posicions'],
      nivell => { n = { facil: 1, mig: 2, dificil: 3 }[nivell]; reiniciar(); mostrarPantalla('joc-nback'); }),
    reiniciar
  });
})();
