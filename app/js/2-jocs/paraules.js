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
  { paraula: 'SABÓ', pista: 'Per rentar-se les mans' }, { paraula: 'TOVALLOLA', pista: 'Serveix per eixugar-se' },
  { paraula: 'POMA', pista: 'Fruita rodona, vermella o verda' }, { paraula: 'PERA', pista: 'Fruita verda amb forma de campana' },
  { paraula: 'MADUIXA', pista: 'Fruita vermella i petita amb llavors per fora' }, { paraula: 'LLIMONA', pista: 'Fruita groga i molt àcida' },
  { paraula: 'RAÏM', pista: 'Fruita en gotims que dona el vi' }, { paraula: 'MELÓ', pista: 'Fruita gran i dolça d\'estiu' },
  { paraula: 'AMETLLA', pista: 'Fruit sec que es menja a Nadal' }, { paraula: 'CASTANYA', pista: 'Es menja torrada per la Castanyada' },
  { paraula: 'CEBA', pista: 'Fa plorar quan la talles' }, { paraula: 'ENCIAM', pista: 'Fulles verdes per a l\'amanida' },
  { paraula: 'ALL', pista: 'Petit, blanc i de gust fort' }, { paraula: 'PEBROT', pista: 'Hortalissa vermella o verda que es fa escalivada' },
  { paraula: 'ESPINACS', pista: 'Verdura de fulles verdes fosques' }, { paraula: 'FORMATGE', pista: 'Es fa amb llet i es menja a daus' },
  { paraula: 'PERNIL', pista: 'Es talla a llesques i ve del porc' }, { paraula: 'ARRÒS', pista: 'Grans blancs de la paella' },
  { paraula: 'TRUITA', pista: 'Es fa amb ous batuts' }, { paraula: 'SOPA', pista: 'Plat calent amb brou' },
  { paraula: 'ESCUDELLA', pista: 'Plat català típic de Nadal' }, { paraula: 'PA', pista: 'Es compra al forn cada dia' },
  { paraula: 'OLI', pista: 'Es fa amb olives' }, { paraula: 'SUCRE', pista: 'Fa dolç el cafè' },
  { paraula: 'MEL', pista: 'La fan les abelles' }, { paraula: 'XOCOLATA', pista: 'Dolç fet de cacau' },
  { paraula: 'CAFÈ', pista: 'Beguda negra del matí' }, { paraula: 'LLET', pista: 'Beguda blanca que dona la vaca' },
  { paraula: 'AIGUA', pista: 'Es beu quan tens set' }, { paraula: 'VI', pista: 'Beguda que es fa amb raïm' },
  { paraula: 'GOS', pista: 'El millor amic de l\'home' }, { paraula: 'GAT', pista: 'Animal de casa que fa mèu' },
  { paraula: 'VACA', pista: 'Dona llet' }, { paraula: 'PORC', pista: 'Animal de la granja del qual es fa pernil' },
  { paraula: 'CABRA', pista: 'Animal que puja per les roques' }, { paraula: 'ÀNEC', pista: 'Ocell que neda i fa cuac' },
  { paraula: 'OCELL', pista: 'Té ales i plomes' }, { paraula: 'COLOM', pista: 'Ocell de les places' },
  { paraula: 'PEIX', pista: 'Viu a l\'aigua' }, { paraula: 'LLEÓ', pista: 'El rei de la selva' },
  { paraula: 'MICO', pista: 'Animal que s\'enfila pels arbres' }, { paraula: 'GRANOTA', pista: 'Salta i fa rac-rac' },
  { paraula: 'ABELLA', pista: 'Insecte que fa mel' }, { paraula: 'FORMIGA', pista: 'Insecte petit que treballa en grup' },
  { paraula: 'PAPALLONA', pista: 'Insecte amb ales de colors' }, { paraula: 'CARGOL', pista: 'Va lent, amb la casa a sobre' },
  { paraula: 'GUINEU', pista: 'Animal astut de cua llarga' }, { paraula: 'PORTA', pista: 'Per on s\'entra a casa' },
  { paraula: 'SOSTRE', pista: 'És a dalt de l\'habitació' }, { paraula: 'BALCÓ', pista: 'Espai a fora de la finestra' },
  { paraula: 'ASCENSOR', pista: 'Puja i baixa entre pisos' }, { paraula: 'MENJADOR', pista: 'Habitació on es dina' },
  { paraula: 'LAVABO', pista: 'Habitació on hi ha la dutxa' }, { paraula: 'SOFÀ', pista: 'Seient còmode per a diverses persones' },
  { paraula: 'ARMARI', pista: 'Moble on es guarda la roba' }, { paraula: 'LLIT', pista: 'Moble on es dorm' },
  { paraula: 'MIRALL', pista: 'Hi veus la teva cara' }, { paraula: 'CATIFA', pista: 'Es posa a terra perquè sigui càlid' },
  { paraula: 'NEVERA', pista: 'Manté freds els aliments' }, { paraula: 'RENTADORA', pista: 'Renta la roba' },
  { paraula: 'PLANXA', pista: 'Treu les arrugues de la roba' }, { paraula: 'ESCOMBRA', pista: 'Serveix per netejar el terra' },
  { paraula: 'GANIVET', pista: 'Coberts que tallen' }, { paraula: 'PLAT', pista: 'S\'hi posa el menjar' },
  { paraula: 'TASSA', pista: 'S\'hi beu el cafè' }, { paraula: 'OLLA', pista: 'Recipient per bullir' },
  { paraula: 'PAELLA', pista: 'Estri ample per fregir' }, { paraula: 'PINTA', pista: 'Serveix per arreglar els cabells' },
  { paraula: 'ABRIC', pista: 'Roba d\'hivern, de sobre' }, { paraula: 'JERSEI', pista: 'Peça de llana' },
  { paraula: 'PANTALONS', pista: 'Roba amb dues cames' }, { paraula: 'FALDILLA', pista: 'Roba que no té cames' },
  { paraula: 'MITJONS', pista: 'Es posen abans de les sabates' }, { paraula: 'BARRET', pista: 'Es posa al cap' },
  { paraula: 'GUANTS', pista: 'Abriguen les mans' }, { paraula: 'CORBATA', pista: 'Es porta al coll amb el vestit' },
  { paraula: 'ULLERES', pista: 'Serveixen per veure-hi millor' }, { paraula: 'ANELL', pista: 'Joia que es porta al dit' },
  { paraula: 'AVI', pista: 'El pare del pare' }, { paraula: 'ÀVIA', pista: 'La mare de la mare' },
  { paraula: 'GERMÀ', pista: 'Fill dels mateixos pares' }, { paraula: 'NET', pista: 'Fill del teu fill' },
  { paraula: 'COSÍ', pista: 'Fill del teu oncle' }, { paraula: 'VEÏ', pista: 'Viu a prop de casa teva' },
  { paraula: 'AMIC', pista: 'Persona de confiança que t\'estima' }, { paraula: 'FAMÍLIA', pista: 'Pares, fills, avis…' },
  { paraula: 'POBLE', pista: 'Més petit que una ciutat' }, { paraula: 'CARRER', pista: 'Hi ha cases a banda i banda' },
  { paraula: 'CINEMA', pista: 'S\'hi veuen pel·lícules' }, { paraula: 'ESTACIÓ', pista: 'D\'aquí surten els trens' },
  { paraula: 'TREN', pista: 'Va per les vies' }, { paraula: 'COTXE', pista: 'Té quatre rodes i volant' },
  { paraula: 'AVIÓ', pista: 'Vola pel cel' }, { paraula: 'TAXI', pista: 'Cotxe que et porta si pagues' },
  { paraula: 'MOTO', pista: 'Té dues rodes i motor' }, { paraula: 'PONT', pista: 'Serveix per creuar un riu' },
  { paraula: 'FONT', pista: 'D\'aquí surt aigua a la plaça' }, { paraula: 'RIU', pista: 'Aigua que baixa cap al mar' },
  { paraula: 'MAR', pista: 'Aigua salada i molt gran' }, { paraula: 'LLAC', pista: 'Aigua envoltada de terra' },
  { paraula: 'BOSC', pista: 'Lloc ple d\'arbres' }, { paraula: 'ARBRE', pista: 'Té tronc i branques' },
  { paraula: 'FLOR', pista: 'Fa bona olor i té pètals' }, { paraula: 'SOL', pista: 'Ens dona llum de dia' },
  { paraula: 'LLUNA', pista: 'Es veu al cel de nit' }, { paraula: 'NÚVOL', pista: 'Blanc o gris, al cel' },
  { paraula: 'PLUJA', pista: 'Aigua que cau del cel' }, { paraula: 'NEU', pista: 'Blanca i freda, a l\'hivern' },
  { paraula: 'VENT', pista: 'Mou les fulles dels arbres' }, { paraula: 'FUSTER', pista: 'Treballa la fusta' },
  { paraula: 'PESCADOR', pista: 'Surt al mar a buscar peix' }, { paraula: 'INFERMERA', pista: 'Cuida els malalts a l\'hospital' },
  { paraula: 'CUINER', pista: 'Prepara el menjar al restaurant' }, { paraula: 'CARTER', pista: 'Porta les cartes' },
  { paraula: 'PERRUQUER', pista: 'Et talla els cabells' }, { paraula: 'PIANO', pista: 'Instrument amb tecles blanques i negres' },
  { paraula: 'VIOLÍ', pista: 'Instrument de corda amb arquet' }, { paraula: 'FLAUTA', pista: 'Instrument de vent' },
  { paraula: 'CANÇÓ', pista: 'Música amb lletra' }, { paraula: 'SARDANA', pista: 'Dansa catalana en rotllana' },
  { paraula: 'NADAL', pista: 'Festa del 25 de desembre' }, { paraula: 'ESTIU', pista: 'L\'estació més calorosa' },
  { paraula: 'HIVERN', pista: 'L\'estació més freda' }, { paraula: 'TARDOR', pista: 'Cauen les fulles dels arbres' },
  { paraula: 'PRIMAVERA', pista: 'Surten les flors' }, { paraula: 'BOCA', pista: 'Serveix per menjar i parlar' },
  { paraula: 'ORELLA', pista: 'Serveix per sentir' }, { paraula: 'NAS', pista: 'Serveix per olorar' },
  { paraula: 'ULL', pista: 'Serveix per veure' }, { paraula: 'CAMA', pista: 'Serveix per caminar' },
  { paraula: 'MÀ', pista: 'Té cinc dits' }, { paraula: 'COR', pista: 'Batega dins del pit' }
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
