'use strict';
// ==========================================================
//  MentA · NUCLI
//  Utilitats, ajustos, tema, so, efectes, modals accessibles,
//  usuaris, onboarding, catàleg de jocs, navegació (amb historial),
//  capçalera comuna de joc, pausa i flux comú de partida.
//  (Ordre de càrrega: config → 1-nucli → 2-jocs/* → 3-progres → 6-estadistiques → 4-familia → 7-dades → 8-producte → 5-init)
// ==========================================================

// ==========================================================
// 1. UTILITATS
// ==========================================================
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nomsParella = t => (typeof t === 'string' && typeof parella !== 'undefined' && parella.actiu) ? t.replace(/Jugador 1/g, parella.j1.nom).replace(/Jugador 2/g, parella.j2.nom) : t;
function setText(id, t) { const e = $(id); if (e) e.textContent = nomsParella(t); }
function mostra(id, visible = true, tipus = 'block') { const e = $(id); if (e) e.style.display = visible ? tipus : 'none'; }
function setFeedback(prefix, text, classe = '') {
  const e = $(prefix + '-feedback'); if (!e) return;
  e.textContent = nomsParella(text); e.className = 'feedback' + (classe ? ' ' + classe : '');
}
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let _fontAleatoria = Math.random;                      // per defecte, llavor aleatòria; fixaLlavor() la fa reproduïble (Duel de puntuació, proves)
const rng = () => _fontAleatoria();
const fixaLlavor = llavor => { _fontAleatoria = mulberry32(llavor); };
const llavorAleatoria = () => { _fontAleatoria = Math.random; };
function barreja(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
const aleatori = a => a[Math.floor(rng() * a.length)];
const aleatoriUI = a => a[Math.floor(Math.random() * a.length)];   // missatges i decoració: no consumeixen la font dels jocs
// --- Actualització incremental del DOM (evita que es tornin a animar o a crear elements que no han canviat) ---
// Compara el contingut nou amb el que ja hi ha i només modifica allò que és diferent. Així no es reinicien animacions
// CSS, no es perd el focus del teclat i no hi ha parpelleig. Substitueix `element.innerHTML = html` als jocs.
function morph(pare, html) {
  const t = document.createElement('template'); t.innerHTML = html;
  morphFills(pare, t.content);
}
function morphFills(vell, nou) {
  const nous = [...nou.childNodes], vells = [...vell.childNodes];
  nous.forEach((n, i) => {
    const v = vells[i];
    if (!v) { vell.appendChild(n); return; }
    if (v.nodeType !== n.nodeType || v.nodeName !== n.nodeName) { vell.replaceChild(n, v); return; }
    if (n.nodeType === 3) { if (v.nodeValue !== n.nodeValue) v.nodeValue = n.nodeValue; return; }
    if (n.nodeType !== 1) return;
    for (const a of [...v.attributes]) if (!n.hasAttribute(a.name)) v.removeAttribute(a.name);
    for (const a of n.attributes) if (v.getAttribute(a.name) !== a.value) v.setAttribute(a.name, a.value);
    morphFills(v, n);
  });
  for (let i = vells.length - 1; i >= nous.length; i--) vell.removeChild(vells[i]);
}
// Carta del Memory (i de la mini-demo de la benvinguda): cara de darrere i cara de davant, amb gir en 3D
const htmlCartaMemory = i => `<button type="button" class="carta" data-i="${i}" aria-label="Carta ${i + 1}, tapada" aria-pressed="false"><span class="carta-in"><span class="carta-cara carta-darrere"></span><span class="carta-cara carta-davant"></span></span></button>`;
// Fase d'una animació infinita (ms): en recrear un element, l'animació continua pel mateix punt en lloc de tornar a començar
const faseAnimacio = periode => `-${Date.now() % periode}ms`;
// Tria n elements d'un banc sense repetir els vistos recentment (es recorda a mentA_vistos_<clau>)
function trianSenseRepetir(clau, banc, n) {
  let vistos = lsGet('mentA_vistos_' + clau, []).filter(i => i < banc.length);
  let lliures = banc.map((_, i) => i).filter(i => !vistos.includes(i));
  if (lliures.length < n) { vistos = []; lliures = banc.map((_, i) => i); }
  const triats = barreja(lliures).slice(0, n);
  lsSet('mentA_vistos_' + clau, vistos.concat(triats).slice(-Math.max(0, banc.length - n)));
  return triats.map(i => banc[i]);
}
const enter = (min, max) => min + Math.floor(rng() * (max - min + 1));
// Icona de l'sprite SVG de l'HTML (<symbol id="i-nom">)
const ico = (nom, cls = '') => `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${nom}"/></svg>`;
const prefereixMenysMoviment = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mitjana = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

// --- localStorage segur (mai llença excepcions) ---
let _avisMemoria = false, _lsDisponible = true;
try { localStorage.setItem('mentA_prova', '1'); localStorage.removeItem('mentA_prova'); } catch (e) { _lsDisponible = false; }
function lsGet(clau, defecte) { try { const v = localStorage.getItem(clau); return v == null ? defecte : JSON.parse(v); } catch (e) { return defecte; } }
function lsSet(clau, valor) {
  try { localStorage.setItem(clau, JSON.stringify(valor)); return true; }
  catch (e) {
    const ple = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    if (!_avisMemoria) { _avisMemoria = true; toast(ple ? 'L\'espai del navegador està ple i no es poden guardar més dades. Fes una còpia de seguretat i esborra fotos a Configuració → Dades i privadesa.' : 'No es poden guardar les dades: el navegador no ho permet. Exporta una còpia de seguretat des de Configuració.', 9000, 'error'); setTimeout(() => { _avisMemoria = false; }, 60000); }
    return false;
  }
}
function lsRawGet(clau) { try { return localStorage.getItem(clau); } catch (e) { return null; } }
function lsRawSet(clau, valor) { try { localStorage.setItem(clau, valor); } catch (e) { /* ignorat */ } }

// --- Dates ---
function isoData(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function avuiISO() { return isoData(new Date()); }
function dataMenys(dies, base) { const d = base ? new Date(base) : new Date(); d.setDate(d.getDate() - dies); return isoData(d); }
const dataDeISO = iso => new Date(iso + 'T12:00:00');
// La setmana comença en dilluns (norma a Catalunya): 0 = dilluns … 6 = diumenge
const diaSetmana = d => (d.getDay() + 6) % 7;
function formatDurada(s) {
  s = Math.round(s || 0); if (s < 60) return s + ' s';
  const m = Math.floor(s / 60), r = s % 60; return r ? `${m} min ${r} s` : `${m} min`;
}

// --- Temps de joc pausable ---
// ara() és Date.now() menys el temps que el joc ha estat en pausa; els temporitzadors també s'aturen amb la pausa.
let _msPausat = 0, _iniciPausa = 0;
const ara = () => Date.now() - _msPausat;
const _timers = new Map();            // identificador propi → { tipus, fn, ms, inici, restant, nat }
let _seqTimer = 0;
function _armaTimer(id, t) {
  t.inici = Date.now();
  t.nat = t.tipus === 't'
    ? setTimeout(() => { _timers.delete(id); t.fn(); }, t.restant)
    : setInterval(t.fn, t.ms);
}
function temps(fn, ms) { const id = ++_seqTimer, t = { tipus: 't', fn, ms, restant: ms }; _timers.set(id, t); _armaTimer(id, t); return id; }
function interval(fn, ms) { const id = ++_seqTimer, t = { tipus: 'i', fn, ms, restant: ms }; _timers.set(id, t); _armaTimer(id, t); return id; }
function _desarma(t) { clearTimeout(t.nat); clearInterval(t.nat); }
function aturaTemps(id) { const t = _timers.get(id); if (t) { _desarma(t); _timers.delete(id); } }
function aturaTimers() { _timers.forEach(_desarma); _timers.clear(); }
let enPausa = false;
function pausaTimers() {
  if (enPausa) return; enPausa = true; _iniciPausa = Date.now();
  _timers.forEach(t => { _desarma(t); if (t.tipus === 't') t.restant = Math.max(0, t.restant - (Date.now() - t.inici)); });
}
function reprenTimers() {
  if (!enPausa) return; enPausa = false; _msPausat += Date.now() - _iniciPausa;
  _timers.forEach((t, id) => _armaTimer(id, t));
}

// --- Avís flotant (substitueix els alert()) ---
function toast(msg, ms = 2800, tipus = '') {
  let t = $('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast'; t.className = 'toast';
    t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }
  t.textContent = msg; t.className = 'toast actiu' + (tipus ? ' ' + tipus : '');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('actiu'), ms);
}
function saltarAlContingut(e) { e.preventDefault(); const p = document.querySelector('.screen.active h1'); if (p) { p.setAttribute('tabindex', '-1'); p.focus(); } }

// ==========================================================
// 2. ESTAT GLOBAL I AJUSTOS
// ==========================================================
let modeActual = 'individual';
let jocActualId = null;
let errorsActuals = [];
let dificultatActual = 'mig';
let tempsIniciPregunta = 0;
let partidaAcabada = false;
let fotoPerfilTemp = null;
let _tsPartida = 0;
const tempsMitjaJoc = {};

const _ajustosGuardats = lsGet('mentA_ajustes', null);
const ajustes = Object.assign({
  elefantPresencia: 'discret', elefantNom: '', elefantVeu: false, elefantVestuari: [],
  volum: 0.7, efectesSo: true, ambient: false, ambientTipus: 'natura',
  veu: false, veuVelocitat: 0.9, veuNom: '', vibracio: true, animacions: true, elefant: true,
  fosc: false, tema: null, altContrast: false,
  idioma: 'ca', zoom: 'normal', focus: false, unaMa: false,
  dificultatMode: 'adaptatiu', duradaSessio: 10, horaPreferida: '', recordaJugar: false, diesRecordatori: [0, 1, 2, 3, 4, 5, 6],
  usAnonim: false, rol: null, cuidadorNom: '', filtreTremolor: false
}, _ajustosGuardats || {});
if (_ajustosGuardats && _ajustosGuardats.elefant === false && !_ajustosGuardats.elefantPresencia) ajustes.elefantPresencia = 'apagat';     // migració v1.8 → v1.9
if (!ajustes.tema) ajustes.tema = ajustes.fosc ? 'fosc' : 'clar';      // migració v1.6 → v1.7 (la clau `fosc` es manté)
function guardarAjustes() { ajustes.fosc = resolTema() === 'fosc'; lsSet('mentA_ajustes', ajustes); }

// ==========================================================
// 3. SO, VIBRACIÓ I VEU
// ==========================================================
let audioCtx = null;
function getAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
function tocarTo(freq, durada = 0.08, tipus = 'sine', volum = 0.08) {
  if (!ajustes.efectesSo) return;
  const ctx = getAudio(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = tipus; osc.frequency.value = freq;
    gain.gain.setValueAtTime(volum * ajustes.volum, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durada);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + durada);
  } catch (e) { /* sense so */ }
}
function melodia(notes, pas, durada, tipus, volum) { notes.forEach((f, i) => setTimeout(() => tocarTo(f, durada, tipus, volum), i * pas)); }
const soClic = () => tocarTo(620, 0.07, 'sine', 0.07);
const soEncert = () => { melodia([523, 659, 784], 90, 0.15, 'sine', 0.15); if (typeof elefantEvent === 'function') elefantEvent('encert'); };
const soError = () => { tocarTo(220, 0.2, 'sawtooth', 0.1); setTimeout(() => tocarTo(165, 0.25, 'sawtooth', 0.1), 180); if (typeof elefantEvent === 'function') elefantEvent('error'); };
const soVictoria = () => melodia([523, 659, 784, 1047], 130, 0.2, 'triangle', 0.2);
const soEstrella = () => { tocarTo(1047, 0.15, 'sine', 0.25); setTimeout(() => tocarTo(1319, 0.25, 'sine', 0.25), 120); };
function provarSo() { const era = ajustes.efectesSo; ajustes.efectesSo = true; soEncert(); ajustes.efectesSo = era; if (ajustes.veu) llegirText('Aquesta és la veu que llegirà les preguntes.', true); vibrar(60); toast('Prova de so'); }
function vibrar(patro = 30) { if (ajustes.vibracio && navigator.vibrate) navigator.vibrate(patro); }

