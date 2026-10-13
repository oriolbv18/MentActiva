'use strict';
// ==========================================================
//  QUINA PARAULA ÉS? (penjat amb pistes)
// ==========================================================
const BARALLA_PARAULES = [
  { paraula: 'TAULA', pista: 'Moble per menjar' }, { paraula: 'CADIRA', pista: 'Seient amb respatller' },
  { paraula: 'FINESTRA', pista: 'Per on entra la llum' }, { paraula: 'LLIBRE', pista: 'Té pàgines' },
  { paraula: 'JARDÍ', pista: 'Ple de flors i plantes' }, { paraula: 'RELLOTGE', pista: "Per saber l'hora" },
  { paraula: 'MUNTANYA', pista: 'Elevació gran de terreny' }, { paraula: 'CAMISA', pista: 'Roba de dalt amb botons' },
  { paraula: 'CUINA', pista: 'Lloc on es cuina' }, { paraula: 'PLATJA', pista: 'Sorra i mar' },
  { paraula: 'ELEFANT', pista: 'Animal amb trompa' }, { paraula: 'BICICLETA', pista: 'Vehicle de dues rodes amb pedals' },
  { paraula: 'GUITARRA', pista: 'Instrument de corda' }, { paraula: 'AEROPORT', pista: "Lloc d'avions" },
  { paraula: 'HOSPITAL', pista: 'Hi van els malalts' }, { paraula: 'PARC', pista: 'Arbres i gronxadors' },
  { paraula: 'BOTIGA', pista: 'On es compra' }, { paraula: 'FARMÀCIA', pista: 'Ven medicines' },
  { paraula: 'MERCAT', pista: 'Hi ha parades de fruita i verdura' }, { paraula: 'ESGLÉSIA', pista: 'Lloc de culte amb campanar' },
  { paraula: 'PLAÇA', pista: 'Espai obert al mig del poble' }, { paraula: 'ESCOLA', pista: 'Hi van els nens a aprendre' },
  { paraula: 'ESTRELLA', pista: 'Brilla al cel de nit' }, { paraula: 'PARAIGUA', pista: 'Et protegeix de la pluja' },
  { paraula: 'BUFANDA', pista: "Abriga el coll a l'hivern" }, { paraula: 'SABATA', pista: 'Es posa als peus' },
  { paraula: 'TELÈFON', pista: 'Serveix per trucar' }, { paraula: 'TELEVISIÓ', pista: 'Pantalla amb programes' },
  { paraula: 'ORDINADOR', pista: 'Màquina per escriure i navegar' }, { paraula: 'MALETA', pista: 'Es porta de viatge' },
  { paraula: 'AUTOBÚS', pista: 'Transport públic amb moltes places' }, { paraula: 'VAIXELL', pista: 'Navega pel mar' },
  { paraula: 'FAR', pista: 'Llum que guia els vaixells' }, { paraula: 'CASTELL', pista: 'Fortalesa amb torres' },
  { paraula: 'MUSEU', pista: 'S\'hi exposen obres i objectes' }, { paraula: 'TEATRE', pista: 'Hi actuen els actors' },
  { paraula: 'BIBLIOTECA', pista: 'Lloc ple de llibres per llegir' }, { paraula: 'FORN', pista: 'Hi fan el pa' },
  { paraula: 'METGE', pista: 'Et cura quan estàs malalt' }, { paraula: 'MESTRE', pista: 'Ensenya a l\'escola' },
  { paraula: 'BOMBER', pista: 'Apaga els focs' }, { paraula: 'PAGÈS', pista: 'Treballa al camp' },
  { paraula: 'TARONJA', pista: 'Fruita rodona de color taronja' }, { paraula: 'PLÀTAN', pista: 'Fruita llarga i groga' },
  { paraula: 'CIRERA', pista: 'Fruita petita i vermella amb pinyol' }, { paraula: 'SÍNDRIA', pista: 'Fruita gran, verda per fora i vermella per dins' },
  { paraula: 'PRÈSSEC', pista: 'Fruita de pell aterciopelada' }, { paraula: 'TOMÀQUET', pista: 'Hortalissa vermella per a l\'amanida' },
  { paraula: 'PASTANAGA', pista: 'Hortalissa llarga i taronja' }, { paraula: 'PATATA', pista: 'Tubercle que es fa fregit o bullit' },
  { paraula: 'CARBASSA', pista: 'Hortalissa gran i taronja de tardor' }, { paraula: 'GALLINA', pista: 'Ocell de corral que pon ous' },
  { paraula: 'CAVALL', pista: 'Animal que es munta' }, { paraula: 'OVELLA', pista: 'Dona llana' },
  { paraula: 'CONILL', pista: 'Animal de llargues orelles que salta' }, { paraula: 'TORTUGA', pista: 'Animal lent amb closca' },
  { paraula: 'MUSSOL', pista: 'Ocell de nit amb ulls grans' }, { paraula: 'ESQUIROL', pista: 'Petit rosegador de cua peluda' },
  { paraula: 'CATEDRAL', pista: 'Església molt gran' }, { paraula: 'ESCALA', pista: 'Serveix per pujar al pis de dalt' },
  { paraula: 'DORMITORI', pista: 'Habitació per descansar' }, { paraula: 'CALAIX', pista: 'Es guarda dins d\'un moble i s\'obre estirant' },
  { paraula: 'CORTINA', pista: 'Tela que tapa la finestra' }, { paraula: 'LLUMINÀRIA', pista: 'Dona llum a l\'habitació' },
  { paraula: 'FORQUILLA', pista: 'Coberts amb pues' }, { paraula: 'CULLERA', pista: 'Per menjar la sopa' },
  { paraula: 'SABÓ', pista: 'Per rentar-se les mans' }, { paraula: 'TOVALLOLA', pista: 'Serveix per eixugar-se' }
];
const base = c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');const MAX_ERRORS_PARAULA = 6;
const LLETRES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

