'use strict';
// ==========================================================
//  MentA · L'ELEFANT (v1.9, redisseny) · COMPORTAMENT A L'APP
//  Un animalet petit que t'ajuda en petites coses. Viu SEMPRE al mateix lloc: a baix a la dreta, petit i quiet.
//  Als jocs no s'hi està: surt per la vora dreta de la pantalla, et pregunta si necessites ajuda i, quan acabes, se'n torna a anar.
//  No parla sol: només quan toques l'elefantet, o quan et veu encallat (errors seguits o molta estona sense moure res) i t'ofereix una pista.
//  Tot el que diu és text (aria-live al globus); la veu és opcional. Mai afirmacions mèdiques.
// ==========================================================
const PRESENCIES = {
  molt:    { nom: 'Molt present', desc: 'Surt a oferir ajuda aviat i fa alguna animació més.', perMinut: 4, perPartida: 6, errorsPista: 2, inactiuMs: 18000, animacions: true },
  normal:  { nom: 'Normal', desc: 'Surt a oferir una pista quan veu que t\'encalles.', perMinut: 2, perPartida: 3, errorsPista: 3, inactiuMs: 28000, animacions: true },
  discret: { nom: 'Discret', desc: 'Quiet a la vora; només surt si t\'encalles molta estona o si el toques.', perMinut: 1, perPartida: 1, errorsPista: 4, inactiuMs: 40000, animacions: false },
  apagat:  { nom: 'Apagat', desc: 'No es veu. Les pistes continuen al botó de la bombeta.', perMinut: 0, perPartida: 0, errorsPista: 0, inactiuMs: 0, animacions: false }
};
const ELEFANT_ACCESSORIS = [
  { id: 'llaçada', nom: 'Llaçada', medalla: null, desc: 'Per començar' },
  { id: 'bufanda', nom: 'Bufanda verda', medalla: 'ratxa_3', desc: '3 dies seguits' },
  { id: 'gorra', nom: 'Gorra', medalla: 'ratxa_7', desc: '7 dies seguits' },
  { id: 'barret', nom: 'Barret', medalla: 'partides_50', desc: '50 partides' },
  { id: 'ulleres', nom: 'Ulleres de lectura', medalla: 'dies_20', desc: '20 dies actius' },
  { id: 'barret-festa', nom: 'Barret de festa', medalla: 'partides_100', desc: '100 partides' },
  { id: 'paraigua', nom: 'Paraigua', medalla: 'ratxa_30', desc: '30 dies seguits' }
];
const JOCS_CRONOMETRATS = ['nback', 'stroop', 'span', 'fluidesa', 'sequencia', 'bingo'];
const ELEF = { inst: null, flotant: null, slot: null, minut: [], partida: 0, jocActual: null, errorsSeguits: 0, encertsSeguits: 0, silenciPartida: false };

const nomElefant = () => ((typeof ajustes !== 'undefined' && ajustes.elefantNom) || '').trim().slice(0, 24) || t(typeof ELEFANT_NOM !== 'undefined' ? ELEFANT_NOM : "L'Elefant");
function presenciaActual() {
  if (typeof ajustes === 'undefined') return 'discret';
  if (ajustes.elefant === false) return 'apagat';
  if (ajustes.elefantPresencia && PRESENCIES[ajustes.elefantPresencia]) return ajustes.elefantPresencia;
  return 'discret';
}
const reglesPresencia = () => PRESENCIES[presenciaActual()];
const elefantPermes = () => presenciaActual() !== 'apagat' && !modeLectura;
const enEspaiCuidador = () => idPantallaActiva() === 'cuidador';
const esCronometrat = () => ELEF.jocActual && JOCS_CRONOMETRATS.includes(ELEF.jocActual);
const nomPersona = () => { const u = getUsuariActual(); return u && u.id !== 'convidat' ? u.nom : ''; };
const enOnboarding = () => { const o = $('onboardingOverlay'); return !!o && o.classList.contains('actiu'); };

