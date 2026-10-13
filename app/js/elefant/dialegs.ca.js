'use strict';
// ==========================================================
//  MentA · L'ELEFANT (v1.9) · DIÀLEGS EN CATALÀ  (editable per l'Oriol)
//  Cada context té una llista de frases; l'Elefant en tria una amb ponderació anti-repetició (mai la mateixa dues vegades seguides).
//  Variables: {nom} la persona, {ratxa} dies seguits, {joc} nom del joc, {n} un número, {elefant} el nom de la mascota.
//  To: paciència, calidesa i un punt d'humor. Tuteig amable, frases curtes. Mai infantilitzar ni dramatitzar un error.
//  MAI afirmacions mèdiques ni de salut cognitiva: només anima, acompanya i ajuda a jugar. (Guia de to a docs/ELEFANT.md)
// ==========================================================
const DIALEGS_CA = {
  // ---------- Salutacions segons l'hora ----------
  ajuda_menu: ['Et puc ajudar en alguna cosa?', 'Digues, què necessites?', 'Aquí em tens. Què fem?'],
  salutacio_mati: ['Bon dia, {nom}! Què tal has dormit?', 'Bon dia, {nom}. Comencem el dia amb un joc?', 'Bon dia! Un matí tranquil, ideal per jugar una estona.', 'Hola, {nom}! Ja t\'esperava amb la trompa a punt.', 'Bon dia, {nom}. Avui toca {joc}?'],
  salutacio_tarda: ['Bona tarda, {nom}! Fem un joc?', 'Hola, {nom}. Una estoneta de joc després de dinar?', 'Bona tarda! Quina alegria veure\'t.', 'Hola, {nom}! Avui toca {joc}?', 'Bona tarda, {nom}. Com va el dia?'],
  salutacio_vespre: ['Bon vespre, {nom}! Un joc abans de sopar?', 'Hola, {nom}. Un vespre tranquil per jugar una mica.', 'Bon vespre! Quin gust tornar-te a veure.', 'Bon vespre, {nom}. Anem a pams: un joc suau?'],
  salutacio_nit: ['Ja és tard, {nom}. Un joc tranquil i a descansar?', 'Bona nit, {nom}. Jo també tinc una mica de son.', 'Hola, {nom}. Si estàs cansat, demà ho fem amb més calma.'],
  tornada: ['{nom}, et trobava a faltar! Quina alegria.', 'Quant de temps, {nom}! Tornem-hi poc a poc.', 'Benvingut de nou, {nom}. Sense pressa.', 'Hola, {nom}! Aquí em tens, com sempre.'],
  primera_vegada: ['Hola, {nom}! Jo sóc {elefant}. Seré el teu company de jocs.', 'Encantat, {nom}! Aquí tens algú que no es cansa de jugar.'],
  aniversari: ['Moltes felicitats, {nom}! Avui és el teu dia.', 'Per molts anys, {nom}! Et dedico un trompeteig.', 'Feliç aniversari, {nom}! Avui toca celebrar-ho.'],
  // ---------- Inici ----------
  inici_proposta: ['Avui et proposo {joc}. Què et sembla?', 'Què tal {joc}? És un bon moment.', 'Et ve de gust {joc}? Si no, tria el que vulguis.', 'Tinc ganes de jugar a {joc}. M\'acompanyes?'],
  inici_ratxa: ['Portes {ratxa} dies seguits, {nom}. Molt bé!', '{ratxa} dies seguits! Quina constància.', 'Ja són {ratxa} dies, {nom}. Seguim?'],
  inici_ja_has_jugat: ['Avui ja has jugat, {nom}. Si vols, un altre?', 'Molt bé per avui. Un joc més, o ho deixem aquí?', 'Ja has fet la feina d\'avui. El que vingui ara és de regal.'],
  inici_toc: ['Hola! M\'has tocat la trompa.', 'Ep, que fas pessigolles!', 'Sóc aquí, {nom}. Què fem?', 'Dis-me, què vols fer?', 'Aquí em tens. Jugar o respirar una mica?'],
  inici_massa_toc: ['Ei, que em faràs gastar la trompa!', 'Quina feinada, tocar-me tant. Jugam?', 'Prou, prou, que em marejo! Fem un joc millor.'],
  silenci_llarg: ['Sóc aquí quan vulguis.', 'Sense pressa, {nom}.', 'Si vols, et proposo un joc.', 'Quan estiguis a punt, em dius.'],
  novetat: ['Hi ha alguna cosa nova. Vols veure-ho?', 'Mira, tinc una novetat per a tu.'],
  // ---------- Dins dels jocs ----------
  joc_comenca: ['Quan vulguis, {nom}.', 'Endavant, jo et miro.', 'Tranquil·litat. Ho fas molt bé.', 'A per ell!'],
  encert: ['Molt bé!', 'Ben fet, {nom}!', 'Això és!', 'Perfecte.', 'Així mateix.', 'Quina vista!', 'Correcte!', 'Sí senyor!'],
  encert_ratxa: ['{n} seguits! Quina ratxa.', '{n} d\'una tirada, {nom}!', 'Estàs inspirat: {n} seguits.', 'Que no pari! Ja en portes {n}.'],
  error_suau: ['No passa res, {nom}. Tornem-hi.', 'Gairebé! A la propera.', 'Ho tornes a provar? Sense pressa.', 'Uf, a tothom li passa. Seguim.', 'Cap problema. Respira i continua.', 'Aquest ha estat difícil. Va, un altre.'],
  error_seguits: ['Hi ha preguntes que són més dures que altres. Vols una pista?', 'Costa una mica, oi? Et puc donar un cop de trompa.'],
  record: ['Un nou rècord personal! Felicitats, {nom}!', 'Mai havies arribat tan lluny. Enhorabona!', 'Aquest és el teu millor resultat. Ho celebrem!'],
  final_bo: ['Quina partida, {nom}! Estic content.', 'Ho has fet molt bé. Gràcies per jugar amb mi.', 'Una partida rodona. Repetim?', 'Fantàstic, {nom}. Això s\'ha de celebrar.'],
  final_normal: ['Bona partida, {nom}. Gràcies per jugar.', 'Ben fet. Cada partida suma.', 'Ha estat una bona estona. Una altra?', 'Has acabat, i això ja és molt.'],
  final_dur: ['Aquesta ha estat dura, però has arribat al final. Mereixes un descans.', 'No tots els dies són iguals. Demà hi tornem.', 'Gràcies per no rendir-te, {nom}. Això compta.'],
  pausa: ['Fes el que et calgui. Ho tinc tot guardat.', 'Pausa. Aquí t\'espero.', 'Descansa una mica, {nom}.'],
  sortir_joc: ['Cap problema, ho deixem aquí. Tornes quan vulguis.', 'Entesos. Un altre dia seguim.'],
  // ---------- Pistes ----------
  pista_oferta: ['Vols una pista?', 'Et poso una mà? Només si ho vols.', 'Una pista, potser?', 'Vols que t\'ajudi una miqueta?'],
  pista_1: ['Una idea:', 'Fixa\'t en això:', 'Et dono una pista:'],
  pista_2: ['Mira, t\'ho assenyalo amb la trompa.', 'És per aquí. Hi has de mirar.', 'Aquí, aquí!'],
  pista_3: ['Va, t\'ho mostro i et ho explico.', 'Et destapo la resposta, i te la raono.', 'Mira, t\'ho resolc un cop, i ho veuràs clar.'],
  pista_acceptada: ['Doncs som-hi!', 'Perfecte, anem a pams.', 'Molt bé. Ho mirem plegats.'],
  pista_rebutjada: ['Com vulguis. Ho estàs fent molt bé tu sol.', 'Entesos, confio en tu.', 'D\'acord. Jo sóc aquí si canvies d\'idea.'],
  pista_gracies: ['Quan vulguis una altra, només cal que me la demanis.', 'Aprofita-ho! Ho veus ara?', 'Una pista no és trampa: és aprendre.'],
  pista_no_disponible: ['Aquí no et puc ajudar gaire. Però t\'animo molt!', 'Ara mateix no hi ha pista per a això. Tu pots, {nom}.'],
  // ---------- Benestar ----------
  respira_inici: ['Fem-ho junts. Seu còmode i mira\'m la trompa.', 'Una estona de calma. Respira al meu ritme.', 'Anem a respirar tranquils, sense pressa.'],
  respira_inhala: ['Agafa aire…', 'Inspira lentament…', 'Entra l\'aire…'],
  respira_exhala: ['I ara deixa anar l\'aire…', 'Treu l\'aire a poc a poc…', 'Expira…'],
  respira_fi: ['Molt bé, {nom}. Ja està.', 'Això és tot. Gràcies per fer-ho amb mi.', 'Una bona pausa. Quan vulguis, seguim.'],
  aigua: ['Hora d\'un got d\'aigua! Jo ja n\'he begut.', 'Beure aigua és una bona idea. Vols un descans?', 'Recorda hidratar-te, {nom}. Jo t\'espero.'],
  anim_pregunta: ['Com et trobes avui, {nom}?', 'Com ha anat el dia fins ara?', 'Com et sents ara mateix?'],
  anim_resposta_be: ['M\'alegro molt!', 'Quina bona notícia.', 'Això m\'agrada sentir.'],
  anim_resposta_regular: ['Gràcies per dir-m\'ho. Sigui com sigui, aquí em tens.', 'Hi ha dies així. Anem a poc a poc.'],
  anim_resposta_baix: ['Gràcies per explicar-m\'ho, {nom}. Si vols parlar amb algú, fes-ho. Mentrestant, aquí em tens.', 'Hi ha dies més grisos. Una estona tranquil·la pot anar bé.'],
  // ---------- Bingo ----------
  bingo_inici: ['Ja trec el bombo! Preparat?', 'Comença el bingo! Tingues els ulls oberts.', 'Bola, bola… Anem a veure què surt.'],
  bingo_bola: ['El {n}!', 'Surt el {n}.', 'Cantem el {n}.', 'Atenció: el {n}.'],
  bingo_tens: ['Tens el {n}! Marca\'l.', 'El {n} el tens al cartró, {nom}!', 'Aquest és teu: el {n}.'],
  bingo_no_tens: ['Aquest no el tens. Seguim.', 'Cap sort amb aquest. A la propera.'],
  bingo_linia_record: ['Tens una línia! No oblidis cantar LÍNIA.', 'Mira el cartró: hi ha una línia completa. Canta-la!'],
  bingo_bingo_record: ['Cartró ple! Canta BINGO!', 'Ho tens tot! Toca BINGO.'],
  bingo_linia_fet: ['Línia! Molt bé, {nom}.', 'Una línia, i en directe!'],
  bingo_bingo_fet: ['BINGO! Quina alegria, {nom}!', 'Bingo! Això s\'ha de celebrar.'],
  bingo_rival_linia: ['{n} ha cantat línia. Seguim endavant.', 'Línia de {n}. Encara ens queda bingo!'],
  bingo_rival_bingo: ['{n} ha fet bingo. Bona partida a tothom!', 'Bingo de {n}. Tornem a jugar?'],
  // ---------- Jugar amb algú ----------
  parella_torn: ['Torn de {nom}.', '{nom}, és el teu torn.', 'Ara toca a {nom}.', 'Endavant, {nom}.'],
  parella_guanya: ['Guanya {nom}! Quina bona partida.', 'Enhorabona, {nom}! Però tothom ha jugat molt bé.', '{nom} s\'emporta aquesta. Revenja?'],
  parella_empat: ['Empat! Això sí que és igualat.', 'Mateix resultat. Quina cosa, eh?'],
  parella_anima: ['Aquesta l\'has perdut, però la propera pot ser teva.', 'Bon joc, {nom}. Amb ganes de revenja?', 'Una derrota amb elegància. Com sempre.'],
  parella_junts: ['Entre els dos ho heu fet molt bé!', 'Quin equip! Així es guanya.', 'Plegats arribeu més lluny.'],
  parella_inici: ['Que comenci el duel! Bona sort als dos.', 'Preparats? Que guanyi el millor.'],
  // ---------- Progrés ----------
  progres_bona: ['Aquesta setmana has jugat {n} dies. Molt bé, {nom}!', 'Setmana constant: {n} dies. Se\'t veu animat.'],
  progres_poca: ['Aquesta setmana has jugat poc, i no passa res. Quan vulguis, tornem-hi.', 'Una setmana tranquil·la. Aquí em tens quan tinguis ganes.'],
  progres_cap: ['Et trobava a faltar. Quan vulguis, comencem.', 'Cap problema: cada dia és bon dia per començar.'],
  progres_vestuari: ['Mira què has guanyat: {n}! Et queda molt bé.', 'Has desbloquejat una cosa nova per a mi. Gràcies!'],
  vestuari_nou: ['Una peça nova! Em veus guapo?', 'Gràcies per aquest regal. M\'encanta.'],
  // ---------- Residència ----------
  residencia_benvinguda: ['Hola, {nom}! Quina alegria veure\'t.', 'Benvingut, {nom}. Aquí tens el teu company de jocs.', 'Hola, {nom}! Preparat per a una estona de jocs?'],
  residencia_planta: ['Bon dia a tota la planta! Qui juga avui?', 'Bona tarda, planta! Estic a punt.'],
  // ---------- Estats especials ----------
  sense_connexio: ['No tinc connexió, però jo sóc aquí.', 'Sense internet no passa res: tot funciona igual.'],
  buit: ['Aquí encara no hi ha res. Comencem?', 'Tot és buit per ara, però es pot omplir.'],
  error_app: ['Alguna cosa no ha anat bé, però no és culpa teva. Torna-ho a provar.', 'Ep, hi ha hagut un entrebanc. Respira, ho tornem a intentar.'],
  copia_seguretat: ['Fem una còpia perquè no perdis res?', 'Una còpia de seguretat? Només porta un moment.'],
  // ---------- Onboarding ----------
  ob_benvinguda: ['Hola! Jo sóc l\'Elefant de MentA. Encantat!', 'Hola, hola! Soc l\'Elefant i faré el camí amb tu.'],
  ob_nom_pregunta: ['Jo sóc l\'Elefant. I tu, com et dius?', 'Com et dius? M\'agradaria saber-ho.'],
  ob_nom_resposta: ['Quin nom més bonic, {nom}!', 'Encantat, {nom}!', 'Molt de gust, {nom}.'],
  ob_rol: ['Primer, digue\'m qui jugarà amb mi.', 'Qui farà servir MentA? Així m\'ajusto.'],
  ob_pin: ['Un PIN de 4 xifres protegeix les dades. És opcional.', 'Això és per a qui t\'ajuda. Pots deixar-ho per a després.'],
  ob_consent: ['Això és important: decideix-ho amb calma.', 'Cap pressa. Es pot canviar quan vulguis.'],
  ob_lletra: ['Mira, ara em veus més gran. Així està bé?', 'Tria la mida que et vagi millor. Jo creixo amb tu!'],
  ob_prova: ['Provem-ho: toca la carta que et dic.', 'Fixa\'t, jo ho faig primer i després tu.'],
  ob_prova_ok: ['Perfecte, ja ho tens!', 'Això és. Fàcil, oi?', 'Molt bé. Un més!'],
  ob_anim: ['Com et sents avui? No hi ha resposta incorrecta.', 'Digue\'m, com et trobes?'],
  ob_posa_nom: ['I a mi, quin nom em poses? Pots deixar-me com sóc.', 'Em posaries un nom? Si no, seré l\'Elefant.'],
  ob_final: ['Ja està tot a punt! Anem a jugar?', 'Llest! Ara comença el millor.'],
  // ---------- Només a la web (hero) ----------
  web_saluda: ['Hola! Sóc l\'Elefant de MentA.', 'Passa, passa. Mira què hem preparat.'],
  web_massa: ['Eh, que em fas pessigolles!', 'Para, para! Que em faràs riure!']
};
const Dialegs = (() => {
  const historial = {};      // context → índexs usats recentment (per no repetir)
  function tria(context, vars, llengua) {
    const dic = (typeof window !== 'undefined' && window.DIALEGS && window.DIALEGS[llengua || (window.__llengua || 'ca')]) || DIALEGS_CA;
    const llista = dic[context] || DIALEGS_CA[context]; if (!llista || !llista.length) return '';
    const h = historial[context] || (historial[context] = []);
    const v = Object.assign({ nom: '', elefant: (typeof nomElefant === 'function' ? nomElefant() : "L'Elefant") }, vars || {});
    // Només frases que es poden omplir del tot; pes baix per a les usades fa poc i zero per a l'última
    const candidats = llista.map((t, i) => i).filter(i => !/\{(?!nom\})\w+\}/.test(llista[i].replace(/\{(\w+)\}/g, (m, k) => (v[k] != null && v[k] !== '') ? 'x' : m)));
    const bons = candidats.length ? candidats : llista.map((t, i) => i);
    const pesos = bons.map(i => { const pos = h.lastIndexOf(i); return pos < 0 ? 1 : (pos === h.length - 1 && bons.length > 1 ? 0 : 0.15 + 0.15 * (h.length - pos) / Math.max(1, h.length)); });
    const total = pesos.reduce((a, b) => a + b, 0) || 1; let r = Math.random() * total, idx = bons[bons.length - 1];
    for (let i = 0; i < pesos.length; i++) { r -= pesos[i]; if (r <= 0) { idx = bons[i]; break; } }
    h.push(idx); if (h.length > Math.min(4, Math.max(1, llista.length - 1))) h.shift();
    return omple(llista[idx], v);
  }
  function omple(text, v) {
    const r = text.replace(/\{(\w+)\}/g, (m, k) => (v[k] == null || v[k] === '') ? (k === 'nom' ? '' : m) : v[k])
      .replace(/\s+([,.!?])/g, '$1').replace(/,\s*([!?.])/g, '$1').replace(/^[,\s]+/, '').replace(/\s{2,}/g, ' ').trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }
  const quantes = () => Object.values(DIALEGS_CA).reduce((t, l) => t + l.length, 0);
  return { tria, omple, quantes, contextos: () => Object.keys(DIALEGS_CA) };
})();
