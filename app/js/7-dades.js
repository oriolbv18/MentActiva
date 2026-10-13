'use strict';
// ==========================================================
//  MentA · DADES
//  Còpia de seguretat (exportar/importar), CSV, esborrar-ho tot,
//  mode demostració, registre d'ús anònim i perfil a Configuració.
// ==========================================================
const PREFIX = 'mentA_';
const CLAUS_NO_EXPORTABLES = ['mentA_errors', 'mentA_us', 'mentA_prova', 'mentA_cuidador', 'mentA_registre_accessos'];
function totesLesClaus() { const r = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) r.push(k); } } catch (e) { /* sense accés */ } return r; }
function baixaFitxer(nom, contingut, tipus) {
  const url = URL.createObjectURL(new Blob([contingut], { type: tipus })), a = document.createElement('a');
  a.href = url; a.download = nom; a.style.display = 'none'; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}

// (L'exportació i la importació segura són a js/14-copia.js)
function exportarCSV() {
  const fila = a => a.map(v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
  const files = [fila(['usuari', 'data', 'joc', 'area', 'nivell', 'encerts', 'errors', 'resultat_pct', 'puntuacio', 'durada_s'])];
  [_convidat, ...usuaris].forEach(u => (u.dades.historial || []).forEach(h => files.push(fila([u.nom, h.data, nomJoc(h.joc), NOMS_DOMINI[h.domini] || h.domini, h.nivell || '', h.encerts, h.errors, h.pct, h.puntuacio, h.durada]))));
  if (files.length === 1) { toast('Encara no hi ha partides per exportar.'); return; }
  baixaFitxer(`MentA-partides-${avuiISO()}.csv`, '﻿' + files.join('\n'), 'text/csv;charset=utf-8');
  toast('Partides exportades en CSV', 3000, 'exit');
}
function esborrarTotesLesDades() {
  mostrarConfirmacio('Esborrar totes les dades?', 'Es perdran les partides, les estadístiques, les fotos, les notes i els ajustos de tots els usuaris d\'aquest dispositiu. Et recomanem exportar una còpia abans.', () => {
    setTimeout(() => mostrarConfirmacio('Última confirmació', 'Aquesta acció no es pot desfer. Segur que vols esborrar-ho tot?', () => {
      totesLesClaus().forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* res */ } });
      toast('Dades esborrades. Reiniciem MentA…', 2500); setTimeout(() => { location.hash = ''; location.reload(); }, 900);
    }, { boto: 'Sí, esborra-ho tot' }), 250);
  }, { boto: 'Continuar' });
}

// ---------- Perfil a Configuració ----------
function renderConfigPerfil() {
  const c = $('configPerfil'); if (!c) return;
  const u = getUsuariActual(), d = u.dades;
  c.innerHTML = `<div class="config-perfil"><span class="av" style="background:${u.foto ? 'transparent' : fonsAvatar(u.color)}">${htmlAvatar(u)}</span><div class="info"><strong>${esc(u.nom)}</strong><small>${d.totalPartides} partides · ${diesActius().size} dies actius</small></div></div>
    <div class="config-perfil-accions">${u.id !== 'convidat' ? `<button type="button" class="boto-secundari boto-petit" onclick="editarUsuari('${esc(u.id)}')">${ico('llapis')}Editar perfil</button>` : `<button type="button" class="boto-secundari boto-petit" onclick="obrirModalNouUsuari()">${ico('mes')}Crear el meu perfil</button>`}<button type="button" class="boto-secundari boto-petit" onclick="obrirModalUsuaris()">${ico('usuari')}Canviar d'usuari</button></div>`;
}
PANTALLA_ENTRA.configuracio = () => { renderConfigPerfil(); pintarToggles(); pintarRecordatorisConfig(); pintarEstatNotificacions(); const t = $('toggleDemo'); if (t) { const on = !!usuaris.find(x => x.demo); t.classList.toggle('actiu', on); t.setAttribute('aria-checked', on); } };

