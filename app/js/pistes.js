'use strict';
// ==========================================================
//  MentA · SISTEMA D'AJUDES I PISTES (v1.9)
//  Cada joc declara: registrarJoc({ …, pista: { obtenir(nivell) → { text, objectiu?, aplica?, explica? } | null, proactiva?: false } }).
//  3 nivells progressius (la persona tria fins on arribar):
//    1 · una frase d'ànim o d'orientació
//    2 · l'Elefantet assenyala amb la trompa la zona o l'element (anell pulsant)
//    3 · desvela una part de la solució, explicant el perquè
//  No és cap càstig: no resta estrelles ni es mostra com a fracàs; només es registra (ajudesUsades + nivell màxim) per al Cuidador.
//  L'Elefant no hi és mentre jugues: surt per la vora dreta només quan s'ofereix ajuda o es demana una pista, i se'n va en acabar.
//  Oferta: després de N errors seguits o de molta estona sense moure res pregunta «Vols una pista?» (Sí / Ara no).
//  Si es rebutja dues vegades, deixa d'oferir-ho en aquella partida.
// ==========================================================
const Pistes = (() => {
  const E = { errors: 0, rebutjades: 0, ofertaActiva: false, nivell: 0, maxNivell: 0, usos: 0, ultimaActivitat: Date.now(), ultimaOferta: 0, obertes: false, reg: {} };
  let temporitzador = 0;
  const def = () => (typeof JOCS !== 'undefined' && JOCS[jocActualId] && JOCS[jocActualId].pista) || null;
  const jugant = () => enJoc() && typeof partidaAcabada !== 'undefined' && !partidaAcabada && !enPausa && !document.querySelector('.modal-fons.actiu, #tutorialOverlay.actiu');
  function obtenir(n) { const d = def(); if (!d) return null; try { return d.obtenir(n) || null; } catch (x) { console.error(x); return null; } }
  const disponible = () => !!def() && !modeLectura && !!obtenir(1);

  function reinicia() {
    Object.assign(E, { errors: 0, rebutjades: 0, ofertaActiva: false, nivell: 0, maxNivell: 0, usos: 0, ultimaActivitat: Date.now(), ultimaOferta: 0, reg: {} });
    tanca(true); clearInterval(temporitzador);
    if (def() && def().proactiva !== false) temporitzador = setInterval(vigila, 1500);
  }
  function activitat() { E.ultimaActivitat = Date.now(); }
  function encert() { E.errors = 0; }
  function error(seguits) { E.errors = seguits; if (puntOferta()) ofereix(); }
  function puntOferta() {
    const r = reglesPresencia();
    if (!r.errorsPista || E.rebutjades >= 2 || E.ofertaActiva || E.obertes || !jugant() || def().proactiva === false) return false;
    if (Date.now() - E.ultimaOferta < 25000) return false;
    return E.errors >= r.errorsPista && disponible();
  }
  function vigila() {
    if (!def() || !jugant() || E.ofertaActiva || E.obertes) return;
    const r = reglesPresencia(); if (!r.inactiuMs || E.rebutjades >= 2 || !elefantPermes()) return;
    if (Date.now() - E.ultimaActivitat > r.inactiuMs && Date.now() - E.ultimaOferta > 25000 && disponible()) ofereix();
  }
  const ofertaActiva = () => E.ofertaActiva;

  // ---- Oferta amable: l'Elefant surt per la dreta i pregunta ----
  function ofereix() {
    if (!elefantPermes()) return; const e = elefantSurt(); if (!e) return;
    E.ofertaActiva = true; E.ultimaOferta = Date.now();
    e.estat('pensant'); e.diu(Dialegs.tria('pista_oferta', { nom: nomPersona() }), { veu: !!ajustes.elefantVeu, durada: 0, accions: [
      { text: 'Sí', principal: true, fer: () => { E.ofertaActiva = false; mostraNivell(1, true); } },
      { text: 'Ara no', fer: () => { E.ofertaActiva = false; E.rebutjades++; elefantTornaAlCostat(300); } }] });
    clearTimeout(E.tOferta); E.tOferta = setTimeout(() => { if (E.ofertaActiva) { E.ofertaActiva = false; E.rebutjades += 0.5; e.callaGlobus(); elefantTornaAlCostat(300); } }, 16000);
    elefantNotaComentari();
  }

  // ---- Demanar (botó de la bombeta o menú de l'Elefant) ----
  function demana() {
    if (!def()) return;
    activitat(); soClic();
    if (!disponible()) { const text = Dialegs.tria('pista_no_disponible', { nom: nomPersona() }); if (elefantPermes()) { const e = elefantSurt(); if (e) { e.diu(text, { durada: 3500 }); elefantTornaAlCostat(4200); return; } } toast(text, 3000); return; }
    E.ofertaActiva = false; clearTimeout(E.tOferta);
    mostraNivell(E.obertes ? Math.min(3, E.nivell + 1) : 1);
  }
  function registra(n) {
    E.usos++; E.maxNivell = Math.max(E.maxNivell, n); E.reg[n] = (E.reg[n] || 0) + 1;
    if (typeof _ajudesPartida !== 'undefined') _ajudesPartida++;
  }
  const resum = () => (E.usos ? { n: E.usos, nivell: E.maxNivell } : null);

  function mostraNivell(n) {
    let r = obtenir(n); if (!r && n > 1) { n = n - 1; r = obtenir(n); } if (!r) return;
    E.nivell = n; E.obertes = true; registra(n);
    const seguent = n < 3 && obtenir(n + 1);
    const intro = Dialegs.tria('pista_' + n, {}), text = n === 1 ? `${intro} ${t(r.text)}` : t(n === 2 ? r.text : (r.explica || r.text));      // el text del joc es tradueix a part (l'intro ja ve en l'idioma de l'Elefant)
    const accions = [{ text: 'Entès', principal: !seguent, fer: () => tanca() }];
    if (seguent) accions.push({ text: n === 1 ? 'Assenyala-m\'ho' : 'Mostra-m\'ho', principal: true, tanca: false, fer: () => mostraNivell(n + 1) });
    if (r.aplica) { try { r.aplica(); } catch (x) { console.error(x); } }
    const objs = objectius(r.objectiu), obj = objs[0];
    const e = elefantPermes() ? elefantSurt() : null;
    if (!e) { mostraSenseElefant(n, text, accions, objs); return; }          // presència «Apagat»: targeta de text
    e.estat('pensant'); e.deixaDAssenyalar();
    e.diu(text, { durada: 0, accions, veu: !!ajustes.elefantVeu });
    if (n >= 2 && obj) setTimeout(() => { if (E.obertes) { e.assenyala(obj, { durada: 60000, retorna: false }); objs.slice(1).forEach(ancorExtra); } }, 350);
  }
  // Sense Elefant (presència «Apagat»): el text va a una targeta i l'objectiu s'il·lumina amb l'anell
  function mostraSenseElefant(n, text, accions, objs) {
    const c = document.createElement('div'); c.id = 'pistaTargeta'; c.className = 'pista-targeta'; c.setAttribute('role', 'status'); c.setAttribute('aria-live', 'polite');
    c.innerHTML = `<p>${esc(text)}</p><div class="el-globus-accions"></div>`;
    const ac = c.querySelector('.el-globus-accions');
    accions.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.className = 'el-boto ' + (a.principal ? 'principal' : 'secundari'); b.textContent = a.text; b.onclick = () => { if (a.tanca !== false) tanca(); if (a.fer) a.fer(); }; ac.appendChild(b); });
    const antic = $('pistaTargeta'); if (antic) antic.remove(); document.body.appendChild(c);
    if (n >= 2 && objs.length) { ancorAnell(objs[0]); objs.slice(1).forEach(ancorExtra); }
  }
  function ancorAnell(obj) {
    treuAnellPista();
    const b = obj.getBoundingClientRect ? obj.getBoundingClientRect() : { left: obj[0] - 20, top: obj[1] - 20, width: 40, height: 40 };
    const a = document.createElement('div'); a.className = 'el-anell'; a.id = 'pistaAnell'; const d = Math.max(40, Math.max(b.width, b.height) + 12);
    a.style.cssText = `left:${b.left + b.width / 2}px;top:${b.top + b.height / 2}px;width:${d}px;height:${d}px`; document.body.appendChild(a);
  }
  // Un objectiu pot ser un element, una coordenada [x, y], una funció que en torna o una llista (el primer és el principal)
  function objectius(o) {
    let v = typeof o === 'function' ? o() : o; if (v == null) return [];
    if (Array.isArray(v) && typeof v[0] === 'number') return [v];
    return (Array.isArray(v) ? v : [v]).filter(Boolean);
  }
  function ancorExtra(obj) {
    const b = obj.getBoundingClientRect(), a = document.createElement('div'), d = Math.max(40, Math.max(b.width, b.height) + 12);
    a.className = 'el-anell pista-anell-extra'; a.style.cssText = `left:${b.left + b.width / 2}px;top:${b.top + b.height / 2}px;width:${d}px;height:${d}px`; document.body.appendChild(a);
  }
  const treuAnellPista = () => { document.querySelectorAll('#pistaAnell, .pista-anell-extra').forEach(a => a.remove()); };

  function tanca(silenci) {
    clearTimeout(E.tOferta);
    const e = ELEF.inst; E.obertes = false; E.nivell = 0; E.ofertaActiva = false;
    treuAnellPista(); const c = $('pistaTargeta'); if (c) c.remove();
    if (e) { e.deixaDAssenyalar(); e.treuAnell(); if (!silenci) e.callaGlobus(); }
    if (!silenci && enJoc()) elefantTornaAlCostat(250);
  }
  // Si la persona toca el tauler mentre l'ajuda és oberta (nivells 2 i 3), ho entenem com «ja ho veig»
  document.addEventListener('pointerdown', ev => { if (!jugant()) return; activitat(); if (E.obertes && !ev.target.closest('#elefantFlotant, .pista-targeta, [data-accio="elefant"]')) setTimeout(() => { if (E.obertes && E.nivell >= 2) tanca(); }, 120); }, true);
  document.addEventListener('keydown', ev => { activitat(); if (ev.key === 'Escape' && E.obertes) tanca(); }, true);
  return { reinicia, activitat, encert, error, demana, resum, ofertaActiva, disponible, tanca, _E: E };
})();
