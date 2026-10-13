'use strict';
// ==========================================================
//  MentA · PRODUCTE
//  PWA (instal·lació i actualitzacions), feedback integrat,
//  mini-enquesta, recordatoris amb notificacions i bàner d'ajuda.
// ==========================================================

// ---------- PWA: service worker només amb http(s); amb file:// l'app funciona igualment ----------
let _promptInstal = null, _swEspera = null;
function registraSW() {
  if (window.__MODE_DEMO || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;     // la demo no registra service worker
  navigator.serviceWorker.register('sw.js').then(reg => {
    const nova = w => { if (w && navigator.serviceWorker.controller) { _swEspera = w; avisNovaVersio(); } };
    if (reg.waiting) nova(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') nova(w); }); });
  }).catch(() => { /* sense service worker: l'app funciona igual */ });
  // Només es recarrega quan s'actualitza una versió ja instal·lada (no en la primera instal·lació)
  const teControlador = !!navigator.serviceWorker.controller; let recarregat = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!teControlador || recarregat) return; recarregat = true; location.reload(); });
}
function avisNovaVersio() {
  const b = $('banerSistema'); if (!b || getUsuariActual().demo) return;
  b.innerHTML = `<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>Hi ha una versió nova de MentA.</strong> Actualitza per tenir les últimes millores.</span><button type="button" class="boto-principal boto-petit" onclick="actualitzaApp()">Actualitza</button></div>`;
}
function actualitzaApp() { if (_swEspera) _swEspera.postMessage('saltaEspera'); else location.reload(); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); _promptInstal = e; renderBanerInstalar(); });
window.addEventListener('appinstalled', () => { _promptInstal = null; lsRawSet('mentA_instal_amagat', '1'); renderBanerInstalar(); toast('MentA instal·lada. La trobaràs a la pantalla d\'inici.', 4500, 'exit'); });
const esStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
function renderBanerInstalar() {
  const c = $('banerInstalar'); if (!c) return;
  if (esStandalone() || lsRawGet('mentA_instal_amagat') || !/^https?:$/.test(location.protocol) || (!_promptInstal && !esIOS())) { c.innerHTML = ''; return; }
  const text = _promptInstal ? 'Instal·la MentA al telèfon o a l\'ordinador: s\'obre més ràpid i funciona sense connexió.' : 'Per instal·lar MentA a l\'iPhone o iPad: toca el botó Comparteix i després «Afegeix a la pantalla d\'inici».';
  c.innerHTML = `<div class="avis-caixa baner-instal"><svg class="ico" aria-hidden="true"><use href="#i-instalar"/></svg><span>${text}</span>${_promptInstal ? '<button type="button" class="boto-principal boto-petit" onclick="instalaApp()">Instal·lar</button>' : ''}<button type="button" class="boto-fantasma boto-petit" onclick="amagaInstalar()">Ara no</button></div>`;
}
async function instalaApp() { if (!_promptInstal) return; _promptInstal.prompt(); try { await _promptInstal.userChoice; } catch (e) { /* res */ } _promptInstal = null; renderBanerInstalar(); }
function amagaInstalar() { lsRawSet('mentA_instal_amagat', '1'); renderBanerInstalar(); }

// ---------- Feedback integrat ----------
const CARES_FEEDBACK = [[1, 'cara-baix', 'Gens bé'], [2, 'cara-cansat', 'Millorable'], [3, 'cara-normal', 'Normal'], [4, 'cara-be', 'Bé'], [5, 'cara-genial', 'Genial']];
let valoracioFeedback = 0;
function pintaCaresFeedback() {
  const c = $('caresFeedback'); if (!c) return;
  c.innerHTML = CARES_FEEDBACK.map(([n, i, t]) => `<button type="button" class="cara-opcio${valoracioFeedback === n ? ' sel' : ''}" role="radio" aria-checked="${valoracioFeedback === n}" data-cara="${n}">${ico(i)}<span>${t}</span></button>`).join('');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cara]'); if (b) { valoracioFeedback = +b.dataset.cara; soClic(); pintaCaresFeedback(); } });
