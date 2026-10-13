'use strict';
// ==========================================================
//  MentA · ESPAI DEL CUIDADOR — pestanyes i informes
//  Resum · Evolució · Jocs · Salut i ànim · Notes · Pla · Informe · (Residència) · Ajustos
// ==========================================================
let pestanyaCu = 'resum', evolSetmanes = 12;
const TABS_CU = [['resum', 'Resum'], ['evolucio', 'Evolució'], ['jocs', 'Jocs'], ['salut', 'Salut i ànim'], ['notes', 'Notes'], ['pla', 'Pla'], ['informe', 'Informe'], ['residencia', 'Residència'], ['ajustos', 'Ajustos']];
const tabsVisibles = () => TABS_CU.filter(([id]) => (id !== 'residencia' || ajustes.rol === 'residencia') && (!modeLectura || !['notes', 'pla', 'ajustos', 'residencia'].includes(id)));

// ---------- Estructura ----------
function renderCuidador() {
  if (!$('cuidador')) return;
  const sel = $('cuPersona'), tots = [..._usuarisCuidador()];
  if (modeLectura) { sel.innerHTML = `<option>${esc(getUsuariActual().nom)}</option>`; sel.disabled = true; }
  else { sel.disabled = false; sel.innerHTML = tots.map(u => `<option value="${esc(u.id)}"${u.id === usuariActualId ? ' selected' : ''}>${esc(u.nom)}${u.demo ? ' (exemple)' : ''}</option>`).join(''); }
  $('cuLectura').hidden = !modeLectura;
  if (!tabsVisibles().some(([id]) => id === pestanyaCu)) pestanyaCu = 'resum';
  $('pestanyesCu').innerHTML = tabsVisibles().map(([id, nom]) => `<button type="button" class="pestanya" role="tab" id="cut-${id}" aria-controls="cuPanell" aria-selected="${id === pestanyaCu}" tabindex="${id === pestanyaCu ? 0 : -1}" onclick="cuTria('${id}')">${nom}</button>`).join('');
  const d = dadesActuals(), s = calculaSemafor(d); $('cuSemaforXip').innerHTML = htmlSemaforXip(s);
  let c = $('cuPanell'); if (!c) { $('cuPanells').innerHTML = '<div class="panell-pestanya" role="tabpanel" id="cuPanell"></div>'; c = $('cuPanell'); }
  c.setAttribute('aria-labelledby', 'cut-' + pestanyaCu);
  const r = { resum: cuResum, evolucio: cuEvolucio, jocs: cuJocs, salut: cuSalut, notes: cuNotes, pla: cuPla, informe: cuInforme, residencia: cuResidencia, ajustos: cuAjustos }[pestanyaCu];
  try { c.innerHTML = r(d, s); } catch (e) { console.error(e); c.innerHTML = '<div class="estat-buit"><p>No hem pogut mostrar aquesta part. Copia l\'informe d\'error des dels ajustos avançats.</p></div>'; }
  pintarToggles(); pintarRecordatorisConfig();
}
const _usuarisCuidador = () => usuaris.length ? usuaris : [_convidat];
function cuTria(id) { pestanyaCu = id; soClic(); renderCuidador(); const t = $('cut-' + id); if (t) t.scrollIntoView({ block: 'nearest', inline: 'center' }); }
function cuidadorTriaPersona(id) { if (modeLectura) return; usuariActualId = id; guardarUsuaris(); actualitzarHeaderUsuari(); renderCuidador(); }
PANTALLA_ENTRA.cuidador = renderCuidador;
document.addEventListener('keydown', e => {
  const t = e.target.closest && e.target.closest('#pestanyesCu [role="tab"]'); if (!t || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
  const ids = tabsVisibles().map(x => x[0]), i = ids.indexOf(t.id.replace('cut-', '')), n = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length;
  e.preventDefault(); cuTria(ids[n]); $('cut-' + ids[n]).focus();
});

// ---------- Utilitats ----------
const dMes = (k) => dataMenys(k);
function agrega(d, deDies, aDies) {
  const ini = dataMenys(aDies), fi = dataMenys(deDies), s = d.historial.filter(h => h.data >= ini && h.data <= fi), ab = (d.abandonaments || []).filter(h => h.data >= ini && h.data <= fi);
  const trs = s.map(h => h.tempsReaccioMediana).filter(Boolean), vs = s.map(h => h.variabilitatTR).filter(v => v != null);
  return { n: s.length, dies: new Set(s.map(h => h.data)).size, minuts: Math.round(s.reduce((t, h) => t + (h.durada || 0), 0) / 60), pct: s.length ? mitjana(s.map(h => h.pct)) : null, tr: mediana(trs), variab: vs.length ? mitjana(vs) : null, ab: ab.length };
}
function tendCu(a, b, { invers = false, decimals = 0, unitat = '' } = {}) {
  if (a == null || b == null) return '<span class="tend igual">' + ico('igual') + 'Sense comparació</span>';
  const dif = a - b, rel = b ? dif / b : 0, mig = Math.abs(rel) < 0.05, bo = invers ? dif < 0 : dif > 0;
  if (mig) return '<span class="tend igual">' + ico('igual') + 'Estable</span>';
  return `<span class="tend ${bo ? 'amunt' : 'avall'}">${ico(dif > 0 ? 'fletxa-amunt' : 'fletxa-avall')}${dif > 0 ? '+' : ''}${dif.toFixed(decimals)}${unitat}</span>`;
}
const infoKpi = (nom, valor, tend, explica, sub) => `<div class="kpi"><div class="kpi-et">${nom}</div><div class="kpi-val">${valor}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ''}${tend}<details class="kpi-que"><summary>Què és això?</summary><p>${explica}</p></details></div>`;
const notaA = (d, ini, fi) => (d.notes || []).find(n => n.data >= ini && n.data <= fi);
const textRegles = () => `<ul>
  <li><strong>Mínim de dades:</strong> almenys ${SEMAFOR.minSessions} sessions en 8 setmanes; si no, el semàfor és gris («no hi ha prou dades»).</li>
  <li><strong>Línia base:</strong> sempre és la mitjana d'aquesta mateixa persona en les 4 setmanes anteriors. Mai es compara amb una norma.</li>
  <li><strong>Groc — precisió:</strong> baixa més d'un ${Math.round(SEMAFOR.precisioGroc * 100)}% respecte a la línia base durant ${SEMAFOR.setmanesGroc} setmanes seguides.</li>
  <li><strong>Vermell — precisió:</strong> baixa més d'un ${Math.round(SEMAFOR.precisioVermell * 100)}% durant ${SEMAFOR.setmanesVermell} setmanes seguides.</li>
  <li><strong>Groc — constància:</strong> els dies actius per setmana cauen a ${Math.round(SEMAFOR.constanciaGroc * 100)}% (o menys) de la línia base durant 2 setmanes.</li>
  <li><strong>Inactivitat:</strong> groc a partir de ${SEMAFOR.diesSenseJugarGroc} dies sense jugar; vermell a partir de ${SEMAFOR.diesSenseJugarVermell} (només si abans hi havia ritme).</li>
  <li><strong>Groc — abandonaments:</strong> més d'un ${Math.round(SEMAFOR.abandonamentsGroc * 100)}% de partides deixades a mitges en 14 dies (mínim 5).</li>
  <li><strong>Groc — temps de reacció:</strong> puja més d'un ${Math.round(SEMAFOR.tempsReaccioGroc * 100)}% durant 2 setmanes.</li>
  <li><strong>Groc — ànim:</strong> ${SEMAFOR.animBaixDies} o més dies amb ànim «Baix» o «Cansat» en l'última setmana.</li>
  <li>El semàfor és <strong>vermell</strong> només si es compleix alguna regla vermella; <strong>groc</strong> si es compleix alguna regla groga; si no, <strong>verd</strong>. Es pot ajustar a <code>app/js/config.js</code>.</li></ul>`;

// ---------- RESUM ----------
function cuResum(d, s) {
  const u = getUsuariActual(), c = estatConsent();
  if (c === 'no') return `<div class="panell"><h2>${esc(u.nom)} no vol compartir el resum</h2><p>De moment no es mostren les dades. Si canvia d'idea, pots canviar-ho aquí o als <strong>Ajustos</strong> d'aquest espai. Sí que pots configurar el <strong>Pla</strong> (accessibilitat i jocs).</p><button type="button" class="boto-principal" onclick="establirConsent('si')">Ara hi està d'acord</button> <button type="button" class="boto-secundari" onclick="establirConsent('tutor')">Ho gestiona la família o el tutor</button></div>`;
  const a28 = agrega(d, 0, 27), p28 = agrega(d, 28, 55), a7 = setmanaDades(d, 0), a14ab = a7.abandonades + setmanaDades(d, 1).abandonades, n14 = a7.n + setmanaDades(d, 1).n;
  const ultResum = d.ultimResum ? Math.round((dataDeISO(avuiISO()) - dataDeISO(d.ultimResum)) / 86400000) : null;
  const banners = [];
  if (c === 'pendent') banners.push(`<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>Falta confirmar el consentiment.</strong> Aquestes dades només s'haurien de veure amb el vistiplau de ${esc(u.nom)} (o de la família o el tutor, si ella no ho pot decidir).</span><span class="botons-banner"><button type="button" class="boto-principal boto-petit" onclick="establirConsent('si')">Hi està d'acord</button><button type="button" class="boto-secundari boto-petit" onclick="establirConsent('tutor')">Ho gestiona la família</button><button type="button" class="boto-fantasma boto-petit" onclick="establirConsent('no')">No ho vol</button></span></div>`);
  if (!modeLectura && (ultResum == null || ultResum >= 7) && d.totalPartides) banners.push(`<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-compartir"/></svg><span>${ultResum == null ? 'Encara no has enviat cap resum a la família.' : `Fa ${ultResum} dies que no s'envia el resum a la família.`} Avui toca?</span><button type="button" class="boto-principal boto-petit" onclick="compartirResumFamilia()">Enviar el resum</button></div>`);
  if (!modeLectura && typeof htmlAvisCopia === 'function') { const ac = htmlAvisCopia(); if (ac) banners.push(ac); }
  const frase = `<div class="semafor-gran ${s.estat}" role="status">${ico(SEMAFOR_ICO[s.estat][0])}<div><strong>${SEMAFOR_ICO[s.estat][1]}</strong><p>${esc(s.frase)}</p></div></div>`;
  const trTxt = a28.tr ? (a28.tr / 1000).toFixed(1).replace('.', ',') + ' s' : '—', varTxt = a28.variab != null ? a28.variab.toFixed(2).replace('.', ',') : '—';
  const kpis = `<div class="kpis">
    ${infoKpi('Dies actius', `${a7.dies}<small>/7 aquesta setmana</small>`, tendCu(a28.dies, p28.dies), 'Dies diferents en què ha fet almenys una partida. És l\'indicador més fiable de constància.', `${a28.dies} dies en 28`)}
    ${infoKpi('Minuts jugats', `${a7.minuts}<small> min aquesta setmana</small>`, tendCu(a28.minuts, p28.minuts), 'Temps real de joc, sense comptar les pauses llargues. Només inclou partides de la v1.7 en endavant.', `${a28.minuts} min en 28 dies`)}
    ${infoKpi('Sessions', `${n14}<small> completades</small>`, `<span class="tend ${a14ab ? 'avall' : 'amunt'}">${ico(a14ab ? 'info' : 'check')}${a14ab} abandonades</span>`, 'Partides acabades i partides deixades a mitges (en 14 dies). Abandonar de tant en tant és normal.', null)}
    ${infoKpi('Precisió global', a28.pct != null ? `${Math.round(a28.pct)}<small>%</small>` : '—', tendCu(a28.pct, p28.pct, { unitat: ' punts', decimals: 0 }), 'Resultat mitjà de les partides en 28 dies. S\'ha de mirar sempre respecte a la seva pròpia línia base: una xifra «baixa» en si mateixa no vol dir res.', `${a28.n} partides`)}
    ${infoKpi('Temps de reacció', trTxt, tendCu(a28.tr ? a28.tr / 1000 : null, p28.tr ? p28.tr / 1000 : null, { invers: true, decimals: 1, unitat: ' s' }), 'Temps mitjà (mediana) que triga a respondre en els jocs de resposta puntual. Un valor menor és més àgil, però depèn molt de l\'hora i del cansament.', null)}
    ${infoKpi('Variabilitat', varTxt, tendCu(a28.variab, p28.variab, { invers: true, decimals: 2 }), 'Com de regular és el temps de reacció dins d\'una partida (0 = molt regular). Més variabilitat pot indicar distracció o cansament; només és informatiu si es manté.', null)}
  </div>`;
  const avisos = s.avisos.length ? `<h2 class="titol-seccio">Aspectes a vigilar</h2>` + s.avisos.map(a => `<div class="avis-cu ${a.nivell}"><div class="avis-cu-cap">${ico(a.nivell === 'vermell' ? 'fletxa-avall' : 'info')}<strong>${esc(a.titol)}</strong></div><p>${esc(a.text)}</p><p class="interpreta"><strong>Com interpretar-ho:</strong> ${esc(a.interpreta)}</p>${a.nota ? `<p class="nota-context">Hi ha una nota teva en aquest període: «${esc(a.nota)}»</p>` : ''}</div>`).join('') : (s.estat === 'verd' ? '<p class="ajuda-camp">Cap aspecte a vigilar ara mateix.</p>' : '');
  const soc = typeof partidesSocials === 'function' ? partidesSocials(d, 28) : 0, social = `<p class="social-cu">${ico('dos')}<span><strong>Activitat social:</strong> ${soc} ${soc === 1 ? 'partida' : 'partides'} amb algú en 28 dies. No compten als indicadors; és un bon senyal que juguin acompanyats.</span></p>`;
  return banners.join('') + frase + kpis + social + avisos + `<details class="com-calcula"><summary>Com es calcula el semàfor?</summary>${textRegles()}</details>`;
}

// ---------- EVOLUCIÓ ----------
function cuEvolucio(d) {
  if (estatConsent() === 'no') return '<div class="estat-buit"><p>Sense consentiment per mostrar les dades.</p></div>';
  const N = evolSetmanes, ws = Array.from({ length: N }, (_, i) => setmanaDades(d, N - 1 - i));
  const et = w => w.k === 0 ? 'Ara' : `-${w.k}s`;
  const marques = ws.map((w, i) => { const n = notaA(d, w.ini, w.fi); return n ? { idx: i, text: `${n.data}: ${n.text}` } : null; }).filter(Boolean);
  const prec = ws.map(w => ({ et: et(w), v: w.pct == null ? null : Math.round(w.pct), tip: `${w.k === 0 ? 'Últims 7 dies' : 'Fa ' + w.k + ' setmanes'}: ${w.pct == null ? 'sense dades' : Math.round(w.pct) + '% de precisió'} (${w.n} partides)` }));
  const trV = ws.map(w => w.tr), trMax = Math.max(2.5, ...trV.filter(Boolean).map(x => x / 1000)) * 1.15;
  const tr = ws.map(w => ({ et: et(w), v: w.tr ? Math.round(w.tr / 100) / 10 : null, tip: `${w.k === 0 ? 'Últims 7 dies' : 'Fa ' + w.k + ' setmanes'}: ${w.tr ? (w.tr / 1000).toFixed(1) + ' s' : 'sense dades'}` }));
  const cons = ws.map(w => ({ et: et(w), v: w.dies, tip: `${w.k === 0 ? 'Últims 7 dies' : 'Fa ' + w.k + ' setmanes'}: ${w.dies} ${plural(w.dies, 'dia actiu', 'dies actius')}` }));
  const ara4 = DOMINIS.map(k => pctDomini(d, k, dataMenys(27), avuiISO()).v), ant4 = DOMINIS.map(k => pctDomini(d, k, dataMenys(55), dataMenys(28)).v);
  return `<div class="segmentat" role="group" aria-label="Període" style="max-width:24rem">${[4, 12, 26].map(n => `<button type="button" aria-pressed="${evolSetmanes === n}" onclick="evolSetmanes=${n};soClic();renderCuidador()">${n} setmanes</button>`).join('')}</div>
    <div class="grafic-card"><h3>Precisió per setmana</h3>${svgLinia('Precisió setmanal', `Precisió mitjana (en percentatge) de cada setmana durant les últimes ${N} setmanes.`, prec, { marques })}</div>
    <div class="grafic-card"><h3>Temps de reacció (segons)</h3>${svgLinia('Temps de reacció setmanal', `Temps de reacció mediana, en segons, de cada setmana durant les últimes ${N} setmanes.`, tr, { ymin: 0, ymax: Math.ceil(trMax * 2) / 2, ticks: [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * Math.ceil(trMax * 2) / 2 * 10) / 10), unitat: ' s', marques })}</div>
    <div class="grafic-card"><h3>Constància (dies actius per setmana)</h3>${svgBarres('Dies actius per setmana', `Nombre de dies amb activitat en cada una de les últimes ${N} setmanes.`, cons)}</div>
    <div class="grafic-card"><h3>Per àrees: ara i fa 4 setmanes</h3>${svgRadar('Resultat mitjà per àrea', 'Radar amb el resultat mitjà per àrea cognitiva: últimes 4 setmanes (ara) comparades amb les 4 anteriors.', DOMINIS.map(k => NOMS_DOMINI[k]), ara4, ant4.some(x => x != null) ? ant4 : null)}</div>
    <div class="panell"><h3>Activitat dels últims 6 mesos</h3>${mapaCalor()}</div>`;
}

// ---------- JOCS ----------
function cuJocs(d) {
  if (estatConsent() === 'no') return '<div class="estat-buit"><p>Sense consentiment per mostrar les dades.</p></div>';
  const files = jocsIndividuals().map(j => {
    const s = sessionsJoc(d, j.id); if (!s.length) return `<tr class="sense-dades"><th scope="row">${esc(nomTecnicJoc(j.id))}</th><td colspan="9">Encara no ha jugat</td></tr>`;
    const ult = s.slice(-5), ant = s.slice(-10, -5), mit = Math.round(mitjana(s.map(h => h.pct))), millor = Math.max(...s.map(h => h.puntuacio || 0));
    let tend = '<span class="tend igual">' + ico('igual') + 'Estable</span>';
    if (ult.length >= 3 && ant.length >= 3) { const df = mitjana(ult.map(h => h.pct)) - mitjana(ant.map(h => h.pct)); tend = df > 4 ? `<span class="tend amunt">${ico('fletxa-amunt')}Puja</span>` : df < -4 ? `<span class="tend avall">${ico('fletxa-avall')}Baixa</span>` : tend; } else tend = '<span class="tend igual">Poques dades</span>';
    const trs = s.map(h => h.tempsReaccioMediana).filter(Boolean), dur = s.map(h => h.durada).filter(Boolean), aj = s.reduce((t, h) => t + (h.ajudesUsades || 0), 0), ab = (d.abandonaments || []).filter(a => a.joc === j.id).length;
    return `<tr><th scope="row">${esc(nomTecnicJoc(j.id))}</th><td>${JOCS_AMB_NIVELL.includes(j.id) ? NOMS_NIVELL[nivellGuardat(j.id)] : '—'}</td><td>${s.length}</td><td>${millor}</td><td>${mit}%</td><td>${tend}</td><td>${trs.length ? (mediana(trs) / 1000).toFixed(1).replace('.', ',') + ' s' : '—'}</td><td>${dur.length ? formatDurada(Math.round(mitjana(dur))) : '—'}</td><td>${aj}</td><td>${ab}</td></tr>`;
  }).join('');
  return `<div class="taula-wrap" role="region" aria-label="Taula de jocs" tabindex="0"><table class="taula-cu"><caption class="nomes-lector">Resum per joc</caption><thead><tr><th scope="col">Joc</th><th scope="col">Nivell</th><th scope="col">Partides</th><th scope="col">Millor punt.</th><th scope="col">Mitjana</th><th scope="col">Tendència</th><th scope="col">Reacció</th><th scope="col">Durada</th><th scope="col">Ajudes</th><th scope="col">Abandons</th></tr></thead><tbody>${files}</tbody></table></div>
    <p class="ajuda-camp">«Ajudes» són pistes, desfer i obertures del «?» durant la partida. «Abandons» són partides deixades a mitges (no compten com a resultat). El nivell s'ajusta sol (adaptatiu) dins del màxim que fixi el pla.</p>`;
}

// ---------- SALUT I ÀNIM ----------
function svgTemps(d) {
  const dies = Array.from({ length: 30 }, (_, k) => dataMenys(29 - k)), W = 500, H = 200, m = { t: 22, r: 12, b: 28, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b, a = iw / dies.length;
  const n = dies.map(iso => d.historial.filter(h => h.data === iso).length), max = Math.max(3, ...n), hist = (d.salut && d.salut.historial) || {};
  const yAnim = v => m.t + ih - ih * (v - 1) / 3;
  let g = n.map((v, i) => `<rect class="barra" x="${m.l + a * i + 2}" y="${m.t + ih - ih * v / max}" width="${Math.max(2, a - 4)}" height="${ih * v / max}" rx="2" opacity=".35"><title>${dies[i]}: ${v} partides</title></rect>`).join('');
  const pts = dies.map((iso, i) => { const an = (hist[iso] || {}).anim; return an ? { x: m.l + a * i + a / 2, y: yAnim(PUNTS_ANIM[an]), an, iso } : null; }).filter(Boolean);
  if (pts.length > 1) g += `<path class="linia" style="stroke:var(--accio-fosc);stroke-width:2" d="M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}"/>`;
  g += pts.map(p => `<g tabindex="0" role="img" aria-label="${esc(p.iso + ': ànim ' + p.an)}" data-tip="${esc(p.iso + ': ànim ' + p.an)}"><circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--superficie)" stroke="var(--accio-fosc)" stroke-width="2.5"/></g>`).join('');
  (d.notes || []).forEach(nt => { const i = dies.indexOf(nt.data); if (i >= 0) { const x = m.l + a * i + a / 2; g += `<g tabindex="0" role="img" aria-label="${esc('Nota ' + nt.data + ': ' + nt.text)}" data-tip="${esc('Nota ' + nt.data + ': ' + nt.text)}"><path d="M ${x} 4 l 6 6 l -6 6 l -6 -6 z" fill="var(--accio)" stroke="var(--text)" stroke-width="1.2"/></g>`; } });
  g += [['Bé', 4], ['Normal', 3], ['Cansat', 2], ['Baix', 1]].map(([t, v]) => `<text x="${m.l - 5}" y="${yAnim(v) + 4}" text-anchor="end">${t}</text>`).join('');
  g += dies.map((iso, i) => i % 5 === 0 ? `<text x="${m.l + a * i + a / 2}" y="${H - 8}" text-anchor="middle">${iso.slice(8)}</text>` : '').join('');
  return `<figure class="grafic-fig"><svg class="grafic" viewBox="0 0 ${W} ${H}" role="group" aria-labelledby="gtt gtd"><title id="gtt">Activitat i ànim dels últims 30 dies</title><desc id="gtd">Barres: partides per dia. Línia: estat d'ànim anotat. Rombes: notes del cuidador.</desc>${g}</svg><figcaption class="ajuda-camp tip" aria-live="polite">Barres = partides per dia · línia = ànim · rombes = notes. Toca un punt per veure'n el detall.</figcaption></figure>`;
}
function cuSalut(d) {
  if (estatConsent() === 'no') return '<div class="estat-buit"><p>Sense consentiment per mostrar les dades.</p></div>';
  return `<div class="grafic-card"><h3>Línia de temps conjunta</h3>${svgTemps(d)}</div>` + renderSalut();
}

// ---------- NOTES ----------
function cuNotes(d) {
  const llista = [...(d.notes || [])].sort((a, b) => b.data.localeCompare(a.data));
  return `${modeLectura ? '' : `<form class="panell" onsubmit="return cuAfegeixNota(event)"><h3>Afegir una observació</h3><p class="ajuda-camp">Per exemple: «avui estava cansada», «ha canviat de medicació». Apareix com a marca als gràfics i a l'informe.</p>
    <label class="etiqueta-camp" for="notaData">Data</label><input type="date" id="notaData" class="camp-input" value="${avuiISO()}" max="${avuiISO()}">
    <label class="etiqueta-camp" for="notaText">Nota</label><textarea id="notaText" class="camp-input" rows="3" maxlength="400" required></textarea>
    <button type="submit" class="boto-principal boto-ample" style="margin-top:.6rem">Guardar la nota</button></form>`}
    <h2 class="titol-seccio">Observacions</h2>${llista.length ? llista.map(n => `<div class="missatge-item"><div><div class="cap">${esc(n.data)}${n.autor ? ' · ' + esc(n.autor) : ''}</div><div class="cos">${esc(n.text)}</div></div>${modeLectura ? '' : `<button type="button" class="esborra-petit" aria-label="Esborrar la nota del ${esc(n.data)}" onclick="cuEsborraNota('${esc(n.id)}')">${ico('paperera')}</button>`}</div>`).join('') : '<div class="estat-buit"><p>Encara no hi ha observacions. Una nota sobre un mal dia o un canvi de medicació ajuda a interpretar els gràfics.</p></div>'}`;
}
function cuAfegeixNota(ev) {
  ev.preventDefault(); const text = $('notaText').value.trim(), data = $('notaData').value || avuiISO(); if (!text) return false;
  const d = dadesActuals(); d.notes = (d.notes || []).concat([{ id: 'n_' + Date.now(), data, text, autor: (dadesCuidador() || {}).nom || '' }]); guardarDadesUsuari();
  registraAcces('nota'); toast('Nota guardada', 2200, 'exit'); renderCuidador(); return false;
}
function cuEsborraNota(id) { mostrarConfirmacio('Esborrar la nota?', 'Aquesta observació es perdrà.', () => { const d = dadesActuals(); d.notes = d.notes.filter(n => n.id !== id); guardarDadesUsuari(); renderCuidador(); }); }

// ---------- PLA (el cuidador configura l'experiència de la persona) ----------
const swPla = (clau, nom, sub, on) => `<div class="ajust-fila"><div class="etiqueta-ajust">${nom}${sub ? `<small>${sub}</small>` : ''}</div><button type="button" class="toggle${on ? ' actiu' : ''}" role="switch" aria-checked="${on}" aria-label="${nom}" onclick="cuTogglePla('${clau}')"></button></div>`;
function cuPla(d) {
  const p = d.plaCuidador, ocults = p.jocsOcults || [];
  return `<div class="panell grup-ajustos"><h3>Jocs que veu la persona</h3><p class="ajuda-camp">Amaga els que la frustren. Els amagats no surten ni a les sessions ni als menús.</p>
    <div class="llista-jocs-pla">${jocsIndividuals().map(j => `<label class="joc-pla dom-${j.domini}"><input type="checkbox" ${ocults.includes(j.id) ? '' : 'checked'} onchange="cuToggleJoc('${j.id}')"><span class="targeta-ico petita">${ico(iconaJoc(j.id))}</span><span>${esc(j.nom)}</span></label>`).join('')}</div></div>
    <div class="panell grup-ajustos"><h3>Dificultat i durada</h3>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-nmax">Nivell màxim<small>El sistema ajusta sol el nivell, però mai per sobre d'aquest</small></div><div class="segmentat" role="radiogroup" aria-labelledby="et-nmax">${['facil', 'mig', 'dificil'].map(n => `<button type="button" role="radio" aria-checked="${p.nivellMaxim === n}" class="${p.nivellMaxim === n ? 'sel' : ''}" onclick="cuNivellMaxim('${n}')">${NOMS_NIVELL[n]}</button>`).join('')}</div></div>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-dif">Dificultat<small>Adaptativa: puja o baixa sense dir-li res a la persona</small></div><div class="segmentat" role="radiogroup" aria-labelledby="et-dif" data-tria="dificultatMode"><button type="button" role="radio" data-valor="adaptatiu">Adaptativa (recomanada)</button><button type="button" role="radio" data-valor="manual">Manual</button></div></div>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-dur">Durada de la sessió</div><div class="segmentat" role="radiogroup" aria-labelledby="et-dur" data-tria="duradaSessio"><button type="button" role="radio" data-valor="5">5 min</button><button type="button" role="radio" data-valor="10">10 min</button><button type="button" role="radio" data-valor="15">15 min</button></div></div>
    </div>
    <div class="panell grup-ajustos"><h3>Recordatori per jugar</h3>
      <div class="ajust-fila"><div class="etiqueta-ajust">Recordar que jugui<small>Una nota a l'inici a l'hora triada</small></div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Recordar que jugui" data-ajust="recordaJugar"></button></div>
      <div class="ajust-bloc"><label class="etiqueta-ajust" for="horaPreferida">Hora</label><input type="time" class="camp-input" id="horaPreferida" onchange="canviarHoraPreferida(this.value)"></div>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-dies">Dies</div><div class="xips-dies" id="xipsDies" role="group" aria-labelledby="et-dies"></div></div>
    </div>
    <div class="panell grup-ajustos"><h3>Accessibilitat</h3>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-zoom">Mida de la lletra</div><div class="segmentat" role="radiogroup" aria-labelledby="et-zoom" data-tria="zoom"><button type="button" role="radio" data-valor="normal">Normal</button><button type="button" role="radio" data-valor="gran">Gran</button><button type="button" role="radio" data-valor="extragran">Extra</button><button type="button" role="radio" data-valor="gegant">Gegant</button></div></div>
      <div class="ajust-fila"><div class="etiqueta-ajust">So i efectes</div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="So i efectes" data-ajust="efectesSo"></button></div>
      <div class="ajust-fila"><div class="etiqueta-ajust">Lectura en veu alta<small>Llegeix preguntes i instruccions</small></div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Lectura en veu alta" data-ajust="veu"></button></div>
      <div class="ajust-fila"><div class="etiqueta-ajust">Alt contrast</div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Alt contrast" data-ajust="altContrast"></button></div>
      <div class="ajust-fila"><div class="etiqueta-ajust">Mode una mà</div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Mode una mà" data-ajust="unaMa"></button></div>
      <div class="ajust-fila"><div class="etiqueta-ajust">Filtre de tremolor<small>Ignora tocs molt breus i tocs repetits</small></div><button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Filtre de tremolor" data-ajust="filtreTremolor"></button></div>
      <div class="ajust-bloc"><div class="etiqueta-ajust" id="et-elefant-cu">Presència de l'Elefant<small>A l'Espai del Cuidador no es mostra mai</small></div><div class="segmentat" role="radiogroup" aria-labelledby="et-elefant-cu" data-tria="elefantPresencia"><button type="button" role="radio" data-valor="molt">Molt present</button><button type="button" role="radio" data-valor="normal">Normal</button><button type="button" role="radio" data-valor="discret">Discret</button><button type="button" role="radio" data-valor="apagat">Apagat</button></div></div>
    </div>
    <div class="panell grup-ajustos"><h3>Mode 2 jugadors i records</h3>
      ${swPla('dosJugadors', 'Permetre el mode 2 jugadors', 'Jugar amb algú més al mateix dispositiu', p.dosJugadors !== false)}
    </div>`;
}
function cuToggleJoc(id) { const p = dadesActuals().plaCuidador, i = p.jocsOcults.indexOf(id); if (i >= 0) p.jocsOcults.splice(i, 1); else if (jocsIndividuals().length - p.jocsOcults.length > 1) p.jocsOcults.push(id); else toast('Ha de quedar almenys un joc visible.', 3000); guardarDadesUsuari(); soClic(); renderCuidador(); }
function cuNivellMaxim(n) { dadesActuals().plaCuidador.nivellMaxim = n; guardarDadesUsuari(); soClic(); renderCuidador(); }
function cuTogglePla(clau) { const p = dadesActuals().plaCuidador; p[clau] = p[clau] === false ? true : false; guardarDadesUsuari(); soClic(); renderCuidador(); }

// ---------- INFORME ----------
function cuInforme(d) {
  const c = estatConsent(), bloq = c === 'no' ? ' disabled' : '';
  return `<div class="panell grup-ajustos"><h3>Informes en PDF</h3>
      <p class="ajuda-camp">Els dos porten l'avís de no-diagnòstic. «Per a la família» és en llenguatge senzill; «per al professional» és més precís (taules i tendències).</p>
      <button type="button" class="boto-principal boto-ample"${bloq} onclick="informeCuidadorPDF('familia')">${ico('document')}Informe per a la família</button>
      <button type="button" class="boto-secundari boto-ample"${bloq} onclick="informeCuidadorPDF('professional')">${ico('document')}Informe per al professional</button>
      <button type="button" class="boto-fantasma boto-ample"${bloq} onclick="informeCuidadorImprimir()">Imprimir o desar en PDF</button></div>
    <div class="panell grup-ajustos"><h3>Compartir i exportar</h3>
      <button type="button" class="boto-secundari boto-ample"${bloq} onclick="compartirResumFamilia()">${ico('compartir')}Compartir el resum</button>
      <button type="button" class="boto-secundari boto-ample"${bloq} onclick="exportaPaquetLectura()">${ico('descarregar')}Paquet per a un familiar (JSON)</button>
      <button type="button" class="boto-secundari boto-ample"${bloq} onclick="exportarCSV()">${ico('document')}Exportar les partides (CSV)</button>
      <button type="button" class="boto-secundari boto-ample" onclick="exportarDades()">${ico('descarregar')}Còpia de seguretat (JSON)</button>
      <p class="ajuda-camp">El <strong>paquet de lectura</strong> permet que un familiar que viu lluny el pugui obrir al seu mòbil o ordinador i veure l'Espai del Cuidador <strong>sense poder canviar res</strong>. Cada exportació queda anotada al registre d'accessos.</p></div>
    <div class="panell grup-ajustos"><h3>Obrir un paquet de lectura</h3><p class="ajuda-camp">Si algú t'ha enviat un paquet, el pots mirar aquí sense barrejar-lo amb les teves dades.</p>
      <button type="button" class="boto-secundari boto-ample" onclick="$('inputPaquet').click()">${ico('pujar')}Obrir un paquet de lectura</button><input type="file" id="inputPaquet" accept="application/json,.json" hidden onchange="importaPaquetLectura(event)"></div>`;
}
async function compartirResumFamilia() { const d = dadesActuals(); d.ultimResum = avuiISO(); guardarDadesUsuari(); registraAcces('comparteix', 'resum setmanal'); await compartirProgres(); renderCuidador(); }
function exportaPaquetLectura() {
  const u = getUsuariActual(), d = JSON.parse(JSON.stringify(u.dades)); delete d.diari; d.salut = { historial: d.salut.historial, xecs: d.salut.xecs };
  const paquet = { app: 'MentA', tipus: 'paquet-lectura', versio: VERSIO, schema: SCHEMA, generat: new Date().toISOString(), persona: { nom: u.nom, color: u.color, avatar: u.avatar || 'inicial' }, dades: d };
  baixaFitxer(`MentA-lectura-${u.nom.replace(/[^\w-]+/g, '_')}-${avuiISO()}.json`, JSON.stringify(paquet), 'application/json'); registraAcces('exporta', 'paquet de lectura'); toast('Paquet descarregat. No inclou el diari personal ni les fotos.', 5000, 'exit');
}

// Informes PDF (jsPDF local, carregat sota demanda)
async function informeCuidadorPDF(variant) {
  if (modeLectura || estatConsent() === 'no') { if (estatConsent() === 'no') return; }
  const ok = await carregaJsPDF(); if (!ok) { toast('No s\'ha pogut preparar el PDF. Prova l\'alternativa d\'impressió.', 4500, 'error'); return; }
  const d = dadesActuals(), u = getUsuariActual(), s = calculaSemafor(d), pro = variant === 'professional', doc = pdfNou({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const V = [19, 74, 44], T = [36, 31, 25], S = [90, 81, 70]; let y = 42;
  doc.setFillColor(...V); doc.rect(0, 0, 210, 30, 'F'); try { doc.addImage(LOGO_PDF, 'PNG', 12, 5, 20, 20); } catch (e) { /* sense logo */ }
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(pro ? 'MentA · Informe orientatiu per al professional' : 'MentA · Com li va a ' + u.nom, 38, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`${u.nom} · generat el ${new Date().toLocaleDateString(localeApp())} · període: últimes 8 setmanes`, 38, 22);
  const sec = t => { if (y > 258) { doc.addPage(); y = 20; } doc.setTextColor(...V); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(t, 14, y); y += 7; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...T); };
  const par = (k, v) => { if (y > 275) { doc.addPage(); y = 20; } doc.setTextColor(...S); doc.text(k, 14, y); doc.setTextColor(...T); doc.setFont('helvetica', 'bold'); doc.text(String(v), 80, y); doc.setFont('helvetica', 'normal'); y += 6; };
  const text = (t, w = 180) => { const l = doc.splitTextToSize(t, w); l.forEach(x => { if (y > 278) { doc.addPage(); y = 20; } doc.text(x, 14, y); y += 5; }); y += 2; };
  const a28 = agrega(d, 0, 27), p28 = agrega(d, 28, 55), ws = Array.from({ length: 8 }, (_, i) => setmanaDades(d, 7 - i));
  sec('Resum'); doc.setFont('helvetica', 'bold'); text({ verd: 'Constància estable i resultats dins del seu nivell habitual.', groc: s.frase, vermell: s.frase, gris: s.frase }[s.estat]); doc.setFont('helvetica', 'normal');
  par('Estat del semàfor', { verd: 'Verd · tot en ordre', groc: 'Groc · convé fixar-s\'hi', vermell: 'Vermell · canvis sostinguts', gris: 'Sense prou dades' }[s.estat]);
  par('Dies actius (últims 28 dies)', `${a28.dies} (anteriors 28: ${p28.dies})`); par('Minuts jugats (28 dies)', a28.minuts);
  if (pro) { par('Precisió global (28 dies)', a28.pct != null ? Math.round(a28.pct) + '%' : '—'); par('Temps de reacció (mediana)', a28.tr ? (a28.tr / 1000).toFixed(2) + ' s' : '—'); par('Variabilitat del temps de reacció', a28.variab != null ? a28.variab.toFixed(2) : '—'); par('Abandonaments (28 dies)', a28.ab); y += 2; }
  sec(pro ? 'Evolució setmanal' : 'Setmana a setmana');
  const gx = 20, gy = y + 36, gw = 170, gh = 32; doc.setDrawColor(200, 200, 200); doc.line(gx, gy, gx + gw, gy);
  ws.forEach((w, i) => { const bw = 12, x = gx + 6 + i * (gw / 8), h = w.pct ? gh * w.pct / 100 : 0; doc.setFillColor(...V); if (h) doc.rect(x, gy - h, bw, h, 'F'); doc.setTextColor(...S); doc.setFontSize(8); doc.text(w.k === 0 ? 'Ara' : '-' + w.k + 's', x + bw / 2, gy + 4, { align: 'center' }); if (w.pct != null) doc.text(Math.round(w.pct) + '%', x + bw / 2, gy - h - 1.5, { align: 'center' }); });
  doc.setFontSize(10); y = gy + 12;
  if (pro) {
    sec('Taula setmanal'); doc.setFont('helvetica', 'bold'); ['Setmana', 'Partides', 'Dies', 'Min', 'Precisió', 'T. reacc.', 'Abandons'].forEach((c, i) => doc.text(c, [14, 46, 68, 84, 100, 126, 156][i], y)); doc.setFont('helvetica', 'normal'); y += 6;
    ws.forEach(w => { if (y > 278) { doc.addPage(); y = 20; } [w.k === 0 ? 'Últims 7 d.' : 'Fa ' + w.k + ' set.', w.n, w.dies, w.minuts, w.pct != null ? Math.round(w.pct) + '%' : '—', w.tr ? (w.tr / 1000).toFixed(2) + ' s' : '—', w.abandonades].forEach((c, i) => doc.text(String(c), [14, 46, 68, 84, 100, 126, 156][i], y)); y += 5.5; }); y += 4;
    sec('Resultat per àrees (28 dies)'); DOMINIS.forEach(k => { const v = pctDomini(d, k, dataMenys(27), avuiISO()); par(NOMS_DOMINI[k], v.v == null ? 'Dades insuficients' : v.v + '% (' + v.n + ' partides)'); });
    sec('Regles aplicades al semàfor'); doc.setFontSize(9); text(`Mínim ${SEMAFOR.minSessions} sessions en 8 setmanes. Línia base: mitjana de les 4 setmanes anteriors de la mateixa persona. Groc: precisió -${Math.round(SEMAFOR.precisioGroc * 100)}% durant ${SEMAFOR.setmanesGroc} setmanes, o constància ≤${Math.round(SEMAFOR.constanciaGroc * 100)}% de la base, o ≥${SEMAFOR.diesSenseJugarGroc} dies sense jugar, o >${Math.round(SEMAFOR.abandonamentsGroc * 100)}% d'abandonaments, o temps de reacció +${Math.round(SEMAFOR.tempsReaccioGroc * 100)}%. Vermell: precisió -${Math.round(SEMAFOR.precisioVermell * 100)}% durant ${SEMAFOR.setmanesVermell} setmanes o ≥${SEMAFOR.diesSenseJugarVermell} dies sense jugar.`.replace(/≤/g, '<=').replace(/≥/g, '>='), 180); doc.setFontSize(10);
  } else {
    sec('Com es troba'); const hist = (d.salut && d.salut.historial) || {}, anims = [...Array(14)].map((_, k) => (hist[dataMenys(k)] || {}).anim).filter(Boolean);
    text(anims.length ? `En els últims 14 dies ha anotat el seu ànim ${anims.length} vegades: ${['Bé', 'Normal', 'Baix', 'Cansat'].map(a => `${anims.filter(x => x === a).length} «${a.toLowerCase()}»`).join(', ')}.` : 'Encara no ha anotat com es troba.');
    text(s.avisos.length ? 'Aspectes a tenir en compte: ' + s.avisos.map(a => a.titol).join('; ') + '.' : 'No hi ha cap aspecte que calgui vigilar ara mateix.');
  }
  if ((d.notes || []).length) { sec('Observacions del cuidador'); [...d.notes].sort((a, b) => a.data.localeCompare(b.data)).slice(-10).forEach(n => text(`${n.data}${n.autor ? ' (' + n.autor + ')' : ''}: ${n.text}`)); }
  const t = d.tests.slice(-4); if (pro && t.length) { sec('Mini-test de memòria (joc orientatiu)'); t.forEach(x => par(x.data, `${x.punts}/${x.total}`)); }
  if (y > 246) { doc.addPage(); y = 20; }
  doc.setFillColor(244, 239, 231); doc.roundedRect(14, y, 182, 30, 2, 2, 'F'); doc.setFontSize(9); doc.setTextColor(...S);
  doc.text(doc.splitTextToSize('Avís important. Aquests indicadors són orientatius i mesuren el rendiment en uns jocs, no la salut. MentA no és un dispositiu sanitari ni fa diagnòstics. Si observeu canvis que us preocupen, consulteu un professional de la salut.', 172), 19, y + 7);
  doc.setFontSize(8); doc.text(`Generat per MentA v${VERSIO_CURTA} al dispositiu del cuidador. Les dades no s'han enviat enlloc.`, 14, 289);
  const url = URL.createObjectURL(doc.output('blob')), a = document.createElement('a');
  a.href = url; a.download = `MentA-informe-${pro ? 'professional' : 'familia'}-${u.nom.replace(/[^\w-]+/g, '_')}-${avuiISO()}.pdf`; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
  registraAcces('informe', variant); soVictoria(); toast('Informe descarregat', 2800, 'exit');
}
function informeCuidadorImprimir() { registraAcces('informe', 'impressió'); informeImprimir(); }

// ---------- AJUSTOS ----------
const NOMS_ROL = { jo: 'Jo mateix/a', cuidat: 'Una persona gran (l\'ajudo jo)', residencia: 'Residència o centre' };
function cuAjustos(d) {
  const c = dadesCuidador() || {}, u = getUsuariActual(), acc = lsGet(CLAU_ACCESSOS, []).slice(-30).reverse(), est = estatConsent();
  return `<div class="panell grup-ajustos"><h3>Qui fa servir MentA?</h3><div class="segmentat" role="radiogroup" aria-label="Rol">${Object.entries(NOMS_ROL).map(([k, n]) => `<button type="button" role="radio" aria-checked="${ajustes.rol === k}" class="${ajustes.rol === k ? 'sel' : ''}" onclick="cuCanviaRol('${k}')">${n}</button>`).join('')}</div>
      <p class="ajuda-camp">Les residències tenen el selector de resident i el panell de planta. Els canvis no esborren cap dada.</p></div>
    <div class="panell grup-ajustos"><h3>PIN i cuidador</h3>
      <p>${teCuidadorPin() ? 'Hi ha un PIN creat' + (c.nom ? ' per ' + esc(c.nom) : '') + '.' : 'Encara no hi ha cap PIN: qualsevol persona pot entrar a aquest espai.'}</p>
      <button type="button" class="boto-secundari boto-ample" onclick="cuCanviaPin()">${teCuidadorPin() ? 'Canviar el PIN' : 'Crear un PIN'}</button>
      ${teCuidadorPin() ? `<button type="button" class="boto-fantasma boto-ample" onclick="cuTreuPin()">Treure el PIN</button>` : ''}
      <label class="etiqueta-camp" for="cuNom">El teu nom (apareix a les notes i als informes)</label><input type="text" id="cuNom" class="camp-input" maxlength="20" value="${esc(c.nom || '')}" onchange="cuDesaNom(this.value)">
      <p class="ajuda-camp">El PIN evita que la persona gran hi entri per error. <strong>No és seguretat forta</strong>: les dades viuen en aquest dispositiu.</p></div>
    <div class="panell grup-ajustos"><h3>Consentiment de ${esc(u.nom)}</h3><p>${CONSENT_TEXT[est]}${u.dades.consentiment ? ' · ' + esc(u.dades.consentiment.data) : ''}</p>
      <div class="segmentat" role="radiogroup" aria-label="Consentiment">${['si', 'tutor', 'no'].map(k => `<button type="button" role="radio" aria-checked="${est === k}" class="${est === k ? 'sel' : ''}" onclick="establirConsent('${k}')">${k === 'si' ? 'D\'acord' : k === 'tutor' ? 'Família o tutor' : 'No'}</button>`).join('')}</div>
      <p class="ajuda-camp">Si la persona no pot decidir-ho (deteriorament avançat), el consentiment l'ha de donar la <strong>família o el tutor legal</strong>, i ho gestiona la residència o la família, no l'app. Les dades de salut són una categoria especial (RGPD): no surten del dispositiu si no ho decideix el cuidador.</p></div>
    <div class="panell grup-ajustos"><h3>Persones i ajustos</h3>
      <button type="button" class="boto-secundari boto-ample" onclick="obrirModalUsuaris(true)">${ico('usuari')}Gestionar persones</button>
      <button type="button" class="boto-secundari boto-ample" onclick="mostrarPantalla('configuracio')">${ico('ajustos')}Ajustos avançats</button>
      <button type="button" class="boto-fantasma boto-ample" onclick="mostrarPantalla('privadesa')">${ico('escut')}Privadesa i condicions</button></div>
    <div class="panell"><h3>Registre d'accessos</h3><p class="ajuda-camp">Qui ha vist o exportat dades i quan (últims 30).</p>${acc.length ? `<ul class="registre">${acc.map(x => `<li><time>${new Date(x.ts).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}</time> · ${esc(x.qui)} · <strong>${esc(x.accio)}</strong>${x.detall ? ' · ' + esc(x.detall) : ''} · ${esc(x.persona)}</li>`).join('')}</ul>` : '<p class="ajuda-camp">Encara no hi ha cap accés registrat.</p>'}</div>`;
}
function cuCanviaRol(r) { ajustes.rol = r; guardarAjustes(); soClic(); if (r === 'residencia' && !teCuidadorPin()) demanaPin('crear', () => renderCuidador()); renderCuidador(); if (typeof refrescarTot === 'function') refrescarTot(); }
function cuCanviaPin() { const crea = () => demanaPin('crear', () => renderCuidador()); if (teCuidadorPin()) demanaPin('verificar', crea); else crea(); }
function cuTreuPin() { demanaPin('verificar', () => { const c = dadesCuidador() || {}; delete c.hash; delete c.sal; lsSet(CLAU_CUIDADOR, c); toast('PIN eliminat', 2500); renderCuidador(); }); }
function cuDesaNom(v) { const c = dadesCuidador() || {}; c.nom = v.trim(); lsSet(CLAU_CUIDADOR, c); ajustes.cuidadorNom = c.nom; guardarAjustes(); }