// ---------- Instància i contenidor fix (baix a la dreta) ----------
function elefantInst() {
  if (ELEF.inst) return ELEF.inst;
  if (typeof Elefant === 'undefined') return null;
  const c = ELEF.flotant = document.createElement('div'); c.id = 'elefantFlotant'; c.className = 'elefant-flotant amagat'; c.setAttribute('inert', ''); document.body.appendChild(c);
  const e = ELEF.inst = Elefant.crea(c, { mida: 'mini', rol: 'flotant', estat: 'repos' });
  const f = e.el.querySelector('.el-figura'); f.setAttribute('role', 'button'); f.setAttribute('tabindex', '0');
  e.pausa(); elefantAplicaVestuari(); e.tema(document.documentElement.dataset.tema === 'fosc' ? 'fosc' : 'clar');
  actualitzaEtiquetaElefant();
  return e;
}
function actualitzaEtiquetaElefant() { const e = ELEF.inst; if (e) e.el.querySelector('.el-figura').setAttribute('aria-label', t(nomElefant() + ', el teu ajudant. Toca per veure què pot fer')); }
function elefantVestuariDesbloquejat() { const d = dadesActuals(), m = (d && d.medalles) || []; return ELEFANT_ACCESSORIS.filter(a => !a.medalla || m.includes(a.medalla)).map(a => a.id); }
function elefantAplicaVestuari() {
  const e = ELEF.inst; if (!e) return; const triats = ajustes.elefantVestuari || [], lliures = elefantVestuariDesbloquejat();
  e.desvesteix(); triats.filter(a => lliures.includes(a)).forEach(a => e.vesteix(a, true));
}
const visible = () => !!ELEF.flotant && !ELEF.flotant.classList.contains('amagat');
function elefantMostra() {
  const e = elefantInst(); if (!e) return null; const c = ELEF.flotant;
  const nav = $('bottomNav'), nv = nav && getComputedStyle(nav).display !== 'none' && !document.body.classList.contains('jugant') ? nav.getBoundingClientRect() : null;
  c.style.setProperty('--alt-nav', nv && nv.height ? Math.round(innerHeight - nv.top + 6) + 'px' : '0px');          // per no quedar tapat per la barra de baix
  clearTimeout(ELEF.tAmaga); c.removeAttribute('inert'); c.classList.remove('amagat'); e.refrescaMoviment(); e['reprèn'](); ELEF.slot = c;
  e.tema(document.documentElement.dataset.tema === 'fosc' ? 'fosc' : 'clar'); return e;
}
function elefantAmaga() {          // surt de la pantalla pel costat (també sense animació) i s'atura
  const e = ELEF.inst; if (!e) { ELEF.slot = null; return; }
  e.callaGlobus(); e.deixaDAssenyalar(); ELEF.flotant.classList.add('amagat'); ELEF.flotant.setAttribute('inert', '');
  ELEF.slot = null; clearTimeout(ELEF.tAmaga); ELEF.tAmaga = setTimeout(() => { if (ELEF.flotant && ELEF.flotant.classList.contains('amagat')) e.pausa(); }, 600);
}
// Als jocs: surt per la dreta quan hi ha alguna cosa a dir i hi torna a entrar sol
function elefantSurt() { const e = elefantMostra(); if (e) e.estat('repos'); return e; }
function elefantTornaAlCostat(ms) {
  clearTimeout(ELEF.tTorna); ELEF.tTorna = setTimeout(() => { if (enJoc() && !(typeof Pistes !== 'undefined' && (Pistes._E.obertes || Pistes._E.ofertaActiva))) elefantAmaga(); }, ms || 600);
}
function elefantColoca() { return elefantMostra(); }          // compatibilitat: ara només hi ha una ranura

// S'executa cada cop que canvia la pantalla
function elefantPantalla(id) {
  clearTimeout(ELEF.tTorna);
  if (!elefantPermes() || enEspaiCuidador() || enOnboarding()) { if (ELEF.flotant) { ELEF.flotant.classList.add('sense-trans'); setTimeout(() => ELEF.flotant.classList.remove('sense-trans'), 700); } elefantAmaga(); actualitzaBotoPistaJoc(id); return; }
  if (id.startsWith('joc-')) { ELEF.jocActual = id.slice(4); actualitzaBotoPistaJoc(id); elefantAmaga(); return; }     // dins d'un joc, només surt quan toca
  ELEF.jocActual = null;
  if (document.body.classList.contains('focus')) { elefantAmaga(); return; }
  const e = elefantMostra(); if (e) e.estat('repos');
}