PANTALLA_ENTRA.feedback = () => { valoracioFeedback = 0; pintaCaresFeedback(); };
async function enviaText(assumpte, text, dades) {
  // 1) URL configurada (Google Forms / Formspree…)  2) Web Share  3) correu  4) porta-retalls
  if (FEEDBACK_URL) {
    try { const r = await fetch(FEEDBACK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ missatge: text, versio: VERSIO }, dades)) }); if (r.ok) { toast('Gràcies! Hem rebut el teu feedback.', 4000, 'exit'); return true; } } catch (e) { /* segueix amb alternatives */ }
  }
  try { if (navigator.share) { await navigator.share({ title: assumpte, text }); return true; } } catch (e) { if (e && e.name === 'AbortError') return false; }
  if (FEEDBACK_EMAIL) { location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(assumpte)}&body=${encodeURIComponent(text)}`; return true; }
  try { await navigator.clipboard.writeText(text); toast('Text copiat. Enganxa\'l en un missatge o correu per enviar-nos-el.', 6000, 'exit'); return true; }
  catch (e) { baixaFitxer('MentA-feedback.txt', text, 'text/plain'); toast('S\'ha descarregat un fitxer amb el teu feedback per enviar-nos-el.', 6000); return true; }
}
async function enviarFeedback(ev) {
  ev.preventDefault();
  if (!valoracioFeedback) { toast('Tria una cara per valorar MentA'); return false; }
  const g = $('fbAgradat').value.trim(), m = $('fbMillora').value.trim(), c = $('fbContacte').value.trim();
  const text = `Feedback de MentA v${VERSIO}\nValoració: ${valoracioFeedback}/5\nM'ha agradat: ${g || '—'}\nMilloraria: ${m || '—'}\nContacte: ${c || '—'}\n(${innerWidth}x${innerHeight})`;
  const llista = lsGet('mentA_feedback', []); llista.push({ t: new Date().toISOString(), valoracio: valoracioFeedback, g, m }); lsSet('mentA_feedback', llista.slice(-10));
  const ok = await enviaText('Feedback de MentA', text, { valoracio: valoracioFeedback, agradat: g, milloraria: m, contacte: c, cuidador: hiHaCu ? cu : undefined, bingoAmbAlgu: hiHaNou ? nou18 : undefined });
  if (ok) { $('formFeedback').reset(); valoracioFeedback = 0; pintaCaresFeedback(); }
  return false;
}

// ---------- Mini-enquesta (3 preguntes, després de la 3a sessió, una sola vegada, omissible) ----------
function comprovarEnquesta() {
  const d = dadesActuals(); if (d.enquesta || lsRawGet('mentA_enquesta_feta') || d.totalPartides < 3 || d.demo || getUsuariActual().demo) return;
  const dies = new Set(d.historial.map(h => h.data)); if (dies.size < 1) return;
  setTimeout(() => { if (!document.querySelector('.modal-fons.actiu') && !enJoc()) mostrarEnquesta(); else _enquestaPendent = true; }, 4000);
}
let _enquestaPendent = false;
document.addEventListener('click', () => { if (_enquestaPendent && !enJoc() && !document.querySelector('.modal-fons.actiu') && pantallaActiva('menuJocs')) { _enquestaPendent = false; setTimeout(mostrarEnquesta, 800); } });
function mostrarEnquesta() {
  if (lsRawGet('mentA_enquesta_feta')) return;
  const nps = Array.from({ length: 11 }, (_, i) => `<label class="xip" style="cursor:pointer"><input type="radio" name="enqNps" value="${i}" style="accent-color:var(--marca-fosc)"> ${i}</label>`).join(' ');
  $('enquestaCos').innerHTML = `<fieldset class="fs-cares"><legend class="etiqueta-camp">1. Quina probabilitat hi ha que recomanis MentA a un amic o familiar? (0 = gens, 10 = segur)</legend><div style="display:flex;flex-wrap:wrap;gap:.3rem">${nps}</div></fieldset>
    <fieldset class="fs-cares"><legend class="etiqueta-camp">2. L'app m'ha semblat fàcil d'usar.</legend><div class="segmentat" role="radiogroup" aria-label="Facilitat d'ús">${[['1', 'Gens'], ['2', 'Poc'], ['3', 'Normal'], ['4', 'Força'], ['5', 'Molt']].map(([v, t]) => `<button type="button" role="radio" aria-checked="false" data-enq-sus="${v}">${t}</button>`).join('')}</div></fieldset>
    <label class="etiqueta-camp" for="enqText">3. Què és el primer que canviaries?</label><textarea class="camp-input" id="enqText" rows="2"></textarea>`;
  window._enqSus = 0; obrirModal('modalEnquesta');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-enq-sus]'); if (!b) return; window._enqSus = +b.dataset.enqSus; b.parentElement.querySelectorAll('button').forEach(x => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-checked', on); }); });
