'use strict';
// ==========================================================
//  MentA · ONBOARDING (v1.8): interactiu, ≤ 90 s, es veu UNA sola vegada
//  Passos (segons el rol): benvinguda · rol · nom i avatar · mida de lletra amb vista prèvia · «Prova-ho!» + ànim
//  · (cuidador: PIN i consentiment · residència: PIN i nom del centre) · tot a punt (+ recordatori opcional).
//  Mai torna a sortir sol: marca robusta (localStorage + sessionStorage + memòria) i migració de dades antigues.
//  Només es pot veure de nou a mà: Configuració → «Repetir la guia» (visita guiada, no toca nom, rol ni dades).
// ==========================================================
const CLAU_ONB = 'mentA_onboarding';
const PASSOS_ONB = {
  jo: ['benvinguda', 'rol', 'nom', 'zoom', 'prova', 'final'],
  cuidat: ['benvinguda', 'rol', 'nom', 'zoom', 'prova', 'pin', 'consent', 'final'],
  residencia: ['benvinguda', 'rol', 'zoom', 'prova', 'pin', 'final'],
  repeticio: ['benvinguda', 'prova', 'final']
};
const FRASES_ANIM_ONB = { 'Bé': 'Quina alegria! Gaudirem d\'aquesta estona.', 'Normal': 'Bé, anem a poc a poc i amb calma.', 'Cansat': 'Descansa quan vulguis. Jugarem sense pressa.', 'Baix': 'Gràcies per dir-ho. Aquí tens companyia.' };
let _onbMem = false, passosOnb = PASSOS_ONB.jo, onboardingPas = 0, onbRol = 'jo', onbConsent = 'si', onbRepeticio = false, onbAvatar = 0, onbAnim = null, onbProvaFeta = false, _onbT0 = 0, _onbSwipe = null;

// ---------- Marca de «ja vist» ----------
function onboardingJaFet() {
  if (_onbMem) return true;
  try { if (sessionStorage.getItem('mentA_onb_sessio')) return true; } catch (e) { /* mode privat */ }
  if (lsRawGet('mentA_onboarding_vist') || lsGet(CLAU_ONB, null)) return true;
  // Migració: qui ja ha fet servir la 1.6/1.7 (o té dades) no veu mai la benvinguda
  const abans = window.__schemaAnterior || 0;
  if ((abans > 0 && abans < SCHEMA) || (usuaris && usuaris.length) || (_convidat && _convidat.dades && _convidat.dades.totalPartides > 0)) { marcaOnboarding('migracio', true); return true; }
  return false;
}
function marcaOnboarding(rol, saltat) {
  _onbMem = true;
  try { sessionStorage.setItem('mentA_onb_sessio', '1'); } catch (e) { /* res */ }
  let desat = true;
  try { localStorage.setItem('mentA_onboarding_vist', '1'); localStorage.setItem('mentA_zoom_vist', '1'); localStorage.setItem(CLAU_ONB, JSON.stringify({ versio: VERSIO, data: new Date().toISOString(), rol, saltat: !!saltat })); } catch (e) { desat = false; }
  document.documentElement.classList.remove('onb-pendent');
  return desat;
}

// ---------- Obrir / tancar ----------
function iniciarOnboarding(repeticio) {
  if (!repeticio && onboardingJaFet()) { document.documentElement.classList.remove('onb-pendent'); return; }
  onbRepeticio = !!repeticio; onbRol = 'jo'; onbConsent = 'si'; onboardingPas = 0; onbAnim = null; onbProvaFeta = false; onbAvatar = 0; _onbT0 = Date.now();
  passosOnb = PASSOS_ONB[onbRepeticio ? 'repeticio' : 'jo'];
  ['onboardingNom', 'onbPin1', 'onbPin2', 'onbCuidadorNom', 'onbCentre'].forEach(id => { const e = $(id); if (e) e.value = ''; });
  pintaAvatarsOnb(); onboardingAvatar(0, true); pintaZoomOnb(); setText('onbError', '');
  document.getElementById('onbIdioma').hidden = !I18N.disponible(); mostra('onbIdioma', I18N.disponible(), 'flex'); pintaIdiomaOnb();
  $('onboardingOverlay').classList.add('actiu'); _inertFons(true);
  actualitzarOnboardingSlide(true);
}
function onboardingIdioma(l) { soClic(); const aplica = ok => { ajustes.idioma = ok ? l : 'ca'; guardarAjustes(); I18N.canvia(ajustes.idioma, true); pintaIdiomaOnb(); if (typeof pintarToggles === 'function') pintarToggles(); }; if (l === 'ca') aplica(true); else I18N.assegura(aplica); }
function pintaIdiomaOnb() { document.querySelectorAll('#onbIdioma button').forEach(b => { const on = b.dataset.valor === I18N.llengua; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); }); }
function repetirBenvinguda() { iniciarOnboarding(true); }
function tancaOverlayOnb() { $('onboardingOverlay').classList.remove('actiu'); _inertFons(false); document.documentElement.classList.remove('onb-pendent'); }