const LLENGUA_VEU = 'ca';
function veusDisponibles() { try { return window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { return []; } }
function triaVeu() {
  const v = veusDisponibles(); if (!v.length) return null;
  if (ajustes.veuNom) { const t = v.find(x => x.name === ajustes.veuNom); if (t) return t; }
  const ll = I18N.llengua === 'es' ? ['es', 'ca'] : ['ca', 'es'];
  return v.find(x => new RegExp('^' + ll[0], 'i').test(x.lang)) || v.find(x => new RegExp('^' + ll[1], 'i').test(x.lang)) || null;
}
function llegirText(text, forcat) {
  if ((!ajustes.veu && !forcat) || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t(text)), v = triaVeu();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = localeApp();
    u.rate = ajustes.veuVelocitat || 0.9; u.volume = ajustes.volum;
    speechSynthesis.speak(u);
  } catch (e) { /* sense veu */ }
}
function aturarVeu() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* res */ } }

// --- Sons ambientals ---
let ambientNodes = [], ambientTimer = null;
function aturarAmbient() {
  ambientNodes.forEach(n => { try { n.stop(); } catch (e) { /* ja aturat */ } });
  ambientNodes = [];
  if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
}
function iniciarAmbient(tipus) {
  aturarAmbient();
  if (!ajustes.ambient) return;
  const ctx = getAudio(); if (!ctx) return;
  try {
    if (tipus === 'natura') {
      const mida = 2 * ctx.sampleRate, buffer = ctx.createBuffer(1, mida, ctx.sampleRate), dades = buffer.getChannelData(0);
      for (let i = 0; i < mida; i++) dades[i] = (Math.random() * 2 - 1) * 0.15;
      const font = ctx.createBufferSource(); font.buffer = buffer; font.loop = true;
      const filtre = ctx.createBiquadFilter(); filtre.type = 'bandpass'; filtre.frequency.value = 800; filtre.Q.value = 0.6;
      const gain = ctx.createGain(); gain.gain.value = 0.05 * ajustes.volum;
      font.connect(filtre); filtre.connect(gain); gain.connect(ctx.destination);
      font.start(); ambientNodes.push(font);
    } else {
      const escales = { piano: [261.63, 329.63, 392.0, 523.25, 659.25], classica: [220, 261.63, 293.66, 329.63, 392] };
      const notes = escales[tipus] || escales.piano;
      let idx = 0;
      const tocar = () => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = notes[idx++ % notes.length];
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06 * ajustes.volum, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 3.2);
      };
      setTimeout(tocar, 100);
      ambientTimer = setInterval(tocar, 3200);
    }
  } catch (e) { /* sense ambient */ }
}

// ==========================================================
// 4. EFECTES DE CELEBRACIÓ I ELEFANT
// ==========================================================
const animacionsActives = () => ajustes.animacions && !prefereixMenysMoviment();
function confeti() {
  if (!animacionsActives()) return;
  const colors = ['#2e8b57', '#f2a65a', '#5fcf8d', '#f4c95d', '#4a9fd4', '#c75a5a'], frag = document.createDocumentFragment(), peces = [];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div'); c.className = 'confeti';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${aleatoriUI(colors)};animation-delay:${Math.random() * 0.5}s;border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
    frag.appendChild(c); peces.push(c);
  }
  document.body.appendChild(frag);
  setTimeout(() => peces.forEach(c => c.remove()), 3600);
}
function mostrarTrofeu() {
  const t = $('trophyOverlay'); if (!t || !animacionsActives()) return;
  t.classList.add('actiu'); setTimeout(() => t.classList.remove('actiu'), 1600);
}
function starBurst(x, y) {
  if (!animacionsActives()) return;
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div'), angle = (Math.PI * 2 * i) / 10, dist = 90 + Math.random() * 90;
    s.className = 'star-burst';
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.setProperty('--tx', Math.cos(angle) * dist + 'px'); s.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1300);
  }
}
function celebracioCompleta(x, y) {
  confeti(); mostrarTrofeu();
  if (x !== undefined && y !== undefined) starBurst(x, y);
  elefantCelebra();
}

// (L'Elefant — dibuix, motor, diàlegs i comportament — és a js/elefant/. Aquí només queda el que necessiten els jocs.)
const enJoc = () => { const p = document.querySelector('.screen.active'); return !!p && p.id.startsWith('joc-'); };
function saludaSegonsHora() { const h = new Date().getHours(); return h >= 6 && h < 13 ? 'Bon dia' : h >= 13 && h < 20 ? 'Bona tarda' : 'Bona nit'; }

// ==========================================================
// 5. MODALS ACCESSIBLES (focus atrapat i retornat, aria-modal, Escape)
// ==========================================================
const MODAL_TANCA = {};   // id → funció que s'executa en tancar
const _focusPrevi = [];
const SELECTOR_FOCUS = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function _inertFons(on) {
  ['app', 'bottomNav'].forEach(id => { const e = $(id); if (e) { if (on) e.setAttribute('inert', ''); else e.removeAttribute('inert'); } });
  const h = document.querySelector('.menta-header'); if (h) { if (on) h.setAttribute('inert', ''); else h.removeAttribute('inert'); }
}
function obrirModal(id, so = true) {
  const m = $(id); if (!m) return;
  if (so) soClic();
  if (!m.classList.contains('actiu')) _focusPrevi.push(document.activeElement);
  m.classList.add('actiu'); document.body.classList.add('modal-obert'); _inertFons(true);
  const f = m.querySelector('[autofocus], .boto-principal, ' + SELECTOR_FOCUS.split(',')[1]) || m.querySelector(SELECTOR_FOCUS);
  setTimeout(() => { if (f) f.focus({ preventScroll: true }); }, 30);
}
function tancarModal(id) {
  const m = $(id); if (!m || !m.classList.contains('actiu')) return;
  m.classList.remove('actiu');
  if (MODAL_TANCA[id]) MODAL_TANCA[id]();
  if (!document.querySelector('.modal-fons.actiu')) { document.body.classList.remove('modal-obert'); _inertFons(false); }
  const f = _focusPrevi.pop(); if (f && f.focus && document.contains(f)) setTimeout(() => f.focus({ preventScroll: true }), 30);
}
document.addEventListener('click', e => {
  const t = e.target;
  const boto = t.closest && t.closest('[data-tanca]');
  if (boto) { const m = boto.closest('.modal-fons'); if (m) { soClic(); tancarModal(m.id); } return; }
  if (t.classList && t.classList.contains('modal-fons') && t.id !== 'modalPausa' && t.id !== 'modalFi') tancarModal(t.id);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    const obert = [...document.querySelectorAll('.modal-fons.actiu, .tutorial-overlay.actiu, .onboarding-overlay.actiu')].pop(); if (!obert) return;
    const f = [...obert.querySelectorAll(SELECTOR_FOCUS)].filter(x => x.offsetParent !== null || x === document.activeElement);
    if (!f.length) return;
    const primer = f[0], ultim = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === primer || !obert.contains(document.activeElement))) { e.preventDefault(); ultim.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultim || !obert.contains(document.activeElement))) { e.preventDefault(); primer.focus(); }
    return;
  }
  if (e.key !== 'Escape') return;
  const tut = $('tutorialOverlay');
  if (tut && tut.classList.contains('actiu')) { tancarTutorial(); return; }
  const obert = [...document.querySelectorAll('.modal-fons.actiu')].pop();
  if (obert) { if (obert.id === 'modalPausa') reprendreJoc(); else if (obert.id !== 'modalFi') tancarModal(obert.id); }
});

let _confirmCallback = null;
MODAL_TANCA.modalConfirm = () => { _confirmCallback = null; };
function mostrarConfirmacio(titol, text, callback, opcions = {}) {
  setText('confirmTitol', titol); setText('confirmText', text);
  setText('confirmOk', opcions.boto || 'Sí, endavant'); setText('confirmCancela', opcions.cancela || 'Cancel·lar');
  $('confirmOk').className = opcions.perill === false ? 'boto-principal' : 'boto-perill';
  _confirmCallback = callback; obrirModal('modalConfirm', false);
}
function confirmarAccio() {
  const cb = _confirmCallback; _confirmCallback = null;
  tancarModal('modalConfirm');
  if (typeof cb === 'function') cb();
}

