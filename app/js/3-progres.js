'use strict';
// ==========================================================
//  MentA · PROGRÉS (part de l'inici)
//  Ratxa (amb opció de recuperar un dia), medalles, pantalla d'inici,
//  recordatoris, salut i benestar (respiració, xec, diari) i mini-test de memòria.
//  Les estadístiques i els informes són a 6-estadistiques.js.
// ==========================================================
const pantallaActiva = id => { const p = $(id); return !!p && p.classList.contains('active'); };
const pct = (enc, err) => (enc + err) > 0 ? Math.round(enc / (enc + err) * 100) : 0;
const DIES_CURTS = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];      // la setmana comença en dilluns
const NOMS_MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];

// ==========================================================
// 1. DIES JUGATS I RATXA
// ==========================================================
function registrarDiaJugat() {
  const d = dadesActuals(), avui = avuiISO();
  if (d.diesJugats.includes(avui)) return;
  d.diesJugats.push(avui);
  if (d.diesJugats.length > 1500) d.diesJugats = d.diesJugats.slice(-1500);
}
const diesActius = () => { const d = dadesActuals(); return new Set([...d.diesJugats, ...(d.diesRecuperats || [])]); };
function calcularRatxa() {
  const dies = diesActius();
  let ratxa = 0;
  for (let i = 0; i < 1500; i++) {
    if (dies.has(dataMenys(i))) ratxa++;
    else if (i > 0) break;            // si encara no has jugat avui, la ratxa d'ahir no es perd
  }
  return ratxa;
}
function calcularRatxaMaxima() {
  const dies = [...diesActius()].sort();
  if (!dies.length) return 0;
  let max = 1, actual = 1;
  for (let i = 1; i < dies.length; i++) {
    const diff = Math.round((dataDeISO(dies[i]) - dataDeISO(dies[i - 1])) / 86400000);
    actual = diff === 1 ? actual + 1 : 1; if (actual > max) max = actual;
  }
  return max;
}
const teJugatAvui = () => dadesActuals().diesJugats.includes(avuiISO());
// Ratxa «trencada» només per un dia: ahir no, abans-d'ahir sí, i no s'ha recuperat cap dia els últims 14 dies
function diaRecuperable() {
  const d = dadesActuals(), dies = diesActius(), ahir = dataMenys(1), abans = dataMenys(2);
  if (dies.has(ahir) || !dies.has(abans) || dies.has(avuiISO())) return null;
  const recents = (d.diesRecuperats || []).filter(x => x >= dataMenys(14));
  return recents.length ? null : ahir;
}
function recuperarDia() {
  const dia = diaRecuperable(); if (!dia) return;
  const d = dadesActuals(); d.diesRecuperats = d.diesRecuperats || []; d.diesRecuperats.push(dia); guardarDadesUsuari();
  soVictoria(); toast('Dia recuperat. La teva ratxa continua!', 3500, 'exit'); refrescarInici();
}

