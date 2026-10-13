'use strict';
// ==========================================================
//  MentA · MODE RESIDÈNCIA (v1.8)
//  Una tauleta compartida: selector de resident amb cara i nom, tornada automàtica
//  al selector, mode quiosc i panell de planta per al professional (amb PIN).
// ==========================================================
const INACTIVITAT_RESIDENT = 3 * 60 * 1000;
let _ultimaActivitat = Date.now(), filtreResidencia = 'tots', ordreResidencia = 'atencio';

// ---------- Selector de resident ----------
function renderSelectorResident() {
  const g = $('residentsGraella'); if (!g) return;
  const llista = usuaris.filter(u => !u.demo || usuaris.some(x => x.demo));
  g.innerHTML = llista.length ? llista.map(u => `<button type="button" class="resident-targeta" onclick="residentTria('${esc(u.id)}')"><span class="resident-av" style="background:${u.foto ? 'transparent' : fonsAvatar(u.color)}">${htmlAvatar(u)}</span><strong>${esc(u.nom)}</strong></button>`).join('')
    : '<div class="estat-buit" style="grid-column:1/-1"><span class="targeta-ico gran dom-memoria">' + ico('usuari') + '</span><h3>Encara no hi ha cap resident</h3><p>Toca «Afegir resident» (et demanarà el PIN del professional).</p></div>';
  const s = $('selectorSub'); if (s) s.textContent = llista.length ? 'Toca la teva foto' : '';
}
function residentTria(id) { soClic(); canviarUsuariSilenciós(id); _ultimaActivitat = Date.now(); mostrarPantalla('inici'); if (typeof elefantResident === 'function' && presenciaActual() !== 'apagat') elefantResident(getUsuariActual().nom); else toast('Hola, ' + getUsuariActual().nom, 1800); }
function canviarUsuariSilenciós(id) { usuariActualId = id; guardarUsuaris(); actualitzarHeaderUsuari(); sessio = null; if (typeof refrescarTot === 'function') refrescarTot(); }
function residenciaAfegir() { const obre = () => { obrirModalNouUsuari(); }; if (teCuidadorPin() && !cuidadorObert) demanaPin('entrar', () => { cuidadorObert = true; reiniciaInactivitatCuidador(); obre(); }); else obre(); }
PANTALLA_ENTRA.selectorResident = renderSelectorResident;
// En mode residència, el botó d'usuari de la capçalera torna al selector (la modal d'usuaris queda per al professional)
const _obrirModalUsuarisOriginal = obrirModalUsuaris;
obrirModalUsuaris = function (forcar) { if (ajustes.rol === 'residencia' && forcar !== true) { sessio = null; mostrarPantalla('selectorResident'); return; } _obrirModalUsuarisOriginal(); };

// ---------- Tornada automàtica al selector i mode quiosc ----------
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { _ultimaActivitat = Date.now(); }, true));
setInterval(() => {
  if (ajustes.rol !== 'residencia' || modeLectura) return;
  const id = idPantallaActiva();
  if (id === 'selectorResident' || cuidadorObert || document.querySelector('.modal-fons.actiu:not(#modalPausa)')) { if (id !== 'selectorResident' && !cuidadorObert) _ultimaActivitat = Date.now(); return; }
  if (Date.now() - _ultimaActivitat > INACTIVITAT_RESIDENT) { if (enJoc()) { if (partidaEnCurs()) registraAbandonament(); document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); } sessio = null; mostrarPantalla('selectorResident'); }
}, 5000);
function alternaQuiosc() {
  const el = document.documentElement;
  try { if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } else document.exitFullscreen(); } catch (e) { toast('Aquest dispositiu no permet la pantalla completa.', 3500); }
}
document.addEventListener('fullscreenchange', () => { document.body.classList.toggle('quiosc', !!document.fullscreenElement); setText('btnQuiosc', ''); const b = $('btnQuiosc'); if (b) b.innerHTML = `${ico('ull')}<span>${document.fullscreenElement ? 'Sortir de pantalla completa' : 'Pantalla completa'}</span>`; });

