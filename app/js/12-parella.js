'use strict';
// ==========================================================
//  MentA · JUGAR AMB ALGÚ (v1.8)
//  Dues persones, un sol dispositiu. Tres maneres de jugar:
//   · Un contra l'altre: partida de 2 jugadors pròpia del joc (Memory, Dòmino, Dames…)
//     o, si el joc és d'un sol jugador, «Duel de puntuació» (la mateixa partida, un darrere l'altre).
//   · Junts: els dos fan la mateixa partida i sumen (sense competir).
//  «Joc just»: cada jugador pot tenir un nivell diferent.
//  Les partides amb algú NO entren als indicadors cognitius del cuidador (es desen a part, com a activitat social).
// ==========================================================
const CLAU_PARELLA = 'mentA_ultimaParella';
const JOCS_DUEL = ['calcul', 'stroop', 'span', 'quefalta', 'sopa', 'seqlog', 'sudoku', 'fluidesa'];     // d'1 jugador, amb Duel de puntuació
const JOCS_NATIUS_2P = ['memory', 'sequencia', 'domino', 'dames', 'bingo', 'tertulia', 'refranys', 'paraules'];
const JOCS_JUNTS = ['memory', 'sequencia', 'tertulia'].concat(JOCS_DUEL);
let parella = { actiu: false, j1: { id: null, nom: 'Jugador 1' }, j2: { id: null, nom: 'Convidat' }, marcador: [0, 0], mode: 'contra', nivells: { 1: 'auto', 2: 'auto' }, ultim: null };
let duel = null;     // { joc, mode:'duel'|'junts', seed, torn, res:[null,null] }

// ---------- Jugadors ----------
const usuariPerId = id => usuaris.find(u => u.id === id) || null;
function usuariParella(p) {
  const u = p.id ? usuariPerId(p.id) : null;
  return u || { nom: p.nom, color: '#7a6f60', foto: null, avatar: 'inicial' };
}
function carregaParella() {
  const g = lsGet(CLAU_PARELLA, null), u = getUsuariActual();
  parella.j1 = { id: u.id === 'convidat' ? null : u.id, nom: u.nom };
  const id2 = g && g.j2 && g.j2.id && g.j2.id !== parella.j1.id && usuariPerId(g.j2.id) ? g.j2.id : null;
  parella.j2 = id2 ? { id: id2, nom: usuariPerId(id2).nom } : { id: null, nom: (g && g.j2 && !g.j2.id && g.j2.nom && g.j2.nom !== u.nom) ? g.j2.nom : (u.nom === 'Convidat' ? 'Convidat 2' : 'Convidat') };
  if (g) { parella.mode = g.mode === 'junts' ? 'junts' : 'contra'; parella.nivells = Object.assign({ 1: 'auto', 2: 'auto' }, g.nivells || {}); parella.ultim = g.ultim || null; }
}
function guardaParella() { lsSet(CLAU_PARELLA, { j1: parella.j1, j2: parella.j2, mode: parella.mode, nivells: parella.nivells, ultim: parella.ultim }); }