// ---------- Etiqueta: no ser pesat ----------
function elefantPermisComentar(op) {
  const r = reglesPresencia(), ara_ = Date.now(), o = op || {};
  if (!elefantPermes() || r.perMinut === 0) return false;
  if (o.forcat || o.ajuda) return true;
  ELEF.minut = ELEF.minut.filter(x => ara_ - x < 60000);
  if (ELEF.minut.length >= r.perMinut) return false;
  if (enJoc() && (ELEF.partida >= r.perPartida || ELEF.silenciPartida || esCronometrat())) return false;
  return true;
}
function elefantNotaComentari() { ELEF.minut.push(Date.now()); if (enJoc()) ELEF.partida++; }
// Diu una frase d'un context. L'Elefant no xerra sol: només si és una ajuda explícita ({ ajuda: true }).
function elefantDiuCtx(ctx, vars, op) {
  const o = Object.assign({}, op || {}); if (!o.ajuda) return false;
  if (!elefantPermisComentar(o)) return false;
  const e = elefantMostra(); if (!e) return false;
  const text = Dialegs.tria(ctx, Object.assign({ nom: nomPersona() }, vars || {})); if (!text) return false;
  e.diu(text, { emocio: o.emocio || null, veu: !!ajustes.elefantVeu, accions: o.accions || [], durada: o.durada || 0 });
  elefantNotaComentari(); return true;
}
function elefantReaccio(estat, ms) {          // només un gest, sense paraules
  const e = ELEF.inst; if (!e || !elefantPermes() || ELEF.slot == null || !reglesPresencia().animacions) return;
  e.estat(estat); clearTimeout(ELEF.tCalma); ELEF.tCalma = setTimeout(() => { if (ELEF.inst) ELEF.inst.estat('repos'); }, ms || 1400);
}

// ---------- Toc a l'elefantet: un petit menú d'ajuda ----------
function elefantClick() {
  const e = elefantInst(); if (!elefantPermes() || !e) return; soClic();
  if (e.el.querySelector('.el-globus.visible')) { e.callaGlobus(); return; }
  const accions = [], j = ELEF.jocActual;
  if (j) {
    if (typeof Pistes !== 'undefined' && Pistes.disponible()) accions.push({ text: 'Una pista', principal: true, fer: () => Pistes.demana() });
    accions.push({ text: 'Com es juga', fer: () => { registraAjuda(); mostrarTutorial(jocActualId, null, true); } });
  } else {
    const jugat = typeof teJugatAvui === 'function' && teJugatAvui();
    accions.push({ text: jugat ? 'Jugar un altre joc' : 'Jugar', principal: true, fer: () => elefantJugar() }, { text: 'Respirar una estona', fer: () => iniciarRespiracio() }, { text: 'Com em trobo', fer: () => obrirXecSalut() });
  }
  e.estat('content'); e.diu(Dialegs.tria('ajuda_menu', { nom: nomPersona() }), { durada: 0, accions, veu: !!ajustes.elefantVeu });
  clearTimeout(ELEF.tCalma); ELEF.tCalma = setTimeout(() => e.estat('repos'), 2200);
}
const tancarElefantPanell = () => { if (ELEF.inst) ELEF.inst.callaGlobus(); };
function elefantJugar() { tancarElefantPanell(); obrirJoc(jocRecomanat().joc); }
document.addEventListener('click', ev => {
  if (ev.target.closest && ev.target.closest('#elefantFlotant .el-figura')) { elefantClick(); return; }
  if (ELEF.inst && !enJoc() && !ev.target.closest('#elefantFlotant')) ELEF.inst.callaGlobus();      // tocar fora tanca el menú
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('el-figura') && ELEF.flotant && ELEF.flotant.contains(ev.target)) { ev.preventDefault(); elefantClick(); }
  else if (ev.key === 'Escape' && ELEF.inst && !(typeof Pistes !== 'undefined' && Pistes._E.obertes)) ELEF.inst.callaGlobus();
});
function mostrarMissatgeElefant() { /* l'Elefant ja no xerra sol; es manté per compatibilitat amb crides antigues */ }
function elefantSalutacio() { /* sense salutacions automàtiques */ }

// ---------- Jocs ----------
function elefantPartidaNova() {
  ELEF.partida = 0; ELEF.silenciPartida = false; ELEF.errorsSeguits = 0; ELEF.encertsSeguits = 0;
  if (typeof Pistes !== 'undefined') Pistes.reinicia();
  if (ELEF.inst && enJoc()) { ELEF.inst.callaGlobus(); ELEF.inst.deixaDAssenyalar(); elefantAmaga(); }
}
function elefantEvent(tipus) {
  if (!enJoc() || !ELEF.inst) return;
  if (typeof Pistes !== 'undefined') Pistes.activitat();
  if (tipus === 'encert') { ELEF.errorsSeguits = 0; ELEF.encertsSeguits++; if (typeof Pistes !== 'undefined') Pistes.encert(); }
  else if (tipus === 'error') { ELEF.encertsSeguits = 0; ELEF.errorsSeguits++; if (typeof Pistes !== 'undefined') Pistes.error(ELEF.errorsSeguits); }
}
function elefantCelebra() { }
function elefantTrist() { }
function elefantFiPartida() { }