// ---------- Navegació ----------
// (L'Elefant no surt a la benvinguda: és un ajudant petit que viu a baix a la dreta un cop dins de l'app.)
function mascotaEstat() { }
function actualitzarOnboardingSlide(primer) {
  const id = passosOnb[onboardingPas], ultima = onboardingPas === passosOnb.length - 1;
  document.querySelectorAll('.onboarding-slide').forEach(s => { const on = s.dataset.slide === id; s.classList.toggle('actiu', on); if (!on) s.removeAttribute('data-sortint'); });
  $('onboardingDots').innerHTML = passosOnb.map((_, i) => `<span class="onb-seg${i < onboardingPas ? ' fet' : i === onboardingPas ? ' actiu' : ''}"></span>`).join('');
  setText('onboardingNext', ultima ? (onbRepeticio ? 'Veure la guia' : 'Entrar a MentA') : id === 'benvinguda' ? 'Comencem' : 'Següent');
  $('onboardingBack').style.visibility = onboardingPas ? 'visible' : 'hidden';
  setText('onboardingPas', (onboardingPas + 1) + ' / ' + passosOnb.length); setText('onbError', '');
  mostra('onboardingSkip', !ultima, 'inline-flex');
  textosOnbSegonsRol();
  if (id === 'prova') iniciaProvaOnb(); if (id === 'final') pintaResumOnb();
  setText('onbAnunci', `Pas ${onboardingPas + 1} de ${passosOnb.length}`);
  const h = document.querySelector(`.onboarding-slide[data-slide="${id}"] h2`); if (h && !primer) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  else setTimeout(() => { const b = $('onboardingNext'); if (b) b.focus({ preventScroll: true }); }, 60);
  if (typeof registrarUsAnonim === 'function') registrarUsAnonim('onb_pas', { pas: id, n: onboardingPas + 1, ms: Date.now() - _onbT0 });
}
function textosOnbSegonsRol() {
  setText('onbNomTitol', onbRol === 'cuidat' ? 'Com es diu la persona que jugarà?' : 'Com et dius?');
  setText('onbPinTitol', { jo: 'Vols protegir l\'espai del cuidador?', cuidat: 'Crea el PIN del cuidador', residencia: 'PIN del professional' }[onbRol]);
  setText('onbPinText', { jo: 'Opcional. Amb 4 xifres, ningú més no podrà entrar on es veuen les dades i els ajustos.', cuidat: 'Un PIN de 4 xifres protegeix l\'espai on es veuen les dades. La persona gran no l\'ha de saber.', residencia: 'Un PIN de 4 xifres protegeix el panell de planta i els ajustos. Només l\'ha de saber el personal.' }[onbRol]);
  mostra('onbFilaCentre', onbRol === 'residencia', 'block'); mostra('onbFilaCuidadorNom', onbRol !== 'residencia', 'block');
}
async function onboardingNext() {
  soClic(); const id = passosOnb[onboardingPas];
  if (id === 'pin') {
    const p1 = $('onbPin1').value, p2 = $('onbPin2').value, obligatori = onbRol !== 'jo';
    if (p1 || p2 || obligatori) {
      if (!/^\d{4}$/.test(p1)) { setText('onbError', 'El PIN ha de tenir 4 xifres.'); $('onbPin1').focus(); return; }
      if (p1 !== p2) { setText('onbError', 'Els dos PIN no coincideixen.'); $('onbPin2').focus(); return; }
    }
  }
  if (onboardingPas < passosOnb.length - 1) { onboardingPas++; actualitzarOnboardingSlide(); } else await finalitzarOnboarding();
}
function onboardingEnrere() { soClic(); if (onboardingPas > 0) { onboardingPas--; actualitzarOnboardingSlide(); } }
const onboardingSkip = () => { soClic(); if (typeof registrarUsAnonim === 'function') registrarUsAnonim('onb_salta', { pas: passosOnb[onboardingPas], ms: Date.now() - _onbT0 }); finalitzarOnboarding(true); };
function onboardingRol(rol, el) {
  onbRol = rol; passosOnb = PASSOS_ONB[rol]; vibrar(15); soClic();
  document.querySelectorAll('.onb-rol[data-rol]').forEach(o => { const on = o === el; o.classList.toggle('sel', on); o.setAttribute('aria-checked', on); });
  actualitzarOnboardingSlide(true);
}
function onboardingConsent(c, el) { onbConsent = c; vibrar(15); document.querySelectorAll('.onb-rol[data-consent]').forEach(o => { const on = o === el; o.classList.toggle('sel', on); o.setAttribute('aria-checked', on); }); soClic(); }