// ==========================================================
// 2. MEDALLES (per categories, amb progrés cap a la següent)
// ==========================================================
const jugades = (d, joc) => (d.partides[joc] || {}).jugades || 0;
const sessionsDomini = (d, dom) => d.historial.filter(h => h.domini === dom);
const fotosAlbum = () => Object.keys(lsGet('mentA_album_' + getUsuariActual().id, {})).length;
const rec = (a, o) => ({ actual: Math.min(a, o), objectiu: o });
const CAT_MEDALLES = { constancia: 'Constància', domini: 'Domini', variacio: 'Variació', record: 'Rècords', familia: 'Benestar i família' };
const MEDALLES = [
  { id: 'primer_dia', cat: 'constancia', nom: 'Primer dia', desc: 'Has jugat per primer cop', prog: d => rec(d.totalPartides, 1) },
  { id: 'ratxa_3', cat: 'constancia', nom: '3 dies seguits', desc: 'Tres dies seguits jugant', prog: () => rec(calcularRatxaMaxima(), 3) },
  { id: 'ratxa_7', cat: 'constancia', nom: 'Setmana perfecta', desc: 'Set dies seguits jugant', prog: () => rec(calcularRatxaMaxima(), 7) },
  { id: 'ratxa_30', cat: 'constancia', nom: 'Mes complet', desc: '30 dies seguits jugant', prog: () => rec(calcularRatxaMaxima(), 30) },
  { id: 'dies_20', cat: 'constancia', nom: '20 dies actius', desc: 'Has jugat 20 dies diferents', prog: () => rec(diesActius().size, 20) },
  { id: 'partides_50', cat: 'constancia', nom: '50 partides', desc: 'Has jugat 50 partides', prog: d => rec(d.totalPartides, 50) },
  { id: 'partides_100', cat: 'constancia', nom: '100 partides', desc: 'Has jugat 100 partides', prog: d => rec(d.totalPartides, 100) },
  { id: 'partides_500', cat: 'constancia', nom: '500 partides', desc: 'Has jugat 500 partides', prog: d => rec(d.totalPartides, 500) },
  { id: 'encerts_80', cat: 'domini', nom: 'Franctirador', desc: '80% d\'encerts globals (mínim 20 respostes)', prog: d => (d.totalEncerts + d.totalErrors) > 20 ? rec(pct(d.totalEncerts, d.totalErrors), 80) : rec(d.totalEncerts + d.totalErrors, 21) },
  { id: 'nback_10', cat: 'domini', nom: 'Ment brillant', desc: '10 partides de N-back', prog: d => rec(jugades(d, 'nback'), 10) },
  { id: 'stroop_10', cat: 'domini', nom: 'Atenció d\'acer', desc: '10 partides de Stroop', prog: d => rec(jugades(d, 'stroop'), 10) },
  { id: 'sudoku_5', cat: 'domini', nom: 'Mestre del Sudoku', desc: '5 sudokus completats', prog: d => rec(d.historial.filter(h => h.joc === 'sudoku' && h.errors < 3).length, 5) },
  { id: 'dom_memoria', cat: 'domini', nom: 'Memòria sòlida', desc: '15 partides de memòria amb més del 75%', prog: d => rec(sessionsDomini(d, 'memoria').filter(h => h.pct >= 75).length, 15) },
  { id: 'dom_llenguatge', cat: 'domini', nom: 'Bon parlador', desc: '15 partides de llenguatge amb més del 75%', prog: d => rec(sessionsDomini(d, 'llenguatge').filter(h => h.pct >= 75).length, 15) },
  { id: 'dom_logica', cat: 'domini', nom: 'Ment lògica', desc: '15 partides de lògica amb més del 75%', prog: d => rec(sessionsDomini(d, 'logica').filter(h => h.pct >= 75).length, 15) },
  { id: 'tots_jocs', cat: 'variacio', nom: 'Explorador', desc: 'Has provat 10 jocs diferents', prog: d => rec(Object.keys(d.partides).length, 10) },
  { id: 'cinc_dominis', cat: 'variacio', nom: 'Ment completa', desc: 'Els 5 dominis treballats en una mateixa setmana', prog: d => rec(new Set(d.historial.filter(h => h.data >= dataMenys(6)).map(h => h.domini)).size, 5) },
  { id: 'tres_estrelles_5', cat: 'record', nom: 'Perfeccionista', desc: '3 estrelles a 5 jocs diferents', prog: d => rec(Object.values(d.estrelles).filter(v => v === 3).length, 5) },
  { id: 'records_3', cat: 'record', nom: 'Superant-te', desc: 'Has millorat el teu millor resultat en 3 jocs', prog: d => rec(Object.values(d.partides).filter(p => p.jugades >= 2 && p.millor >= 90).length, 3) },
  { id: 'respiracio_5', cat: 'familia', nom: 'Zen', desc: '5 sessions de respiració', prog: d => rec(d.salut.respiracio || 0, 5) },
  { id: 'diari_7', cat: 'familia', nom: 'Memòria viva', desc: '7 records al diari', prog: d => rec(d.diari.length, 7) },
  { id: 'salut_7', cat: 'familia', nom: 'Vida sana', desc: '7 dies amb xec diari', prog: d => rec(d.salut.xecs || 0, 7) },
  { id: 'album_5', cat: 'familia', nom: 'Àlbum viu', desc: '5 fotos a l\'àlbum de records', prog: () => rec(fotosAlbum(), 5) },
  { id: 'compartit_1', cat: 'familia', nom: 'Compartint', desc: 'Has compartit el teu progrés amb la família', prog: d => rec(d.salut.compartit || 0, 1) }
];
const medallaFeta = (m, d) => { const p = m.prog(d); return p.actual >= p.objectiu; };
let _medallesNoves = [];
function comprovarMedalles() {
  const d = dadesActuals(), noves = MEDALLES.filter(m => !d.medalles.includes(m.id) && medallaFeta(m, d));
  if (!noves.length) return;
  noves.forEach(m => d.medalles.push(m.id)); _medallesNoves = noves.map(m => m.id);
  guardarDadesUsuari();
  // s'avisa després de la pantalla final perquè no se solapin
  setTimeout(() => { toast(`Nova medalla: ${noves.map(m => m.nom).join(', ')}`, 4500, 'exit'); soEstrella(); }, partidaAcabada ? 2600 : 200);
}
function htmlMedalles() {
  const d = dadesActuals();
  return Object.entries(CAT_MEDALLES).map(([cat, nomCat]) => {
    const llista = MEDALLES.filter(m => m.cat === cat);
    return `<div class="cat-medalles"><h3>${nomCat}</h3><span class="xip">${llista.filter(m => d.medalles.includes(m.id)).length}/${llista.length}</span></div>
      <div class="medalles-grid">${llista.map(m => {
        const feta = d.medalles.includes(m.id), p = m.prog(d), nova = _medallesNoves.includes(m.id);
        return `<div class="medalla${feta ? ' obtinguda' : ''}${nova ? ' nova' : ''}"><div class="medalla-ico">${ico(feta ? 'trofeu' : 'cadenat')}</div><div class="nom-m">${esc(m.nom)}</div><div class="desc-m">${esc(m.desc)}</div>
        ${feta ? '<span class="xip exit">Aconseguida</span>' : `<div class="barra-progres" role="progressbar" aria-valuemin="0" aria-valuemax="${p.objectiu}" aria-valuenow="${p.actual}" aria-label="Progrés de ${esc(m.nom)}"><div class="farcit" style="width:${Math.round(p.actual / p.objectiu * 100)}%"></div></div><span class="prog-text">${p.actual} / ${p.objectiu}</span>`}</div>`;
      }).join('')}</div>`;
  }).join('');
}
function htmlRepteDiari() {
  const d = dadesActuals(), avui = avuiISO(), objectiu = 3, fetes = d.historial.filter(h => h.data === avui).length, complet = fetes >= objectiu;
  return `<div class="repte-cap" style="display:flex;justify-content:space-between"><strong>${complet ? 'Repte diari completat' : 'Repte diari'}</strong><span>${Math.min(fetes, objectiu)}/${objectiu}</span></div>
    <p class="nota">Fes ${objectiu} partides avui</p><div class="barra-progres"><div class="farcit" style="width:${Math.min(100, fetes / objectiu * 100)}%"></div></div>`;
}

