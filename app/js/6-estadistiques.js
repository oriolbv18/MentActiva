'use strict';
// ==========================================================
//  MentA · PROGRÉS (pantalla d'estadístiques) I INFORMES
//  Pestanyes: Resum · Dominis · Jocs · Calendari · Salut.
//  Tot surt del registre de sessions (dadesActuals().historial) i es calcula al dispositiu.
//  Els gràfics són SVG propis, amb títol, descripció i taula alternativa.
// ==========================================================

// ---------- Càlcul ----------
const sessions = () => dadesActuals().historial;
function rangSetmana(offset) {
  const avui = new Date(); avui.setHours(12, 0, 0, 0);
  const dilluns = new Date(avui); dilluns.setDate(avui.getDate() - diaSetmana(avui) + offset * 7);
  const diumenge = new Date(dilluns); diumenge.setDate(dilluns.getDate() + 6);
  return { ini: isoData(dilluns), fi: isoData(diumenge) };
}
const entre = (arr, ini, fi) => arr.filter(h => h.data >= ini && h.data <= fi);
function resum(arr) {
  const dies = new Set(arr.map(h => h.data)), durs = arr.map(h => h.durada).filter(Boolean);
  return { partides: arr.length, dies: dies.size, minuts: Math.round(durs.reduce((a, b) => a + b, 0) / 60), tempsConegut: durs.length > 0, pct: arr.length ? Math.round(mitjana(arr.map(h => h.pct))) : null };
}
const plural = (n, s, p) => n === 1 ? s : p;
function fraseSetmana(a, b) {
  if (!a.partides && !b.partides) return 'Encara no has jugat aquestes setmanes. Una partida breu ja compta: quan vulguis, aquí estarem.';
  if (!a.partides) return `Aquesta setmana encara no has jugat. La passada vas jugar ${b.dies} ${plural(b.dies, 'dia', 'dies')}. Quan vulguis, tornem-hi.`;
  let f = `Aquesta setmana has jugat ${a.dies} ${plural(a.dies, 'dia', 'dies')}`;
  if (a.dies > b.dies) f += `, ${a.dies - b.dies} més que la passada.`;
  else if (a.dies < b.dies) f += `. La passada en vas jugar ${b.dies}: cada setmana és diferent.`;
  else f += ', igual que la passada.';
  return f;
}
function diferencia(a, b, unitat = '', invers) {
  if (a == null || b == null) return '<span class="dif">Sense comparació</span>';
  const d = a - b; if (!d) return `<span class="dif">${ico('igual')}Igual que la passada</span>`;
  const bo = invers ? d < 0 : d > 0;
  return `<span class="dif ${d > 0 ? 'amunt' : 'avall'}">${ico(d > 0 ? 'fletxa-amunt' : 'fletxa-avall')}${d > 0 ? '+' : ''}${d}${unitat} respecte a la passada</span>`;
}

