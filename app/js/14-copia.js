'use strict';
// ==========================================================
//  MentA · CÒPIA DE SEGURETAT I PROTECCIÓ DE DADES LOCALS (v1.9)
//  Tot viu al navegador: si s'esborra, es perd. Aquí hi ha el recordatori amable de còpia, l'«Espai utilitzat»,
//  la importació segura (esquema, mida, resum, combinar o substituir, còpia automàtica prèvia i desfer) i la persistència.
//  La importació tracta el fitxer com a ENTRADA HOSTIL: res no s'aplica fins que passa totes les validacions.
// ==========================================================
const CLAU_COPIA = 'mentA_copiaInfo';              // { data, partides } de l'última còpia descarregada
const LIMITS_COPIA = { text: 25 * 1024 * 1024, claus: 300, valor: 8 * 1024 * 1024, usuaris: 500, profunditat: 24 };
const CLAUS_PERILLOSES = new Set(['__proto__', 'constructor', 'prototype']);
let _paquetPendent = null;

// ---------- IndexedDB mínima (per desar la còpia automàtica d'abans d'importar, que pot ser gran) ----------
function idbObre() {
  return new Promise((res, rej) => { try { const r = indexedDB.open('menta', 1); r.onupgradeneeded = () => r.result.createObjectStore('copies'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
}
async function idbDesa(k, v) { const db = await idbObre(); return new Promise((res, rej) => { const t = db.transaction('copies', 'readwrite'); t.objectStore('copies').put(v, k); t.oncomplete = () => { db.close(); res(true); }; t.onerror = () => { db.close(); rej(t.error); }; }); }
async function idbLlegeix(k) { const db = await idbObre(); return new Promise((res, rej) => { const q = db.transaction('copies').objectStore('copies').get(k); q.onsuccess = () => { db.close(); res(q.result); }; q.onerror = () => { db.close(); rej(q.error); }; }); }
async function idbEsborra(k) { const db = await idbObre(); return new Promise(res => { const t = db.transaction('copies', 'readwrite'); t.objectStore('copies').delete(k); t.oncomplete = () => { db.close(); res(true); }; }); }

// ---------- Paquet de dades ----------
function construeixPaquet() {
  const claus = {}; totesLesClaus().filter(k => !CLAUS_NO_EXPORTABLES.includes(k) && k !== CLAU_COPIA).forEach(k => { claus[k] = lsRawGet(k); });
  return { app: 'MentA', versio: VERSIO, schema: SCHEMA, exportat: new Date().toISOString(), claus };
}
const totalPartidesGuardades = () => usuaris.reduce((t, u) => t + ((u.dades && u.dades.totalPartides) || 0), 0) + ((_convidat.dades && _convidat.dades.totalPartides) || 0);
function copiaDesada() { try { lsSet(CLAU_COPIA, { data: avuiISO(), partides: totalPartidesGuardades() }); } catch (e) { /* res */ } renderRecordatoris && renderRecordatoris(); }

// ---------- Recordatori amable de còpia ----------
function copiaNecessaria() {
  const partides = totalPartidesGuardades(); if (partides < 5 || modeLectura) return null;
  const info = lsGet(CLAU_COPIA, null), cuida = ajustes.rol === 'residencia' || ajustes.rol === 'cuidat';
  const maxDies = cuida ? 14 : 30, maxPartides = cuida ? 25 : 40;
  if (!info) return { motiu: 'Encara no has fet cap còpia', urgent: cuida };
  const dies = Math.round((dataDeISO(avuiISO()) - dataDeISO(info.data)) / 86400000), noves = partides - (info.partides || 0);
  if (dies >= maxDies) return { motiu: `Fa ${dies} dies de l'última còpia`, urgent: cuida };
  if (noves >= maxPartides) return { motiu: `Hi ha ${noves} partides noves des de l'última còpia`, urgent: cuida };
  return null;
}
function htmlAvisCopia(clau) {
  const n = copiaNecessaria(); if (!n) return '';
  const text = (ELEF && ELEF.inst && presenciaActual() !== 'apagat' ? Dialegs.tria('copia_seguretat', {}) : 'Fem una còpia perquè no perdis res?');
  return `<div class="recordatori-card avis-copia${n.urgent ? ' urgent' : ''}" role="group" aria-label="Còpia de seguretat"><span class="recordatori-ico">${ico('descarregar')}</span><span class="text-r"><strong>${esc(text)}</strong><small>${esc(n.motiu)}. Es descarrega un fitxer.</small></span><button type="button" class="boto-principal boto-petit" onclick="exportarDades()">Fer la còpia</button></div>`;
}
(() => {
  const _r = renderRecordatoris; renderRecordatoris = function () { _r(); const c = $('recordatorisInici'); if (c) c.insertAdjacentHTML('afterbegin', htmlAvisCopia()); };
})();

// ---------- Espai utilitzat ----------
const kb = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB';
function mesuraEspai() {
  let tot = 0, fotos = 0, partides = 0; const claus = totesLesClaus();
  claus.forEach(k => {
    const v = lsRawGet(k) || '', mida = (k.length + v.length) * 2; tot += mida;
    if (k.startsWith('mentA_album_') || k === 'mentA_missatges') fotos += mida; else if (k === 'mentA_usuaris' || k === 'mentA_convidat') partides += mida;
  });
  return { tot, fotos, partides, claus: claus.length };
}
async function renderEspaiUtilitzat() {
  const c = $('espaiUtilitzat'); if (!c) return;
  const m = mesuraEspai(); let est = null, persistent = null;
  try { if (navigator.storage && navigator.storage.estimate) est = await navigator.storage.estimate(); if (navigator.storage && navigator.storage.persisted) persistent = await navigator.storage.persisted(); } catch (e) { /* sense accés */ }
  const limit = 5 * 1024 * 1024, pct = Math.min(100, Math.round(m.tot / limit * 100));      // el límit habitual de localStorage és d'uns 5 MB
  const nec = copiaNecessaria(), info = lsGet(CLAU_COPIA, null);
  c.innerHTML = `<div class="barra-espai" role="img" aria-label="Espai utilitzat: ${pct} per cent"><i style="width:${pct}%"></i></div>
    <p><strong>${kb(m.tot)}</strong> utilitzats d'uns 5 MB que permet el navegador (${pct} %). Partides i perfils: ${kb(m.partides)}. Fotos i missatges: ${kb(m.fotos)}.</p>
    ${pct >= 80 ? '<p class="avis-caixa"><span><strong>L\'espai s\'acaba.</strong> Fes una còpia i esborra fotos que ja no necessitis.</span></p>' : ''}
    <p class="ajuda-camp">Última còpia: ${info ? new Date(info.data + 'T12:00:00').toLocaleDateString(localeApp()) : 'cap'}${nec ? ' · convé fer-ne una' : ''}. ${persistent === true ? 'El navegador no esborrarà aquestes dades si va just d\'espai.' : persistent === false ? 'El navegador podria esborrar aquestes dades si va just d\'espai: fes còpies.' : ''}${est && est.quota ? ' Espai total disponible: ' + kb(est.quota) + '.' : ''}</p>`;
  const u = $('btnDesferImport'); if (u) { try { u.hidden = !(await idbLlegeix('copia-previa')); } catch (e) { u.hidden = true; } }
}
async function demanaPersistencia() {
  try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) { /* el navegador ho pot denegar */ }
}

// ---------- Exportar ----------
function exportarDades() {
  const paquet = construeixPaquet();
  baixaFitxer(`MentA-copia-${avuiISO()}.json`, JSON.stringify(paquet), 'application/json');
  copiaDesada(); demanaPersistencia();
  toast('Còpia de seguretat descarregada. Guarda-la en un lloc segur.', 4500, 'exit');
}

// ---------- Importar amb seguretat ----------
function profunditatOk(v, k) { return true; }
function validaPaquet(text) {
  if (typeof text !== 'string' || text.length > LIMITS_COPIA.text) return { error: 'El fitxer és massa gran per ser una còpia de MentA.' };
  let p; try { p = JSON.parse(text); } catch (e) { return { error: 'Aquest fitxer no és una còpia de MentA vàlida (no es pot llegir).' }; }
  if (!p || typeof p !== 'object' || Array.isArray(p) || p.app !== 'MentA') return { error: 'Aquest fitxer no és una còpia de MentA.' };
  if (!p.claus || typeof p.claus !== 'object' || Array.isArray(p.claus)) return { error: 'La còpia no té dades.' };
  const entrades = Object.entries(p.claus);
  if (!entrades.length || entrades.length > LIMITS_COPIA.claus) return { error: 'La còpia té un nombre d\'apartats que no és vàlid.' };
  if (p.schema != null && (!Number.isFinite(Number(p.schema)) || Number(p.schema) < 0)) return { error: 'La versió de la còpia no és vàlida.' };
  if (Number(p.schema) > SCHEMA) return { error: 'La còpia és d\'una versió més nova de MentA i no es pot importar.' };
  let total = 0; const claus = Object.create(null);
  for (const [k, v] of entrades) {
    if (!/^mentA_[A-Za-z0-9_.-]{1,80}$/.test(k) || /__proto__|constructor|prototype/.test(k) || CLAUS_NO_EXPORTABLES.includes(k)) return { error: 'La còpia té apartats que no són vàlids («' + String(k).slice(0, 30) + '»).' };
    if (typeof v !== 'string' || v.length > LIMITS_COPIA.valor) return { error: 'Un apartat de la còpia és massa gran o no és vàlid.' };
    total += v.length; if (total > LIMITS_COPIA.text) return { error: 'La còpia és massa gran.' };
    if (/^[\[{]/.test(v)) {                        // JSON: es llegeix refusant claus perilloses i estructures massa fondes
      let prof = 0; try { JSON.parse(v, (kk, x) => { if (CLAUS_PERILLOSES.has(kk)) throw new Error('clau'); if (++prof > 2e6) throw new Error('gran'); return x; }); } catch (e) { return { error: 'Un apartat de la còpia està malmès.' }; }
    } else if (v.length > 400) return { error: 'Un apartat de la còpia no té un format vàlid.' };
    claus[k] = v;
  }
  let usus = [];
  if (claus.mentA_usuaris) {
    try { usus = JSON.parse(claus.mentA_usuaris); } catch (e) { return { error: 'La llista de persones està malmesa.' }; }
    if (!Array.isArray(usus) || usus.length > LIMITS_COPIA.usuaris || !usus.every(u => u && typeof u === 'object' && typeof u.id === 'string' && u.id.length <= 80 && typeof u.nom === 'string' && u.nom.length <= 80 && u.dades && typeof u.dades === 'object')) return { error: 'La llista de persones de la còpia no té un format vàlid.' };
  }
  const partides = usus.reduce((t, u) => t + (Number(u.dades.totalPartides) || 0), 0);
  return { ok: true, p: { app: 'MentA', versio: String(p.versio || '').slice(0, 20), schema: Number(p.schema) || 1, exportat: p.exportat, claus }, resum: { persones: usus.length, partides, apartats: entrades.length, mides: total, data: p.exportat, noms: usus.slice(0, 6).map(u => u.nom) } };
}
function importarDades(ev) {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  if (f.size > LIMITS_COPIA.text) { toast('El fitxer és massa gran per ser una còpia de MentA.', 4500, 'error'); return; }
  const l = new FileReader();
  l.onerror = () => toast('No s\'ha pogut llegir el fitxer.', 4500, 'error');
  l.onload = () => importaText(l.result);
  l.readAsText(f);
}
function importaText(text) {
  const v = validaPaquet(text); if (!v.ok) { toast(v.error, 5500, 'error'); return false; }
  _paquetPendent = v.p; const r = v.resum, quan = r.data ? new Date(r.data).toLocaleDateString(localeApp()) : 'data desconeguda';
  $('importaResum').innerHTML = `<p>Còpia del <strong>${esc(quan)}</strong>:</p><ul class="llista-resum"><li><strong>${r.persones}</strong> ${r.persones === 1 ? 'persona' : 'persones'}${r.noms.length ? ' (' + esc(r.noms.join(', ')) + (r.persones > r.noms.length ? '…' : '') + ')' : ''}</li><li><strong>${r.partides.toLocaleString('ca-ES')}</strong> partides</li><li>${r.apartats} apartats · ${kb(r.mides * 2)}</li></ul>
    <p class="ajuda-camp"><strong>Substituir</strong> esborra el que hi ha ara en aquest dispositiu. <strong>Combinar</strong> afegeix les persones noves i, si una persona ja hi és, es queda la que té més partides. En tots dos casos es guarda una còpia automàtica d'abans, per poder desfer-ho.</p>`;
  obrirModal('modalImporta'); return true;
}
async function aplicaImportacio(mode) {
  const p = _paquetPendent; if (!p) return; tancarModal('modalImporta');
  // 1) còpia automàtica d'abans (per poder desfer)
  try { await idbDesa('copia-previa', JSON.stringify(construeixPaquet())); } catch (e) { lsRawSet('mentA_copia_previa', JSON.stringify(construeixPaquet())); }
  // 2) càlcul del resultat
  let claus = Object.assign({}, p.claus);
  if (mode === 'combina') claus = combinaClaus(construeixPaquet().claus, p.claus);
  // 3) aplicar
  const antigues = {}; totesLesClaus().filter(k => !CLAUS_NO_EXPORTABLES.includes(k) && k !== CLAU_COPIA).forEach(k => { antigues[k] = lsRawGet(k); });
  try {
    Object.keys(antigues).forEach(k => localStorage.removeItem(k));
    Object.entries(claus).forEach(([k, v]) => localStorage.setItem(k, v));
  } catch (e) {                                       // quota o error: es torna enrere sencer
    try { totesLesClaus().filter(k => !CLAUS_NO_EXPORTABLES.includes(k)).forEach(k => localStorage.removeItem(k)); Object.entries(antigues).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e2) { /* res */ }
    toast('No hi ha prou espai per importar aquesta còpia. No s\'ha canviat res.', 7000, 'error'); return;
  }
  _paquetPendent = null;
  toast('Dades importades. Reiniciem MentA…', 2500, 'exit'); setTimeout(() => { location.hash = ''; location.reload(); }, 900);
}
function combinaClaus(actual, nou) {
  const r = Object.assign({}, nou, actual);           // en les claus soltes (ajustos, convidat…) guanya el que ja hi ha
  let ua = [], un = []; try { ua = JSON.parse(actual.mentA_usuaris || '[]'); un = JSON.parse(nou.mentA_usuaris || '[]'); } catch (e) { /* ja validat */ }
  const m = new Map(ua.map(u => [u.id, u])), parts = u => (u.dades && Number(u.dades.totalPartides)) || 0;
  un.forEach(u => { const e = m.get(u.id); if (!e || parts(u) > parts(e)) m.set(u.id, u); });
  r.mentA_usuaris = JSON.stringify([...m.values()]);
  r.mentA_schema = String(SCHEMA);
  return r;
}
async function desferImportacio() {
  let c = null; try { c = await idbLlegeix('copia-previa'); } catch (e) { /* res */ } if (!c) c = lsRawGet('mentA_copia_previa');
  if (!c) { toast('No hi ha cap importació per desfer.', 3500); return; }
  const v = validaPaquet(c); if (!v.ok) { toast('La còpia automàtica no es pot llegir.', 4500, 'error'); return; }
  mostrarConfirmacio('Desfer l\'última importació?', 'Es tornaran les dades que hi havia just abans d\'importar.', async () => {
    totesLesClaus().filter(k => !CLAUS_NO_EXPORTABLES.includes(k) && k !== CLAU_COPIA).forEach(k => localStorage.removeItem(k));
    Object.entries(v.p.claus).forEach(([k, x]) => lsRawSet(k, x));
    try { await idbEsborra('copia-previa'); } catch (e) { /* res */ } try { localStorage.removeItem('mentA_copia_previa'); } catch (e) { /* res */ }
    toast('Importació desfeta. Reiniciem MentA…', 2500, 'exit'); setTimeout(() => { location.hash = ''; location.reload(); }, 900);
  }, { perill: false, boto: 'Sí, desfés-ho' });
}

// ---------- Integració ----------
document.addEventListener('menta:usuaris', () => renderRecordatoris());
(() => {
  const _cfg = PANTALLA_ENTRA.configuracio; PANTALLA_ENTRA.configuracio = () => { if (_cfg) _cfg(); renderEspaiUtilitzat(); };
  // Demana la persistència quan hi ha dades que val la pena protegir (després de la primera partida)
  const _fp = registrarPartida; registrarPartida = function (...a) { const r = _fp.apply(this, a); if (totalPartidesGuardades() === 1) demanaPersistencia(); return r; };
})();
