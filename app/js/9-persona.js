'use strict';
// ==========================================================
//  MentA · MODE PERSONA (v1.8)
//  Tot el que veu la persona gran: un botó enorme («JUGAR»), dos botons grans més,
//  una sessió guiada de 3 jocs, «Com vaig» només amb reforç positiu i tres ajustos
//  bàsics (lletra, so, ajuda). Cap número fred, cap gràfic, cap jerga.
// ==========================================================

const FRASES_ANIM = ['Molt bé! Un respir i seguim.', 'Quina bona feina!', 'Ho estàs fent genial.', 'Així, amb calma, va molt bé.', 'Gràcies per dedicar-te aquesta estona.'];
const FRASES_FI = ['Avui has fet una molt bona feina.', 'Quin gust veure\'t jugar!', 'Cada dia que jugues, la teva ment ho agraeix.', 'Has tingut la ment ben activa.'];

// ---------- Inici ----------
const visibles = () => { const ocults = (dadesActuals().plaCuidador || {}).jocsOcults || []; return jocsIndividuals().filter(j => !ocults.includes(j.id)); };
const diesDeLaSetmana = () => { const ini = rangSetmana(0).ini; return new Set(dadesActuals().historial.filter(h => h.data >= ini).map(h => h.data)).size; };
function renderInici() {
  const u = getUsuariActual(), nom = u.id === 'convidat' ? '' : u.nom, g = $('titolInici');
  if (g) g.textContent = nom ? `${saludaSegonsHora()}, ${nom}` : saludaSegonsHora();
  const ses = triaJocsSessio(true), minuts = ses.reduce((s, id) => s + infoJoc(id).min, 0), jugat = teJugatAvui();
  setText('jugarSub', jugat ? 'Una altra estona de jocs' : `${ses.length} jocs · uns ${Math.max(5, Math.round(minuts / 5) * 5)} minuts`);
  const dies = diesDeLaSetmana(), x = $('xipComVaig');
  if (x) x.innerHTML = `${ico('estrella-ple')}<span>${dies ? `Has jugat ${dies} ${plural(dies, 'dia', 'dies')} aquesta setmana` : 'Quan vulguis, aquí estic: cada dia compta'}</span>${ico('fletxa', 'fletxa')}`;
  actualitzaAjustosRapids();
}
function refrescarInici() { renderInici(); renderNovetats(); renderRecordatoris(); if (typeof renderBanerInstalar === 'function') renderBanerInstalar(); }
PANTALLA_ENTRA.inici = refrescarInici;

// ---------- Ajustos ràpids (només 3) ----------
const NOMS_LLETRA = { normal: 'Lletra normal', gran: 'Lletra gran', extragran: 'Lletra molt gran', gegant: 'Lletra gegant' };
function actualitzaAjustosRapids() {
  setText('btnLletraText', NOMS_LLETRA[ajustes.zoom] || 'Lletra');
  const b = $('btnSoRapid'); if (b) { b.setAttribute('aria-pressed', !!ajustes.efectesSo); b.querySelector('svg use').setAttribute('href', ajustes.efectesSo ? '#i-volum' : '#i-so-off'); }
  setText('btnSoText', ajustes.efectesSo ? 'So' : 'Sense so');
}
function canviaLletraRapid() {
  const ordre = ['normal', 'gran', 'extragran', 'gegant'], seg = ordre[(ordre.indexOf(ajustes.zoom) + 1) % ordre.length];
  aplicarZoom(seg); soClic(); actualitzaAjustosRapids(); toast(NOMS_LLETRA[seg], 1800);
}
function alternaSoRapid() { ajustes.efectesSo = !ajustes.efectesSo; guardarAjustes(); pintarToggles(); actualitzaAjustosRapids(); actualitzarBotoSo(); if (ajustes.efectesSo) soClic(); }