// ---------- Mode demostració: 8 residents fictícis amb trajectòries diferents (3 mesos) ----------
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const JOCS_AMB_TR = ['nback', 'stroop', 'quefalta', 'calcul', 'seqlog', 'tertulia', 'refranys', 'span', 'fluidesa', 'paraules'];
// w = setmanes enrere (0 = l'actual, 12 = la més antiga). Cada trajectòria diu quina precisió, constància i temps de reacció té cada setmana.
const TRAJECTORIES_DEMO = [
  { nom: 'Montserrat', color: '#2e8b57', avatar: 'sol', consent: 'si', desc: 'Estable', pct: w => 74, act: w => .65, tr: w => 1900 },
  { nom: 'Josep', color: '#2b6fb3', avatar: 'estrella', consent: 'tutor', desc: 'Millora', pct: w => 52 + (12 - w) * 2, act: w => .5 + (12 - w) * .02, tr: w => 2300 - (12 - w) * 40 },
  { nom: 'Carme', color: '#b3261e', avatar: 'cor', consent: 'tutor', desc: 'Baixada lenta', pct: w => w >= 6 ? 78 : 78 - (6 - w) * 5, act: w => .6, tr: w => w >= 6 ? 1800 : 1800 + (6 - w) * 180, notes: [[21, 'Ha estat constipada aquestes setmanes.']] },
  { nom: 'Antoni', color: '#7048a8', avatar: 'diana', consent: 'tutor', desc: 'Intermitent', pct: w => 70, act: w => w % 2 ? .12 : .8, tr: w => 2100 },
  { nom: 'Roser', color: '#0f7770', avatar: 'flama', consent: 'tutor', desc: 'Constància que cau', pct: w => 72, act: w => w >= 3 ? .75 : .15, tr: w => 2000 },
  { nom: 'Pere', color: '#c9771f', avatar: 'xat', consent: 'tutor', desc: 'Ànim baix recent', pct: w => 71, act: w => .6, tr: w => 2000, anim: 'baix' },
  { nom: 'Dolors', color: '#a14f7a', avatar: 'musica', consent: 'tutor', desc: 'Baixada recent', pct: w => w >= 2 ? 75 : 58, act: w => .65, tr: w => w >= 2 ? 1800 : 2600, notes: [[9, 'Ha canviat de medicació.']] },
  { nom: 'Joan', color: '#5a5146', avatar: 'inicial', consent: 'tutor', desc: 'Fa dies que no juga', pct: w => 73, act: w => .6, tr: w => 1950, aturaFa: 12, notes: [[11, 'Està de vacances amb la família.']] }
];
function generaDadesDemo(traj, seed, idUsuari) {
  const R = mulberry(seed), d = getDadesBuit(), jocs = jocsIndividuals(), DIES = 90, nivells = {}, nz = () => (R() + R() + R() - 1.5) / 1.5;
  for (let i = DIES; i >= 0; i--) {
    const w = Math.floor(i / 7), iso = dataMenys(i);
    if (traj.aturaFa && i < traj.aturaFa) continue;
    if (R() > traj.act(w) * (i === 0 ? .6 : 1) + (i > 0 && R() < .02 ? 0 : 0)) continue;
    d.diesJugats.push(iso);
    const n = 1 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const j = jocs[Math.floor(R() * jocs.length)], pct = clamp(Math.round(traj.pct(w) + nz() * 14 + (j.domini === 'calcul' ? -6 : j.domini === 'llenguatge' ? 4 : 0)), 20, 100), nivell = JOCS_AMB_NIVELL.includes(j.id) ? (w > 6 ? 'facil' : 'mig') : null;
      const enc = Math.round(pct / 10), s = { id: `s_demo_${seed}_${i}_${k}`, usuari: idUsuari, data: iso, ts: dataDeISO(iso).getTime() + (9 + k * 3) * 3600e3, horaInici: `${String(9 + k * 3).padStart(2, '0')}:${R() < .5 ? '00' : '30'}`, joc: j.id, domini: j.domini, nivell, mode: 'individual', encerts: enc, errors: 10 - enc, pct, puntuacio: enc * 10, durada: 100 + Math.floor(R() * 360), adaptatiu: true, abandonada: false, ajudesUsades: R() < .3 ? 1 : 0, pausesFetes: R() < .2 ? 1 : 0 };
      if (JOCS_AMB_TR.includes(j.id)) { const m = Math.round(traj.tr(w) * (1 + nz() * .12)); s.tempsReaccioMitja = m; s.tempsReaccioMediana = Math.round(m * .95); s.variabilitatTR = Math.round((.28 + R() * .15 + (w < 2 && traj.tr(w) > 2400 ? .12 : 0)) * 100) / 100; }
      d.historial.push(s);
      const pz = d.partides[j.id] = d.partides[j.id] || { jugades: 0, encerts: 0, errors: 0, millor: 0 }; pz.jugades++; pz.encerts += enc; pz.errors += 10 - enc; pz.millor = Math.max(pz.millor, pct);
      d.totalPartides++; d.totalEncerts += enc; d.totalErrors += 10 - enc; d.millorRatxa = Math.max(d.millorRatxa, enc);
      const dm = d.dominis[j.domini] = d.dominis[j.domini] || { encerts: 0, errors: 0 }; dm.encerts += enc; dm.errors += 10 - enc;
      d.estrelles[j.id] = Math.max(d.estrelles[j.id] || 0, pct >= 90 ? 3 : pct >= 70 ? 2 : 1); if (nivell) nivells[j.id] = nivell;
    }
    if (R() < .09 + (w < 2 && traj.desc.startsWith('Baixada') ? .25 : 0)) d.abandonaments.push({ id: `a_demo_${seed}_${i}`, joc: jocs[Math.floor(R() * jocs.length)].id, data: iso, ts: dataDeISO(iso).getTime() + 10 * 3600e3, durada: 30 + Math.floor(R() * 120), nivell: null });
  }
  const anims = traj.anim === 'baix' ? null : ['Bé', 'Bé', 'Normal', 'Normal', 'Baix', 'Cansat'], hist = d.salut.historial = {};
  for (let i = 0; i <= 60; i++) {
    if (traj.aturaFa && i < traj.aturaFa) continue; if (R() > .55 && !(traj.anim === 'baix' && i < 8)) continue;
    const baix = traj.anim === 'baix' && i < 8;
    hist[dataMenys(i)] = { aigua: R() < .8, caminar: R() < .5, dormir: R() < .65, medicacio: R() < .7, anim: baix ? (R() < .5 ? 'Baix' : 'Cansat') : aleatori(anims || ['Bé', 'Normal']) };
  }
  d.salut.xecs = Object.keys(hist).length; d.salut.respiracio = 4; d.salut.compartit = 1;
  d.tests = [{ data: dataMenys(60), punts: 11, total: 13 }, { data: dataMenys(30), punts: 11 + (R() < .5 ? 1 : 0), total: 13 }, { data: dataMenys(4), punts: 10 + (R() < .5 ? 1 : 0), total: 13 }];
  Object.entries(nivells).forEach(([j, n]) => { d.nivells[j] = { actual: n, canvis: [] }; });
  (traj.notes || []).forEach(([dies, text], q) => d.notes.push({ id: `n_demo_${seed}_${q}`, data: dataMenys(dies), text, autor: 'Cuidador (exemple)' }));
  if (R() < .5) { d.social = d.social || []; const n = 2 + Math.floor(R() * 8); for (let k = 0; k < n; k++) d.social.push({ data: dataMenys(Math.floor(R() * 28)), joc: aleatoriUI(['memory', 'domino', 'dames', 'bingo', 'tertulia', 'calcul']), mode: R() < .8 ? 'contra' : 'junts', amb: aleatoriUI(['Nét', 'Filla', 'Veïna']), resultat: aleatoriUI(['guanya', 'perd', 'empat']) }); }
  d.consentiment = { estat: traj.consent, data: dataMenys(80), qui: 'dades d\'exemple' };
  d.diesJugats.sort(); d.historial.sort((a, b) => a.data.localeCompare(b.data));
  MEDALLES.forEach(m => { if (medallaFeta(m, d)) d.medalles.push(m.id); });
  return d;
}
function carregarDemo() {
  if (usuaris.some(u => u.demo)) { canviarUsuari(usuaris.find(u => u.demo).id); return; }
  lsSet('mentA_demo_prev', { id: usuariActualId, rol: ajustes.rol });
  TRAJECTORIES_DEMO.forEach((t, i) => { const id = 'u_demo_' + i; usuaris.push({ id, demo: true, nom: t.nom, color: t.color, foto: null, avatar: t.avatar, descripcioDemo: t.desc, dades: generaDadesDemo(t, 20261011 + i * 97, id) }); });
  ajustes.rol = 'residencia'; guardarAjustes(); usuariActualId = 'u_demo_0'; guardarUsuaris(); notificaUsuaris();
}
function alternarDemo() {
  const hiHaDemo = usuaris.some(u => u.demo);
  if (!hiHaDemo) { carregarDemo(); toast('Mode demostració: 8 residents d\'exemple. No són dades reals.', 6000); PANTALLA_ENTRA.configuracio(); return; }
  mostrarConfirmacio('Sortir del mode demostració?', 'S\'esborraran els 8 residents d\'exemple. Les teves dades reals no es toquen.', () => {
    usuaris = usuaris.filter(u => !u.demo); let prev = lsGet('mentA_demo_prev', null); if (typeof prev === 'string') prev = { id: prev, rol: null };
    ajustes.rol = prev && prev.rol !== undefined ? prev.rol : ajustes.rol; guardarAjustes();
    const id = prev && (prev.id === 'convidat' || usuaris.some(u => u.id === prev.id)) ? prev.id : 'convidat'; usuariActualId = id;
    guardarUsuaris(); try { localStorage.removeItem('mentA_demo_prev'); } catch (e) { /* res */ } cuidadorObert = cuidadorObert && ajustes.rol !== null; notificaUsuaris(); PANTALLA_ENTRA.configuracio(); if (idPantallaActiva() === 'selectorResident' && ajustes.rol !== 'residencia') mostrarPantalla('inici');
  }, { boto: 'Sí, esborrar l\'exemple', perill: false });
}
function renderBanerDemo() {
  const b = $('banerSistema'); if (!b) return;
  const en = usuaris.some(u => u.demo) && getUsuariActual().demo;
  b.innerHTML = en ? `<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>Dades d'exemple.</strong> Són residents fictícis, no persones reals.</span><button type="button" class="boto-secundari boto-petit" onclick="alternarDemo()">Sortir</button></div>` : '';
}

