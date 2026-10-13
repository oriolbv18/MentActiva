'use strict';
// ==========================================================
//  MentA · MODE PILOT (v1.9)
//  Per fer proves amb persones reals sense recollir dades personals: participants amb codi anònim (P01, P02…),
//  sense fotos, sense dades d'exemple, amb versió i data visibles i exportació de resultats en un clic.
//  S'activa a Configuració → «Mode pilot» amb un codi (CODI_PILOT a config.js). Veure docs/PILOT.md.
// ==========================================================
const CLAU_PILOT = 'mentA_pilot';
const pilotActiu = () => !!(ajustes && ajustes.pilot);
const SUS_PREGUNTES = [
  'Crec que faria servir MentA sovint.', 'He trobat MentA complicada sense necessitat.', 'He trobat MentA fàcil d\'utilitzar.', 'Crec que necessitaria ajuda d\'una persona per poder fer-la servir.',
  'Les diferents funcions de MentA estan ben integrades.', 'He trobat massa incoherències a MentA.', 'Crec que la majoria de la gent aprendria a fer servir MentA molt de pressa.',
  'He trobat MentA molt feixuga d\'utilitzar.', 'M\'he sentit molt segur/a fent servir MentA.', 'He hagut d\'aprendre moltes coses abans de poder fer servir MentA.'
];
// Puntuació SUS (0–100): ítems senars (resposta − 1), parells (5 − resposta), suma × 2,5
function puntuacioSUS(r) { if (!Array.isArray(r) || r.length !== 10 || r.some(x => !(x >= 1 && x <= 5))) return null; return r.reduce((t, x, i) => t + (i % 2 === 0 ? x - 1 : 5 - x), 0) * 2.5; }

// ---------- Activar / desactivar ----------
function pilotActiva() {
  const v = ($('pilotCodi').value || '').trim();
  if (!v) { toast('Escriu el codi de pilot.', 3000); return; }
  if (v.toUpperCase() !== String(CODI_PILOT).toUpperCase()) { toast('Aquest codi no és vàlid.', 3500, 'error'); return; }
  if (usuaris.some(u => u.demo)) { toast('Surt primer del mode demostració.', 4000); return; }
  ajustes.pilot = true; ajustes.pilotInici = ajustes.pilotInici || avuiISO(); guardarAjustes(); aplicaPilot(); soEncert(); toast('Mode pilot activat. Els participants es crearan amb un codi (P01, P02…).', 5500, 'exit');
}
function pilotDesactiva() {
  mostrarConfirmacio('Desactivar el mode pilot?', 'Les persones ja creades es queden tal com són (amb el seu codi). Pots tornar-lo a activar quan vulguis.', () => { ajustes.pilot = false; guardarAjustes(); aplicaPilot(); toast('Mode pilot desactivat.'); }, { boto: 'Sí, desactiva', perill: false });
}
function aplicaPilot() {
  document.body.classList.toggle('mode-pilot', pilotActiu());
  const on = pilotActiu();
  mostra('pilotFormActiva', !on, 'block'); mostra('pilotPanellActiu', on, 'block');
  const b = $('banerPilot'); if (b) { b.hidden = !on; if (on) b.innerHTML = `<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>Mode pilot</strong> · v${esc(VERSIO)} · ${esc(avuiISO())}. Sense noms ni fotos.</span></div>`; }
  const llista = $('pilotLlista'); if (llista && on) llista.innerHTML = usuaris.length ? usuaris.map(u => `<div class="ajust-fila"><div class="etiqueta-ajust">${esc(u.nom)}<small>${(u.dades.totalPartides || 0)} partides · SUS ${u.dades.pilot && u.dades.pilot.sus != null ? u.dades.pilot.sus : '—'}</small></div><button type="button" class="boto-secundari boto-petit" onclick="pilotObreSUS('${esc(u.id)}')">Escala SUS</button></div>`).join('') : '<p class="ajuda-camp">Encara no hi ha cap participant.</p>';
  const mem = $('memory-fotos'); if (mem && on) mem.style.display = 'none';
}
const codiSeguent = () => { const n = usuaris.filter(u => /^P\d{2,}$/.test(u.nom)).length + 1; let c; let k = n; do { c = 'P' + String(k++).padStart(2, '0'); } while (usuaris.some(u => u.nom === c)); return c; };

// En mode pilot, qui es crea rep un codi (mai un nom) i cap foto
(() => {
  const _g = guardarUsuari;
  guardarUsuari = function () {
    if (!pilotActiu() || editantUsuariId) return _g();
    $('inputNomUsuari').value = codiSeguent(); fotoPerfilTemp = null; return _g();
  };
  const _f = obrirFormulariUsuari;
  obrirFormulariUsuari = function (id) { _f(id); if (pilotActiu()) { const n = $('inputNomUsuari'); if (!id) n.value = codiSeguent(); n.readOnly = true; n.setAttribute('aria-describedby', 'ajudaPilotNom'); } else { $('inputNomUsuari').readOnly = false; } };
  const _cd = carregarDemo; carregarDemo = function () { if (pilotActiu()) { toast('La demostració està desactivada en mode pilot.', 4000); return; } return _cd(); };
  const _oj = obrirJoc;
  obrirJoc = function (id, dos) { pilotRegistraPrimerJoc(); return _oj(id, dos); };
})();