// ==========================================================
// 3. RECORDATORIS DE L'INICI (l'inici en si és al Mode Persona: 9-persona.js)
// ==========================================================
// Recordatoris visibles a l'inici (salut + recordatori per jugar a l'hora triada)
const RECORDATORIS = {
  aigua: { text: 'Recorda beure aigua' },
  caminar: { text: 'Surt a caminar una estona' },
  medicacio: { text: "No t'oblidis de la medicació" }
};
function recordatoriJugarActiu() {
  if (!ajustes.recordaJugar || teJugatAvui()) return false;
  const ara_ = new Date(); if (!ajustes.diesRecordatori.includes(ara_.getDay())) return false;
  const [h, m] = (ajustes.horaPreferida || '00:00').split(':').map(Number);
  return ara_.getHours() * 60 + ara_.getMinutes() >= h * 60 + (m || 0);
}
function renderRecordatoris() {
  const cont = $('recordatorisInici'); if (!cont) return;
  const actius = lsGet('mentA_recordatoris', {}), fets = xecAvui();
  let h = '';
  if (recordatoriJugarActiu()) h += `<button type="button" class="recordatori-card" onclick="obrirJoc('${jocRecomanat().joc}')"><span class="recordatori-ico">${ico('campana')}</span><span class="text-r">És l'hora que has triat per jugar</span><span class="fet-r">Jugar</span></button>`;
  h += Object.entries(RECORDATORIS).filter(([k]) => actius[k] && !fets[k]).map(([k, r]) =>
    `<button type="button" class="recordatori-card" data-rec-fet="${k}" aria-label="${r.text}. Marcar com a fet"><span class="recordatori-ico">${ico('campana')}</span><span class="text-r">${r.text}</span><span class="fet-r">Fet</span></button>`).join('');
  cont.innerHTML = h;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-rec-fet]'); if (!b) return;
  xecAvui(true)[b.dataset.recFet] = true; comptaXecs(); guardarDadesUsuari(); soEncert(); toast('Molt bé!'); renderRecordatoris(); comprovarMedalles();
});