// ---------- Els meus jocs ----------
function jocsFavorits() {
  const d = dadesActuals(), vis = visibles(), jugades = j => (d.partides[j.id] || {}).jugades || 0;
  if (!d.totalPartides) return ['memory', 'tertulia', 'calcul', 'sopa', 'refranys', 'paraules'].map(infoJoc).filter(j => vis.includes(j)).concat(vis).filter((j, i, a) => a.indexOf(j) === i).slice(0, 6);
  const trias = [...vis].sort((a, b) => jugades(b) - jugades(a)).slice(0, 3), dominis = new Set(trias.map(j => j.domini));
  [...vis].sort((a, b) => a.min - b.min).forEach(j => { if (trias.length < 6 && !trias.includes(j) && !dominis.has(j.domini)) { trias.push(j); dominis.add(j.domini); } });
  [...vis].sort((a, b) => jugades(b) - jugades(a)).forEach(j => { if (trias.length < 6 && !trias.includes(j)) trias.push(j); });
  return trias;
}
function obrirMeusJocs() { soClic(); modeActual = 'individual'; mostrarPantalla('meusJocs'); }
function renderMeusJocs() {
  const jd = jocDelDia(); if ($('jocDelDia') && jd) setText('jocDelDiaNom', jd.nom);
  const c = $('jocsGran'); if (!c) return;
  c.innerHTML = jocsFavorits().map(j => `<button type="button" class="joc-gran dom-${j.domini}" data-joc="${j.id}" data-dos="0"><span class="targeta-ico gran">${ico(iconaJoc(j.id))}</span><strong>${esc(j.nom)}</strong><span class="estrelles-mini">${htmlEstrelles(obtenirEstrelles(j.id))}</span></button>`).join('');
  const dos = $('btnDosJugadors'); if (dos) dos.style.display = (dadesActuals().plaCuidador || {}).dosJugadors === false ? 'none' : '';
}
PANTALLA_ENTRA.meusJocs = renderMeusJocs;

// ---------- Sessió guiada: 3 jocs seguits, escollits pel sistema ----------
let sessio = null;
function triaJocsSessio(previa) {
  const d = dadesActuals(), vis = visibles(), jugatsAvui = new Set(d.historial.filter(h => h.data === avuiISO()).map(h => h.joc));
  const setmana = {}; d.historial.filter(h => h.data >= dataMenys(7)).forEach(h => { setmana[h.domini] = (setmana[h.domini] || 0) + 1; });
  const maxMin = (ajustes.duradaSessio || 10) + 2;
  const cand = (previa ? vis : barreja(vis)).slice().sort((a, b) => (jugatsAvui.has(a.id) - jugatsAvui.has(b.id)) || ((setmana[a.domini] || 0) - (setmana[b.domini] || 0)) || (a.min - b.min));
  const triats = [], dominis = new Set(); let minuts = 0;
  cand.forEach(j => { if (triats.length < 3 && !dominis.has(j.domini) && minuts + j.min <= maxMin + (triats.length ? 0 : 3)) { triats.push(j); dominis.add(j.domini); minuts += j.min; } });
  cand.forEach(j => { if (triats.length < 3 && !triats.includes(j)) triats.push(j); });
  return triats.map(j => j.id);
}
function iniciarSessio() {
  soClic(); const jocs = triaJocsSessio(false);
  if (!jocs.length) { toast('No hi ha jocs disponibles. Un cuidador els ha de tornar a activar.', 4000); return; }
  sessio = { jocs, idx: 0, estrelles: [], inici: Date.now() };
  if (typeof registrarUsAnonim === 'function') registrarUsAnonim('sessio_inici', { jocs });
  modeActual = 'individual'; obrirJoc(jocs[0]);
}
// Cridada per mostrarModalFinal: dins d'una sessió, en lloc del resultat es mostra un descans amable
function sessioGuiadaFi(r) {
  if (!sessio || sessio.jocs[sessio.idx] !== r.s.joc) return false;
  sessio.estrelles.push(r.estrelles);
  const ultim = sessio.idx >= sessio.jocs.length - 1;
  if (ultim) { renderSessioFi(); mostrarPantalla('sessioFi'); if (animacionsActives()) { confeti(); mostrarTrofeu(); } soVictoria(); return true; }
  const seg = sessio.jocs[sessio.idx + 1];
  $('sessioPunts').innerHTML = Array.from({ length: sessio.jocs.length }, (_, i) => `<span class="punt-sessio${i <= sessio.idx ? ' fet' : ''}" aria-hidden="true"></span>`).join('') + `<span class="nomes-lector">Joc ${sessio.idx + 1} de ${sessio.jocs.length} acabat</span>`;
  const est = document.querySelectorAll('#descansEstrelles .star-big');
  est.forEach(x => x.classList.remove('activa'));
  setText('titolDescans', ['Gràcies!', 'Bona feina!', 'Molt bé!', 'Excel·lent!'][r.estrelles]); setText('descansFrase', aleatoriUI(FRASES_ANIM));
  setText('continuarSub', 'Següent: ' + nomJoc(seg));
  mostrarPantalla('sessioDescans');
  setTimeout(() => { for (let i = 0; i < r.estrelles; i++) setTimeout(() => { est[i].classList.add('activa'); soEstrella(); }, i * 300); }, 300);
  return true;
}
function renderSessioFi() {
  const total = sessio.estrelles.reduce((a, b) => a + b, 0);
  setText('sessioFiFrase', aleatoriUI(FRASES_FI) + (total ? ` Has guanyat ${total} ${plural(total, 'estrella', 'estrelles')}.` : ''));
  $('sessioFiEstrelles').innerHTML = sessio.estrelles.map(n => htmlEstrelles(n, 'star-big')).join('<span style="width:1rem"></span>');
}
// Sessió de 5 minuts: dos jocs breus. «Joc del dia»: el mateix per a tothom aquell dia, rotatiu.
function iniciarSessioCurta() {
  soClic(); const breus = visibles().filter(j => j.min <= 5), cand = (breus.length >= 2 ? breus : visibles()), triats = barreja(cand).slice(0, 2).map(j => j.id);
  if (!triats.length) { toast('No hi ha jocs disponibles. Un cuidador els ha de tornar a activar.', 4000); return; }
  sessio = { jocs: triats, idx: 0, estrelles: [], inici: Date.now() }; modeActual = 'individual'; obrirJoc(triats[0]);
}
function jocDelDia() { const v = visibles(), d = new Date(); return v.length ? v[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % v.length] : null; }
function obrirJocDelDia() { const j = jocDelDia(); if (j) { soClic(); modeActual = 'individual'; obrirJoc(j.id); } }
function sessioContinuar() { if (!sessio) { anarAInici(); return; } sessio.idx++; soClic(); obrirJoc(sessio.jocs[sessio.idx]); }
function sessioAcabar() { sessio = null; anarAInici(); }