// ==========================================================
// 6. TEMA I AJUSTOS DE LA INTERFÍCIE
// ==========================================================
const mqFosc = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function resolTema() { return ajustes.tema === 'auto' ? (mqFosc && mqFosc.matches ? 'fosc' : 'clar') : (ajustes.tema === 'fosc' ? 'fosc' : 'clar'); }
function aplicarTema() {
  const r = resolTema(), h = document.documentElement;
  h.setAttribute('data-tema', r);
  const alt = ajustes.altContrast || (window.matchMedia && matchMedia('(prefers-contrast: more)').matches);
  if (alt) h.setAttribute('data-contrast', 'alt'); else h.removeAttribute('data-contrast');
  document.body.classList.toggle('fosc', r === 'fosc');
  // el color de la barra del navegador i el logotip segueixen el tema triat (no només el del dispositiu)
  const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
  metas.forEach((m, i) => { if (i) m.remove(); });
  if (metas[0]) { metas[0].removeAttribute('media'); metas[0].content = r === 'fosc' ? '#15120e' : '#faf7f2'; }
  document.querySelectorAll('img[data-logo]').forEach(im => { im.src = r === 'fosc' ? 'img/logo-fosc.webp' : 'img/logo.webp'; });
}
if (mqFosc && mqFosc.addEventListener) mqFosc.addEventListener('change', () => { if (ajustes.tema === 'auto') aplicarTema(); });

const AJUST_ACCIONS = {
  efectesSo: v => { if (v) soClic(); actualitzarBotoSo(); },
  ambient: v => { if (v) iniciarAmbient(ajustes.ambientTipus); else aturarAmbient(); },
  veu: v => { if (v) llegirText('Veu activada'); },
  vibracio: v => { if (v) vibrar(30); },
  altContrast: aplicarTema, focus: aplicarClassesBody, unaMa: aplicarClassesBody, animacions: aplicarClassesBody,
  elefant: () => { if (typeof elefantPantalla === 'function') elefantPantalla(idPantallaActiva() || 'inici'); },
  elefantPresencia: v => { ajustes.elefant = v !== 'apagat'; guardarAjustes(); if (typeof elefantRefrescaPresencia === 'function') elefantRefrescaPresencia(); },
  elefantVeu: v => { if (v && typeof llegirText === 'function') llegirText(nomElefant() + ' ja pot parlar', true); },
  idioma: v => { const aplica = ok => { if (!ok) { ajustes.idioma = v = 'ca'; } I18N.canvia(v, true); guardarAjustes(); if (typeof refrescarTot === 'function') refrescarTot(); if (typeof elefantRefrescaPresencia === 'function') elefantRefrescaPresencia(); }; if (v === 'ca') aplica(true); else I18N.assegura(aplica); },
  recordaJugar: () => { if (typeof refrescarInici === 'function') refrescarInici(); },
  usAnonim: v => { if (v) toast('Ús anònim activat. No s\'envia res automàticament.'); }
};
function aplicarClassesBody() {
  const b = document.body.classList;
  b.toggle('focus', !!ajustes.focus); b.toggle('una-ma', !!ajustes.unaMa); b.toggle('sense-animacions', !ajustes.animacions);
}
function pintarToggles() {
  document.querySelectorAll('[data-ajust]').forEach(t => {
    const on = !!ajustes[t.dataset.ajust];
    t.classList.toggle('actiu', on); t.setAttribute('aria-checked', on);
  });
  document.querySelectorAll('[data-tria]').forEach(g => {
    const v = String(ajustes[g.dataset.tria]);
    g.querySelectorAll('button').forEach(b => { const sel = b.dataset.valor === v; b.setAttribute('aria-checked', sel); b.classList.toggle('sel', sel); b.tabIndex = sel ? 0 : -1; });
  });
  const dies = $('xipsDies');
  if (dies) dies.innerHTML = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map((n, i) => { const d = (i + 1) % 7; return `<button type="button" aria-pressed="${ajustes.diesRecordatori.includes(d)}" data-dia="${d}" aria-label="${['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge'][i]}">${n}</button>`; }).join('');
  const hora = $('horaPreferida'); if (hora) hora.value = ajustes.horaPreferida || '';
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-ajust]');
  if (t) {
    const clau = t.dataset.ajust;
    ajustes[clau] = !ajustes[clau]; guardarAjustes(); pintarToggles();
    if (clau !== 'efectesSo') soClic();
    if (AJUST_ACCIONS[clau]) AJUST_ACCIONS[clau](ajustes[clau]);
    return;
  }
  const g = e.target.closest && e.target.closest('[data-tria] button');
  if (g) {
    const clau = g.parentElement.dataset.tria; let v = g.dataset.valor;
    if (['duradaSessio', 'veuVelocitat'].includes(clau)) v = parseFloat(v);
    ajustes[clau] = v; guardarAjustes(); pintarToggles(); soClic();
    if (clau === 'tema') aplicarTema();
    else if (clau === 'zoom') aplicarZoom(v);
    else if (clau === 'ambientTipus' && ajustes.ambient) iniciarAmbient(v);
    else if (clau === 'veuVelocitat') llegirText('Així sonarà la veu.', true);
    else if (AJUST_ACCIONS[clau]) AJUST_ACCIONS[clau](v);
    else if (clau === 'duradaSessio' && typeof refrescarInici === 'function') { const d = dadesActuals(); d.pla = null; guardarDadesUsuari(); }
    return;
  }
  const dia = e.target.closest && e.target.closest('[data-dia]');
  if (dia) {
    const d = +dia.dataset.dia, i = ajustes.diesRecordatori.indexOf(d);
    if (i >= 0) ajustes.diesRecordatori.splice(i, 1); else ajustes.diesRecordatori.push(d);
    guardarAjustes(); pintarToggles(); soClic();
  }
});
// Fletxes dins dels grups d'opcions excloents (patró radiogroup)
document.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const g = e.target.closest && e.target.closest('[role="radiogroup"][data-tria]'); if (!g) return;
  const bs = [...g.querySelectorAll('button')], i = bs.indexOf(document.activeElement); if (i < 0) return;
  e.preventDefault(); const n = bs[(i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
});

// --- Filtre de tremolor (opcional, el fixa el cuidador): ignora tocs massa breus i tocs repetits sobre el mateix element ---
(function filtreTremolor() {
  let inici = 0, darrer = { el: null, t: 0 };
  document.addEventListener('pointerdown', () => { inici = performance.now(); }, true);
  document.addEventListener('click', e => {
    if (!ajustes.filtreTremolor || e.detail === 0 || !e.target.closest) return;
    const ara_ = performance.now(), cap = e.target.closest('button, [role="button"], a, label');
    if (!cap) return;
    if (ara_ - inici < 80 || (darrer.el === cap && ara_ - darrer.t < 450)) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    darrer = { el: cap, t: ara_ };
  }, true);
})();
function canviarVolum(v) { ajustes.volum = v / 100; guardarAjustes(); }
function canviarHoraPreferida(v) { ajustes.horaPreferida = v; guardarAjustes(); if (typeof refrescarInici === 'function') refrescarInici(); }

// --- Mida del text (tot en rem: es reflecteix a tota la interfície) ---
const NIVELLS_ZOOM = { normal: 'Normal', gran: 'Gran', extragran: 'Extra gran', gegant: 'Gegant' };
function aplicarZoom(nivell) {
  if (!NIVELLS_ZOOM[nivell]) nivell = 'normal';
  ajustes.zoom = nivell; guardarAjustes(); lsRawSet('mentA_zoom_vist', '1');
  document.documentElement.dataset.zoom = nivell; pintarToggles();
}