// ---------- Gràfics SVG ----------
let _idGrafic = 0;
function taulaAlt(titol, caps, files) {
  return `<details class="taula-alt"><summary>Veure les dades en forma de taula</summary><table><caption class="nomes-lector">${esc(titol)}</caption><thead><tr>${caps.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${files.map(f => `<tr>${f.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}
function svgBarres(titol, desc, punts, unitat = '') {
  const id = 'g' + (++_idGrafic), W = 500, H = 200, m = { t: 22, r: 8, b: 28, l: 8 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const max = Math.max(...punts.map(p => p.v), 1), n = punts.length, a = iw / n, bw = Math.min(26, a * .62);
  const barres = punts.map((p, i) => {
    const h = p.v ? Math.max(5, p.v / max * ih) : 0, x = m.l + a * i + (a - bw) / 2, y = m.t + ih - h;
    return `<g tabindex="0" role="img" aria-label="${esc(p.tip)}" data-tip="${esc(p.tip)}"><rect class="barra${p.avui ? ' avui' : ''}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4"/>${p.v ? `<text class="valor" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${p.v}${unitat}</text>` : ''}<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(p.et)}</text></g>`;
  }).join('');
  return `<figure class="grafic-fig"><svg class="grafic" viewBox="0 0 ${W} ${H}" role="group" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(titol)}</title><desc id="${id}d">${esc(desc)}</desc><line class="graella" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/>${barres}</svg><figcaption class="ajuda-camp tip" aria-live="polite">Toca una barra per veure'n el detall.</figcaption>${taulaAlt(titol, ['Dia', 'Valor'], punts.map(p => [p.et, p.tip]))}</figure>`;
}
function svgLinia(titol, desc, punts, opts = {}) {
  // opts: ymin, ymax, ticks, etY (etiquetes de l'eix), unitat (per defecte «%»), senseValors, marques [{idx, text}] (notes del cuidador)
  const id = 'g' + (++_idGrafic), W = 500, H = 220, m = { t: 26, r: 18, b: 30, l: opts.etY ? 62 : 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b, ymax = opts.ymax || 100, ymin = opts.ymin || 0, unitat = opts.unitat ?? '%';
  const x = i => m.l + (punts.length > 1 ? iw * i / (punts.length - 1) : iw / 2), y = v => m.t + ih - ih * (v - ymin) / (ymax - ymin);
  const val = punts.map((p, i) => p.v == null ? null : { x: x(i), y: y(p.v), p }).filter(Boolean);
  const ticks = opts.ticks || [0, 25, 50, 75, 100];
  let h = ticks.map(v => `<line class="graella" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${opts.etY ? opts.etY[v] || '' : v + unitat}</text>`).join('');
  if (!val.length) h += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">Encara no hi ha prou dades</text>`;
  else {
    // els buits (setmanes sense dades) trenquen la línia en trams
    const trams = []; let actual = [];
    punts.forEach((p, i) => { if (p.v == null) { if (actual.length) trams.push(actual); actual = []; } else actual.push({ x: x(i), y: y(p.v) }); }); if (actual.length) trams.push(actual);
    trams.forEach(t => { if (t.length > 1) h += `<path class="area" d="M ${t[0].x} ${y(ymin)} ${t.map(q => `L ${q.x} ${q.y}`).join(' ')} L ${t[t.length - 1].x} ${y(ymin)} Z"/><path class="linia" d="M ${t.map(q => `${q.x} ${q.y}`).join(' L ')}"/>`; });
    h += val.map(q => `<g tabindex="0" role="img" aria-label="${esc(q.p.tip)}" data-tip="${esc(q.p.tip)}"><circle class="punt" cx="${q.x}" cy="${q.y}" r="5"/>${opts.senseValors ? '' : `<text class="valor" x="${q.x}" y="${q.y - 11}" text-anchor="middle">${esc(q.p.etV != null ? q.p.etV : q.p.v + unitat)}</text>`}</g>`).join('');
  }
  (opts.marques || []).forEach(mq => { const xx = x(mq.idx); h += `<g tabindex="0" role="img" aria-label="${esc(mq.text)}" data-tip="${esc(mq.text)}"><path d="M ${xx} ${m.t - 16} l 6 6 l -6 6 l -6 -6 z" fill="var(--accio)" stroke="var(--text)" stroke-width="1.2"/><line x1="${xx}" x2="${xx}" y1="${m.t - 4}" y2="${m.t + ih}" stroke="var(--accio)" stroke-width="1.2" stroke-dasharray="2 3"/></g>`; });
  const pas = Math.ceil(punts.length / 8);
  h += punts.map((p, i) => i % pas === 0 || i === punts.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(p.et)}</text>` : '').join('');
  return `<figure class="grafic-fig"><svg class="grafic" viewBox="0 0 ${W} ${H}" role="group" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(titol)}</title><desc id="${id}d">${esc(desc)}</desc>${h}</svg><figcaption class="ajuda-camp tip" aria-live="polite">Toca un punt per veure'n el detall.${(opts.marques || []).length ? ' Els rombes ambre són notes del cuidador.' : ''}</figcaption>${taulaAlt(titol, ['Període', 'Valor'], punts.map(p => [p.et, p.v == null ? 'Sense dades' : p.tip]))}</figure>`;
}
function svgRadar(titol, desc, etiquetes, actual, previ) {
  const id = 'g' + (++_idGrafic), S = 300, c = S / 2, R = 100, n = etiquetes.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * v / 100; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  const poli = vals => vals.map((v, i) => pt(i, v ?? 0).join(',')).join(' ');
  let h = [25, 50, 75, 100].map(v => `<polygon class="radar-fons" points="${etiquetes.map((_, i) => pt(i, v).join(',')).join(' ')}"/>`).join('');
  h += etiquetes.map((_, i) => { const [x, y] = pt(i, 100); return `<line class="radar-eix" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`; }).join('');
  if (previ) h += `<polygon class="radar-prev" points="${poli(previ)}"/>`;
  h += `<polygon class="radar-area" points="${poli(actual)}"/>`;
  h += actual.map((v, i) => { const [x, y] = pt(i, v ?? 0); return `<circle class="radar-punt" cx="${x}" cy="${y}" r="5.5" fill="var(--dom-${DOMINIS[i]})"/>`; }).join('');
  h += etiquetes.map((e, i) => { const [x, y] = pt(i, 128), anc = x < c - 8 ? 'end' : x > c + 8 ? 'start' : 'middle'; return `<text class="radar-et" x="${x}" y="${y + 4}" text-anchor="${anc}">${esc(e)}${actual[i] != null ? ' ' + actual[i] + '%' : ''}</text>`; }).join('');
  return `<figure class="grafic-fig"><svg class="grafic" viewBox="-30 -4 ${S + 60} ${S + 8}" role="group" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(titol)}</title><desc id="${id}d">${esc(desc)}</desc>${h}</svg>
    <div class="llegenda"><span><i style="background:var(--marca-fosc)"></i>Últimes 4 setmanes</span>${previ ? '<span><i style="border:2px dashed var(--text-suau);background:none"></i>4 setmanes anteriors</span>' : ''}</div>
    ${taulaAlt(titol, ['Domini', 'Últimes 4 setmanes', '4 setmanes anteriors'], etiquetes.map((e, i) => [e, actual[i] == null ? 'Sense dades' : actual[i] + '%', previ && previ[i] != null ? previ[i] + '%' : 'Sense dades']))}</figure>`;
}
document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('.grafic [data-tip]'); if (!g) return;
  const tip = g.closest('.grafic-fig').querySelector('.tip'); if (tip) tip.textContent = g.dataset.tip;
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest && e.target.closest('.grafic [data-tip]'); if (!g) return;
  e.preventDefault(); g.closest('.grafic-fig').querySelector('.tip').textContent = g.dataset.tip;
});