MODAL_TANCA.modalEnquesta = () => { lsRawSet('mentA_enquesta_feta', '1'); dadesActuals().enquesta = true; guardarDadesUsuari(); };
async function enviarEnquesta() {
  const nps = document.querySelector('input[name="enqNps"]:checked'), sus = window._enqSus || 0, t = $('enqText').value.trim();
  if (!nps && !sus && !t) { toast('Tria alguna resposta o tanca la finestra.'); return; }
  const text = `Mini-enquesta MentA v${VERSIO}\nRecomanaria (0-10): ${nps ? nps.value : '—'}\nFacilitat d'ús (1-5): ${sus || '—'}\nPrimer canvi: ${t || '—'}`;
  lsSet('mentA_enquesta', { t: new Date().toISOString(), nps: nps ? +nps.value : null, sus, text: t });
  tancarModal('modalEnquesta'); await enviaText('Mini-enquesta de MentA', text, { nps: nps ? +nps.value : null, facilitat: sus, canvi: t });
}

// ---------- Recordatoris amb notificacions (només mentre l'app és oberta) ----------
function pintarEstatNotificacions() {
  const b = $('btnNotificacions'), a = $('ajudaNotificacions'); if (!b) return;
  if (!('Notification' in window)) { b.disabled = true; setText('ajudaNotificacions', 'El teu navegador no admet avisos. Veuràs el recordatori a la pantalla d\'inici.'); return; }
  if (Notification.permission === 'granted') { b.textContent = 'Avisos activats'; b.disabled = true; }
  else if (Notification.permission === 'denied') { b.disabled = true; setText('ajudaNotificacions', 'Has bloquejat els avisos al navegador. Si vols activar-los, canvia el permís des de la configuració del navegador.'); }
}
async function demanarNotificacions() {
  if (!('Notification' in window)) return;
  try { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Avisos activats' : 'No s\'han activat els avisos', 3000); } catch (e) { /* res */ }
  pintarEstatNotificacions();
}
function vigilaRecordatori() {
  setInterval(() => {
    if (!recordatoriJugarActiu()) { if (pantallaActiva('inici')) renderRecordatoris(); return; }
    if (pantallaActiva('inici')) renderRecordatoris();
    if ('Notification' in window && Notification.permission === 'granted' && lsRawGet('mentA_avis_dia') !== avuiISO()) {
      lsRawSet('mentA_avis_dia', avuiISO());
      try { new Notification('MentA', { body: 'És l\'hora que has triat per jugar una estona.', icon: 'img/icona-192.png' }); } catch (e) { /* res */ }
    }
  }, 60000);
}

// «Sobre MentA»: només es mostren els contactes que existeixen de debò (config.js → CONTACTE)
PANTALLA_ENTRA.sobre = () => {
  const c = $('sobreContacte'), l = contactesValids(); if (!c) return;
  c.hidden = !l.length; c.innerHTML = l.length ? '<p><strong>Contacte</strong></p><p>' + l.map(x => `<a href="${esc(x.href)}" target="_blank" rel="noopener noreferrer">${esc(x.etiqueta)}</a>`).join(' · ') + '</p>' : '';
};