function carregarAjustesUI() {
  const sv = $('sliderVolum'); if (sv) sv.value = Math.round(ajustes.volum * 100);
  aplicarTema(); aplicarClassesBody(); pintarToggles(); aplicarZoom(ajustes.zoom);
  AJUST_ACCIONS.elefant(); muntaSelectorVeu();
  document.querySelectorAll('.versio-app').forEach(e => { e.textContent = VERSIO_CURTA; });
  document.querySelectorAll('.data-versio').forEach(e => { e.textContent = new Date(DATA_VERSIO + 'T12:00:00').toLocaleDateString(localeApp(), { day: 'numeric', month: 'long', year: 'numeric' }); });
}
function muntaSelectorVeu() {
  const sel = $('selVeu'), bloc = $('blocVeu'); if (!sel) return;
  const v = veusDisponibles();
  if (!v.length) { sel.innerHTML = '<option value="">Veu per defecte del dispositiu</option>'; return; }
  const ordre = [...v].sort((a, b) => (/^ca/i.test(b.lang) - /^ca/i.test(a.lang)) || (/^es/i.test(b.lang) - /^es/i.test(a.lang)) || a.name.localeCompare(b.name));
  sel.innerHTML = '<option value="">Automàtica (català si n\'hi ha)</option>' + ordre.map(x => `<option value="${esc(x.name)}"${x.name === ajustes.veuNom ? ' selected' : ''}>${esc(x.name)} (${esc(x.lang)})</option>`).join('');
  if (!v.some(x => /^ca/i.test(x.lang))) setText('ajudaVeu', 'El teu dispositiu no té cap veu en català: s\'usarà una altra veu i sonarà amb accent diferent.');
  sel.onchange = () => { ajustes.veuNom = sel.value; guardarAjustes(); llegirText('Així sonarà la veu.', true); };
}
if ('speechSynthesis' in window && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', muntaSelectorVeu);
function reiniciarTutorials() {
  mostrarConfirmacio('Tornar a veure els tutorials?', 'Els veuràs una altra vegada quan obris cada joc. També els pots obrir amb el botó «?» dins de cada joc.', () => {
    try { localStorage.removeItem('mentA_tutorials'); } catch (e) { /* ignorat */ }
    soVictoria(); toast('Tutorials reiniciats');
  }, { perill: false, boto: 'Sí, torna-los a mostrar' });
}

// ==========================================================
// 7. USUARIS I DADES
// ==========================================================
const COLORS_AVATAR = ['#2e8b57', '#c9771f', '#2b6fb3', '#b3261e', '#7048a8', '#0f7770', '#a14f7a', '#5a5146'];
const AVATARS = ['inicial', 'sol', 'cor', 'flama', 'estrella', 'diana', 'xat', 'musica'];
let colorSeleccionat = '#2e8b57', avatarSeleccionat = 'inicial', editantUsuariId = null;

function getDadesBuit() {
  return {
    partides: {}, totalPartides: 0, totalEncerts: 0, totalErrors: 0,
    millorRatxa: 0, diesJugats: [], diesRecuperats: [], historial: [], medalles: [],
    dominis: {}, salut: {}, diari: [], estrelles: {}, tests: [],
    nivellsOptims: {}, nivells: {}, pla: null, enquesta: false,
    notes: [], abandonaments: [], plaCuidador: { jocsOcults: [], nivellMaxim: 'dificil' }, consentiment: null
  };
}
// Migració v1.6 → v1.7: completa els camps nous sense perdre res i marca l'esquema
function migraDades(d) {
  d = Object.assign(getDadesBuit(), d || {});
  d.plaCuidador = Object.assign({ jocsOcults: [], nivellMaxim: 'dificil' }, d.plaCuidador || {});
  d.notes = d.notes || []; d.abandonaments = d.abandonaments || [];
  d.historial = (d.historial || []).map((h, i) => {
    if (!h.id) h = Object.assign({ id: 's_' + (h.ts || h.data) + '_' + i }, h);
    if (h.pct != null) return h;
    const t = (h.encerts || 0) + (h.errors || 0);
    return Object.assign({ ts: null, durada: null, puntuacio: (h.encerts || 0) * 10, pct: t > 0 ? Math.round(h.encerts / t * 100) : 0, mode: 'individual' }, h);
  });
  return d;
}
let usuaris = lsGet('mentA_usuaris', []);
if (!Array.isArray(usuaris)) usuaris = [];
usuaris.forEach(u => { u.dades = migraDades(u.dades); });
let usuariActualId = lsRawGet('mentA_usuariActual') || 'convidat';
if (usuariActualId !== 'convidat' && !usuaris.some(u => u.id === usuariActualId)) usuariActualId = 'convidat';
const _convidat = { id: 'convidat', nom: 'Convidat', color: '#5a5146', foto: null, avatar: 'inicial', dades: migraDades(lsGet('mentA_convidat', {})) };
window.__schemaAnterior = +lsRawGet('mentA_schema') || 0;     // per no repetir la benvinguda a qui ve d'una versió anterior
if (+lsRawGet('mentA_schema') !== SCHEMA) { lsRawSet('mentA_schema', String(SCHEMA)); lsSet('mentA_usuaris', usuaris); lsSet('mentA_convidat', _convidat.dades); }

// Mode lectura (v1.8): un familiar obre un «paquet de dades» exportat; es veu l'Espai del Cuidador però no es pot canviar res
let modeLectura = false, _lectura = null;
function getUsuariActual() { return modeLectura && _lectura ? _lectura : (usuaris.find(u => u.id === usuariActualId) || _convidat); }
const dadesActuals = () => getUsuariActual().dades;
// ---- Font única dels usuaris (v1.9) ----
// Qualsevol alta, edició, baixa, importació o demo passa per aquí i acaba avisant amb l'esdeveniment «menta:usuaris».
// Totes les llistes (modal, selector de residents, panell de planta, selector de «Jugar amb algú»…) s'hi subscriuen i es
// repinten soles: cap vista depèn d'haver estat oberta (arrel de l'error «l'usuari no surt fins que toco la icona»).
function idUsuariNou(prefix) {
  let id;
  do { id = (prefix || 'u_') + ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); }
  while (usuaris.some(x => x.id === id));
  return id;
}
let _usuarisAvisPendent = false;
function notificaUsuaris() {
  document.dispatchEvent(new CustomEvent('menta:usuaris', { detail: { total: usuaris.length, actual: usuariActualId } }));
}
function afegirUsuari(dades, fer) {
  const nou = Object.assign({ id: idUsuariNou(), nom: '?', color: '#2e8b57', foto: null, avatar: 'inicial', dades: getDadesBuit() }, dades);
  if (usuaris.some(x => x.id === nou.id)) nou.id = idUsuariNou();
  usuaris.push(nou); if (fer !== false) usuariActualId = nou.id; guardarUsuaris(); notificaUsuaris(); return nou;
}
function editarUsuariDades(id, canvis) { const u = usuaris.find(x => x.id === id); if (!u) return null; Object.assign(u, canvis); guardarUsuaris(); notificaUsuaris(); return u; }
function treuUsuari(id) {
  usuaris = usuaris.filter(x => x.id !== id);
  if (usuariActualId === id) usuariActualId = 'convidat';
  try { localStorage.removeItem('mentA_album_' + id); } catch (e) { /* ignorat */ }
  guardarUsuaris(); notificaUsuaris();
}
function guardarUsuaris() { if (modeLectura) return; lsSet('mentA_usuaris', usuaris); lsRawSet('mentA_usuariActual', usuariActualId); }
function guardarDadesUsuari() { if (modeLectura) return; if (usuariActualId === 'convidat') lsSet('mentA_convidat', _convidat.dades); else guardarUsuaris(); }

function ajustarLluminositat(hex, delta) {
  const n = parseInt(hex.replace('#', ''), 16), tall = v => Math.max(0, Math.min(255, v));
  return '#' + ((tall((n >> 16) + delta) << 16) | (tall(((n >> 8) & 0xff) + delta) << 8) | tall((n & 0xff) + delta)).toString(16).padStart(6, '0');
}
// Entrades hostils (una còpia importada pot dur colors o fotos manipulats): només s'accepten formats estrictes
const colorSegur = c => (/^#[0-9a-fA-F]{6}$/.test(String(c || '')) ? c : '#2e8b57');
const fotoSegura = v => (typeof v === 'string' && v.length < 3e6 && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) ? v : '';
const fonsAvatar = color => { color = colorSegur(color); return `linear-gradient(135deg, ${color}, ${ajustarLluminositat(color, -28)})`; };
const inicialNom = nom => (String(nom || '').trim()[0] || '?').toUpperCase();
function htmlAvatar(u) {
  if (fotoSegura(u.foto)) return `<img src="${fotoSegura(u.foto)}" alt="">`;
  if (u.avatar && u.avatar !== 'inicial') return ico(u.avatar);
  return u.id === 'convidat' ? ico('usuari') : esc(inicialNom(u.nom));
}
function actualitzarHeaderUsuari() {
  const u = getUsuariActual(), av = $('usuariAvatar'); if (!av) return;
  av.innerHTML = htmlAvatar(u); av.style.background = u.foto ? 'transparent' : fonsAvatar(u.color);
  setText('usuariNom', u.nom);
  const b = $('usuariBadge'); if (b) b.setAttribute('aria-label', `Jugues com a ${u.nom}. Canviar d'usuari`);
}
function obrirModalUsuaris() { renderitzarLlistaUsuaris(); obrirModal('modalUsuaris'); }
function renderitzarLlistaUsuaris() {
  const cont = $('usuarisLlista');
  cont.innerHTML = usuaris.length ? usuaris.map(it => {
    const d = it.dades || {};
    return `<div class="usuari-item${it.id === usuariActualId ? ' actiu' : ''}" data-usuari="${esc(it.id)}">
      <button type="button" class="usuari-tria" data-tria-usuari="${esc(it.id)}" style="display:flex;align-items:center;gap:.7rem;flex:1;min-width:0;text-align:left;min-height:3rem" ${it.id === usuariActualId ? 'aria-current="true"' : ''}>
        <span class="av" style="background:${it.foto ? 'transparent' : fonsAvatar(it.color)}">${htmlAvatar(it)}</span>
        <span class="nom-u">${esc(it.nom)}<small>${d.totalPartides || 0} partides · ${(d.diesJugats || []).length} dies${it.id === usuariActualId ? ' · actiu' : ''}</small></span>
      </button>
      ${it.id === usuariActualId ? `<span class="etiqueta-actiu" aria-hidden="true">${ico('check')}</span>` : ''}
      <button type="button" class="accio-boto" data-editar="${esc(it.id)}" aria-label="Editar ${esc(it.nom)}">${ico('llapis')}</button>
      <button type="button" class="accio-boto" data-eliminar="${esc(it.id)}" aria-label="Eliminar ${esc(it.nom)}">${ico('paperera')}</button></div>`;
  }).join('') : '<div class="estat-buit"><p>Encara no hi ha cap persona. Afegeix-ne una per guardar el progrés de cadascú per separat.</p></div>';
  mostra('btnConvidat', usuariActualId !== 'convidat', 'flex');
  setText('modalUsuarisText', usuariActualId === 'convidat' ? 'Ara jugues com a convidat. El progrés es guarda en aquest dispositiu.' : 'Tria amb quina persona vols jugar.');
}
document.addEventListener('click', e => {
  const cont = $('usuarisLlista'); if (!cont || !cont.contains(e.target)) return;
  const ed = e.target.closest('[data-editar]'), el = e.target.closest('[data-eliminar]'), it = e.target.closest('[data-tria-usuari]');
  if (ed) editarUsuari(ed.dataset.editar);
  else if (el) eliminarUsuari(el.dataset.eliminar);
  else if (it) canviarUsuari(it.dataset.triaUsuari);
});
function canviarUsuari(id) {
  soClic(); usuariActualId = id; guardarUsuaris();
  refrescarTot(); tancarModal('modalUsuaris'); toast('Ara juga ' + getUsuariActual().nom);
}
function eliminarUsuari(id) {
  const u = usuaris.find(x => x.id === id); if (!u) return;
  mostrarConfirmacio(`Eliminar ${u.nom}?`, `Es perdran el progrés, les fotos i les notes de ${u.nom}. Si vols conservar-les, primer pots fer una còpia de seguretat a Configuració → Dades i privadesa.`, () => {
    treuUsuari(id); toast('Persona eliminada');
  }, { boto: 'Sí, eliminar' });
}
function obrirFormulariUsuari(id) {
  const u = id ? usuaris.find(x => x.id === id) : null;
  editantUsuariId = u ? u.id : null;
  colorSeleccionat = u ? (u.color || COLORS_AVATAR[0]) : aleatoriUI(COLORS_AVATAR);
  avatarSeleccionat = u ? (u.avatar || 'inicial') : 'inicial';
  fotoPerfilTemp = u ? u.foto || null : null;
  $('inputNomUsuari').value = u ? u.nom : '';
  setText('nouUsuariTitol', u ? 'Editar perfil' : 'Nova persona');
  setText('botoGuardarUsuari', u ? 'Guardar els canvis' : 'Crear');
  renderitzarColors(); renderitzarAvatars(); actualitzarVistaFotoPerfil();
  tancarModal('modalUsuaris'); obrirModal('modalNouUsuari', false);
}
const editarUsuari = id => obrirFormulariUsuari(id);
const obrirModalNouUsuari = () => { soClic(); obrirFormulariUsuari(null); };
MODAL_TANCA.modalNouUsuari = () => { editantUsuariId = null; fotoPerfilTemp = null; };
function jugarComConvidat() { canviarUsuari('convidat'); }
function renderitzarColors() {
  const g = $('colorsGrid'); if (!g) return;
  g.innerHTML = COLORS_AVATAR.map(c => `<button type="button" role="radio" aria-checked="${c === colorSeleccionat}" class="color-opcio${c === colorSeleccionat ? ' sel' : ''}" data-color="${c}" style="background:${c}" aria-label="Color ${COLORS_AVATAR.indexOf(c) + 1}"></button>`).join('');
}
function renderitzarAvatars() {
  const g = $('avatarsGrid'); if (!g) return;
  g.innerHTML = AVATARS.map(a => `<button type="button" role="radio" aria-checked="${a === avatarSeleccionat}" class="avatar-opcio${a === avatarSeleccionat ? ' sel' : ''}" data-avatar="${a}" aria-label="${a === 'inicial' ? 'La meva inicial' : 'Icona ' + a}">${a === 'inicial' ? esc(inicialNom($('inputNomUsuari').value)) : ico(a)}</button>`).join('');
}
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('[data-color]');
  if (c) { colorSeleccionat = c.dataset.color; renderitzarColors(); actualitzarVistaFotoPerfil(); soClic(); return; }
  const a = e.target.closest && e.target.closest('[data-avatar]');
  if (a) { avatarSeleccionat = a.dataset.avatar; fotoPerfilTemp = null; renderitzarAvatars(); actualitzarVistaFotoPerfil(); soClic(); }
});
// Redimensiona una imatge a un quadrat o a una amplada màxima i la retorna com a JPEG (dataURL)
function comprimirImatge(fitxer, { costat, ampladaMax, qualitat = 0.8 }, callback) {
  const lector = new FileReader();
  lector.onerror = () => callback(null);
  lector.onload = ev => {
    const img = new Image();
    img.onerror = () => callback(null);
    img.onload = () => {
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      if (costat) {
        const m = Math.min(img.width, img.height);
        canvas.width = canvas.height = costat;
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, costat, costat);
      } else {
        const k = Math.min(1, ampladaMax / img.width);
        canvas.width = Math.round(img.width * k); canvas.height = Math.round(img.height * k);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      callback(canvas.toDataURL('image/jpeg', qualitat));
    };
    img.src = ev.target.result;
  };
  lector.readAsDataURL(fitxer);
}
function carregarFotoPerfil(ev) {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  comprimirImatge(f, { costat: 200 }, url => {
    if (!url) { toast('No s\'ha pogut llegir la imatge. Prova amb una altra foto.', 4000, 'error'); return; }
    fotoPerfilTemp = url; actualitzarVistaFotoPerfil(); soVictoria();
  });
}
function actualitzarVistaFotoPerfil() {
  const img = $('fotoPerfilImg'), ph = $('fotoPerfilPlaceholder'); if (!img || !ph) return;
  img.style.display = fotoPerfilTemp ? 'block' : 'none';
  ph.style.display = fotoPerfilTemp ? 'none' : 'flex';
  if (fotoPerfilTemp) img.src = fotoPerfilTemp;
  else { ph.innerHTML = avatarSeleccionat !== 'inicial' ? ico(avatarSeleccionat) : esc(inicialNom($('inputNomUsuari').value)); ph.style.background = fonsAvatar(colorSeleccionat); }
  const a0 = document.querySelector('[data-avatar="inicial"]'); if (a0) a0.textContent = inicialNom($('inputNomUsuari').value);
}
function guardarUsuari() {
  const nom = $('inputNomUsuari').value.trim();
  if (!nom) { toast('Escriu un nom per continuar'); $('inputNomUsuari').focus(); return; }
  if (editantUsuariId) {
    editarUsuariDades(editantUsuariId, { nom, color: colorSeleccionat, foto: fotoPerfilTemp, avatar: avatarSeleccionat });
  } else {
    afegirUsuari({ nom, color: colorSeleccionat, foto: fotoPerfilTemp, avatar: avatarSeleccionat });
  }
  soVictoria();
  tancarModal('modalNouUsuari');
}