// ---------- Pestanya RESUM ----------

// ---------- Pestanya DOMINIS ----------
function pctDomini(d, dom, ini, fi) { const q = entre(d.historial.filter(h => h.domini === dom), ini, fi); return q.length >= 2 ? { v: Math.round(mitjana(q.map(h => h.pct))), n: q.length } : { v: null, n: q.length }; }

// ---------- Pestanya JOCS ----------

// ---------- Pestanya CALENDARI ----------
function mapaCalor() {
  const d = dadesActuals(), cnt = {}; d.historial.forEach(h => { cnt[h.data] = (cnt[h.data] || 0) + 1; });
  const rec = new Set(d.diesRecuperats || []), avui = new Date(); avui.setHours(12, 0, 0, 0);
  const primerDilluns = new Date(avui); primerDilluns.setDate(avui.getDate() - diaSetmana(avui) - 25 * 7);
  let h = '', dies = 0;
  for (let w = 0; w < 26; w++) for (let k = 0; k < 7; k++) {
    const dt = new Date(primerDilluns); dt.setDate(primerDilluns.getDate() + w * 7 + k); const iso = isoData(dt);
    if (dt > avui) { h += '<div class="c buit"></div>'; continue; }
    const n = (cnt[iso] || 0) + (rec.has(iso) && !cnt[iso] ? 1 : 0); if (n) dies++;
    h += `<div class="c${n ? ' n' + (n >= 5 ? 4 : n >= 3 ? 3 : n >= 2 ? 2 : 1) : ''}" title="${iso}: ${n} ${plural(n, 'partida', 'partides')}"></div>`;
  }
  return `<div class="mapa-calor" role="img" aria-label="Mapa d'activitat dels últims 6 mesos: ${dies} dies amb activitat">${h}</div><div class="llegenda"><span><i style="background:var(--superficie-2);border:1px solid var(--vora)"></i>Cap partida</span><span><i style="background:color-mix(in srgb,var(--marca-fosc) 30%,var(--superficie))"></i>1</span><span><i style="background:color-mix(in srgb,var(--marca-fosc) 55%,var(--superficie))"></i>2</span><span><i style="background:color-mix(in srgb,var(--marca-fosc) 80%,var(--superficie))"></i>3-4</span><span><i style="background:var(--marca-fosc)"></i>5 o més</span></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-dia-cal]'); if (!b) return;
  calDiaSel = b.dataset.diaCal; soClic(); const dd = $('detallDia'); dd.hidden = false; dd.innerHTML = htmlDetallDia(calDiaSel);
});

// ---------- Pestanya SALUT ----------
function renderSalutProgres() { const p = $('pp-salut'); if (p) p.innerHTML = renderSalut(); }
function renderSalut() {
  const d = dadesActuals(), s = salutDades(), xec = xecAvui(), hist = s.historial || {};
  const dies30 = Array.from({ length: 30 }, (_, k) => { const iso = dataMenys(29 - k), a = (hist[iso] || {}).anim, dt = dataDeISO(iso); return { et: dt.getDate() + '', v: a ? PUNTS_ANIM[a] : null, etV: a || '', tip: `${dt.getDate()} de ${NOMS_MESOS[dt.getMonth()]}: ${a}` }; });
  const hiHaAnim = dies30.some(x => x.v != null);
  // correlació simple, sense causalitat
  const parells = (clau, bo) => { const si = [], no = []; d.historial.forEach(h => { const x = hist[h.data]; if (!x) return; const val = clau === 'anim' ? (x.anim ? PUNTS_ANIM[x.anim] >= 3 : null) : (x.dormir === undefined && !Object.keys(x).length ? null : !!x.dormir); if (val === null) return; (val ? si : no).push(h.pct); }); return { si, no }; };
  const dorm = parells('dormir'), anim = parells('anim');
  const frase = (p, txtSi, txtNo) => p.si.length >= 4 && p.no.length >= 4 ? `<p>${txtSi} <strong>${Math.round(mitjana(p.si))}%</strong>; ${txtNo} <strong>${Math.round(mitjana(p.no))}%</strong>.</p>` : '';
  const corr = frase(dorm, 'Els dies que dius que has dormit bé, el teu resultat mitjà és de', 'els altres dies, de') + frase(anim, 'Els dies que et trobes bé o normal, el resultat mitjà és de', 'els dies que et trobes baix o cansat, de');
  const tests = d.tests.slice(-6);
  return `<div class="panell"><h3>Avui</h3><div class="salut-xec-resum"><div><b>${xec.aigua ? '✓' : '—'}</b>Aigua</div><div><b>${xec.caminar ? '✓' : '—'}</b>Caminar</div><div><b>${xec.dormir ? '✓' : '—'}</b>Dormir bé</div><div><b>${xec.anim || '—'}</b>Ànim</div></div><button type="button" class="boto-principal boto-ample" onclick="obrirXecSalut()">${ico('cor')}Fer el xec d'avui</button></div>
    <div class="evolucio-card"><h3>Estat d'ànim dels últims 30 dies</h3>${hiHaAnim ? svgLinia('Estat d\'ànim diari', 'Gràfic de línia amb l\'estat d\'ànim que has anotat cada dia durant els últims 30 dies.', dies30, { senseValors: true, ymin: 1, ymax: 4, ticks: [1, 2, 3, 4], etY: { 1: 'Baix', 2: 'Cansat', 3: 'Normal', 4: 'Bé' } }) : '<div class="estat-buit"><p>Anota com et trobes amb el xec diari i aquí veuràs com evoluciona el teu ànim.</p></div>'}</div>
    ${corr ? `<div class="correlacio"><strong>Una observació, no una conclusió</strong>${corr}<p class="nota">Moltes coses influeixen en com et surt un joc. Aquestes dades només t'ajuden a conèixer-te millor, i no diuen que una cosa causi l'altra.</p></div>` : ''}
    <div class="llista-targetes">
      <button type="button" class="fila-accio" onclick="iniciarRespiracio()"><span class="targeta-ico petita dom-llenguatge">${ico('wind')}</span><span class="info"><strong>Respiració 4-7-8</strong><small>Un moment per relaxar-te</small></span>${ico('fletxa', 'fletxa')}</button>
      <button type="button" class="fila-accio" onclick="obrirDiariRecords()"><span class="targeta-ico petita dom-calcul">${ico('diari')}</span><span class="info"><strong>Diari de records</strong><small>Una pregunta al dia</small></span>${ico('fletxa', 'fletxa')}</button>
      <button type="button" class="fila-accio" onclick="mostrarPantalla('testCognitiu')"><span class="targeta-ico petita dom-logica">${ico('test')}</span><span class="info"><strong>Mini-test de memòria</strong><small>Un joc orientatiu de 5 minuts</small></span>${ico('fletxa', 'fletxa')}</button>
      <button type="button" class="fila-accio" onclick="mostrarPantalla('configuracio');setTimeout(()=>$('configuracio').querySelector('[data-rec]').scrollIntoView(),50)"><span class="targeta-ico petita dom-atencio">${ico('campana')}</span><span class="info"><strong>Recordatoris</strong><small>Aigua, caminar, medicació</small></span>${ico('fletxa', 'fletxa')}</button>
    </div>
    ${tests.length ? `<div class="evolucio-card"><h3>Mini-test de memòria</h3>${svgBarres('Resultats del mini-test', 'Gràfic de barres amb els punts de cada mini-test (sobre 13).', tests.map(t => ({ et: t.data.slice(5), v: t.punts, tip: `${t.data}: ${t.punts} de ${t.total}` })))}<p class="nota">El resultat varia d'un dia a l'altre. No és un diagnòstic.</p></div>` : ''}`;
}

// ---------- Estructura, pestanyes i render ----------

// ==========================================================
// INFORME EN PDF (jsPDF local, carregat sota demanda) i alternativa d'impressió
// ==========================================================
let _promesaPDF = null;
function carregaJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(true);
  if (_promesaPDF) return _promesaPDF;
  _promesaPDF = new Promise(res => { const s = document.createElement('script'); s.src = 'vendor/jspdf.umd.min.js'; s.onload = () => res(!!(window.jspdf && window.jspdf.jsPDF)); s.onerror = () => { _promesaPDF = null; res(false); }; document.head.appendChild(s); });
  return _promesaPDF;
}
const AVIS_LEGAL = 'MentA és una eina d\'entreteniment i benestar cognitiu. Aquest informe no és un document mèdic, no fa diagnòstics i no substitueix la valoració d\'un professional de la salut. Si us preocupa la memòria, consulteu un professional.';
function dadesInforme() {
  const u = getUsuariActual(), d = u.dades, a = resum(entre(d.historial, dataMenys(27), avuiISO())), tots = resum(d.historial);
  return {
    nom: u.nom, data: new Date().toLocaleDateString(localeApp()), totals: { partides: d.totalPartides, dies: diesActius().size, ratxa: calcularRatxa(), ratxaMax: calcularRatxaMaxima() },
    mes: a, minutsTotals: tots.minuts,
    setmanes: Array.from({ length: 8 }, (_, k) => { const i = 7 - k, q = entre(d.historial, dataMenys(i * 7 + 6), dataMenys(i * 7)); return { et: i === 0 ? 'Ara' : '-' + i + 's', v: q.length ? Math.round(mitjana(q.map(h => h.pct))) : null, n: q.length }; }),
    dominis: DOMINIS.map(k => ({ nom: NOMS_DOMINI[k], v: pctDomini(d, k, dataMenys(27), avuiISO()).v, n: pctDomini(d, k, dataMenys(27), avuiISO()).n })),
    jocs: jocsIndividuals().filter(j => d.partides[j.id]).map(j => { const s = sessionsJoc(d, j.id); return { nom: j.nom, partides: d.partides[j.id].jugades, mit: s.length ? Math.round(mitjana(s.map(h => h.pct))) : pct(d.partides[j.id].encerts, d.partides[j.id].errors), millor: d.partides[j.id].millor, estrelles: obtenirEstrelles(j.id) }; }),
    tests: d.tests.slice(-5), salut: { respiracio: d.salut.respiracio || 0, xecs: d.salut.xecs || 0, diari: d.diari.length }, medalles: d.medalles.length
  };
}
async function informeGenerarPDF() {
  const ok = await carregaJsPDF();
  if (!ok) { toast('No s\'ha pogut preparar el PDF. T\'obrim la versió per imprimir.', 4500); informeImprimir(); return; }
  const I = dadesInforme(), doc = pdfNou({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const V = [19, 74, 44], T = [36, 31, 25], S = [90, 81, 70];
  doc.setFillColor(...V); doc.rect(0, 0, 210, 30, 'F');
  try { doc.addImage(LOGO_PDF, 'PNG', 12, 5, 20, 20); } catch (e) { /* sense logo */ }
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('MentA · Informe de progrés', 38, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`${I.nom} · ${I.data}`, 38, 22);
  let y = 42;
  const sec = t => { if (y > 262) { doc.addPage(); y = 20; } doc.setTextColor(...V); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(t, 14, y); y += 7; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...T); };
  const par = (k, v) => { doc.setTextColor(...S); doc.text(k, 14, y); doc.setTextColor(...T); doc.setFont('helvetica', 'bold'); doc.text(String(v), 90, y); doc.setFont('helvetica', 'normal'); y += 6; };
  sec('Resum');
  par('Partides jugades', I.totals.partides); par('Dies actius', I.totals.dies); par('Ratxa actual / màxima', `${I.totals.ratxa} / ${I.totals.ratxaMax} dies`);
  par('Últims 28 dies', `${I.mes.partides} partides en ${I.mes.dies} dies${I.mes.pct != null ? ' · resultat mitjà ' + I.mes.pct + '%' : ''}`);
  if (I.minutsTotals) par('Temps jugat (des de la v1.7)', I.minutsTotals + ' min'); par('Medalles', I.medalles); y += 4;
  sec('Resultat mitjà per setmana');
  const gx = 20, gy = y + 36, gw = 170, gh = 34; doc.setDrawColor(200, 200, 200); doc.line(gx, gy, gx + gw, gy);
  I.setmanes.forEach((s, i) => { const bw = 12, x = gx + 6 + i * (gw / 8), h = s.v ? gh * s.v / 100 : 0; doc.setFillColor(...V); if (h) doc.rect(x, gy - h, bw, h, 'F'); doc.setTextColor(...S); doc.setFontSize(8); doc.text(s.et, x + bw / 2, gy + 4, { align: 'center' }); if (s.v != null) doc.text(s.v + '%', x + bw / 2, gy - h - 1.5, { align: 'center' }); });
  doc.setFontSize(10); y = gy + 12;
  sec('Àrees (últimes 4 setmanes)');
  I.dominis.forEach(dm => { doc.setTextColor(...T); doc.text(dm.nom, 14, y); doc.setFillColor(225, 225, 215); doc.rect(55, y - 3.5, 100, 4, 'F'); if (dm.v != null) { doc.setFillColor(...V); doc.rect(55, y - 3.5, dm.v, 4, 'F'); } doc.text(dm.v == null ? 'Sense dades suficients' : dm.v + '%', 160, y); y += 7; }); y += 3;
  sec('Detall per joc');
  doc.setFont('helvetica', 'bold'); ['Joc', 'Partides', 'Mitjana', 'Millor', 'Estrelles'].forEach((c, i) => doc.text(c, [14, 80, 108, 136, 162][i], y)); doc.setFont('helvetica', 'normal'); y += 6;
  if (!I.jocs.length) { doc.text('Encara no hi ha dades.', 14, y); y += 8; }
  I.jocs.forEach(j => { if (y > 275) { doc.addPage(); y = 20; } [j.nom, j.partides, j.mit + '%', j.millor + '%', j.estrelles + ' de 3'].forEach((c, i) => doc.text(String(c), [14, 80, 108, 136, 162][i], y)); y += 6; }); y += 4;
  sec('Mini-test de memòria i hàbits (orientatiu)');
  if (I.tests.length) I.tests.forEach(t => { doc.text(`${t.data}: ${t.punts}/${t.total}`, 14, y); y += 6; }); else { doc.text('No s\'ha fet cap mini-test.', 14, y); y += 6; }
  par('Sessions de respiració', I.salut.respiracio); par('Dies amb xec diari', I.salut.xecs); par('Records al diari', I.salut.diari); y += 4;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(244, 239, 231); doc.roundedRect(14, y, 182, 26, 2, 2, 'F'); doc.setFontSize(9); doc.setTextColor(...S);
  doc.text(doc.splitTextToSize('Avís important. ' + AVIS_LEGAL, 172), 19, y + 7);
  doc.setFontSize(8); doc.text(`Generat per MentA v${VERSIO_CURTA} al dispositiu de l'usuari. Les dades no s'han enviat enlloc.`, 14, 289);
  const url = URL.createObjectURL(doc.output('blob')), a = document.createElement('a');
  a.href = url; a.download = 'MentA-Informe-' + avuiISO() + '.pdf'; a.style.display = 'none'; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
  soVictoria(); tancarModal('modalInforme'); toast('Informe descarregat', 2800, 'exit');
}
function informeImprimir() {
  const I = dadesInforme(), z = $('zonaImpressio');
  z.innerHTML = `<h1 style="font-family:var(--font-titols)">MentA · Informe de progrés</h1><p>${esc(I.nom)} · ${esc(I.data)}</p>
    <h2>Resum</h2><ul><li>Partides jugades: ${I.totals.partides}</li><li>Dies actius: ${I.totals.dies}</li><li>Ratxa actual / màxima: ${I.totals.ratxa} / ${I.totals.ratxaMax}</li><li>Últims 28 dies: ${I.mes.partides} partides${I.mes.pct != null ? ', resultat mitjà ' + I.mes.pct + '%' : ''}</li></ul>
    <h2>Àrees (últimes 4 setmanes)</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>Àrea</th><th>Resultat mitjà</th></tr>${I.dominis.map(d => `<tr><td>${esc(d.nom)}</td><td>${d.v == null ? 'Sense dades suficients' : d.v + '%'}</td></tr>`).join('')}</table>
    <h2>Detall per joc</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>Joc</th><th>Partides</th><th>Mitjana</th><th>Millor</th></tr>${I.jocs.map(j => `<tr><td>${esc(j.nom)}</td><td>${j.partides}</td><td>${j.mit}%</td><td>${j.millor}%</td></tr>`).join('') || '<tr><td colspan="4">Encara no hi ha dades.</td></tr>'}</table>
    <h2>Mini-test de memòria (orientatiu)</h2>${I.tests.length ? '<ul>' + I.tests.map(t => `<li>${esc(t.data)}: ${t.punts}/${t.total}</li>`).join('') + '</ul>' : '<p>No s\'ha fet cap mini-test.</p>'}
    <p style="margin-top:1.5em;padding:.8em;border:1px solid #888"><strong>Avís important.</strong> ${esc(AVIS_LEGAL)}</p>`;
  tancarModal('modalInforme'); setTimeout(() => { window.print(); }, 150);
}
function obrirModalInforme() { obrirModal('modalInforme'); }
// Logotip (64 px) incrustat perquè funcioni amb file:// sense «taint» del canvas
const LOGO_PDF = 'data:image/png;base64,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';