// ---------- Registre d'ús anònim (opt-in) i informe d'error ----------
function registrarUsAnonim(tipus, dades) {
  if (!ajustes.usAnonim) return;
  const l = lsGet('mentA_us', []); l.push(Object.assign({ t: new Date().toISOString(), tipus }, dades || {})); lsSet('mentA_us', l.slice(-500));
}
// Mètriques d'usabilitat (només si l'usuari ho ha activat): temps i tocs des que s'obre l'app fins al primer joc
let _tocsDesDeObrir = 0, _primerJocRegistrat = false;
const _t0App = performance.now();
document.addEventListener('pointerdown', () => { if (!_primerJocRegistrat) _tocsDesDeObrir++; }, true);
const _obrirJocOriginal = obrirJoc;
obrirJoc = function (id, dos) {
  if (!_primerJocRegistrat) { _primerJocRegistrat = true; registrarUsAnonim('primer_joc', { joc: id, msDesDeObrir: Math.round(performance.now() - _t0App), tocsDesDeObrir: _tocsDesDeObrir }); }
  return _obrirJocOriginal.apply(this, arguments);
};
function exportarUsAnonim() {
  const l = lsGet('mentA_us', []);
  if (!ajustes.usAnonim && !l.length) { toast('Activa primer «Compartir ús anònim».'); return; }
  const paquet = { app: 'MentA', versio: VERSIO, generat: new Date().toISOString(), pantalla: innerWidth + 'x' + innerHeight, tema: resolTema(), zoom: ajustes.zoom, nota: 'Registre anònim: sense noms, fotos ni dades personals.', esdeveniments: l, errors: lsGet('mentA_errors', []).map(e => ({ t: e.t, m: e.m })) };
  baixaFitxer(`MentA-us-anonim-${avuiISO()}.json`, JSON.stringify(paquet, null, 1), 'application/json');
  toast('Registre descarregat. Pots enviar-nos aquest fitxer.', 4500, 'exit');
}
function informeErrorText() {
  const e = lsGet('mentA_errors', []);
  return [`MentA ${VERSIO} · esquema ${lsRawGet('mentA_schema')}`, `Navegador: ${navigator.userAgent}`, `Pantalla: ${innerWidth}x${innerHeight} · zoom ${ajustes.zoom} · tema ${resolTema()} · mode instal·lat: ${matchMedia('(display-mode: standalone)').matches}`,
    `Usuaris: ${usuaris.length} · pantalla actual: ${idPantallaActiva()}`, e.length ? 'Últims errors:\n' + e.map(x => `- ${x.t} ${x.m} ${x.p}`).join('\n') : 'Cap error registrat.'].join('\n');
}
async function copiarInformeError() {
  const t = informeErrorText();
  try { await navigator.clipboard.writeText(t); toast('Informe copiat. Enganxa\'l en un missatge per enviar-nos-el.', 5000, 'exit'); }
  catch (e) { baixaFitxer('MentA-informe-error.txt', t, 'text/plain'); toast('No s\'ha pogut copiar; s\'ha descarregat com a fitxer.', 5000); }
}