// ---------- Com vaig: només reforç positiu ----------
function obrirComVaig() { soClic(); mostrarPantalla('comVaig'); }
function renderComVaig() {
  const d = dadesActuals(), ini = rangSetmana(0).ini, dies = [...Array(7)].map((_, k) => { const dt = new Date(ini + 'T12:00:00'); dt.setDate(dt.getDate() + k); return isoData(dt); });
  const jugats = new Set([...d.historial.map(h => h.data), ...(d.diesRecuperats || [])]), n = dies.filter(x => jugats.has(x)).length, avui = avuiISO();
  const estrellesMes = d.historial.filter(h => h.data >= dataMenys(30)).reduce((s, h) => s + calcularEstrelles(h.pct, false), 0);
  const medalla = MEDALLES.filter(m => d.medalles.includes(m.id)).slice(-1)[0], propera = MEDALLES.filter(m => !d.medalles.includes(m.id)).map(m => ({ m, p: m.prog(d) })).sort((a, b) => b.p.actual / b.p.objectiu - a.p.actual / a.p.objectiu)[0];
  const meta = 5, pctMeta = Math.min(100, Math.round(n / meta * 100));
  $('comVaigCos').innerHTML = `
    <p class="cv-frase">${n ? `Has jugat <strong>${n} ${plural(n, 'dia', 'dies')}</strong> aquesta setmana.` : 'Aquesta setmana encara no has jugat. Quan vulguis, comencem.'} ${n >= 4 ? ' Quina constància!' : n ? ' Molt bé!' : ''}</p>
    <div class="cv-setmana" role="img" aria-label="Dies d'aquesta setmana en què has jugat: ${n}">${dies.map((x, k) => `<div class="cv-dia${jugats.has(x) ? ' fet' : ''}${x === avui ? ' avui' : ''}"><span class="cv-lletra">${DIES_CURTS[k]}</span><span class="cv-marca">${jugats.has(x) ? ico('estrella-ple') : ''}</span></div>`).join('')}</div>
    <div class="panell"><h2>La teva constància</h2><div class="barra-progres accio" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pctMeta}" aria-label="Constància d'aquesta setmana"><div class="farcit" style="width:${pctMeta}%"></div></div><p class="ajuda-camp">${n >= meta ? 'Has complert l\'objectiu de la setmana!' : 'Si jugues uns dies més, la completaràs.'}</p></div>
    ${estrellesMes ? `<div class="panell cv-estrelles"><span class="targeta-ico dom-atencio">${ico('estrella-ple')}</span><p>Aquest mes has guanyat <strong>${estrellesMes} estrelles</strong>.</p></div>` : ''}
    ${medalla ? `<div class="panell cv-estrelles"><span class="targeta-ico dom-atencio">${ico('trofeu')}</span><p>La teva última medalla: <strong>${esc(medalla.nom)}</strong></p></div>` : (propera ? `<div class="panell cv-estrelles"><span class="targeta-ico dom-neutre">${ico('trofeu')}</span><p>La teva primera medalla és a prop: <strong>${esc(propera.m.nom)}</strong></p></div>` : '')}
    <button type="button" class="boto-jugar" onclick="iniciarSessio()"><span class="jugar-fila">${ico('play')}JUGAR</span></button>`;
}
PANTALLA_ENTRA.comVaig = renderComVaig;