// ---------- Mètriques del pilot: temps i tocs fins al primer joc ----------
let _tAcces = Date.now(), _tocsAcces = 0;
document.addEventListener('pointerdown', () => { _tocsAcces++; }, true);
document.addEventListener('menta:usuaris', () => { _tAcces = Date.now(); _tocsAcces = 0; });
function pilotReiniciaAcces() { _tAcces = Date.now(); _tocsAcces = 0; }
function pilotRegistraPrimerJoc() {
  if (!pilotActiu() || modeLectura) return; const d = dadesActuals(); if (!d) return;
  d.pilot = d.pilot || {}; if (d.pilot.primerJocS != null) return;
  d.pilot.primerJocS = Math.round((Date.now() - _tAcces) / 100) / 10; d.pilot.primerJocTocs = _tocsAcces; d.pilot.primerJocData = new Date().toISOString(); guardarDadesUsuari();
}

// ---------- Escala SUS ----------
let _susUsuari = null;
function pilotObreSUS(id) {
  _susUsuari = id; const u = usuaris.find(x => x.id === id); if (!u) return;
  const r = (u.dades.pilot && u.dades.pilot.susResp) || Array(10).fill(0);
  $('susTitol').textContent = 'Escala SUS · ' + u.nom;
  $('susPreguntes').innerHTML = SUS_PREGUNTES.map((p, i) => `<fieldset class="sus-pregunta"><legend>${i + 1}. ${esc(p)}</legend><div class="segmentat" role="radiogroup" aria-label="Pregunta ${i + 1}">${[1, 2, 3, 4, 5].map(v => `<button type="button" role="radio" aria-checked="${r[i] === v}" class="${r[i] === v ? 'sel' : ''}" onclick="pilotSUSTria(${i}, ${v}, this)" aria-label="${v}: ${['gens d\'acord', 'poc d\'acord', 'neutral', 'd\'acord', 'molt d\'acord'][v - 1]}">${v}</button>`).join('')}</div></fieldset>`).join('');
  $('susResultat').textContent = ''; window.__susResp = r.slice(); obrirModal('modalSUS');
}
function pilotSUSTria(i, v, el) { window.__susResp[i] = v; el.parentElement.querySelectorAll('button').forEach(b => { const on = b === el; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); }); soClic(); }
function pilotDesaSUS() {
  const s = puntuacioSUS(window.__susResp); if (s == null) { $('susResultat').textContent = 'Falta alguna resposta (1 a 5 a totes les preguntes).'; return; }
  const u = usuaris.find(x => x.id === _susUsuari); if (!u) return;
  u.dades.pilot = u.dades.pilot || {}; u.dades.pilot.susResp = window.__susResp.slice(); u.dades.pilot.sus = s; guardarUsuaris();
  tancarModal('modalSUS'); toast(`SUS de ${u.nom}: ${s}`, 3500, 'exit'); aplicaPilot();
}

// ---------- Exportar els resultats (un clic) ----------
function pilotResultats() {
  return usuaris.filter(u => !u.demo).map(u => {
    const d = u.dades, h = d.historial || [], p = d.pilot || {}, aj = h.reduce((t, x) => t + (x.ajudesUsades || 0), 0), ambPista = h.filter(x => x.pistes).length, pista3 = h.filter(x => x.pistes && x.pistes.nivell >= 3).length;
    const onb = lsGet(CLAU_ONB, null) || {};
    return { codi: u.nom, partides: d.totalPartides || 0, dies: (d.diesJugats || []).length, encerts_pct: (d.totalEncerts + d.totalErrors) ? Math.round(d.totalEncerts / (d.totalEncerts + d.totalErrors) * 100) : null,
      temps_primer_joc_s: p.primerJocS ?? null, tocs_primer_joc: p.primerJocTocs ?? null, partides_amb_pista: ambPista, partides_pista_nivell3: pista3, ajudes_totals: aj, abandonaments: (d.abandonaments || []).length,
      onboarding_completat: !!(onb.data && !onb.saltat), sus: p.sus ?? null, medalles: (d.medalles || []).length };
  });
}
function pilotExporta() {
  const files = pilotResultats(); if (!files.length) { toast('Encara no hi ha participants.', 3500); return; }
  const resum = { app: 'MentA', versio: VERSIO, data: avuiISO(), participants: files.length, sus_mitjana: (() => { const s = files.map(f => f.sus).filter(x => x != null); return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10 : null; })(),
    temps_primer_joc_mitjana_s: (() => { const s = files.map(f => f.temps_primer_joc_s).filter(x => x != null); return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10 : null; })(),
    onboarding_completat_pct: Math.round(files.filter(f => f.onboarding_completat).length / files.length * 100), pistes_pct: Math.round(files.filter(f => f.partides_amb_pista > 0).length / files.length * 100), nota: 'Dades anònimes: només codis de participant, sense noms ni fotos.' };
  const cols = Object.keys(files[0]), csv = [cols.join(','), ...files.map(f => cols.map(c => f[c] == null ? '' : f[c]).join(','))].join('\n');
  baixaFitxer(`MentA-pilot-${avuiISO()}.json`, JSON.stringify({ resum, participants: files }, null, 1), 'application/json');
  setTimeout(() => baixaFitxer(`MentA-pilot-${avuiISO()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8'), 600);
  toast('Resultats del pilot descarregats (JSON i CSV).', 4500, 'exit');
}

(() => { const _c = PANTALLA_ENTRA.configuracio; PANTALLA_ENTRA.configuracio = () => { if (_c) _c(); aplicaPilot(); }; })();
document.addEventListener('menta:usuaris', () => { if (pilotActiu()) aplicaPilot(); });
function pilotInicialitza() { aplicaPilot(); }