// ---------- Pantalla «Jugar amb algú» ----------
function obrirJugarAmbAlgu() { soClic(); duel = null; carregaParella(); parella.actiu = true; renderJugarAmbAlgu(); mostrarPantalla('jugarAmbAlgu'); }
triaDosJugadors = obrirJugarAmbAlgu;                                  // els botons antics porten ara a la pantalla nova
function targetaJugador(n) {
  const p = parella['j' + n], u = usuariParella(p);
  const opcions = (n === 2 ? [`<option value="">Un convidat (escriu el nom)</option>`] : []).concat(usuaris.filter(x => x.id !== (n === 1 ? parella.j2.id : parella.j1.id)).map(x => `<option value="${esc(x.id)}"${p.id === x.id ? ' selected' : ''}>${esc(x.nom)}</option>`)).join('');
  const nivell = `<label class="etiqueta-camp" for="parNiv${n}">Nivell (joc just)</label><select class="camp-input" id="parNiv${n}" onchange="parellaNivell(${n}, this.value)">${[['auto', 'Automàtic'], ['facil', 'Fàcil'], ['mig', 'Normal'], ['dificil', 'Difícil']].map(([v, t]) => `<option value="${v}"${parella.nivells[n] === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  return `<div class="parella-jugador j${n}"><span class="resident-av" style="background:${u.foto ? 'transparent' : fonsAvatar(u.color)}">${htmlAvatar(u)}</span>
    ${n === 1 ? `<strong>${esc(p.nom)}</strong>` : `<label class="nomes-lector" for="parSel2">Jugador 2</label><select class="camp-input" id="parSel2" onchange="parellaTriaUsuari(this.value)">${opcions}</select>${p.id ? '' : `<input type="text" class="camp-input" id="parNom2" maxlength="15" value="${esc(p.nom)}" aria-label="Nom del convidat" placeholder="Nom del convidat" oninput="parellaNom(this.value)">`}`}
    <details class="parella-nivell"><summary>Nivell del joc</summary>${nivell}</details></div>`;
}
function renderJugarAmbAlgu() {
  $('parellaJugadors').innerHTML = targetaJugador(1) + `<span class="parella-vs" aria-hidden="true">contra</span>` + targetaJugador(2);
  const m = $('parellaMode'); m.querySelectorAll('[data-mode]').forEach(b => { const on = b.dataset.mode === parella.mode; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
  const [a, b] = parella.marcador, mar = $('parellaMarcador');
  mar.hidden = !(a || b); mar.innerHTML = `<strong>Marcador de la tarda</strong><span>${esc(parella.j1.nom)} <b>${a}</b> – <b>${b}</b> ${esc(parella.j2.nom)}</span>`;
  const ids = parella.mode === 'junts' ? JOCS_JUNTS : JOCS_NATIUS_2P.concat(JOCS_DUEL);
  const jocs = ids.map(infoJoc).filter(Boolean);
  $('jocsParella').innerHTML = jocs.map(j => `<button type="button" class="joc-gran dom-${j.domini}" onclick="parellaTriaJoc('${j.id}')"><span class="targeta-ico gran">${ico(iconaJoc(j.id))}</span><strong>${esc(j.nom)}</strong><small>${etiquetaParella(j.id)}</small></button>`).join('');
  const ult = parella.ultim && infoJoc(parella.ultim.joc);
  mostra('btnRepetirParella', !!ult); if (ult) setText('btnRepetirParellaText', 'Repetir: ' + ult.nom);
}
const etiquetaParella = id => parella.mode === 'junts' ? 'Junts' : (JOCS_NATIUS_2P.includes(id) ? 'Per torns' : 'Duel de puntuació');
function parellaMode(m) { parella.mode = m; soClic(); guardaParella(); renderJugarAmbAlgu(); }
function parellaTriaUsuari(id) { parella.j2 = id ? { id, nom: usuariPerId(id).nom } : { id: null, nom: 'Convidat' }; soClic(); guardaParella(); renderJugarAmbAlgu(); }
function parellaNom(v) { parella.j2.nom = v.trim().slice(0, 15) || 'Convidat'; guardaParella(); }
function parellaNivell(n, v) { parella.nivells[n] = v; guardaParella(); }
function parellaSorpresa() { const ids = parella.mode === 'junts' ? JOCS_JUNTS : JOCS_NATIUS_2P.concat(JOCS_DUEL); parellaTriaJoc(aleatoriUI(ids.filter(id => infoJoc(id)))); }
function parellaRepetir() { if (parella.ultim) { parella.mode = parella.ultim.mode; parellaTriaJoc(parella.ultim.joc); } }

// ---------- Començar ----------
function parellaTriaJoc(id) {
  soClic(); carregaParellaSiCal(); parella.actiu = true; parella.ultim = { joc: id, mode: parella.mode }; guardaParella();
  if (parella.mode === 'contra' && JOCS_NATIUS_2P.includes(id)) { duel = null; obrirJoc(id, true); toast('Comença ' + parella.j1.nom + '. Després, ' + parella.j2.nom + '.', 2600); return; }
  iniciaDuel(id, parella.mode === 'junts' ? 'junts' : 'duel');
}
const carregaParellaSiCal = () => { if (!parella.j1.id && parella.j1.nom === 'Jugador 1') carregaParella(); };
function iniciaDuel(id, mode) {
  duel = { joc: id, mode, seed: Math.floor(Math.random() * 2147483647), torn: 1, res: [null, null] };
  assegurarJoc(id).then(ok => { if (ok) duelRelleu(1); });
}
function duelRelleu(n) {
  duel.torn = n; const p = parella['j' + n], u = usuariParella(p);
  $('relleuAvatar').innerHTML = `<span class="resident-av" style="background:${u.foto ? 'transparent' : fonsAvatar(u.color)}">${htmlAvatar(u)}</span>`;
  setText('relleuTitol', n === 1 ? `Comença ${p.nom}` : `Ara juga ${p.nom}`);
  setText('relleuText', n === 1 ? `${nomJoc(duel.joc)}. ${duel.mode === 'junts' ? 'Jugueu junts: els punts se sumen.' : 'Després jugarà ' + parella.j2.nom + ' la mateixa partida.'}` : `Passa-li el dispositiu. Veurà la mateixa partida que ${parella.j1.nom}.`);
  mostrarPantalla('duelRelleu');
  if (typeof elefantParella === 'function') elefantParella('torn', { nom: p.nom, primer: n === 1 });
}
function duelComenca() {
  soClic(); const id = duel.joc, j = JOCS[id]; if (!j) return;
  modeActual = 'individual'; jocActualId = id; netejarErrors(); aturaTimers(); aturarVeu(); dificultatActual = 'mig'; iniciPartida();
  fixaLlavor(duel.seed); j.obrir(false);
}
function duelNivellForcat(joc) {
  if (!duel || duel.joc !== joc || !JOCS_AMB_NIVELL.includes(joc)) return null;
  const v = parella.nivells[duel.torn];
  if (v && v !== 'auto') return v;
  const p = parella['j' + duel.torn], u = p.id ? usuariPerId(p.id) : null, n = u && u.dades && u.dades.nivells && u.dades.nivells[joc];
  return (n && n.actual) || 'mig';
}
// Cridada des de finalitzarPartida: retorna true si ha absorbit la partida
function duelFiTorn(joc, encerts, errors, meta) {
  if (!duel || duel.joc !== joc) return false;
  llavorAleatoria();
  const total = encerts + errors, pct = meta && meta.pct != null ? clamp(Math.round(meta.pct), 0, 100) : (total > 0 ? Math.round(encerts / total * 100) : 0);
  duel.res[duel.torn - 1] = { pct, encerts, errors, durada: Math.max(1, Math.round((ara() - _tsPartida) / 1000)) };
  setTimeout(() => { if (!duel) return; if (duel.torn === 1) duelRelleu(2); else duelResultat(); }, 700);
  return true;
}
function duelResultat() {
  const [a, b] = duel.res, n1 = parella.j1.nom, n2 = parella.j2.nom; let titol, text, guanyador = 0;
  if (duel.mode === 'junts') {
    const mitjana = Math.round((a.pct + b.pct) / 2), est = calcularEstrelles(mitjana, false);
    titol = est >= 2 ? 'Quin equip!' : 'Bona feina, junts!'; text = `${n1} ${a.pct}% · ${n2} ${b.pct}%. Entre els dos: ${mitjana}%.`;
    $('duelEstrelles').innerHTML = htmlEstrelles(est, 'star-big'); $('duelEstrelles').hidden = false;
  } else {
    guanyador = a.pct > b.pct ? 1 : b.pct > a.pct ? 2 : a.durada < b.durada ? 1 : b.durada < a.durada ? 2 : 0;
    if (a.pct === b.pct && a.durada === b.durada) guanyador = 0;
    titol = guanyador ? `Guanya ${guanyador === 1 ? n1 : n2}!` : 'Empat!'; text = `${n1} ${a.pct}% (${a.durada} s) · ${n2} ${b.pct}% (${b.durada} s)`;
    if (guanyador) parella.marcador[guanyador - 1]++;
    $('duelEstrelles').hidden = true;
  }
  duel.guanyador = guanyador; parellaDesaSocial(duel.joc, duel.mode, guanyador);
  setText('duelTitol', titol); setText('duelText', text); setText('duelMarcador', `Marcador de la tarda: ${n1} ${parella.marcador[0]} – ${parella.marcador[1]} ${n2}`);
  mostrarPantalla('duelFi'); soVictoria(); if (animacionsActives()) celebracioCompleta();
  if (typeof elefantParella === 'function') elefantParella('fi', { junts: duel.mode === 'junts', guanyador, nomGuanyador: guanyador === 1 ? n1 : n2, nomPerdedor: guanyador === 1 ? n2 : n1 });
}
function duelRevenja() { soClic(); if (duel) iniciaDuel(duel.joc, duel.mode); }
function duelAltreJoc() { soClic(); obrirJugarAmbAlgu(); }
async function duelCompartir() {
  const j = nomJoc(duel.joc), n1 = parella.j1.nom, n2 = parella.j2.nom;
  const text = duel.mode === 'junts' ? `Avui ${n1} i ${n2} hem jugat junts a ${j} amb MentA` : duel.guanyador ? `Avui ${duel.guanyador === 1 ? n1 : n2} ha guanyat a ${duel.guanyador === 1 ? n2 : n1} a ${j} amb MentA` : `Avui ${n1} i ${n2} hem empatat a ${j} amb MentA`;
  try { if (navigator.share) { await navigator.share({ title: 'MentA', text }); return; } await navigator.clipboard.writeText(text); toast('Text copiat. Enganxa\'l on vulguis.', 3000, 'exit'); } catch (e) { /* cancel·lat */ }
}

// ---------- Fi d'una partida de 2 jugadors pròpia del joc (Memory, Dames…) ----------
function parellaPartidaNativaFi(missatge) {
  if (!parella.actiu || duel || typeof missatge !== 'string') return;
  const g1 = /Guanya.*(Jugador 1|Blanques)/i.test(missatge) || missatge.includes(parella.j1.nom) && /Guanya/i.test(missatge) && !missatge.includes(parella.j2.nom), g2 = /Guanya.*(Jugador 2|Negres)/i.test(missatge) || missatge.includes(parella.j2.nom) && /Guanya/i.test(missatge) && !missatge.includes(parella.j1.nom);
  const guanyador = g1 && !g2 ? 1 : g2 && !g1 ? 2 : 0;
  if (guanyador) parella.marcador[guanyador - 1]++;
  parellaDesaSocial(jocActualId, 'contra', guanyador);
  setTimeout(() => toast(`Marcador de la tarda: ${parella.j1.nom} ${parella.marcador[0]} – ${parella.marcador[1]} ${parella.j2.nom}`, 4000), 900);
}
// Activitat social: es desa a part de l'historial perquè no «contamini» la gràfica de cada persona
function parellaDesaSocial(joc, mode, guanyador) {
  const entrada = (amb, guanya) => ({ data: avuiISO(), joc, mode, amb, resultat: mode === 'junts' ? 'junts' : (guanya ? 'guanya' : guanyador ? 'perd' : 'empat') });
  [[1, parella.j1, parella.j2], [2, parella.j2, parella.j1]].forEach(([n, p, altre]) => {
    if (!p.id) return; const u = usuariPerId(p.id); if (!u || !u.dades) return;
    u.dades.social = (u.dades.social || []).concat([entrada(altre.nom, guanyador === n)]).slice(-300);
  });
  guardarUsuaris();
}
const partidesSocials = (d, dies = 7) => (d.social || []).filter(s => s.data >= dataMenys(dies)).length;

// ---------- Integració ----------
const _anarAIniciOriginal = anarAInici;
anarAInici = function () { parella.actiu = false; duel = null; llavorAleatoria(); _anarAIniciOriginal(); };
const _tornarMenuActualOriginal = tornarMenuActual;
tornarMenuActual = function () { if (parella.actiu) { soClic(); duel = null; llavorAleatoria(); renderJugarAmbAlgu(); mostrarPantalla('jugarAmbAlgu'); } else _tornarMenuActualOriginal(); };
const _obrirJocParella = obrirJoc;
obrirJoc = function (id, dos) { if (!dos && !duel) parella.actiu = false; return _obrirJocParella.apply(this, arguments); };
PANTALLA_ENTRA.jugarAmbAlgu = renderJugarAmbAlgu;