(() => {
  let llista = [], idx = 0, actual = null, endevinades = new Set(), errors = 0;
  let encerts = 0, fallides = 0, dos = false, torn = 1, punts = [0, 0], resolta = false;

  function reiniciar(ds) {
    dos = ds !== undefined ? !!ds : modeActual === '2vs2';
    llista = trianSenseRepetir(idiomaBanc('paraules'), (I18N.llengua === 'es' && window.BANCS_ES ? BANCS_ES.paraules.map(([paraula, pista]) => ({ paraula, pista })) : BARALLA_PARAULES), 6);
    idx = 0; encerts = 0; fallides = 0; torn = 1; punts = [0, 0];
    setText('paraules-total', llista.length);
    mostrar();
  }
  function mostrar() {
    actual = llista[idx]; endevinades = new Set(); errors = 0; resolta = false;
    setText('paraules-errors', 0); setText('paraules-num', idx + 1);
    setFeedback('paraules', 'Pista: ' + actual.pista);
    mostra('paraules-seguent', false);
    renderMarcador2P('paraules', punts[0], punts[1], dos ? torn : null);
    llegirText(actual.pista); pintarParaula(); pintarTeclat(); iniciTemps();
  }
  function pintarParaula() {
    morph($('paraules-display'), [...actual.paraula].map(l => `<div class="paraula-lletra">${endevinades.has(base(l)) ? l : ''}</div>`).join(''));
  }
  function pintarTeclat() {
    $('paraules-teclat').innerHTML = LLETRES.map(l => `<button type="button" class="tecla" data-lletra="${l}">${l}</button>`).join('');
  }
  function lletra(l) {
    if (resolta || endevinades.has(l)) return;
    const boto = $('paraules-teclat').querySelector(`[data-lletra="${l}"]`);
    if (!boto || boto.disabled) return;
    boto.disabled = true; registraTR(ara() - tempsIniciPregunta); tempsIniciPregunta = ara();
    if ([...actual.paraula].some(x => base(x) === l)) {
      endevinades.add(l); soEncert(); vibrar(30); boto.classList.add('encertada'); pintarParaula();
      if ([...actual.paraula].every(x => endevinades.has(base(x)))) acabaParaula(true);
    } else {
      errors++; soError(); vibrar(150); boto.classList.add('fallada'); setText('paraules-errors', errors);
      if (errors >= MAX_ERRORS_PARAULA) acabaParaula(false);
    }
  }
  function acabaParaula(ok) {
    resolta = true;
    $('paraules-teclat').querySelectorAll('.tecla').forEach(b => { b.disabled = true; });
    if (ok) {
      encerts++; if (dos) punts[torn - 1]++;
      setFeedback('paraules', 'Has encertat la paraula!', 'correcte'); soVictoria(); elefantCelebra();
    } else {
      fallides++; elefantTrist();
      setFeedback('paraules', 'La paraula era: ' + actual.paraula, 'incorrecte');
      $('paraules-display').innerHTML = [...actual.paraula].map(l => `<div class="paraula-lletra">${l}</div>`).join('');
      if (!dos) guardarError('Pista: ' + actual.pista, actual.paraula, '(no endevinada)');
    }
    renderMarcador2P('paraules', punts[0], punts[1], dos ? torn : null);
    $('paraules-seguent').textContent = idx === llista.length - 1 ? 'Veure resultat →' : 'Següent →';
    mostra('paraules-seguent', true);
  }
  function seguent() {
    soClic();
    if ($('paraules-seguent').dataset.fi) { reiniciar(); return; }
    idx++; if (dos) torn = 3 - torn;
    if (idx < llista.length) { mostrar(); return; }
    // final de la partida
    $('paraules-teclat').innerHTML = ''; setFeedback('paraules', '');
    renderMarcador2P('paraules', 0, 0, null);
    if (dos) $('paraules-display').innerHTML = `<div class="missatge-final">${esc(finalPartida2P(textGuanyador2P(punts[0], punts[1])))}</div>`;
    else { $('paraules-display').innerHTML = `<div class="missatge-final">Has endevinat ${encerts} de ${llista.length} paraules.</div>`; finalitzarPartida('paraules', encerts, fallides); }
    $('paraules-seguent').textContent = 'Tornar a jugar'; $('paraules-seguent').dataset.fi = '1'; mostra('paraules-seguent', true);
  }
  // Teclat de pantalla i teclat físic
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#paraules-teclat [data-lletra]'); if (t) { soClic(); lletra(t.dataset.lletra); } });
  document.addEventListener('keydown', e => {
    if (!$('joc-paraules').classList.contains('active') || e.ctrlKey || e.metaKey || e.altKey) return;
    const l = e.key.toUpperCase(); if (l.length === 1 && LLETRES.includes(l)) lletra(l);
  });
  $('paraules-seguent').addEventListener('click', seguent);

  // Pista: nombre de lletres, primera lletra i una lletra descoberta
  const tecla = l => $('paraules-teclat').querySelector(`[data-lletra="${l}"]`);
  const lletraPendent = () => [...actual.paraula].map(base).find(l => !endevinades.has(l));
  const pista = {
    obtenir(n) {
      if (!actual || resolta) return null;
      const l = lletraPendent(); if (!l) return null;
      if (n === 1) return { text: `La paraula té ${actual.paraula.length} lletres. Torna a llegir la pista: «${actual.pista}».` };
      const primera = base(actual.paraula[0]);
      if (n === 2) { const k = !endevinades.has(primera) ? primera : l; return { text: k === primera ? `La paraula comença per la ${primera}.` : `Prova la lletra ${k}.`, objectiu: () => tecla(k) }; }
      return { text: `Hi ha una ${l}.`, explica: `T'he destapat una lletra: la ${l}. Amb la pista «${actual.pista}» segur que ja ho veus.`, objectiu: () => tecla(l), aplica: () => lletra(l) };
    }
  };

  registrarJoc({
    id: 'paraules', pista,
    tutorial: { titol: 'Endevina la paraula', cos: '<p>Llegeix la <strong>pista</strong> i descobreix la paraula amagada tocant lletres.</p><p>Tens fins a 6 errors per paraula.</p>' },
    obrir: ds => { reiniciar(ds); delete $('paraules-seguent').dataset.fi; mostrarPantalla('joc-paraules'); },
    reiniciar: () => { delete $('paraules-seguent').dataset.fi; reiniciar(); }
  });
})();