// ==========================================================
// 4. SALUT I BENESTAR
// ==========================================================
const CLAUS_XEC = ['aigua', 'caminar', 'dormir', 'medicacio'];
function salutDades() { const s = dadesActuals().salut; s.historial = s.historial || {}; return s; }
function xecAvui(crea) { const s = salutDades(), a = avuiISO(); if (crea) s.historial[a] = s.historial[a] || {}; return s.historial[a] || {}; }
function comptaXecs() { const s = salutDades(); s.xecs = Object.values(s.historial).filter(x => CLAUS_XEC.some(k => x[k])).length; }
const ANIMS = [['Bé', 'cara-genial'], ['Normal', 'cara-normal'], ['Baix', 'cara-baix'], ['Cansat', 'cara-cansat']];
const PUNTS_ANIM = { 'Bé': 4, 'Normal': 3, 'Cansat': 2, 'Baix': 1 };

// --- Respiració 4-7-8 ---
const resp = { actiu: false, cicles: 0, ids: [] };
function faseRespiracio(text, segons, classe, fi) {
  const cercle = $('respirarCercle'); let n = segons;
  setText('respirarText', text); cercle.textContent = n;
  cercle.classList.toggle('inflar', classe === 'inflar'); cercle.classList.toggle('desinflar', classe === 'desinflar');
  if (typeof elefantRespiraFase === 'function') elefantRespiraFase(classe, segons);
  const id = interval(() => { n--; if (n > 0) { cercle.textContent = n; return; } aturaTemps(id); if (resp.actiu) fi(); }, 1000);
  resp.ids.push(id);
}
function cicleRespiracio() {
  faseRespiracio('Inhala pel nas…', 4, 'inflar', () =>
    faseRespiracio('Aguanta la respiració…', 7, 'inflar', () =>
      faseRespiracio('Exhala lentament per la boca…', 8, 'desinflar', () => { resp.cicles++; cicleRespiracio(); })));
}
function iniciarRespiracio() { obrirModal('modalRespiracio'); aturaRespiracio(false); engegaRespiracio(); }
function engegaRespiracio() { resp.actiu = true; resp.cicles = 0; setText('respirarBoto', 'Aturar'); cicleRespiracio(); }
function aturaRespiracio(compta = true) {
  resp.ids.forEach(aturaTemps); resp.ids = [];
  const eraActiva = resp.actiu; resp.actiu = false;
  const c = $('respirarCercle'); if (c) { c.classList.remove('inflar', 'desinflar'); c.textContent = 'Preparat'; }
  setText('respirarText', ''); setText('respirarBoto', 'Començar');
  if (compta && eraActiva && resp.cicles >= 3) {
    salutDades().respiracio = (salutDades().respiracio || 0) + 1; guardarDadesUsuari(); comprovarMedalles(); toast('Sessió de respiració completada', 2800, 'exit');
  }
}
function botoRespiracio() { soClic(); if (resp.actiu) aturaRespiracio(); else engegaRespiracio(); }
MODAL_TANCA.modalRespiracio = () => aturaRespiracio();