// ---------- Nom i avatar (amb vista prèvia en directe) ----------
function pintaAvatarsOnb() {
  $('onbAvatars').innerHTML = AVATARS.map((a, i) => `<button type="button" role="radio" aria-checked="${i === onbAvatar}" class="onb-av${i === onbAvatar ? ' sel' : ''}" aria-label="Avatar ${i + 1}" onclick="onboardingAvatar(${i})" style="background:${fonsAvatar(COLORS_AVATAR[i])}">${htmlAvatar({ nom: ($('onboardingNom').value || 'M').trim() || 'M', color: COLORS_AVATAR[i], avatar: a, foto: null })}</button>`).join('');
}
function onboardingAvatar(i, silenci) {
  onbAvatar = i; if (!silenci) { soClic(); vibrar(15); }
  document.querySelectorAll('.onb-av').forEach((b, k) => { b.classList.toggle('sel', k === i); b.setAttribute('aria-checked', k === i); });
  onboardingNomViu();
}
function onboardingNomViu() {
  const nom = ($('onboardingNom').value || '').trim();
  setText('onbHola', nom ? `Hola, ${nom}!` : 'Hola!');
  $('onbAvPrevi').style.background = fonsAvatar(COLORS_AVATAR[onbAvatar]); $('onbAvPrevi').innerHTML = htmlAvatar({ nom: nom || 'M', color: COLORS_AVATAR[onbAvatar], avatar: AVATARS[onbAvatar], foto: null });
  if ($('onbAvatars').children.length) pintaAvatarsOnb();
}