// ---------- Botó de la barra del joc: una bombeta (les pistes són sempre aquí; l'Elefant només hi surt per ajudar) ----------
function muntaBotoElefantJocs() {
  document.querySelectorAll('.screen-joc .barra-joc').forEach(b => {
    if (b.querySelector('.el-slot-joc')) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ib el-slot-joc sense-elefant'; btn.dataset.accio = 'elefant'; btn.setAttribute('aria-label', 'Demanar una pista'); btn.innerHTML = ico('bulb'); btn.hidden = true;
    const ajuda = b.querySelector('[data-accio="ajuda"]'); if (ajuda) b.insertBefore(btn, ajuda); else b.appendChild(btn);
  });
}
function actualitzaBotoPistaJoc(id) {
  if (!id || !id.startsWith('joc-')) return;
  const b = document.querySelector('#' + id + ' .el-slot-joc'); if (!b) return;
  const joc = id.slice(4), def = typeof JOCS !== 'undefined' && JOCS[joc] && JOCS[joc].pista, enDuel = typeof duel !== 'undefined' && duel && duel.mode === 'duel';
  b.hidden = !def || modeLectura || modeActual === '2vs2' || enDuel;      // en un duel les pistes serien trampa; en mode «Junts» sí que es permeten
}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-accio="elefant"]'); if (b && typeof Pistes !== 'undefined') Pistes.demana(); });

// ---------- Configuració: presència, nom i roba ----------
function elefantRefrescaPresencia() {
  pintarToggles(); renderConfigElefant(); elefantPantalla(idPantallaActiva() || 'inici');
  document.querySelectorAll('.screen-joc').forEach(s => actualitzaBotoPistaJoc(s.id));
}
function elefantCanviaNom(v) { ajustes.elefantNom = String(v || '').slice(0, 24); guardarAjustes(); actualitzaEtiquetaElefant(); }
function elefantTriaVestit(id) {
  const lliures = elefantVestuariDesbloquejat(); if (!lliures.includes(id)) return;
  const set = new Set(ajustes.elefantVestuari || []); set.has(id) ? set.delete(id) : set.add(id);
  ajustes.elefantVestuari = [...set]; guardarAjustes(); soClic(); elefantInst(); elefantAplicaVestuari(); renderConfigElefant();
}
function renderConfigElefant() {
  const l = $('elefantVestuariLlista'); if (!l) return;
  const lliures = elefantVestuariDesbloquejat(), triats = ajustes.elefantVestuari || [];
  l.innerHTML = ELEFANT_ACCESSORIS.map(a => { const ok = lliures.includes(a.id), on = ok && triats.includes(a.id);
    return `<button type="button" class="vestit${on ? ' sel' : ''}${ok ? '' : ' bloquejat'}" aria-pressed="${on}" ${ok ? '' : 'aria-disabled="true"'} onclick="elefantTriaVestit('${a.id}')"><strong>${esc(a.nom)}</strong><small>${ok ? (on ? 'Posat' : 'Disponible') : 'Es desbloqueja amb ' + esc(a.desc)}</small></button>`; }).join('');
  const n = $('elefantNomInput'); if (n && document.activeElement !== n) n.value = ajustes.elefantNom || '';
  const a = $('ajudaElefant'); if (a) a.textContent = t(PRESENCIES[presenciaActual()].desc);
}

// ---------- Bingo: només el recordatori de cantar LÍNIA o BINGO (és una ajuda); la resta, l'Elefant calla ----------
function elefantBingoBola() { }
function elefantBingoFi() { }
function elefantBingoPremi(tipus) {
  if (!elefantPermes()) return;
  if (elefantDiuCtx(tipus === 'linia' ? 'bingo_linia_record' : 'bingo_bingo_record', { nom: nomPersona() }, { ajuda: true, emocio: 'content', durada: 4500 })) elefantTornaAlCostat(5200);
}
function elefantParella() { }
function elefantResident() { }
function elefantResumProgres() { }
function elefantRespiraInici() { }
function elefantRespiraFase() { }
function elefantRespiraFi() { }

// ---------- Integració amb l'app ----------
function elefantInicialitza() {
  muntaBotoElefantJocs();
  const _mp = mostrarPantalla;
  mostrarPantalla = function (id, opcions) { _mp(id, opcions); try { elefantPantalla(id); } catch (x) { console.error(x); } };
  document.addEventListener('menta:usuaris', () => elefantAplicaVestuari());
  document.addEventListener('menta:idioma', () => actualitzaEtiquetaElefant());
  const _cfg = PANTALLA_ENTRA.configuracio; PANTALLA_ENTRA.configuracio = () => { if (_cfg) _cfg(); renderConfigElefant(); };
  window.addEventListener('offline', () => { if (elefantPermes() && !enJoc() && visible()) elefantDiuCtx('sense_connexio', {}, { ajuda: true, durada: 5000 }); });
  elefantPantalla(idPantallaActiva() || 'inici');
}