// --- Xec diari (hàbits + estat d'ànim amb cares) ---
function obrirXecSalut() {
  const xec = xecAvui();
  document.querySelectorAll('[data-xec]').forEach(t => { t.classList.toggle('actiu', !!xec[t.dataset.xec]); t.setAttribute('aria-checked', !!xec[t.dataset.xec]); });
  $('xecAnim').innerHTML = ANIMS.map(([a, i]) => `<button type="button" role="radio" aria-checked="${xec.anim === a}" class="cara-opcio${xec.anim === a ? ' sel' : ''}" data-anim="${a}">${ico(i)}${a}</button>`).join('');
  obrirModal('modalXecSalut');
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-xec]');
  if (t) {
    const x = xecAvui(true), k = t.dataset.xec; x[k] = !x[k]; t.classList.toggle('actiu', x[k]); t.setAttribute('aria-checked', x[k]);
    comptaXecs(); guardarDadesUsuari(); soClic(); renderRecordatoris(); comprovarMedalles(); return;
  }
  const a = e.target.closest && e.target.closest('[data-anim]');
  if (a) {
    xecAvui(true).anim = a.dataset.anim; comptaXecs(); guardarDadesUsuari(); soEncert();
    $('xecAnim').querySelectorAll('.cara-opcio').forEach(b => { const on = b === a; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
    return;
  }
  const r = e.target.closest && e.target.closest('[data-rec]');
  if (r) { const recs = lsGet('mentA_recordatoris', {}); recs[r.dataset.rec] = !recs[r.dataset.rec]; lsSet('mentA_recordatoris', recs); r.classList.toggle('actiu', recs[r.dataset.rec]); r.setAttribute('aria-checked', !!recs[r.dataset.rec]); soClic(); renderRecordatoris(); }
});
function pintarRecordatorisConfig() {
  const recs = lsGet('mentA_recordatoris', {});
  document.querySelectorAll('[data-rec]').forEach(t => { t.classList.toggle('actiu', !!recs[t.dataset.rec]); t.setAttribute('aria-checked', !!recs[t.dataset.rec]); });
}

