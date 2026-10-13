'use strict';
// ==========================================================
//  MOTOR GENÈRIC DE PREGUNTES (opció múltiple)
//  Serveix per a: Tertúlia, Musicologia, Refranys, Càlcul,
//  Seqüències lògiques, Emocions i Orientació.
//  Cada joc només aporta les preguntes i el seu text.
//
//  cfg = {
//    id,                      // id del joc; els elements són `${id}-num`, `-total`, `-encerts`,
//                             // `-pregunta`, `-opcions`, `-feedback`, `-seguent`, `-marcador-2v2`
//    tutorial,                // { emoji, titol, cos }
//    preparar(dos) → [ { q, o:[opcions], c:índex correcte, veu?, err?, expl? } ],
//    dos: true|false,         // admet mode 2 jugadors?
//    ok: 'Correcte!',      // text d'encert
//    textFinal(encerts,total) // text que es mostra en acabar
//  }
// ==========================================================
function crearQuiz(cfg) {
  const id = cfg.id, el = s => $(id + '-' + s);
  let items = [], idx = 0, encerts = 0, punts = [0, 0], torn = 1, dos = false, bloquejat = false, acabat = false;

  function marcador() { renderMarcador2P(id, punts[0], punts[1], dos && !acabat ? torn : null); }

  function reiniciar(ds) {
    dos = ds !== undefined ? !!ds : modeActual === '2vs2';
    items = cfg.preparar(dos);
    idx = 0; encerts = 0; punts = [0, 0]; torn = 1; bloquejat = false; acabat = false;
    setText(id + '-total', items.length);
    mostra(id + '-seguent', false);
    el('seguent').textContent = 'Següent →';
    mostrar();
  }

  function mostrar() {
    const p = items[idx];
    setText(id + '-num', idx + 1); setText(id + '-encerts', encerts);
    el('pregunta').textContent = p.q; setFeedback(id, '');
    mostra(id + '-seguent', false); bloquejat = false; marcador();
    llegirText(p.veu || p.q); iniciTemps();
    const cont = el('opcions'); cont.innerHTML = '';
    p.o.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opcio'; b.textContent = text;
      b.onclick = () => respondre(i, b); cont.appendChild(b);
    });
  }

  function respondre(i, boto) {
    if (bloquejat) return;
    bloquejat = true;
    const p = items[idx], botons = el('opcions').querySelectorAll('.opcio');
    botons.forEach(b => { b.disabled = true; });
    if (i === p.c) {
      encerts++; if (dos) punts[torn - 1]++;
      soEncert(); vibrar([40, 30, 40]); boto.classList.add('correcte-resp');
      feedbackRics(id, cfg.ok || 'Correcte!', true);
      setText(id + '-encerts', encerts);
    } else {
      soError(); vibrar(150); elefantTrist(); boto.classList.add('incorrecte-resp');
      botons[p.c].classList.add('correcte-resp');
      feedbackRics(id, 'La resposta era: ' + p.o[p.c], false, p.expl);
      if (!dos) guardarError(p.err || p.q, p.o[p.c], p.o[i]);
    }
    marcador();
    if (idx === items.length - 1) el('seguent').textContent = 'Veure resultat →';
    mostra(id + '-seguent', true);
  }

  function seguent() {
    soClic();
    if (acabat) { reiniciar(); return; }
    idx++;
    if (dos) torn = 3 - torn;
    if (idx < items.length) { mostrar(); return; }
    acabar();
  }

  function acabar() {
    acabat = true; marcador();
    el('opcions').innerHTML = ''; setFeedback(id, '');
    if (dos) {
      el('pregunta').textContent = finalPartida2P(textGuanyador2P(punts[0], punts[1]));
    } else {
      el('pregunta').textContent = cfg.textFinal ? cfg.textFinal(encerts, items.length) : `Has encertat ${encerts} de ${items.length}.`;
      finalitzarPartida(id, encerts, items.length - encerts);
    }
    el('seguent').textContent = 'Tornar a jugar'; mostra(id + '-seguent', true);
  }

  // Pista (3 nivells). cfg.pista = { mode: 'descarta' | 'estrategia', h1, h2, h3 } i, per pregunta, p.h1 / p.h2 / p.h3.
  //   descarta:   (2) l'Elefant descarta una opció errònia, (3) assenyala la correcta explicant-ho
  //   estrategia: (2) una estratègia de resolució, (3) descarta dues opcions errònies i desvela com comença la resposta
  const botonsPregunta = () => [...el('opcions').querySelectorAll('.opcio')];
  const descarta = (b) => { if (b) { b.classList.add('descartada'); b.disabled = true; b.setAttribute('aria-label', b.textContent + ' (descartada)'); } };
  const pista = {
    obtenir(n) {
      const p = items[idx]; if (!p || bloquejat || acabat || !cfg.pista) return null;
      const c = cfg.pista, bs = botonsPregunta(), falses = bs.filter((b, i) => i !== p.c && !b.disabled);
      const bona = bs[p.c], correcta = p.o[p.c];
      if (n === 1) return { text: p.h1 || c.h1 || "Llegeix la pregunta amb calma i descarta primer el que et sembli impossible." };
      if (c.mode === 'estrategia') {
        if (n === 2) return { text: p.h2 || c.h2 || "Fes-ho per parts, sense pressa.", objectiu: () => el('pregunta') };
        const dues = falses.slice(0, 2);
        return { text: p.h3 || `La resposta comença per «${String(correcta).charAt(0)}».`, explica: (p.h3 || `La resposta comença per «${String(correcta).charAt(0)}».`) + (p.expl ? ' ' + p.expl : '') + ' He descartat dues opcions.', objectiu: () => bona, aplica: () => dues.forEach(descarta) };
      }
      if (n === 2) { const f = falses[0]; return f ? { text: "Aquesta opció no pot ser. L'he descartada.", objectiu: () => f, aplica: () => descarta(f) } : null; }
      return { text: `La resposta és «${correcta}».`, explica: `La resposta és «${correcta}».${p.expl ? ' ' + p.expl : ''}`, objectiu: () => bona, aplica: () => { if (bona) bona.classList.add('pista-flash'); } };
    }
  };

  // El botó «Següent» de l'HTML crida data-quiz="id\"
  QUIZ_SEGUENT[id] = seguent;
  registrarJoc({
    id, tutorial: cfg.tutorial, pista: cfg.pista ? Object.assign({ proactiva: cfg.pista.proactiva }, pista) : undefined,
    obrir: ds => { reiniciar(ds); mostrarPantalla('joc-' + id); },
    reiniciar: () => reiniciar()
  });
  return { reiniciar, seguent };
}
const QUIZ_SEGUENT = {};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-quiz-seguent]');
  if (b && QUIZ_SEGUENT[b.dataset.quizSeguent]) QUIZ_SEGUENT[b.dataset.quizSeguent]();
});

// Barreja les opcions d'una pregunta i retorna { o, c } amb l'índex de la correcta
function opcionsBarrejades(correcta, falses) {
  const o = barreja([correcta, ...falses]);
  return { o, c: o.indexOf(correcta) };
}