// ---------- Avisar algú de la família (missatge preparat, sense inventar cap trucada) ----------
async function avisarFamilia() {
  const nom = getUsuariActual().id === 'convidat' ? '' : getUsuariActual().nom, text = `Hola! Sóc ${nom || 'jo'}. Estic bé i avui he jugat una estona a MentA. Una abraçada!`;
  try { if (navigator.share) { await navigator.share({ text, title: 'Un missatge' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Missatge copiat. Enganxa\'l a WhatsApp o a un correu.', 5000, 'exit'); }
  catch (e) { toast(text, 6000); }
}

// ---------- Guia de primer ús: 3 passos amb una fletxa als elements reals ----------
const PASSOS_GUIA = [
  { sel: '#btnJugar', text: 'Toca aquí per jugar. Només cal això.' },
  { sel: '#btnJugarAmb', text: 'Si hi ha algú amb tu, juga-hi aquí. Dos tocs i ja esteu jugant.' },
  { sel: '#xipComVaig', text: 'Aquí veus com vas, sempre amb bones notícies.' }
];
let _guiaPas = 0, _guiaDarrer = null;
function iniciarGuiaPrimerUs(forcat) {
  if (!forcat && lsRawGet('mentA_guia_vist')) return;
  mostrarPantalla('inici'); _guiaPas = 0; _guiaDarrer = document.activeElement; $('guiaCapa').hidden = false; _inertFons(true); mostraPasGuia();
}
function mostraPasGuia() {
  const p = PASSOS_GUIA[_guiaPas], el = document.querySelector(p.sel); if (!el) { guiaSaltar(); return; }
  el.scrollIntoView({ block: 'center', behavior: 'auto' });
  const r = el.getBoundingClientRect(), f = $('guiaForat'), b = $('guiaBombolla'), marge = 8;
  Object.assign(f.style, { left: r.left - marge + 'px', top: r.top - marge + 'px', width: r.width + 2 * marge + 'px', height: r.height + 2 * marge + 'px' });
  setText('guiaText', p.text); setText('guiaPas', `${_guiaPas + 1} de ${PASSOS_GUIA.length}`);
  setText('guiaSeguent', _guiaPas === PASSOS_GUIA.length - 1 ? 'Entesos' : 'Següent');
  const sota = r.bottom + 12 + 170 < innerHeight;
  b.style.top = sota ? r.bottom + 14 + 'px' : 'auto'; b.style.bottom = sota ? 'auto' : innerHeight - r.top + 14 + 'px';
  b.classList.toggle('a-sota', sota); b.classList.toggle('a-dalt', !sota);
  setTimeout(() => $('guiaSeguent').focus({ preventScroll: true }), 30);
}
function guiaSeguent() { soClic(); if (_guiaPas >= PASSOS_GUIA.length - 1) { guiaSaltar(); return; } _guiaPas++; mostraPasGuia(); }
function guiaSaltar() { $('guiaCapa').hidden = true; if (!document.querySelector('.modal-fons.actiu')) _inertFons(false); lsRawSet('mentA_guia_vist', '1'); if (_guiaDarrer && _guiaDarrer.focus) _guiaDarrer.focus({ preventScroll: true }); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('guiaCapa').hidden) guiaSaltar(); });
window.addEventListener('resize', () => { if (!$('guiaCapa').hidden) mostraPasGuia(); });

// Targeta «Novetats de la 1.8»: només per a qui ja feia servir una versió anterior; es pot descartar i no torna
function renderNovetats() {
  const c = $('banerNovetats'); if (!c) return;
  const veure = (window.__schemaAnterior > 0 && window.__schemaAnterior < SCHEMA) && !lsRawGet('mentA_novetats_18') && lsRawGet('mentA_onboarding_vist');
  c.innerHTML = veure ? `<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>Novetats de la ${VERSIO_CURTA}.</strong> Ara hi ha «Jugar amb algú», un bingo de debò i un espai per a qui cuida.</span><button type="button" class="boto-secundari boto-petit" onclick="descartaNovetats()">Entesos</button></div>` : '';
}
function descartaNovetats() { soClic(); lsRawSet('mentA_novetats_18', '1'); renderNovetats(); }