// --- Diari de records ---
const PREGUNTES_DIARI = [
  'Quin és el teu record més feliç de quan eres jove?', 'Quin era el teu joc preferit de petit?', 'Quina és la millor recepta que recordes de la teva família?',
  'Quin viatge recordes amb més carinyo?', "Qui va ser el teu millor amic d'infància?", 'Quina cançó et porta records?', "Quin consell t'ha marcat més a la vida?",
  'Com era el teu barri quan eres jove?', "Quina feina vas tenir que més t'agradava?", "Quin és el regal més especial que has rebut?",
  'Quina festa de la teva infància recordes millor?', 'Com vas conèixer algú molt important per a tu?', 'Quin plat et fa pensar en casa?', 'Quina és la teva millor anècdota amb la família?'
];
let preguntaDiari = '';
function obrirDiariRecords() {
  const ara_ = new Date(), diaAny = Math.floor((ara_ - new Date(ara_.getFullYear(), 0, 0)) / 86400000);
  preguntaDiari = PREGUNTES_DIARI[diaAny % PREGUNTES_DIARI.length];
  setText('diariPreguntaActual', preguntaDiari); $('diariResposta').value = '';
  renderDiari(); obrirModal('modalDiari');
}
function diariGuardar() {
  const text = $('diariResposta').value.trim();
  if (!text) { toast('Escriu el teu record primer'); return; }
  dadesActuals().diari.unshift({ id: 'd_' + Date.now(), data: avuiISO(), pregunta: preguntaDiari, text });
  guardarDadesUsuari(); $('diariResposta').value = ''; soVictoria(); celebracioCompleta(); renderDiari(); comprovarMedalles(); toast('Record guardat', 2500, 'exit');
}
function renderDiari() {
  const e = dadesActuals().diari.slice(0, 10);
  $('diariLlista').innerHTML = e.length ? e.map(x => `<div class="diari-entrada"><div class="data-d">${esc(x.data)}</div><div class="pregunta-d">${esc(x.pregunta)}</div><div class="resposta-d">${esc(x.text)}</div></div>`).join('')
    : '<div class="estat-buit"><p>Encara no hi ha records. Escriu-ne el primer: només cal una frase.</p></div>';
}