// ---------- Panell de planta (pestanya «Residència» de l'Espai del Cuidador) ----------
function resumResident(u) {
  const d = u.dades, antic = usuariActualId, s = (() => { usuariActualId = u.id; try { return calculaSemafor(d); } finally { usuariActualId = antic; } })();
  const a28 = agrega(d, 0, 27), a7 = setmanaDades(d, 0), avui = d.historial.filter(h => h.data === avuiISO()).length, sense = jocsSenseJugarDies(d);
  return { u, s, a28, a7, avui, sense, consent: d.consentiment ? d.consentiment.estat : 'pendent' };
}
const PES_ESTAT = { vermell: 0, groc: 1, gris: 2, verd: 3 };
function filaResidencia() {
  let llista = usuaris.filter(u => !(u.demo && !usuaris.every(x => x.demo) && false)).map(resumResident);
  if (filtreResidencia === 'atencio') llista = llista.filter(r => r.s.estat === 'groc' || r.s.estat === 'vermell');
  if (filtreResidencia === 'avui') llista = llista.filter(r => !r.avui);
  if (filtreResidencia === 'dies5') llista = llista.filter(r => r.sense == null || r.sense >= 5);
  return llista.sort((a, b) => ordreResidencia === 'nom' ? a.u.nom.localeCompare(b.u.nom) : (PES_ESTAT[a.s.estat] - PES_ESTAT[b.s.estat]) || ((b.sense ?? 99) - (a.sense ?? 99)));
}
function cuResidencia() {
  const tots = usuaris.map(resumResident), amb = tots.filter(r => r.a28.pct != null);
  const avui = tots.reduce((t, r) => t + r.avui, 0), pctM = amb.length ? Math.round(mitjana(amb.map(r => r.a28.pct))) : null, constants = tots.filter(r => r.a7.dies >= 3).length;
  const llista = filaResidencia();
  const files = llista.map(r => `<tr><th scope="row"><button type="button" class="enllac-resident" onclick="cuObreResident('${esc(r.u.id)}')"><span class="av-mini" style="background:${r.u.foto ? 'transparent' : fonsAvatar(r.u.color)}">${htmlAvatar(r.u)}</span>${esc(r.u.nom)}</button></th><td>${htmlSemaforXip(r.s)}</td><td>${r.sense == null ? 'Mai' : r.sense === 0 ? 'Avui' : 'Fa ' + r.sense + ' d.'}</td><td>${r.avui}</td><td>${r.a7.dies}/7</td><td>${r.a28.pct != null ? Math.round(r.a28.pct) + '%' : '—'}</td><td>${r.consent === 'no' ? 'No' : r.consent === 'pendent' ? 'Pendent' : 'Sí'}</td></tr>`).join('');
  return `<div class="kpis"><div class="kpi"><div class="kpi-et">Residents</div><div class="kpi-val">${tots.length}</div></div><div class="kpi"><div class="kpi-et">Sessions d'avui</div><div class="kpi-val">${avui}</div></div><div class="kpi"><div class="kpi-et">Precisió mitjana (28 d.)</div><div class="kpi-val">${pctM == null ? '—' : pctM + '%'}</div></div><div class="kpi"><div class="kpi-et">Amb constància (≥3 dies/setm.)</div><div class="kpi-val">${constants}<small>/${tots.length}</small></div></div></div>
    <div class="panell"><div class="filtre-residencia"><div class="segmentat" role="group" aria-label="Filtrar residents">${[['tots', 'Tots'], ['atencio', 'Necessiten atenció'], ['avui', 'Sense sessió avui'], ['dies5', 'Fa 5+ dies']].map(([k, n]) => `<button type="button" aria-pressed="${filtreResidencia === k}" onclick="filtreResidencia='${k}';soClic();renderCuidador()">${n}</button>`).join('')}</div>
      <label class="etiqueta-camp" for="ordreRes">Ordenar per</label><select id="ordreRes" class="camp-input" onchange="ordreResidencia=this.value;renderCuidador()"><option value="atencio"${ordreResidencia === 'atencio' ? ' selected' : ''}>Qui necessita més atenció</option><option value="nom"${ordreResidencia === 'nom' ? ' selected' : ''}>Nom</option></select></div>
      <div class="taula-wrap" role="region" aria-label="Taula de residents" tabindex="0"><table class="taula-cu"><caption class="nomes-lector">Residents</caption><thead><tr><th scope="col">Resident</th><th scope="col">Semàfor</th><th scope="col">Última sessió</th><th scope="col">Avui</th><th scope="col">Setmana</th><th scope="col">Precisió</th><th scope="col">Consentiment</th></tr></thead><tbody>${files || '<tr><td colspan="7">Cap resident amb aquest filtre.</td></tr>'}</tbody></table></div></div>
    <div class="panell grup-ajustos"><h3>Exportar</h3>
      <button type="button" class="boto-secundari boto-ample" onclick="residenciaCSV()">${ico('document')}Resum de planta (CSV)</button>
      <button type="button" class="boto-secundari boto-ample" onclick="residenciaPDF()">${ico('document')}Informe de planta (PDF, una fila per resident)</button>
      <p class="ajuda-camp">Per a l'informe individual d'un resident (família o professional), obre'l i ves a la pestanya Informe. Els residents sense consentiment no s'inclouen a les exportacions.</p></div>`;
}
function cuObreResident(id) { cuidadorTriaPersona(id); pestanyaCu = 'resum'; renderCuidador(); window.scrollTo({ top: 0 }); }
function dadesPlanta() {
  return usuaris.filter(u => !u.dades.consentiment || u.dades.consentiment.estat !== 'no').map(resumResident);
}
function residenciaCSV() {
  const fila = a => a.map(v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
  const f = [fila(['resident', 'semafor', 'dies_sense_jugar', 'sessions_avui', 'dies_actius_7d', 'dies_actius_28d', 'sessions_28d', 'precisio_28d_pct', 'temps_reaccio_ms', 'abandonaments_28d', 'avisos'])];
  dadesPlanta().forEach(r => f.push(fila([r.u.nom, r.s.estat, r.sense ?? '', r.avui, r.a7.dies, r.a28.dies, r.a28.n, r.a28.pct != null ? Math.round(r.a28.pct) : '', r.a28.tr ?? '', r.a28.ab, r.s.avisos.map(a => a.titol).join(' | ')])));
  baixaFitxer(`MentA-planta-${avuiISO()}.csv`, '﻿' + f.join('\n'), 'text/csv;charset=utf-8'); registraAcces('exporta', 'resum de planta (CSV)'); toast('Resum de planta descarregat', 3000, 'exit');
}
async function residenciaPDF() {
  const ok = await carregaJsPDF(); if (!ok) { toast('No s\'ha pogut preparar el PDF.', 4500, 'error'); return; }
  const doc = pdfNou({ orientation: 'landscape', unit: 'mm', format: 'a4' }), V = [19, 74, 44];
  doc.setFillColor(...V); doc.rect(0, 0, 297, 24, 'F'); try { doc.addImage(LOGO_PDF, 'PNG', 10, 3, 18, 18); } catch (e) { /* sense logo */ }
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('MentA · Informe de planta (orientatiu)', 32, 13); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(new Date().toLocaleDateString('ca-ES'), 32, 19);
  let y = 36; doc.setTextColor(36, 31, 25); doc.setFont('helvetica', 'bold');
  const cols = [14, 70, 104, 134, 160, 190, 222]; ['Resident', 'Semàfor', 'Ult. sessió', 'Avui', 'Dies (7d)', 'Precisió', 'Avisos'].forEach((c, i) => doc.text(c, cols[i], y)); doc.setFont('helvetica', 'normal'); y += 6;
  const nom = { verd: 'Verd', groc: 'Groc', vermell: 'Vermell', gris: 'Sense dades' };
  dadesPlanta().sort((a, b) => PES_ESTAT[a.s.estat] - PES_ESTAT[b.s.estat]).forEach(r => {
    if (y > 190) { doc.addPage(); y = 20; }
    [r.u.nom, nom[r.s.estat], r.sense == null ? 'Mai' : r.sense === 0 ? 'Avui' : 'Fa ' + r.sense + ' d', r.avui, r.a7.dies + '/7', r.a28.pct != null ? Math.round(r.a28.pct) + '%' : '-', r.s.avisos.map(a => a.titol).join('; ').slice(0, 50)].forEach((c, i) => doc.text(String(c), cols[i], y)); y += 6;
  });
  doc.setFontSize(8.5); doc.setTextColor(90, 81, 70);
  doc.text(doc.splitTextToSize('Aquests indicadors són orientatius i mesuren el rendiment en uns jocs, no la salut. MentA no és un dispositiu sanitari ni fa diagnòstics. Si observeu canvis que us preocupen, consulteu un professional de la salut.', 270), 14, 200);
  const url = URL.createObjectURL(doc.output('blob')), a = document.createElement('a'); a.href = url; a.download = `MentA-planta-${avuiISO()}.pdf`; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
  registraAcces('exporta', 'informe de planta (PDF)'); toast('Informe de planta descarregat', 3000, 'exit');
}
