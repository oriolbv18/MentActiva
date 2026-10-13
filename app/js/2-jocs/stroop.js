'use strict';
// ==========================================================
//  STROOP
//  Toca el COLOR de la tinta, no el que diu la paraula.
// ==========================================================
(() => {
  const COLORS = [
    { nom: 'VERMELL', css: 'c-vermell', color: '#d94f4f' }, { nom: 'VERD', css: 'c-verd', color: '#2e8b57' },
    { nom: 'BLAU', css: 'c-blau', color: '#3a86c8' }, { nom: 'GROC', css: 'c-groc', color: '#e0a800' }
  ];
  const RONDES = 15, PROB_INCONGRUENT = 0.7;
  let idx = 0, encerts = 0, inici = 0, rellotge = null, bloquejat = false, correcte = null;

  function reiniciar() {
    aturaTemps(rellotge); idx = 0; encerts = 0; bloquejat = true;
    setText('stroop-num', 1); setText('stroop-total', RONDES); setText('stroop-encerts', 0); setText('stroop-temps', '0s');
    const p = $('stroop-paraula'); p.textContent = '?'; p.style.color = ''; $('stroop-botons').innerHTML = '';
    setFeedback('stroop', ''); $('stroop-iniciar').textContent = 'Començar'; mostra('stroop-iniciar', true);
  }
  function comencar() {
    soClic(); mostra('stroop-iniciar', false); inici = ara();
    rellotge = interval(() => setText('stroop-temps', Math.floor((ara() - inici) / 1000) + 's'), 1000);
    mostrar();
  }
  function mostrar() {
    if (idx >= RONDES) { acabar(); return; }
    setText('stroop-num', idx + 1); setFeedback('stroop', ''); bloquejat = false;
    const paraula = aleatori(COLORS);
    correcte = rng() < PROB_INCONGRUENT ? aleatori(COLORS.filter(c => c !== paraula)) : paraula;
    const d = $('stroop-paraula'); d.textContent = paraula.nom; d.style.color = correcte.color;
    iniciTemps(); llegirText('Toca el color de la tinta');
    $('stroop-botons').innerHTML = barreja(COLORS).map(c => `<button type="button" class="stroop-btn ${c.css}" data-c="${c.nom}">${c.nom}</button>`).join('');
  }
  function respon(nom) {
    if (bloquejat) return;
    bloquejat = true;
    if (nom === correcte.nom) {
      encerts++; setText('stroop-encerts', encerts); soEncert(); vibrar([40, 30, 40]); feedbackRics('stroop', 'Correcte!', true);
    } else {
      soError(); vibrar(150); elefantTrist(); feedbackRics('stroop', 'El color de la tinta era ' + correcte.nom.toLowerCase(), false);
    }
    idx++; temps(mostrar, 700);
  }
  function acabar() {
    aturaTemps(rellotge);
    const segons = Math.floor((ara() - inici) / 1000), pct = Math.round(encerts / RONDES * 100);
    const d = $('stroop-paraula'); d.textContent = '—'; d.style.color = ''; $('stroop-botons').innerHTML = '';
    setFeedback('stroop', `Has encertat ${encerts}/${RONDES} (${pct}%) en ${segons}s`, 'correcte');
    $('stroop-iniciar').textContent = 'Tornar a jugar'; mostra('stroop-iniciar', true);
    finalitzarPartida('stroop', encerts, RONDES - encerts, `${segons}s en total`);
  }
  $('stroop-iniciar').addEventListener('click', () => { if (idx >= RONDES) reiniciar(); comencar(); });
  $('stroop-botons').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) respon(b.dataset.c); });

  const pista = {
    proactiva: false,
    obtenir(n) {
      if (bloquejat || !correcte) return null;
      if (n === 1) return { text: "Llegeix el color de la tinta, no la paraula. Ignora el que diu." };
      if (n === 2) return { text: "Mira només com està pintada la paraula, no què hi diu.", objectiu: () => $('stroop-paraula') };
      return { text: `La tinta és ${correcte.nom.toLowerCase()}.`, explica: `La paraula diu una cosa, però està pintada de ${correcte.nom.toLowerCase()}: aquest és el botó correcte.`, objectiu: () => $('stroop-botons').querySelector(`[data-c="${correcte.nom}"]`) };
    }
  };

  registrarJoc({
    id: 'stroop', pista,
    tutorial: { titol: 'Colors i paraules', cos: '<p>Veuràs el nom d\'un color escrit amb una tinta d\'un altre color.</p><div class="exemple"><span style="width:auto;padding:0 .6rem;color:#2b6fb3;border-color:currentColor">VERMELL</span></div><p>Toca el botó del <strong>COLOR DE LA TINTA</strong> (aquí, blau), no el que diu la paraula. Cada botó porta escrit el nom del color.</p>' },
    obrir: obrirSenzill('stroop', reiniciar),
    reiniciar
  });
})();
