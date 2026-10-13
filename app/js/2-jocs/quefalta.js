'use strict';
// ==========================================================
//  QUÈ FALTA AQUÍ?
//  Memoritza uns objectes; n'amaguem un i has de dir quin era.
// ==========================================================
(() => {
  const EMOJIS_QF = ['🍎', '🌻', '🐶', '🚗', '☕', '🎵', '📚', '🌳', '🏠', '🍕', '🐱', '⚽', '🎨', '🌙', '🌟', '🐟', '🍋', '🔑', '🎈', '🚲', '🍇', '🧶', '🕯️', '🐢', '🍞', '🌷', '🎁', '🔔', '🧣', '🐓', '🍒', '⏰'];
  const RONDES = 8, OBJECTES = 8, TEMPS_MEMORITZAR = 6;
  let ronda = 0, encerts = 0, objectes = [], falta = null, fase = 'fi';

  function reiniciar() {
    ronda = 0; encerts = 0; fase = 'fi';
    setText('qf-num', 1); setText('qf-total', RONDES); setText('qf-encerts', 0);
    $('qf-grid').innerHTML = ''; $('qf-opcions').innerHTML = '';
    setText('qf-subtitol', 'Prem «Començar» quan estiguis a punt'); setFeedback('qf', '');
    $('qf-iniciar').textContent = 'Començar'; mostra('qf-iniciar', true);
  }
  function comencar() { soClic(); mostra('qf-iniciar', false); novaRonda(); }
  const pintaGrid = (amagat = -1) => {
    $('qf-grid').innerHTML = objectes.map((e, i) => `<div class="qf-casella${i === amagat ? ' buit' : ''}">${i === amagat ? '?' : e}</div>`).join('');
  };
  function novaRonda() {
    if (ronda >= RONDES) { acabar(); return; }
    setText('qf-num', ronda + 1); setFeedback('qf', ''); $('qf-opcions').innerHTML = '';
    objectes = barreja(EMOJIS_QF).slice(0, OBJECTES); fase = 'memoritzar';
    setText('qf-subtitol', `Memoritza els objectes (${TEMPS_MEMORITZAR} segons)…`); pintaGrid();
    temps(() => {
      const pos = enter(0, objectes.length - 1); falta = objectes[pos]; fase = 'endevinar';
      setText('qf-subtitol', 'Quin objecte falta?'); pintaGrid(pos); iniciTemps();
      const distractors = barreja(EMOJIS_QF.filter(e => !objectes.includes(e))).slice(0, 3);   // objectes que no hi eren
      $('qf-opcions').innerHTML = barreja([falta, ...distractors]).map(e => `<button type="button" class="opcio opcio-emoji" data-e="${e}">${e}</button>`).join('');
    }, TEMPS_MEMORITZAR * 1000);
  }
  function respon(emoji, boto) {
    if (fase !== 'endevinar') return;
    fase = 'fi';
    $('qf-opcions').querySelectorAll('.opcio').forEach(b => { b.disabled = true; if (b.dataset.e === falta) b.classList.add('correcte-resp'); });
    if (emoji === falta) {
      encerts++; setText('qf-encerts', encerts); soEncert(); vibrar([40, 30, 40]); feedbackRics('qf', 'Correcte!', true);
    } else {
      boto.classList.add('incorrecte-resp'); soError(); vibrar(150); elefantTrist();
      feedbackRics('qf', `Faltava: ${falta}`, false); guardarError('Quin objecte faltava?', falta, emoji);
    }
    ronda++; temps(novaRonda, 2000);
  }
  function acabar() {
    $('qf-grid').innerHTML = ''; $('qf-opcions').innerHTML = '';
    setText('qf-subtitol', `Encerts: ${encerts}/${RONDES}`); setFeedback('qf', '');
    $('qf-iniciar').textContent = 'Tornar a jugar'; mostra('qf-iniciar', true);
    finalitzarPartida('quefalta', encerts, RONDES - encerts);
  }
  $('qf-iniciar').addEventListener('click', comencar);
  $('qf-opcions').addEventListener('click', e => { const b = e.target.closest('[data-e]'); if (b) respon(b.dataset.e, b); });

  const pista = {
    obtenir(n) {
      if (fase === 'memoritzar') return n === 1 ? { text: "Mira bé tots els objectes: te'n faltarà un. Pots agrupar-los mentalment per tipus." } : null;
      if (fase !== 'endevinar') return null;
      const opcions = [...$('qf-opcions').querySelectorAll('.opcio')];
      if (n === 1) return { text: "Recorda què hi havia a la graella. Entre les opcions, descarta les que no hi eren." };
      if (n === 2) return { text: "Aquest és el forat: era aquí on hi havia l'objecte.", objectiu: () => $('qf-grid').querySelector('.buit') };
      return { text: `Faltava ${falta}.`, explica: `L'objecte que faltava és ${falta}: era l'únic de les opcions que abans era a la graella.`, objectiu: () => opcions.find(b => b.dataset.e === falta), aplica: () => { const b = opcions.find(x => x.dataset.e === falta); if (b) b.classList.add('pista-flash'); } };
    }
  };

  registrarJoc({
    id: 'quefalta', pista,
    tutorial: { titol: 'Què falta aquí?', cos: '<p>Mira bé els objectes durant uns segons. Després en <strong>amagarem un</strong>: toca quin era entre les opcions.</p><div class="exemple"><span>🍎</span><span>🐶</span><span>?</span></div>' },
    obrir: obrirSenzill('quefalta', reiniciar),
    reiniciar
  });
})();