// (L'onboarding és a js/13-onboarding.js)


// ==========================================================
// 9. CATÀLEG DE JOCS (font única: noms, icones, dominis, menús)
// ==========================================================
const CATEGORIES = [
  { id: 'cognitiva', titol: 'Estimulació cognitiva' },
  { id: 'memoria', titol: 'Jocs de memòria' },
  { id: 'taula', titol: 'Jocs de taula' },
  { id: 'cultura', titol: 'Paraules i cultura' }
];
const NOMS_DOMINI = { memoria: 'Memòria', atencio: 'Atenció', llenguatge: 'Llenguatge', calcul: 'Càlcul', logica: 'Lògica' };
const ICONA_DOMINI = { memoria: 'cartes', atencio: 'diana', llenguatge: 'xat', calcul: 'calcul', logica: 'logica' };
const DOMINIS = Object.keys(NOMS_DOMINI);
const CATALEG_JOCS = [
  { id: 'nback', nom: 'Recorda la lletra', tecnic: 'N-back', cat: 'cognitiva', domini: 'memoria', min: 3, desc: 'Recorda la lletra de fa uns instants' },
  { id: 'stroop', nom: 'Colors i paraules', tecnic: 'Stroop', cat: 'cognitiva', domini: 'atencio', min: 4, desc: 'Toca el color de la tinta, no el de la paraula' },
  { id: 'span', nom: 'Quants en recordes?', tecnic: 'Span de dígits', cat: 'cognitiva', domini: 'memoria', min: 3, desc: 'Memoritza i repeteix números' },
  { id: 'fluidesa', nom: 'Digues paraules', tecnic: 'Fluïdesa verbal', cat: 'cognitiva', domini: 'llenguatge', min: 2, desc: 'Digues paraules d\'una categoria en 60 segons' },
  { id: 'calcul', nom: 'Comptes de cada dia', tecnic: 'Càlcul mental', cat: 'cognitiva', domini: 'calcul', min: 5, desc: 'Comptes del dia a dia' },
  { id: 'seqlog', nom: 'Quin número falta?', tecnic: 'Seqüències lògiques', cat: 'cognitiva', domini: 'logica', min: 4, desc: 'Descobreix el número que falta' },
  { id: 'quefalta', nom: 'Què falta aquí?', tecnic: 'Memòria visual', cat: 'cognitiva', domini: 'memoria', min: 3, desc: 'Memòria visual' },
  { id: 'sudoku', nom: 'Sudoku', cat: 'cognitiva', domini: 'logica', min: 7, desc: 'Completa la graella sense repetir números' },
  { id: 'memory', nom: 'Troba les parelles', tecnic: 'Memory', cat: 'memoria', domini: 'memoria', min: 5, desc: 'Troba les cartes iguals', dos: { nom: 'Memory', desc: 'Qui fa més parelles guanya' } },
  { id: 'sequencia', nom: 'Recorda la seqüència', tecnic: 'Seqüència de colors', cat: 'memoria', domini: 'memoria', min: 3, desc: 'Repeteix el patró de colors', dos: { nom: 'Recorda la seqüència', desc: 'Torns alterns' } },
  { id: 'sopa', nom: 'Sopa de lletres', tecnic: 'Cerca visual', cat: 'memoria', domini: 'atencio', min: 6, desc: 'Troba les paraules amagades' },
  { id: 'domino', nom: 'Dòmino', cat: 'taula', domini: 'logica', min: 10, desc: 'Contra l\'ordinador', dos: { nom: 'Dòmino', desc: 'Dos jugadors humans' } },
  { id: 'dames', nom: 'Dames', cat: 'taula', domini: 'logica', min: 10, desc: 'Contra l\'ordinador', dos: { nom: 'Dames', desc: 'Blanques contra negres' } },
  { id: 'bingo', nom: 'Bingo', cat: 'taula', domini: 'atencio', min: 8, desc: 'Línia i bingo, amb rivals', dos: { nom: 'Bingo', desc: 'Qui fa línia primer guanya' } },
  { id: 'tertulia', nom: 'La Tertúlia', cat: 'cultura', domini: 'memoria', min: 5, desc: 'Cultura general', dos: { nom: 'La Tertúlia', desc: 'Qui encerta més guanya' } },
  { id: 'refranys', nom: 'Refranys populars', cat: 'cultura', domini: 'llenguatge', min: 4, desc: 'Completa les dites', dos: { nom: 'Refranys', desc: 'Qui encerta més guanya' } },
  { id: 'paraules', nom: 'Endevina la paraula', tecnic: 'Penjat amb pistes', cat: 'cultura', domini: 'llenguatge', min: 5, desc: 'Endevina la paraula amb pistes', dos: { nom: 'Paraules', desc: 'Qui encerta més guanya' } }
];
const infoJoc = id => CATALEG_JOCS.find(j => j.id === id);
const nomJoc = id => (infoJoc(id) || { nom: id }).nom;                                   // nom humà (Mode Persona)
const nomTecnicJoc = id => { const j = infoJoc(id); return !j ? id : (j.tecnic && j.tecnic !== j.nom ? `${j.nom} (${j.tecnic})` : j.nom); };   // nom per al cuidador
const dominiJoc = id => (infoJoc(id) || {}).domini || 'memoria';
const iconaJoc = id => infoJoc(id) ? 'j-' + id : 'cartes';
const jocsIndividuals = () => CATALEG_JOCS.filter(j => !j.nomesDos);

function htmlEstrelles(n, classe = 'star-mini') { return `<span class="nomes-lector">${n} de 3 estrelles</span>` + [1, 2, 3].map(i => `<span class="${classe}${i <= n ? ' activa' : ''}" aria-hidden="true"></span>`).join(''); }
let filtreDomini = 'tots';
function renderFiltreDominis() {
  const f = $('filtreDominis'); if (!f) return;
  f.innerHTML = [['tots', 'Tots']].concat(DOMINIS.map(d => [d, NOMS_DOMINI[d]])).map(([id, nom]) => `<button type="button" aria-pressed="${filtreDomini === id}" data-filtre="${id}">${nom}</button>`).join('');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-filtre]'); if (b) { filtreDomini = b.dataset.filtre; soClic(); renderMenuJocs(); } });
function renderMenuJocs() {
  const targeta = (j, dos) => {
    const nom = j.nom, desc = dos ? j.dos.desc : j.desc;
    return `<button type="button" class="targeta dom-${j.domini}" data-joc="${j.id}" data-dos="${dos ? 1 : 0}">
      <span class="targeta-ico">${ico(iconaJoc(j.id))}</span>
      <span class="info"><strong>${esc(nom)}</strong><small>${esc(desc)}</small><span class="meta-joc"><span class="xip dom">${NOMS_DOMINI[j.domini]}</span><span class="xip">${j.min} min</span></span></span>
      ${dos ? '' : `<span class="estrelles-mini">${htmlEstrelles(obtenirEstrelles(j.id))}</span>`}
      ${ico('fletxa', 'fletxa')}</button>`;
  };
  const llista = dos => {
    const html = CATEGORIES.map(c => {
      const jocs = CATALEG_JOCS.filter(j => j.cat === c.id && (dos ? j.dos : !j.nomesDos) && (dos || filtreDomini === 'tots' || j.domini === filtreDomini));
      return jocs.length ? `<h2 class="titol-seccio">${c.titol}</h2><div class="llista-targetes">${jocs.map(j => targeta(j, dos)).join('')}</div>` : '';
    }).join('');
    return html || '<div class="estat-buit"><p>No hi ha cap joc d\'aquest tipus.</p></div>';
  };
  const m1 = $('menuJocsLlista'), m2 = $('menu2vs2Llista');
  if (m1) m1.innerHTML = llista(false);
  if (m2) m2.innerHTML = llista(true);
  renderFiltreDominis();
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-joc]'); if (t) obrirJoc(t.dataset.joc, t.dataset.dos === '1');
});