// ==========================================================
// 5. MINI-TEST DE MEMÒRIA (orientatiu; NO és un test mèdic)
//    Fases: introducció → memoritzar 5 paraules → orientació,
//    càlcul i llenguatge → recordar les paraules → resultat.
// ==========================================================
const PARAULES_TEST = [
  { e: '🍎', p: 'poma' }, { e: '🐶', p: 'gos' }, { e: '🌳', p: 'arbre' }, { e: '🚗', p: 'cotxe' }, { e: '🌊', p: 'mar' },
  { e: '🌻', p: 'flor' }, { e: '🏠', p: 'casa' }, { e: '🐟', p: 'peix' }, { e: '📚', p: 'llibre' }, { e: '🌙', p: 'lluna' }
];
const TOTAL_TEST = 13, TEMPS_MEMORITZAR_TEST = 20;
const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let test = null;
function iniciarTestCognitiu() { if (test) aturaTemps(test.rellotge); test = { fase: 'intro', paraules: barreja(PARAULES_TEST).slice(0, 5), orient: {}, calc: [], llengua: [] }; renderTest(); }
const campTest = (id, tipus, ph) => `<input class="camp-input" id="${id}" type="${tipus}" placeholder="${ph}" aria-label="${ph}" autocomplete="off">`;
function renderTest() {
  const cont = $('testCognitiuCos'); if (!cont || !test) return;
  const targeta = (t, c) => `<div class="test-cognitiu-card"><h2 style="font-size:1.125rem;margin-bottom:.5rem;color:var(--marca-molt-fosc)">${t}</h2>${c}</div>`;
  if (test.fase === 'intro') {
    cont.innerHTML = targeta('Com funciona', '<p>Són uns 5 minuts. Primer memoritzaràs 5 paraules, després faràs unes preguntes breus i, al final, recordaràs les paraules. Sense pressa i sense nervis: és un joc.</p>') +
      '<button type="button" class="boto-principal boto-gran" data-test="memoritzar">Començar el mini-test</button><h2 class="titol-seccio">Els teus resultats anteriors</h2><div id="testHistorial"></div>';
    renderTestHistorial(); return;
  }
  if (test.fase === 'memoritzar') {
    let n = TEMPS_MEMORITZAR_TEST;
    cont.innerHTML = targeta('1. Memoritza aquestes 5 paraules', `<div class="test-paraules">${test.paraules.map(w => `<span class="test-paraula">${w.e} ${w.p.toUpperCase()}</span>`).join('')}</div><p class="nota">Passaràs a la següent part en <strong id="testCompte">${n}</strong> segons.</p>`) +
      '<button type="button" class="boto-principal" data-test="tasques">Ja les he memoritzat →</button>';
    aturaTemps(test.rellotge);
    test.rellotge = interval(() => { n--; if (!pantallaActiva('testCognitiu')) { aturaTemps(test.rellotge); return; } setText('testCompte', n); if (n <= 0) { aturaTemps(test.rellotge); test.fase = 'tasques'; renderTest(); } }, 1000);
    return;
  }
  if (test.fase === 'tasques') {
    aturaTemps(test.rellotge);
    const opcions = (llista, ini = 0) => '<option value="">—</option>' + llista.map((x, i) => `<option value="${i + ini}">${x}</option>`).join('');
    cont.innerHTML = targeta('2. Orientació (3 punts)', `<p>Quin dia, mes i any som?</p><div class="test-input-area"><select class="camp-input" id="tDia" aria-label="Dia de la setmana">${opcions(['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'])}</select><select class="camp-input" id="tMes" aria-label="Mes">${opcions(NOMS_MESOS)}</select>${campTest('tAny', 'number', 'Any')}</div>`) +
      targeta('3. Atenció i càlcul (3 punts)', `<p>Resta 7 de 100 i continua restant 7 al resultat:</p><div class="test-input-area">${campTest('tC1', 'number', '100 − 7')}${campTest('tC2', 'number', '… − 7')}${campTest('tC3', 'number', '… − 7')}</div>`) +
      targeta('4. Llenguatge (2 punts)', `<p>Com es diu cada objecte? (un llapis i un rellotge)</p><div class="test-objectes"><div>✏️ ${campTest('tL1', 'text', 'Primer objecte')}</div><div>⌚ ${campTest('tL2', 'text', 'Segon objecte')}</div></div>`) +
      '<button type="button" class="boto-principal" data-test="recordar">Continuar →</button>';
    return;
  }
  if (test.fase === 'recordar') {
    cont.innerHTML = targeta('5. Recorda les paraules (5 punts)', `<p>Escriu les 5 paraules que has memoritzat, en qualsevol ordre:</p><div class="test-input-area">${[1, 2, 3, 4, 5].map(i => campTest('tR' + i, 'text', 'Paraula ' + i)).join('')}</div>`) +
      '<button type="button" class="boto-principal" data-test="acabar">Veure el resultat</button>';
    return;
  }
  const r = test.resultat, ant = dadesActuals().tests.slice(-2, -1)[0];
  cont.innerHTML = `<div class="test-resultat"><div class="puntuacio-test"><strong>${r.punts}/${r.total}</strong></div>
    <p>Has recordat <strong>${r.recordades} de 5</strong> paraules, i has respost bé ${r.orient + r.calc + r.llengua} de 8 preguntes.</p>
    ${ant ? `<p class="nota">L'última vegada: ${ant.punts}/${ant.total} (${esc(ant.data)}). Les diferències d'un dia a l'altre són normals.</p>` : '<p class="nota">Aquest és el teu primer resultat: serveix de referència per comparar amb propers intents.</p>'}
    <div class="avis-caixa legal"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span>Això és un joc orientatiu: <strong>no és un diagnòstic</strong>. El resultat depèn del son, l'ànim i la concentració. Si et preocupa la teva memòria o la d'algú proper, consulta un professional de la salut.</span></div></div>
    <button type="button" class="boto-secundari" data-test="intro">Tornar</button><h2 class="titol-seccio">Els teus resultats anteriors</h2><div id="testHistorial"></div>`;
  renderTestHistorial();
}
const valorTest = id => { const e = $(id); return e ? e.value : ''; };
function avaluaTest() {
  const ara_ = new Date(), o = test.orient;
  let orient = 0, calc = 0, llengua = 0, recordades = 0;
  if (o.dia === String(ara_.getDay())) orient++;
  if (o.mes === String(ara_.getMonth())) orient++;
  if (parseInt(o.any, 10) === ara_.getFullYear()) orient++;
  const c = test.calc.map(v => parseInt(v, 10));
  [93, 86, 79].forEach((correcte, i) => { const base = i === 0 ? 100 : (isNaN(c[i - 1]) ? correcte + 7 : c[i - 1]); if (c[i] === base - 7) calc++; });
  const accepta = [['llapis', 'boligraf', 'ploma', 'retolador'], ['rellotge', 'reloj']];
  test.llengua.forEach((v, i) => { if (v && accepta[i].some(a => norm(v).includes(a))) llengua++; });
  const dites = new Set(test.recordades.map(norm));
  test.paraules.forEach(w => { if (dites.has(w.p)) recordades++; });
  return { punts: orient + calc + llengua + recordades, total: TOTAL_TEST, orient, calc, llengua, recordades };
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-test]'); if (!b || !test) return;
  soClic();
  const fase = b.dataset.test;
  if (fase === 'recordar') {
    test.orient = { dia: valorTest('tDia'), mes: valorTest('tMes'), any: valorTest('tAny') };
    test.calc = [valorTest('tC1'), valorTest('tC2'), valorTest('tC3')]; test.llengua = [valorTest('tL1'), valorTest('tL2')];
  } else if (fase === 'acabar') {
    test.recordades = [1, 2, 3, 4, 5].map(i => valorTest('tR' + i));
    test.resultat = avaluaTest();
    dadesActuals().tests.push({ data: avuiISO(), punts: test.resultat.punts, total: test.resultat.total });
    guardarDadesUsuari(); soVictoria();
  } else if (fase === 'intro') { iniciarTestCognitiu(); return; }
  test.fase = fase === 'acabar' ? 'resultat' : fase; renderTest();
  window.scrollTo({ top: 0 });
});
function renderTestHistorial() {
  const cont = $('testHistorial'); if (!cont) return;
  const tests = dadesActuals().tests.slice(-10).reverse();
  cont.innerHTML = tests.length ? tests.map(t => `<div class="stat-targeta test-hist"><strong>${esc(t.data)}</strong><span>${t.punts}/${t.total}</span></div>`).join('') : '<div class="estat-buit"><p>Encara no has fet cap mini-test. Quan en facis un, aquí veuràs els resultats.</p></div>';
}

// ==========================================================
// 6. REFRESC GLOBAL I ENTRADA A PANTALLES
// ==========================================================
function refrescarTot() {
  actualitzarHeaderUsuari(); refrescarInici(); renderMenuJocs(); repintaVistesUsuaris();
  if (pantallaActiva('testCognitiu')) iniciarTestCognitiu();
  if (typeof refrescarFamilia === 'function') refrescarFamilia();
  if (typeof renderConfigPerfil === 'function') renderConfigPerfil();
}
// Vistes d'usuaris: es repinten SEMPRE, estiguin o no a la pantalla (així cap llista no queda obsoleta)
function repintaVistesUsuaris() {
  if ($('usuarisLlista')) renderitzarLlistaUsuaris();
  if (typeof renderSelectorResident === 'function') renderSelectorResident();
  if (typeof renderCuidador === 'function' && $('cuidador') && (pantallaActiva('cuidador') || cuidadorObert)) renderCuidador();
  if (typeof renderJugarAmbAlgu === 'function' && pantallaActiva('jugarAmbAlgu')) renderJugarAmbAlgu();
}
document.addEventListener('menta:usuaris', () => { actualitzarHeaderUsuari(); refrescarTot(); if (typeof renderBanerDemo === 'function') renderBanerDemo(); });
PANTALLA_ENTRA.testCognitiu = iniciarTestCognitiu;
PANTALLA_ENTRA.menuJocs = renderMenuJocs;
PANTALLA_ENTRA.menu2vs2 = renderMenuJocs;