// ---------- Mida de lletra, tema i contrast amb efecte immediat ----------
function pintaZoomOnb() {
  document.querySelectorAll('.onb-zoom').forEach(b => b.classList.toggle('sel', b.dataset.zoom === (ajustes.zoom || 'normal')));
  document.querySelectorAll('#onbTema [data-valor]').forEach(b => { const on = b.dataset.valor === (ajustes.tema || 'clar'); b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
  const c = $('onbContrast'); if (c) { c.setAttribute('aria-pressed', !!ajustes.altContrast); c.classList.toggle('actiu', !!ajustes.altContrast); }
}
function onboardingZoom(nivell) { aplicarZoom(nivell); vibrar(15); soClic(); pintaZoomOnb(); }
function onboardingTema(valor) { ajustes.tema = valor; ajustes.fosc = valor === 'fosc'; guardarAjustes(); aplicarTema(); soClic(); pintaZoomOnb(); }
function onboardingContrast() { ajustes.altContrast = !ajustes.altContrast; guardarAjustes(); aplicarTema(); soClic(); pintaZoomOnb(); }

// ---------- «Prova-ho!»: 3 rondes de «toca el cercle que brilla» i després, com et trobes ----------
function iniciaProvaOnb() {
  const cont = $('onbCercles'); let ronda = 0, objectiu = 0; onbProvaFeta = false;
  $('onbAnim').hidden = true; $('onbAnim').style.display = ''; cont.hidden = false; $('onbRonda').hidden = false;
  setText('onbProvaTitol', 'Prova-ho!'); setText('onbProvaText', 'Toca el cercle que brilla. Només tres vegades.');
  const COL = ['#2e8b57', '#c9771f', '#2b6fb3', '#7048a8'];
  cont.innerHTML = COL.map((c, i) => `<button type="button" class="onb-cercle" data-i="${i}" style="--c:${c}" aria-label="Cercle ${i + 1}"><span class="onb-cercle-dins"></span></button>`).join('');
  const pinta = () => {
    objectiu = (objectiu + 1 + Math.floor(Math.random() * 3)) % 4;
    cont.querySelectorAll('.onb-cercle').forEach((b, i) => { b.classList.toggle('brilla', i === objectiu); b.setAttribute('aria-label', `Cercle ${i + 1}${i === objectiu ? ', és el que brilla' : ''}`); });
    $('onbRonda').innerHTML = [0, 1, 2].map(k => `<i class="${k < ronda ? 'fet' : ''}"></i>`).join(''); mascotaEstat('pensant');
  };
  cont.onclick = e => {
    const b = e.target.closest('.onb-cercle'); if (!b || onbProvaFeta) return;
    if (+b.dataset.i !== objectiu) { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 400); soError(); vibrar(40); setText('onbProvaText', 'Gairebé! Busca el que té l\'anell que es mou.'); return; }
    soEncert(); vibrar([20, 20]); ronda++; mascotaEstat('content'); setText('onbProvaText', ronda < 3 ? ['Molt bé!', 'Perfecte! Un més.'][ronda - 1] : '');
    if (ronda < 3) { setTimeout(pinta, 350); $('onbRonda').innerHTML = [0, 1, 2].map(k => `<i class="${k < ronda ? 'fet' : ''}"></i>`).join(''); return; }
    onbProvaFeta = true; mascotaEstat('celebrant'); soVictoria(); confeti();
    setTimeout(() => { cont.hidden = true; $('onbRonda').hidden = true; setText('onbProvaTitol', 'Ja has fet el teu primer exercici!'); setText('onbProvaText', ''); $('onbAnim').hidden = false; pintaCaresOnb(); }, 700);
  };
  pinta();
}
function pintaCaresOnb() {
  $('onbCares').innerHTML = ANIMS.map(([nom, ic]) => `<button type="button" role="radio" aria-checked="${onbAnim === nom}" class="onb-cara${onbAnim === nom ? ' sel' : ''}" onclick="onboardingAnim('${nom}')">${ico(ic)}<span>${nom === 'Bé' ? 'Bé' : nom}</span></button>`).join('');
}
function onboardingAnim(nom) { onbAnim = nom; vibrar(15); soClic(); pintaCaresOnb(); setText('onbAnimFrase', FRASES_ANIM_ONB[nom]); mascotaEstat(nom === 'Baix' || nom === 'Cansat' ? 'content' : 'celebrant'); }

// ---------- Tot a punt ----------
function pintaResumOnb() {
  const nom = ($('onboardingNom').value || '').trim(), z = { normal: 'Normal', gran: 'Gran', extragran: 'Extra gran', gegant: 'Gegant' }[ajustes.zoom || 'normal'];
  setText('onbFinalTitol', onbRepeticio ? 'Això és MentA' : nom ? `Tot a punt, ${nom}!` : 'Tot a punt!');
  const files = onbRepeticio ? ['Una sessió són 3 jocs i uns 10 minuts.', 'Cada joc té ajuda amb el botó «?».'] : [`Qui juga: ${onbRol === 'residencia' ? 'una residència o centre' : onbRol === 'cuidat' ? 'una persona gran, amb ajuda' : 'jo mateix/a'}`, `Mida de la lletra: ${z}`, 'Primera sessió: 3 jocs, uns 10 minuts'];
  $('onbResum').innerHTML = files.map(f => `<li>${ico('check')}<span>${esc(f)}</span></li>`).join('');
  mostra('onbFilaRecordatori', !onbRepeticio, 'flex');
}
function onboardingRecordatori() { const b = $('onbRecordatori'), on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.classList.toggle('actiu', on); $('onbHora').disabled = !on; soClic(); }

// ---------- Final ----------
async function finalitzarOnboarding(saltat) {
  let desat = true;
  if (!onbRepeticio) {
    const nom = ($('onboardingNom').value || '').trim(), pin = $('onbPin1').value, rol = saltat ? 'jo' : onbRol;
    ajustes.rol = rol;
    if (!saltat && $('onbRecordatori').getAttribute('aria-pressed') === 'true') { ajustes.recordaJugar = true; ajustes.horaPreferida = $('onbHora').value || '11:00'; if (typeof demanarNotificacions === 'function') { try { demanarNotificacions(); } catch (e) { /* res */ } } }
    if (!saltat && rol === 'residencia') { const centre = ($('onbCentre').value || '').trim(); if (centre) ajustes.centreNom = centre; }
    guardarAjustes();
    if (!saltat && nom && rol !== 'residencia') {
      const nou = { id: idUsuariNou(), nom, color: COLORS_AVATAR[onbAvatar], foto: null, avatar: AVATARS[onbAvatar], dades: getDadesBuit() };
      nou.dades.consentiment = { estat: rol === 'jo' ? 'si' : onbConsent, data: avuiISO(), qui: rol === 'jo' ? 'la mateixa persona' : 'en configurar l\'app' };
      usuaris.push(nou); usuariActualId = nou.id; guardarUsuaris(); notificaUsuaris();
    }
    if (!saltat && onbAnim) { xecAvui(true).anim = onbAnim; comptaXecs(); guardarDadesUsuari(); }
    if (!saltat && /^\d{4}$/.test(pin) && typeof desaPin === 'function') { await desaPin(pin); const nc = ($('onbCuidadorNom').value || '').trim(); if (nc) { const c = lsGet('mentA_cuidador', {}); c.nom = nc; lsSet('mentA_cuidador', c); ajustes.cuidadorNom = nc; guardarAjustes(); } }
    desat = marcaOnboarding(rol, saltat);                       // abans de treure l'overlay: mai no hi ha bucle
  }
  tancaOverlayOnb(); refrescarTot();
  if (typeof registrarUsAnonim === 'function') registrarUsAnonim('onb_fi', { saltat: !!saltat, ms: Date.now() - _onbT0, rol: onbRol });
  if (!desat) toast('En aquest navegador no podem desar les teves dades. Pots jugar igualment, però no es guardaran.', 7000);
  if (!onbRepeticio && ajustes.rol === 'residencia') { mostrarPantalla('selectorResident', { senseHash: true }); toast('Afegeix els residents amb «Afegir resident».', 6000); return; }
  mostrarPantalla('inici', { senseHash: true });
  setTimeout(() => { if (typeof iniciarGuiaPrimerUs === 'function') iniciarGuiaPrimerUs(onbRepeticio); }, 600);
}

// ---------- Teclat i gest de lliscar ----------
document.addEventListener('keydown', e => {
  const o = $('onboardingOverlay'); if (!o || !o.classList.contains('actiu')) return;
  const dinsCamp = e.target.matches && e.target.matches('input, textarea, select');
  if (e.key === 'Enter' && !dinsCamp && !e.target.closest('button')) { e.preventDefault(); onboardingNext(); }
  else if (e.key === 'Escape') { e.preventDefault(); onboardingEnrere(); }
  else if (!dinsCamp && e.key === 'ArrowRight' && !e.target.closest('[role=radiogroup]')) onboardingNext();
  else if (!dinsCamp && e.key === 'ArrowLeft' && !e.target.closest('[role=radiogroup]')) onboardingEnrere();
});
document.addEventListener('touchstart', e => { const o = $('onboardingOverlay'); if (o && o.classList.contains('actiu') && !e.target.closest('input, button, select')) _onbSwipe = e.touches[0].clientX; else _onbSwipe = null; }, { passive: true });
document.addEventListener('touchend', e => { if (_onbSwipe == null) return; const dx = e.changedTouches[0].clientX - _onbSwipe; _onbSwipe = null; if (Math.abs(dx) > 70) (dx < 0 ? onboardingNext : onboardingEnrere)(); }, { passive: true });

// ---------- Sense scroll: si el contingut no hi cap (pantalla petita + lletra gran), es compacta de mica en mica ----------
function ajustaCompacteOnb() {
  const card = document.querySelector('.onboarding-card'), cos = $('onb-cos-ref') || document.querySelector('.onb-cos'); if (!card || !cos) return;
  card.classList.remove('compacte', 'compacte-2');
  if (cos.scrollHeight <= cos.clientHeight + 2) return;
  card.classList.add('compacte'); if (cos.scrollHeight <= cos.clientHeight + 2) return;
  card.classList.add('compacte-2');
}
const _actualitzaSlideOriginal = actualitzarOnboardingSlide;
actualitzarOnboardingSlide = function (primer) { _actualitzaSlideOriginal(primer); requestAnimationFrame(ajustaCompacteOnb); setTimeout(ajustaCompacteOnb, 400); };
const _zoomOnbOriginal = onboardingZoom;
onboardingZoom = function (n) { _zoomOnbOriginal(n); setTimeout(ajustaCompacteOnb, 60); };
window.addEventListener('resize', () => { if ($('onboardingOverlay').classList.contains('actiu')) ajustaCompacteOnb(); });