// ==========================================================
// 10. REGISTRE DE JOCS, NAVEGACIÓ (amb historial) I CAPÇALERA COMUNA
// ==========================================================
const JOCS = {};
function registrarJoc(def) { JOCS[def.id] = def; }

const PANTALLA_ENTRA = {};   // id de pantalla → funció que s'executa en entrar-hi
const NAV_PER_PANTALLA = {
  inici: 'inici', familia: 'inici', resumFamilia: 'inici', album: 'inici', missatgeria: 'inici', calFamiliar: 'inici',
  menuJocs: 'menuJocs', menu2vs2: 'menuJocs', testCognitiu: 'menuJocs',
  configuracio: 'configuracio', privadesa: 'configuracio', condicions: 'configuracio', sobre: 'configuracio', feedback: 'configuracio'
};
let _ignoraHash = false, _navProfunditat = 0;
const idPantallaActiva = () => (document.querySelector('.screen.active') || {}).id;
function mostrarPantalla(id, opcions = {}) {
  if (!$(id)) return;
  const anterior = document.querySelector('.screen.active');
  if (anterior && anterior.id !== id && anterior.id.startsWith('joc-')) { if (partidaEnCurs()) registraAbandonament(); aturaTimers(); aturarVeu(); enPausa = false; anterior.classList.remove('en-pausa'); }
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('jugant', id.startsWith('joc-')); document.body.dataset.pantalla = id;
  const nav = NAV_PER_PANTALLA[id] || null;
  document.querySelectorAll('.bottom-nav-item').forEach(it => { const on = it.dataset.screen === nav; it.classList.toggle('actiu', on); if (on) it.setAttribute('aria-current', 'page'); else it.removeAttribute('aria-current'); });
  if (PANTALLA_ENTRA[id]) PANTALLA_ENTRA[id]();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (!opcions.senseHash) {
    const h = '#/' + id;
    if (location.hash !== h) { _ignoraHash = true; _navProfunditat++; try { location.hash = h; } catch (e) { _ignoraHash = false; } }
  }
  if (!opcions.senseFocus) { const t = document.querySelector('#' + id + ' h1'); if (t && document.body.classList.contains('arrencat')) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
  // Les modals no han de quedar oberts en canviar de pantalla
  document.querySelectorAll('.modal-fons.actiu').forEach(m => { if (!['modalConfirm', 'modalFi', 'modalPausa', 'modalDificultat'].includes(m.id)) tancarModal(m.id); });
}
window.addEventListener('hashchange', () => {
  if (_ignoraHash) { _ignoraHash = false; return; }
  const id = (location.hash || '').replace(/^#\/?/, ''), actual = idPantallaActiva();
  if (_navProfunditat > 0) _navProfunditat--;
  if (!id || !$(id) || id.startsWith('joc-')) { if (actual && actual.startsWith('joc-')) { sortirDeJocPerHistorial('inici'); return; } mostrarPantalla('inici', { senseHash: true }); return; }
  if (actual && actual.startsWith('joc-') && !partidaAcabada) { sortirDeJocPerHistorial(id); return; }
  mostrarPantalla(id, { senseHash: true });
});
// Si l'usuari prem «enrere» a mig joc, no es perd la partida sense preguntar
function sortirDeJocPerHistorial(destiId) {
  const actual = idPantallaActiva();
  if (partidaAcabada) { mostrarPantalla(destiId, { senseHash: true }); return; }
  _ignoraHash = true; _navProfunditat++; location.hash = '#/' + actual;
  mostrarConfirmacio('Sortir del joc?', 'Si surts ara perdràs la partida que tens començada.', () => { mostrarPantalla($(destiId) ? destiId : 'inici'); }, { boto: 'Sí, sortir', cancela: 'Continuar jugant' });
}
function tornarEnrere() { if (_navProfunditat > 0 && history.length > 1) history.back(); else anarAInici(); }
function navAnar(id) {
  soClic();
  if (id === 'inici') anarAInici();
  else if (id === 'menuJocs') triaIndividual();
  else mostrarPantalla(id);
}
function anarAInici() { soClic(); mostrarPantalla('inici'); }
function triaIndividual() { soClic(); modeActual = 'individual'; renderMenuJocs(); mostrarPantalla('menuJocs'); }
function triaDosJugadors() { modeActual = '2vs2'; renderMenuJocs(); mostrarPantalla('menu2vs2'); }
function tornarMenuActual() { soClic(); mostrarPantalla(modeActual === '2vs2' ? 'menu2vs2' : 'menuJocs'); }
function intentarSortir(forcat) {
  const p = document.querySelector('.screen.active');
  if (forcat === true || partidaAcabada || !p || !p.id.startsWith('joc-') || !partidaEnCurs()) { tornarMenuActual(); return; }
  mostrarConfirmacio('Sortir del joc?', 'Si surts ara perdràs la partida que tens començada.', tornarMenuActual, { boto: 'Sí, sortir', cancela: 'Continuar jugant' });
}
// Una partida «en curs» és la que ja ha començat de debò (hi ha hagut alguna interacció després d'obrir-la)
let _partidaIniciada = false;
const partidaEnCurs = () => _partidaIniciada && !partidaAcabada;
document.addEventListener('pointerdown', e => { if (enJoc() && e.target.closest('.joc-cos') && !partidaAcabada) _partidaIniciada = true; }, true);
document.addEventListener('keydown', e => { if (enJoc() && !['Tab', 'Escape'].includes(e.key) && !partidaAcabada) _partidaIniciada = true; }, true);

// Mètriques de la partida en curs per a l'Espai del Cuidador
let _trPartida = [], _pausesPartida = 0, _ajudesPartida = 0, _horaPartida = '';
function iniciPartida() { _tsPartida = ara(); partidaAcabada = false; _partidaIniciada = false; _trPartida = []; _pausesPartida = 0; _ajudesPartida = 0; if (typeof elefantPartidaNova === 'function') elefantPartidaNova(); const d = new Date(); _horaPartida = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
// Temps de reacció (ms) d'una resposta; els jocs que tenen respostes puntuals el criden. Es descarten valors absurds.
function registraTR(ms) { if (ms >= 150 && ms <= 30000) _trPartida.push(Math.round(ms)); }
const registraAjuda = () => { _ajudesPartida++; };
function estadistiquesTR(v) {
  if (v.length < 3) return {};
  const m = mitjana(v), o = [...v].sort((a, b) => a - b), med = o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2;
  const sd = Math.sqrt(mitjana(v.map(x => (x - m) ** 2)));
  return { tempsReaccioMitja: Math.round(m), tempsReaccioMediana: Math.round(med), variabilitatTR: m ? Math.round(sd / m * 100) / 100 : null };
}
// Una partida que s'abandona (surts a mig joc) es guarda a part: no compta als resultats però sí a la constància
function registraAbandonament() {
  if (modeActual !== 'individual' || !jocActualId || modeLectura) return;
  const durada = Math.round((ara() - _tsPartida) / 1000); if (durada < 10) return;
  const d = dadesActuals(); d.abandonaments = (d.abandonaments || []).concat([{ id: 'a_' + Date.now(), joc: jocActualId, data: avuiISO(), ts: Date.now(), durada, nivell: JOCS_AMB_NIVELL.includes(jocActualId) ? dificultatActual : null }]).slice(-500);
  guardarDadesUsuari(); if (typeof registrarUsAnonim === 'function') registrarUsAnonim('abandona', { joc: jocActualId, durada });
}
// Els fitxers dels jocs es carreguen només quan s'obren (primera càrrega més ràpida); el service worker els té tots a la memòria cau
const FITXERS_JOC = { tertulia: ['_quiz', 'tertulia'], refranys: ['_quiz', 'refranys'], calcul: ['_quiz', 'calcul'], seqlog: ['_quiz', 'seqlog'] };
const _scriptsCarregats = {};
function carregaScript(src) {
  return _scriptsCarregats[src] || (_scriptsCarregats[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete _scriptsCarregats[src]; rej(new Error(src)); }; document.head.appendChild(s);
  }));
}
async function assegurarJoc(id) {
  if (JOCS[id]) return true;
  try { for (const f of (FITXERS_JOC[id] || [id])) await carregaScript('js/2-jocs/' + f + '.js'); }
  catch (e) { toast("No s'ha pogut carregar el joc. Comprova la connexió i torna-ho a provar.", 5000, 'error'); return false; }
  return !!JOCS[id];
}
function obrirJoc(id, dos = false) {
  if (!JOCS[id]) { if (infoJoc(id)) assegurarJoc(id).then(ok => { if (ok) obrirJoc(id, dos); }); return; }
  const j = JOCS[id];
  soClic(); modeActual = dos ? '2vs2' : 'individual'; jocActualId = id;
  netejarErrors(); aturaTimers(); aturarVeu(); dificultatActual = 'mig'; iniciPartida();
  if (dos) j.obrir(true); else mostrarTutorial(id, () => j.obrir(false));
}
function reiniciarJocActual() {
  const j = JOCS[jocActualId]; if (!j) return;
  soClic(); netejarErrors(); aturaTimers(); aturarVeu(); iniciPartida(); enPausa = false;
  const p = $('joc-' + jocActualId); if (p) p.classList.remove('en-pausa');
  try { j.reiniciar(); } catch (e) { console.error(e); }
}
// Obre un joc sense menú de dificultat: reinicia i mostra la pantalla
function obrirSenzill(id, reset) { return dos => { reset(dos); mostrarPantalla('joc-' + id); }; }

// --- Capçalera comuna de joc: sortir (ja a l'HTML) + ajuda + pausa + so ---
function muntaCapcaleresJoc() {
  document.querySelectorAll('.screen-joc .barra-joc').forEach(b => {
    if (b.querySelector('[data-accio="ajuda"]')) return;
    b.insertAdjacentHTML('beforeend',
      `<button type="button" class="ib" data-accio="ajuda" aria-label="Com es juga">${ico('pregunta')}</button>` +
      `<button type="button" class="ib" data-accio="pausa" aria-label="Pausa">${ico('pausa')}</button>` +
      `<button type="button" class="ib" data-accio="so" aria-pressed="true" aria-label="So activat">${ico('volum')}</button>`);
  });
  actualitzarBotoSo();
}
function actualitzarBotoSo() {
  document.querySelectorAll('[data-accio="so"]').forEach(b => {
    b.setAttribute('aria-pressed', !!ajustes.efectesSo); b.setAttribute('aria-label', ajustes.efectesSo ? 'So activat. Toca per silenciar' : 'So silenciat. Toca per activar');
    b.innerHTML = ico(ajustes.efectesSo ? 'volum' : 'so-off');
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-accio]'); if (!b) return;
  const a = b.dataset.accio;
  if (a === 'ajuda') { registraAjuda(); mostrarTutorial(jocActualId, null, true); }
  else if (a === 'pausa') pausarJoc();
  else if (a === 'so') { ajustes.efectesSo = !ajustes.efectesSo; guardarAjustes(); pintarToggles(); actualitzarBotoSo(); if (ajustes.efectesSo) soClic(); toast(ajustes.efectesSo ? 'So activat' : 'So silenciat', 1500); }
});
function pausarJoc() {
  if (!enJoc() || enPausa || partidaAcabada) return;
  pausaTimers(); aturarVeu(); _pausesPartida++; const p = $('joc-' + jocActualId); if (p) p.classList.add('en-pausa');
  mostra('pausaNivell', JOCS_AMB_NIVELL.includes(jocActualId) && !(modeActual === '2vs2'), 'flex');
  obrirModal('modalPausa', false);
}
function reprendreJoc() {
  tancarModal('modalPausa'); const p = $('joc-' + jocActualId); if (p) p.classList.remove('en-pausa'); reprenTimers();
}
// Si es canvia de pestanya o es bloqueja el telèfon a mig joc, es posa en pausa
document.addEventListener('visibilitychange', () => { if (document.hidden && enJoc() && partidaEnCurs()) pausarJoc(); });

// --- Tutorials (cada joc porta el seu a la definició) ---
function mostrarTutorial(id, callback, forcat) {
  const vistos = lsGet('mentA_tutorials', {}), t = JOCS[id] && JOCS[id].tutorial;
  if ((!forcat && vistos[id]) || !t) { if (callback) callback(); return; }
  if (forcat) pausaTimers();
  $('tutorialIcona').innerHTML = ico(iconaJoc(id)); $('tutorialIcona').className = 'targeta-ico gran dom-' + dominiJoc(id); setText('tutorialTitol', t.titol);
  $('tutorialCos').innerHTML = t.cos;
  setText('tutorialOk', forcat ? 'Entesos' : 'Entesos, a jugar');
  _focusPrevi.push(document.activeElement);
  $('tutorialOverlay').classList.add('actiu'); _inertFons(true);
  setTimeout(() => $('tutorialOk').focus(), 40);
  window._tutorialCallback = forcat ? () => reprenTimers() : () => { vistos[id] = true; lsSet('mentA_tutorials', vistos); if (callback) callback(); };
}
function tancarTutorial() {
  soClic(); $('tutorialOverlay').classList.remove('actiu'); aturarVeu();
  if (!document.querySelector('.modal-fons.actiu')) _inertFons(false);
  const f = _focusPrevi.pop(); if (f && f.focus && document.contains(f)) f.focus({ preventScroll: true });
  const cb = window._tutorialCallback; window._tutorialCallback = null;
  if (cb) setTimeout(cb, 250);
}

// --- Selector de dificultat: manual (modal) o adaptatiu (nivell guardat per joc) ---
function mostrarModalDificultat(op, callback) {
  tancarModal('modalDificultat');
  const ic = $('dificultatIcona'); ic.innerHTML = ico(op.joc ? iconaJoc(op.joc) : 'diana'); ic.className = 'targeta-ico gran dom-' + dominiJoc(op.joc);
  setText('dificultatTitol', op.titol || 'Tria la dificultat'); setText('dificultatSubtitol', op.subtitol || '');
  const grid = $('dificultatGrid'); grid.innerHTML = '';
  op.llista.forEach((o, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dificultat-btn' + (o.recomanat ? ' recomanat' : '');
    b.innerHTML = `<span class="barres-nivell n${i + 1}" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="dif-text"><strong>${esc(o.nom)}</strong><small>${esc(o.descripcio)}</small></span>
      ${o.recomanat ? '<span class="badge-recomanat">Recomanat</span>' : ''}`;
    b.onclick = () => {
      soClic(); tancarModal('modalDificultat');
      if (op.joc) guardarNivellJoc(op.joc, o.id, true);
      setTimeout(() => callback(o.id), 150);
    };
    grid.appendChild(b);
  });
  setTimeout(() => obrirModal('modalDificultat', false), 150);
}
const NOMS_NIVELL = { facil: 'Fàcil', mig: 'Mig', dificil: 'Difícil' };
let _forcarManual = false;
function triaDificultat(joc, titol, subtitol, descripcions, callback) {
  const forcat = typeof duelNivellForcat === 'function' ? duelNivellForcat(joc) : null;
  if (forcat) { dificultatActual = forcat; callback(forcat); return; }
  const reco = nivellRecomanat(joc), manual = _forcarManual; _forcarManual = false;
  if (ajustes.dificultatMode === 'adaptatiu' && !manual) {
    dificultatActual = reco; guardarNivellJoc(joc, reco);
    toast(`Nivell ${NOMS_NIVELL[reco].toLowerCase()}, adaptat a tu. El pots canviar des de la pausa.`, 2200);
    callback(reco); return;
  }
  mostrarModalDificultat({
    joc, titol, subtitol,
    llista: ['facil', 'mig', 'dificil'].map((id, i) => ({ id, nom: NOMS_NIVELL[id], descripcio: descripcions[i], recomanat: reco === id }))
  }, nivell => { dificultatActual = nivell; callback(nivell); });
}
// Canvi de nivell des de la pausa o des de la pantalla final
function canviarNivellJoc() {
  const j = JOCS[jocActualId]; if (!j || !JOCS_AMB_NIVELL.includes(jocActualId)) return;
  tancarModal('modalPausa'); reprenTimers(); aturaTimers(); iniciPartida(); _forcarManual = true;
  j.obrir(false);
}

// ==========================================================
// 11. FLUX COMÚ DE PARTIDA: sessions, estrelles, dificultat adaptativa, pantalla final
// ==========================================================
function guardarError(pregunta, correcte, donada) { errorsActuals.push({ pregunta, correcte, donada }); }
function netejarErrors() { errorsActuals = []; }
function obrirRepas() {
  tancarModal('modalFi');
  $('repasCos').innerHTML = errorsActuals.length === 0
    ? '<p class="buit-text">No hi ha errors per repassar.</p>'
    : errorsActuals.map((e, i) => `<div class="repas-card"><div class="pregunta-r">${i + 1}. ${esc(e.pregunta)}</div>
        <div class="resposta-correcta">Correcte: ${esc(e.correcte)}</div>
        ${e.donada != null ? `<div class="la-teva-resposta">La teva resposta: ${esc(e.donada)}</div>` : ''}</div>`).join('');
  obrirModal('modalRepas', false);
}
MODAL_TANCA.modalRepas = () => { if (partidaAcabada && jocActualId) setTimeout(() => obrirModal('modalFi', false), 120); };

function calcularEstrelles(pct, esRecord) {
  if (pct >= 90 || (esRecord && pct >= 70)) return 3;
  if (pct >= 70) return 2;
  return pct >= 40 ? 1 : 0;
}
function guardarEstrelles(joc, n) {
  const d = dadesActuals();
  d.estrelles = d.estrelles || {};
  if (n > (d.estrelles[joc] || 0)) { d.estrelles[joc] = n; guardarDadesUsuari(); }
}
const obtenirEstrelles = joc => (dadesActuals().estrelles || {})[joc] || 0;
const sessionsJoc = (d, joc) => (d.historial || []).filter(h => h.joc === joc);

// meta (opcional): { pct, puntuacio, resultat }. Si no hi és, pct = encerts/(encerts+errors).
function registrarPartida(joc, encerts, errors, meta = {}) {
  const d = dadesActuals(), domini = dominiJoc(joc);
  const total = encerts + errors, pct = meta.pct != null ? clamp(Math.round(meta.pct), 0, 100) : (total > 0 ? Math.round(encerts / total * 100) : 0);
  const durada = Math.max(1, Math.round((ara() - _tsPartida) / 1000));
  const sessio = Object.assign({ id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1e4), usuari: getUsuariActual().id, data: avuiISO(), ts: Date.now(), horaInici: _horaPartida, joc, domini, nivell: JOCS_AMB_NIVELL.includes(joc) ? dificultatActual : null, mode: 'individual', encerts, errors, pct, puntuacio: meta.puntuacio != null ? Math.round(meta.puntuacio) : encerts * 10, durada: Math.min(durada, 3600), adaptatiu: ajustes.dificultatMode === 'adaptatiu', abandonada: false, ajudesUsades: _ajudesPartida, pausesFetes: _pausesPartida, pistes: (typeof Pistes !== 'undefined' ? Pistes.resum() : null) || undefined }, estadistiquesTR(_trPartida));
  if (meta.resultat) sessio.resultat = meta.resultat;
  const p = d.partides[joc] = d.partides[joc] || { jugades: 0, encerts: 0, errors: 0, millor: 0 };
  p.jugades++; p.encerts += encerts; p.errors += errors;
  if (pct > p.millor) p.millor = pct;
  d.totalPartides++; d.totalEncerts += encerts; d.totalErrors += errors;
  if (encerts > d.millorRatxa) d.millorRatxa = encerts;
  d.historial.push(sessio);
  if (d.historial.length > 5000) d.historial = d.historial.slice(-5000);
  const dom = d.dominis[domini] = d.dominis[domini] || { encerts: 0, errors: 0 };
  dom.encerts += encerts; dom.errors += errors;
  registrarDiaJugat();
  guardarDadesUsuari();
  if (typeof registrarUsAnonim === 'function') registrarUsAnonim('partida', { joc, pct, durada: sessio.durada, nivell: sessio.nivell });
  comprovarMedalles();
  return sessio;
}
let _ultimaSessio = null;
function finalitzarPartida(joc, encerts, errors, missatgeExtra, meta = {}) {
  partidaAcabada = true;
  if (typeof duelFiTorn === 'function' && duelFiTorn(joc, encerts, errors, meta)) return;
  const abans = sessionsJoc(dadesActuals(), joc).slice(-1)[0] || null;
  const millorAbans = Math.max(0, ...sessionsJoc(dadesActuals(), joc).map(h => h.pct));
  const millorPuntsAbans = Math.max(0, ...sessionsJoc(dadesActuals(), joc).map(h => h.puntuacio || 0));
  const s = registrarPartida(joc, encerts, errors, meta);
  const esRecord = s.pct > millorAbans && s.pct > 0 && !!abans;
  const estrelles = calcularEstrelles(s.pct, esRecord);
  guardarEstrelles(joc, estrelles);
  _ultimaSessio = { s, abans, esRecord, esRecordPunts: s.puntuacio > millorPuntsAbans && !!abans && s.puntuacio > 0, estrelles, extra: missatgeExtra || '' };
  setTimeout(() => {
    if (!partidaAcabada || jocActualId !== joc) return;
    mostrarModalFinal(_ultimaSessio);
    if (estrelles >= 2) { soVictoria(); celebracioCompleta(innerWidth / 2, innerHeight / 3); }
  }, 600);
  if (typeof comprovarEnquesta === 'function') comprovarEnquesta();
}

// --- Dificultat adaptativa: puja o baixa segons resultat i temps de les últimes partides al mateix nivell ---
const JOCS_AMB_NIVELL = ['nback', 'memory', 'domino', 'dames', 'sopa', 'sudoku'];
const ORDRE_NIVELLS = ['facil', 'mig', 'dificil'];
function nivellGuardat(joc) {
  const n = (dadesActuals().nivells || {})[joc], max = ORDRE_NIVELLS.indexOf((dadesActuals().plaCuidador || {}).nivellMaxim || 'dificil');
  return ORDRE_NIVELLS[Math.min(ORDRE_NIVELLS.indexOf((n && n.actual) || 'facil'), max < 0 ? 2 : max)];
}
// Ajust silenciós de la dificultat (Mode Persona): puja o baixa sense preguntar ni parlar de fracàs
function autoNivell(joc) {
  if (ajustes.dificultatMode !== 'adaptatiu' || !JOCS_AMB_NIVELL.includes(joc)) return;
  const a = analitzarNivell(joc); if (a) guardarNivellJoc(joc, a.a);
}
function guardarNivellJoc(joc, nivell, manual) {
  const d = dadesActuals(); d.nivells = d.nivells || {};
  const n = d.nivells[joc] = d.nivells[joc] || { actual: nivell, canvis: [] };
  if (n.actual !== nivell) { n.canvis.push({ data: avuiISO(), de: n.actual, a: nivell, manual: !!manual }); n.canvis = n.canvis.slice(-30); }
  n.actual = nivell; d.nivellsOptims = d.nivellsOptims || {}; d.nivellsOptims[joc] = nivell; guardarDadesUsuari();
}
function analitzarNivell(joc) {
  const nivell = nivellGuardat(joc);
  const recents = sessionsJoc(dadesActuals(), joc).filter(h => h.nivell === nivell).slice(-3);
  if (recents.length < 2) return null;
  const pcts = recents.map(h => h.pct), m = mitjana(pcts);
  const dur = recents.map(h => h.durada).filter(Boolean), durAnt = sessionsJoc(dadesActuals(), joc).filter(h => h.nivell === nivell).slice(-8, -3).map(h => h.durada).filter(Boolean);
  const mesLent = dur.length && durAnt.length && mitjana(dur) > mitjana(durAnt) * 1.4;
  if (m >= 85 && pcts.every(p => p >= 75) && !mesLent && nivell !== 'dificil') return { dir: 'puja', a: ORDRE_NIVELLS[ORDRE_NIVELLS.indexOf(nivell) + 1], text: 'Ho estàs fent molt bé: provem un nivell més?' };
  if (m <= 50 && pcts.filter(p => p <= 50).length >= 2 && nivell !== 'facil') return { dir: 'baixa', a: ORDRE_NIVELLS[ORDRE_NIVELLS.indexOf(nivell) - 1], text: 'Aquest nivell et costa una mica: vols provar-ne un de més tranquil?' };
  return null;
}
function nivellRecomanat(joc) { return nivellGuardat(joc); }
function acceptaCanviNivell(joc, nou) { guardarNivellJoc(joc, nou, true); tancarModal('modalFi'); toast('Nivell ' + NOMS_NIVELL[nou].toLowerCase()); const j = JOCS[joc]; if (j) { jocActualId = joc; iniciPartida(); j.obrir(false); } }

// --- Joc recomanat: el de més variació (domini menys treballat aquesta setmana), sense repetir el que acabes de jugar ---
function jocRecomanat(excloure) {
  const d = dadesActuals(), setmana = d.historial.filter(h => h.data >= dataMenys(7)), cnt = {};
  setmana.forEach(h => { cnt[h.domini] = (cnt[h.domini] || 0) + 1; });
  const jugatsAvui = new Set(d.historial.filter(h => h.data === avuiISO()).map(h => h.joc));
  const candidats = jocsIndividuals().filter(j => j.id !== excloure);
  if (!d.totalPartides) return { joc: 'memory', motiu: 'Un bon joc per començar' };
  candidats.sort((a, b) => (jugatsAvui.has(a.id) - jugatsAvui.has(b.id)) || ((cnt[a.domini] || 0) - (cnt[b.domini] || 0)) || (sessionsJoc(d, a.id).length - sessionsJoc(d, b.id).length));
  const j = candidats[0], n = cnt[j.domini] || 0;
  return { joc: j.id, motiu: n === 0 ? `Aquesta setmana no has treballat ${NOMS_DOMINI[j.domini].toLowerCase()}` : `Per variar: ${NOMS_DOMINI[j.domini].toLowerCase()}` };
}

function mostrarModalFinal(r) {
  const { s, abans, esRecord, estrelles } = r, joc = s.joc;
  autoNivell(joc);
  if (typeof sessioGuiadaFi === 'function' && sessioGuiadaFi(r)) return;          // dins d'una sessió guiada: pantalla de descans
  const titols = ['Gràcies per jugar!', 'Bona feina!', 'Molt bé!', 'Excel·lent!'];
  setText('fiTitol', titols[estrelles]); setText('fiJoc', nomJoc(joc));
  const est = document.querySelectorAll('#starsContainer .star-big');
  est.forEach(x => x.classList.remove('activa', 'activa-1', 'activa-2', 'activa-3'));
  setTimeout(() => { for (let i = 0; i < estrelles; i++) setTimeout(() => { est[i].classList.add('activa'); soEstrella(); }, i * 300); }, 250);
  const frase = esRecord ? 'Has fet la teva millor partida!' : (abans && s.pct > abans.pct ? 'Ho has fet millor que l\'última vegada.' : estrelles >= 2 ? 'Ho has fet molt bé.' : 'Cada partida et fa treballar la ment.');
  $('puntuacioFinal').innerHTML = `<p class="fi-frase"><span class="nomes-lector">${estrelles} de 3 estrelles. </span>${frase}</p>`;
  $('fiDetalls').innerHTML = ''; $('fiAdaptatiu').hidden = true;
  const seg = jocRecomanat(joc);
  const b = $('fiSeguent'); b.innerHTML = `${ico('play')}Un altre joc: ${esc(nomJoc(seg.joc))}`; b.dataset.joc = seg.joc;
  const rb = $('btnRepasarErrores'); rb.style.display = errorsActuals.length ? 'flex' : 'none';
  rb.textContent = `Veure què he fallat (${errorsActuals.length})`;
  obrirModal('modalFi', false);
  if (typeof elefantFiPartida === 'function') elefantFiPartida({ esRecord, estrelles, pct: s.pct });
}
function fiTornarAJugar() { tancarModal('modalFi'); reiniciarJocActual(); }
function fiSeguentJoc() { const id = $('fiSeguent').dataset.joc; tancarModal('modalFi'); if (id) obrirJoc(id); }
function fiVeureProgres() { tancarModal('modalFi'); obrirComVaig(); }
function fiMenu() { tancarModal('modalFi'); anarAInici(); }

// ==========================================================
// 12. UTILITATS COMUNES DELS JOCS
// ==========================================================
function iniciTemps() { tempsIniciPregunta = ara(); if (partidaAcabada) iniciPartida(); }
const getTempsResposta = () => ((ara() - tempsIniciPregunta) / 1000).toFixed(1);
function compararTemps(joc, t) {
  const arr = tempsMitjaJoc[joc]; if (!arr || arr.length < 3) return null;
  const diff = arr.reduce((a, b) => a + b, 0) / arr.length - parseFloat(t);
  if (Math.abs(diff) < 0.3) return null;
  return diff > 0 ? `${diff.toFixed(1)}s més ràpid que la teva mitjana` : `${(-diff).toFixed(1)}s més lent que la teva mitjana`;
}
function feedbackRics(joc, text, esCorrecte, extra) {
  const fb = $(joc + '-feedback'); if (!fb) return;
  const t = getTempsResposta(); registraTR(parseFloat(t) * 1000);
  // El temps de resposta es registra per al cuidador però no es mostra a la persona (res de números freds)
  fb.innerHTML = `${esCorrecte ? ico('check') : ico('tanca')} ${esc(text)}${extra ? `<span class="comparacio">${esc(extra)}</span>` : ''}`;
  fb.className = 'feedback ' + (esCorrecte ? 'correcte' : 'incorrecte');
  (tempsMitjaJoc[joc] = tempsMitjaJoc[joc] || []).push(parseFloat(t));
  if (tempsMitjaJoc[joc].length > 20) tempsMitjaJoc[joc].shift();
}
// Marcador i torns dels jocs de 2 jugadors
function renderMarcador2P(joc, p1, p2, torn) {
  const el = $(joc + '-marcador-2v2'); if (!el) return;
  if (torn == null) { el.innerHTML = ''; return; }
  const item = (n, p) => `<div class="marcador-item j${n}${torn === n ? ' actiu' : ''}"><div class="nom-j">${esc(nomsParella('Jugador ' + n))}${torn === n ? ' · el seu torn' : ''}</div><div class="punt">${p}</div></div>`;
  el.innerHTML = `<div class="marcador" aria-live="polite">${item(1, p1)}${item(2, p2)}</div>`;
}
function textGuanyador2P(a, b) {
  if (a > b) return `Guanya el Jugador 1 (${a}-${b})`;
  if (b > a) return `Guanya el Jugador 2 (${b}-${a})`;
  return `Empat (${a}-${b})`;
}
function finalPartida2P(missatge) { partidaAcabada = true; soVictoria(); celebracioCompleta(); if (typeof parellaPartidaNativaFi === 'function') parellaPartidaNativaFi(missatge); return nomsParella(missatge); }
