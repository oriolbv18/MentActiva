'use strict';
// ==========================================================
//  MentA · INFORMES PDF (v2.0)
//  Aprofita totes les estadístiques que l'app ja recull (S01, S07, decisió 2 de l'apartat 6.4 del document).
//    · «professional»: resultats, agilitat, nivells, ajudes, hàbits, regles del semàfor.
//    · «familia»: el mateix en llenguatge planer, amb idees per a la setmana.
//  Sempre orientatiu: mesura el rendiment en uns jocs, no la salut. Es genera al dispositiu, no s'envia enlloc.
// ==========================================================
const INF = { V: [19, 74, 44], V2: [46, 139, 87], VS: [224, 238, 228], T: [36, 31, 25], S: [90, 81, 70], G: [225, 222, 212], GC: [244, 239, 231], A: [217, 119, 6], AS: [251, 235, 215], R: [179, 38, 30], RS: [249, 224, 221], B: [43, 93, 158] };
const FRANGES = [['Matí', 6, 12], ['Migdia', 12, 16], ['Tarda', 16, 20], ['Vespre', 20, 30]];
const DIES_INF = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const XECS_INF = [['aigua', 'Ha begut aigua'], ['caminar', 'Ha caminat 20 minuts'], ['dormir', 'Ha dormit bé'], ['medicacio', 'Ha pres la medicació']];
// Les tipografies del PDF només tenen alfabet llatí occidental: el que no hi cap es treu l'accent o es descarta
const pdfNet = s => String(s == null ? '' : s).replace(/[^\u0000-ÿ·—–«»’'€•]/g, c => { const b = c.normalize('NFD')[0]; return b.charCodeAt(0) < 256 ? b : ''; });
const signe = (v, unitat = '') => (v > 0 ? '+' : '') + v + unitat;

// Totes les xifres de l'informe en un sol lloc (es pot provar sense generar el PDF)
function dadesInformeCuidador(d) {
  const h = d.historial || [], ab = d.abandonaments || [], a28 = agrega(d, 0, 27), p28 = agrega(d, 28, 55), ws = Array.from({ length: 12 }, (_, i) => setmanaDades(d, 11 - i));
  const r28 = entre(h, dataMenys(27), avuiISO()), recent = r28.length ? r28 : h;
  const dominis = DOMINIS.map(k => { const a = pctDomini(d, k, dataMenys(27), avuiISO()), b = pctDomini(d, k, dataMenys(55), dataMenys(28)); return { k, nom: NOMS_DOMINI[k], v: a.v, n: a.n, ant: b.v }; });
  const jocs = jocsIndividuals().map(j => {
    const s = sessionsJoc(d, j.id), ab_ = ab.filter(a => a.joc === j.id).length;
    if (!s.length) return { id: j.id, nom: j.nom, n: 0, ab: ab_ };
    const ult = s.slice(-5), ant = s.slice(-10, -5), df = ult.length >= 3 && ant.length >= 3 ? mitjana(ult.map(x => x.pct)) - mitjana(ant.map(x => x.pct)) : null, trs = s.map(x => x.tempsReaccioMediana).filter(Boolean), durs = s.map(x => x.durada).filter(Boolean);
    return { id: j.id, nom: j.nom, n: s.length, nivell: JOCS_AMB_NIVELL.includes(j.id) ? NOMS_NIVELL[(d.nivells && d.nivells[j.id] && d.nivells[j.id].actual) || 'facil'] : '—', mit: Math.round(mitjana(s.map(x => x.pct))), millor: Math.max(...s.map(x => x.pct)), tend: df == null ? '—' : df > 4 ? 'Puja' : df < -4 ? 'Baixa' : 'Estable', tr: trs.length ? mediana(trs) : null, dur: durs.length ? Math.round(mitjana(durs)) : null, aj: s.reduce((t, x) => t + (x.ajudesUsades || 0), 0), ab: ab_, est: (d.estrelles || {})[j.id] || 0 };
  });
  const hora = x => parseInt(String(x.horaInici || '').split(':')[0], 10);
  const franges = FRANGES.map(([nom, ini, fi]) => { const q = recent.filter(x => { const v = hora(x); return v >= ini && v < fi; }); return { nom, n: q.length, pct: q.length ? Math.round(mitjana(q.map(x => x.pct))) : null }; });
  const perDia = DIES_INF.map((nom, i) => { const q = recent.filter(x => (dataDeISO(x.data).getDay() + 6) % 7 === i); return { nom, n: q.length }; });
  const mapa = Array.from({ length: 84 }, (_, k) => { const iso = dataMenys(83 - k); return { iso, n: h.filter(x => x.data === iso).length, dia: (dataDeISO(iso).getDay() + 6) % 7 }; });
  const ambPista = recent.filter(x => x.pistes), nivellsPista = [1, 2, 3].map(n => ambPista.filter(x => x.pistes.nivell === n).length);
  const canvis = Object.keys(d.nivells || {}).flatMap(j => ((d.nivells[j] || {}).canvis || []).map(c => Object.assign({ joc: nomJoc(j) }, c))).filter(c => c.data >= dataMenys(83)).sort((a, b) => b.data.localeCompare(a.data));
  const hist = (d.salut && d.salut.historial) || {}, dies28 = Array.from({ length: 28 }, (_, k) => dataMenys(k)), anims = dies28.map(x => (hist[x] || {}).anim).filter(Boolean);
  const so = (d.social || []).filter(x => x.data >= dataMenys(27));
  return {
    a28, p28, ws, dominis, jocs, franges, perDia, mapa, canvis,
    totals: { partides: d.totalPartides || 0, dies: (d.diesJugats || []).length, primer: h.length ? h[0].data : null, minuts: Math.round(h.reduce((t, x) => t + (x.durada || 0), 0) / 60), estrelles: Object.values(d.estrelles || {}).reduce((a, b) => a + b, 0), medalles: (d.medalles || []).length },
    ajudes: { perPartida: recent.length ? Math.round(recent.reduce((t, x) => t + (x.ajudesUsades || 0), 0) / recent.length * 10) / 10 : null, ambPista: ambPista.length, nivellsPista, pauses: recent.length ? Math.round(recent.reduce((t, x) => t + (x.pausesFetes || 0), 0) / recent.length * 10) / 10 : null, abandonPct: a28.n + a28.ab ? Math.round(a28.ab / (a28.n + a28.ab) * 100) : null },
    anim: { n: anims.length, recompte: ANIMS.map(([a]) => ({ a, n: anims.filter(x => x === a).length })) },
    xecs: XECS_INF.map(([k, nom]) => ({ nom, n: dies28.filter(x => (hist[x] || {})[k]).length })),
    salut: { respiracio: (d.salut && d.salut.respiracio) || 0, diari: (d.diari || []).length, tests: (d.tests || []).slice(-5) },
    social: { ambAlgu: so.filter(x => x.mode !== 'grup').length, grup: so.filter(x => x.mode === 'grup').length },
    pla: { ocults: ((d.plaCuidador || {}).jocsOcults || []).length, nivellMaxim: (d.plaCuidador || {}).nivellMaxim || 'dificil' }
  };
}

async function informeCuidadorPDF(variant, opcions = {}) {
  if (!opcions.propi && estatConsent() === 'no') return;
  const ok = await carregaJsPDF(); if (!ok) { toast('No s\'ha pogut preparar el PDF. Prova l\'alternativa d\'impressió.', 4500, 'error'); return; }
  const d = dadesActuals(), u = getUsuariActual(), s = calculaSemafor(d), pro = variant === 'professional', D = dadesInformeCuidador(d), nom = pdfNet(u.nom) || 'Persona';
  const doc = pdfNou({ orientation: 'portrait', unit: 'mm', format: 'a4' }), M = 14, W = 182, BAIX = 280; let y = 44;
  const color = (c, on = 'text') => { if (on === 'text') doc.setTextColor(...c); else if (on === 'fill') doc.setFillColor(...c); else doc.setDrawColor(...c); };
  const lletra = (mida, negreta = false, c = INF.T) => { doc.setFont('helvetica', negreta ? 'bold' : 'normal'); doc.setFontSize(mida); color(c); };
  const lloc = h => { if (y + h > BAIX) { doc.addPage(); y = 22; } };
  const sec = (t, sub, reserva = 24) => { lloc(reserva + 8); y += 5; lletra(14, true, INF.V); doc.text(t, M, y); y += 2; color(INF.V2, 'draw'); doc.setLineWidth(.5); doc.line(M, y, M + W, y); y += 5; if (sub) { lletra(9, false, INF.S); paragraf(sub, 9, INF.S); } };
  function paragraf(t, mida = 10, c = INF.T, negreta = false) { lletra(mida, negreta, c); doc.splitTextToSize(pdfNet(t), W).forEach(l => { lloc(5); doc.text(l, M, y); y += mida * .46; }); y += 1.5; }
  const retalla = (t, w) => { let x = pdfNet(t); if (doc.getTextWidth(x) <= w) return x; while (x.length > 2 && doc.getTextWidth(x + '…') > w) x = x.slice(0, -1); return x + '…'; };
  const banda = (fons, vora, titol, text) => { doc.setFontSize(10); const l = doc.splitTextToSize(pdfNet(text), W - 8), h = 11 + l.length * 4.6; lloc(h + 2); color(fons, 'fill'); doc.roundedRect(M, y, W, h, 2, 2, 'F'); color(vora, 'fill'); doc.rect(M, y, 1.6, h, 'F'); lletra(11, true, vora); doc.text(pdfNet(titol), M + 5, y + 5.6); lletra(10); doc.text(l, M + 5, y + 10.4); y += h + 3; };
  // Rajola amb una xifra gran
  const rajola = (x, yy, w, h, et, val, sub) => { color(INF.GC, 'fill'); doc.roundedRect(x, yy, w, h, 2, 2, 'F'); lletra(8, true, INF.S); doc.text(pdfNet(et).toUpperCase(), x + 3, yy + 5); lletra(17, true, INF.V); doc.text(String(val), x + 3, yy + 13); if (sub) { lletra(8, false, INF.S); doc.text(retalla(sub, w - 5), x + 3, yy + 18.4); } };
  const rajoles = (ll, cols = 3) => { const g = 3, w = (W - g * (cols - 1)) / cols, h = 21; ll.forEach((r, i) => { if (i % cols === 0) lloc(h + 3); rajola(M + (i % cols) * (w + g), y, w, h, r[0], r[1], r[2]); if (i % cols === cols - 1 || i === ll.length - 1) y += h + 3; }); y += 1; };
  // Barres verticals amb etiquetes
  const barres = (punts, o = {}) => {
    const h = o.h || 30, max = o.max || Math.max(1, ...punts.map(p => p.v || 0)); lloc(h + 12); const y0 = y + h + 3, w = W - 10, pas = w / punts.length, bw = Math.min(pas * .62, 11);
    color(INF.G, 'draw'); doc.setLineWidth(.2); [0, .5, 1].forEach(f => { const yy = y0 - h * f; doc.line(M + 8, yy, M + W, yy); lletra(7, false, INF.S); doc.text(String(Math.round(max * f)) + (o.unitat || ''), M + 7, yy + 1, { align: 'right' }); });
    punts.forEach((p, i) => { const x = M + 9 + i * pas + (pas - bw) / 2, hb = p.v ? h * p.v / max : 0; color(o.color || INF.V2, 'fill'); if (hb) doc.rect(x, y0 - hb, bw, hb, 'F'); lletra(7, false, INF.S); doc.text(pdfNet(p.et), x + bw / 2, y0 + 3.6, { align: 'center' }); if (p.v != null && (p.v || o.zeros)) { lletra(7, true, INF.T); doc.text(String(p.etV != null ? p.etV : p.v), x + bw / 2, y0 - hb - 1, { align: 'center' }); } });
    y = y0 + 8;
  };
  // Línia amb punts (els forats queden sense unir)
  const linia = (punts, o = {}) => {
    const h = o.h || 28, vals = punts.map(p => p.v).filter(v => v != null); if (!vals.length) { paragraf('Encara no hi ha prou dades per a aquest gràfic.', 9, INF.S); return; }
    lloc(h + 12); const min = o.min != null ? o.min : Math.min(...vals) * .85, max = o.max != null ? o.max : Math.max(...vals) * 1.15 || 1, y0 = y + h + 3, w = W - 12, pas = w / Math.max(1, punts.length - 1), X = i => M + 10 + i * pas, Y = v => y0 - h * (v - min) / ((max - min) || 1);
    color(INF.G, 'draw'); doc.setLineWidth(.2); [0, .5, 1].forEach(f => { const yy = y0 - h * f; doc.line(M + 9, yy, M + W, yy); lletra(7, false, INF.S); doc.text(String(Math.round((min + (max - min) * f) * 10) / 10).replace('.', ',') + (o.unitat || ''), M + 8, yy + 1, { align: 'right' }); });
    color(o.color || INF.V, 'draw'); color(o.color || INF.V, 'fill'); doc.setLineWidth(.7);
    punts.forEach((p, i) => { if (p.v == null) return; if (i && punts[i - 1].v != null) doc.line(X(i - 1), Y(punts[i - 1].v), X(i), Y(p.v)); doc.circle(X(i), Y(p.v), .9, 'F'); });
    punts.forEach((p, i) => { lletra(7, false, INF.S); doc.text(pdfNet(p.et), X(i), y0 + 3.6, { align: 'center' }); });
    y = y0 + 8;
  };
  const fila = (cels, xs, o = {}) => { lloc(6); lletra(o.mida || 8.5, !!o.negreta, o.color || INF.T); cels.forEach((c, i) => doc.text(pdfNet(c), M + xs[i], y)); y += o.alt || 5; };
  const et = w => (w.k === 0 ? 'Ara' : '-' + w.k);
  const delta = (a, b, u = '') => (a == null || b == null ? 'sense comparació' : Math.round(a) === Math.round(b) ? 'igual que abans' : `${signe(Math.round(a) - Math.round(b), u)} que els 28 d. anteriors`);
  const coma = v => String(v).replace('.', ',');
  const trTxt = v => (v ? (v / 1000).toFixed(1).replace('.', ',') + ' s' : '—');
  const hiHaDades = D.totals.partides > 0 || D.ws.some(w => w.n);

  // ---------- Portada: resum ----------
  color(INF.V, 'fill'); doc.rect(0, 0, 210, 34, 'F'); try { doc.addImage(LOGO_PDF, 'PNG', 12, 7, 20, 20); } catch (e) { /* sense logo */ }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(19); color([255, 255, 255]); doc.text(pro ? 'Informe per al metge o professional' : 'Com li va a ' + nom, 37, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`${nom} · ${new Date().toLocaleDateString(localeApp())}${D.totals.primer ? ' · dades des del ' + D.totals.primer : ''}`, 37, 22);
  doc.setFontSize(8.5); doc.text('MentA · orientatiu: no és un document mèdic ni fa diagnòstics', 37, 27.5);
  const colors = { verd: [INF.VS, INF.V2], groc: [INF.AS, INF.A], vermell: [INF.RS, INF.R], gris: [INF.GC, INF.S] }[s.estat];
  banda(colors[0], colors[1], { verd: 'Tot en ordre', groc: 'Convé fixar-s\'hi', vermell: 'Canvis sostinguts', gris: 'Encara sense prou dades' }[s.estat], s.estat === 'verd' ? 'Constància estable i resultats dins del seu nivell habitual.' : s.frase);
  if (!hiHaDades) paragraf('Encara no hi ha partides. L\'informe s\'anirà omplint a mesura que jugui.', 10, INF.S);
  rajoles([
    ['Dies actius (28 d.)', D.a28.dies, delta(D.a28.dies, D.p28.dies)],
    ['Partides (28 d.)', D.a28.n, delta(D.a28.n, D.p28.n)],
    ['Minuts de joc (28 d.)', D.a28.minuts, delta(D.a28.minuts, D.p28.minuts)],
    ['Nivell d\'encert', D.a28.pct != null ? Math.round(D.a28.pct) + '%' : '—', delta(D.a28.pct, D.p28.pct, ' punts')],
    pro ? ['Temps de reacció', trTxt(D.a28.tr), D.p28.tr ? `abans: ${trTxt(D.p28.tr)}` : 'sense comparació'] : ['Ratxa actual', `${calcularRatxa()} d.`, `millor ratxa: ${calcularRatxaMaxima()} d.`],
    ['Deixades a mitges', D.a28.ab, D.ajudes.abandonPct != null ? `${D.ajudes.abandonPct}% de les iniciades` : '']
  ]);
  if (s.avisos.length) { sec('Aspectes a vigilar'); s.avisos.forEach(a => banda(a.nivell === 'vermell' ? INF.RS : INF.AS, a.nivell === 'vermell' ? INF.R : INF.A, a.titol, `${a.text} ${a.interpreta}${a.nota ? ' Nota del cuidador: «' + a.nota + '»' : ''}`)); }
  else if (s.estat === 'verd') paragraf('Ara mateix no hi ha cap aspecte que calgui vigilar.', 10, INF.S);

  // ---------- Evolució ----------
  sec(pro ? 'Evolució setmanal (12 setmanes)' : 'Setmana a setmana', pro ? 'Cada punt és la mitjana d\'una setmana. «Ara» són els últims 7 dies; -1 és la setmana anterior.' : 'Com ha anat cada setmana. Un mal dia o una mala setmana és normal: el que compta és la tendència.', 60);
  lletra(10, true); lloc(8); doc.text('Nivell d\'encert', M, y); y += 2; linia(D.ws.map(w => ({ et: et(w), v: w.pct == null ? null : Math.round(w.pct) })), { min: 0, max: 100, unitat: '%' });
  lletra(10, true); lloc(44); doc.text('Dies que ha jugat cada setmana', M, y); y += 2; barres(D.ws.map(w => ({ et: et(w), v: w.dies })), { max: 7, h: 22 });

  // ---------- Àrees ----------
  sec('Per àrees (últimes 4 setmanes)', pro ? 'Barra fosca: últims 28 dies. Barra clara: els 28 anteriors. Cal un mínim de 2 partides.' : 'En què ha treballat més i com li ha anat.');
  D.dominis.forEach(a => { lloc(11); lletra(9.5, true); doc.text(a.nom, M, y + 3); color(INF.G, 'fill'); doc.rect(M + 34, y, 118, 3.2, 'F'); doc.rect(M + 34, y + 3.8, 118, 2, 'F'); if (a.v != null) { color(INF.V2, 'fill'); doc.rect(M + 34, y, 118 * a.v / 100, 3.2, 'F'); } if (a.ant != null) { color([150, 190, 165], 'fill'); doc.rect(M + 34, y + 3.8, 118 * a.ant / 100, 2, 'F'); } lletra(9, a.v != null, a.v != null ? INF.T : INF.S); doc.text(a.v != null ? `${a.v}%` : 'Sense dades', M + 155, y + 3); if (a.n) { lletra(7.5, false, INF.S); doc.text(`${a.n} partides`, M + 155, y + 6.6); } y += 9; });
  y += 1;
  const fortes = D.dominis.filter(a => a.v != null).sort((a, b) => b.v - a.v);
  if (!pro && fortes.length >= 2) paragraf(`On se sent més còmode: ${fortes[0].nom.toLowerCase()}. Pot convenir-li practicar una mica més: ${fortes[fortes.length - 1].nom.toLowerCase()}.`);

  // ---------- Jocs ----------
  const jugats = D.jocs.filter(j => j.n).sort((a, b) => b.n - a.n), mai = D.jocs.filter(j => !j.n);
  if (pro) {
    sec('Detall per joc', 'Tendència: últimes 5 partides respecte a les 5 anteriors. Reacció: mediana. Aj.: ajudes (pistes i «?»). Ab.: partides deixades a mitges.', 40);
    const xs = [0, 52, 69, 84, 100, 116, 134, 150, 167];
    fila(['Joc', 'Nivell', 'Partides', 'Mitjana', 'Millor', 'Tendència', 'Reacció', 'Durada', 'Aj. / Ab.'], xs, { negreta: true, mida: 8 });
    if (!jugats.length) paragraf('Encara no hi ha partides.', 9, INF.S);
    jugats.forEach(j => { lloc(6); lletra(8.5, false); doc.text(retalla(j.nom, 50), M, y); [j.nivell, j.n, j.mit + '%', j.millor + '%', j.tend, trTxt(j.tr), j.dur ? formatDurada(j.dur) : '—', `${j.aj} / ${j.ab}`].forEach((c, i) => doc.text(pdfNet(c), M + xs[i + 1], y)); y += 5; });
    y += 1; if (mai.length) paragraf('Encara no ha jugat a: ' + mai.map(j => j.nom).join(', ') + '.', 8.5, INF.S);
  } else {
    sec('Què li agrada');
    paragraf(jugats.length ? 'Els jocs que més juga: ' + jugats.slice(0, 3).map(j => `${j.nom} (${j.n} ${plural(j.n, 'partida', 'partides')})`).join(', ') + '.' : 'Encara no ha jugat cap partida.');
    const millors = jugats.filter(j => j.n >= 2).sort((a, b) => b.mit - a.mit).slice(0, 3); if (millors.length) paragraf('On li va millor: ' + millors.map(j => j.nom).join(', ') + '.');
    if (mai.length && jugats.length) paragraf('Encara no ha provat: ' + mai.slice(0, 6).map(j => j.nom).join(', ') + (mai.length > 6 ? '…' : '.'), 9.5, INF.S);
  }

  // ---------- Quan juga ----------
  sec('Quan juga', 'Els últims 28 dies. Cada quadret del calendari és un dia de les últimes 12 setmanes: com més fosc, més partides.', 70);
  lloc(38); { const c = 5.2, gap = .9, x0 = M + 7, y0 = y; DIES_INF.forEach((n, i) => { lletra(6.5, false, INF.S); doc.text(n, M, y0 + i * (c + gap) + 3.8); });
    const primerDia = D.mapa[0].dia; D.mapa.forEach((m, k) => { const col = Math.floor((k + primerDia) / 7), f = (k + primerDia) % 7, nv = Math.min(m.n, 4); color(nv === 0 ? INF.GC : [[190, 220, 200], [130, 185, 150], [70, 140, 100], INF.V][nv - 1], 'fill'); doc.rect(x0 + col * (c + gap), y0 + f * (c + gap), c, c, 'F'); });
    const xd = M + 92; lletra(9.5, true); doc.text('Moment del dia', xd, y0 + 3); D.franges.forEach((f, i) => { lletra(9, false); doc.text(f.nom, xd, y0 + 9 + i * 5.5); lletra(9, true); doc.text(f.n ? `${f.n} ${plural(f.n, 'partida', 'partides')}` : '—', xd + 22, y0 + 9 + i * 5.5); if (f.pct != null) { lletra(9, false, INF.S); doc.text(`${f.pct}% d'encert`, xd + 52, y0 + 9 + i * 5.5); } }); y = y0 + 7 * (c + gap) + 4; }
  barres(D.perDia.map(p => ({ et: p.nom, v: p.n })), { h: 16, color: INF.B });

  // ---------- Agilitat i autonomia (professional) ----------
  if (pro) {
    sec('Agilitat i atenció', 'Temps de reacció en els jocs de resposta puntual. Variabilitat: com de regular és dins d\'una partida (0 = molt regular). Depenen de l\'hora, del cansament i de la medicació.', 70);
    lletra(10, true); lloc(8); doc.text('Temps de reacció (mediana setmanal)', M, y); y += 2; linia(D.ws.map(w => ({ et: et(w), v: w.tr ? Math.round(w.tr / 100) / 10 : null })), { unitat: ' s', color: INF.B });
    lletra(10, true); lloc(40); doc.text('Variabilitat setmanal', M, y); y += 2; linia(D.ws.map(w => ({ et: et(w), v: w.variab != null ? Math.round(w.variab * 100) / 100 : null })), { min: 0, color: INF.B, h: 20 });
    sec('Autonomia i ajudes');
    rajoles([['Ajudes per partida', D.ajudes.perPartida == null ? '—' : coma(D.ajudes.perPartida), 'pistes i ajuda demanades'], ['Partides amb pista', D.ajudes.ambPista, `nivells 1/2/3: ${D.ajudes.nivellsPista.join(' / ')}`], ['Pauses per partida', D.ajudes.pauses == null ? '—' : coma(D.ajudes.pauses), 'poden indicar cansament']]);
    sec('Nivells de dificultat', `El nivell s'ajusta sol segons els resultats. Nivell màxim fixat al pla: ${NOMS_NIVELL[D.pla.nivellMaxim] || D.pla.nivellMaxim}. Jocs amagats: ${D.pla.ocults}.`);
    if (D.canvis.length) D.canvis.slice(0, 10).forEach(c => fila([c.data, c.joc, `${t(NOMS_NIVELL[c.de] || c.de)} a ${t(NOMS_NIVELL[c.a] || c.a)}`, c.manual ? 'manual' : 'automàtic'], [0, 24, 84, 124])); else paragraf('Cap canvi de nivell en les últimes 12 setmanes.', 9, INF.S);
    y += 2;
  }

  // ---------- Benestar ----------
  sec(pro ? 'Benestar i hàbits (28 dies)' : 'Com es troba', 'El que la mateixa persona ha anotat al xec diari. Són observacions, no mesures.', 50);
  if (D.anim.n) { barres(D.anim.recompte.map(a => ({ et: a.a, v: a.n, zeros: true })), { h: 16, color: INF.A }); } else paragraf('Encara no ha anotat com es troba.', 9.5, INF.S);
  const xecsFets = D.xecs.filter(x => x.n); if (xecsFets.length) { xecsFets.forEach(x => fila([x.nom, `${x.n} de 28 dies`], [0, 60], { mida: 9.5 })); y += 1; }
  lletra(9.5); lloc(6); doc.text(pdfNet(`Sessions de respiració: ${D.salut.respiracio} · Records escrits al diari: ${D.salut.diari} (el contingut no es mostra)`), M, y); y += 6;
  if (pro && D.salut.tests.length) { lletra(9.5, true); lloc(6); doc.text('Mini-test de memòria (joc orientatiu, no és cap prova clínica)', M, y); y += 5; D.salut.tests.forEach(x => fila([x.data, `${x.punts} de ${x.total}`], [0, 30], { mida: 9.5 })); y += 1; }

  // ---------- Participació i reconeixements ----------
  sec('Participació (28 dies)', 'Jugar acompanyat no compta als resultats, però és un bon senyal.');
  rajoles([['Partides amb algú', D.social.ambAlgu, ''], ['Activitats de grup', D.social.grup, ''], ['Medalles', D.totals.medalles, `${D.totals.estrelles} estrelles en total`]]);

  if ((d.notes || []).length) { sec('Observacions del cuidador'); [...d.notes].sort((a, b) => a.data.localeCompare(b.data)).slice(-10).forEach(n => paragraf(`${n.data}${n.autor ? ' (' + n.autor + ')' : ''}: ${n.text}`, 9.5)); }

  // ---------- Tancament ----------
  if (pro) {
    sec('Com es llegeix aquest informe');
    paragraf(I18N.llengua === 'es' ? `Todas las comparaciones son con la misma persona, nunca con una norma de población. Semáforo: mínimo ${SEMAFOR.minSessions} sesiones en 8 semanas; línea base, media de las 4 semanas anteriores. Amarillo: acierto un ${Math.round(SEMAFOR.precisioGroc * 100)}% más bajo durante ${SEMAFOR.setmanesGroc} semanas, días activos al ${Math.round(SEMAFOR.constanciaGroc * 100)}% o menos de la base, ${SEMAFOR.diesSenseJugarGroc} días o más sin jugar (si antes había ritmo), más de un ${Math.round(SEMAFOR.abandonamentsGroc * 100)}% de partidas dejadas a medias, o tiempo de reacción un ${Math.round(SEMAFOR.tempsReaccioGroc * 100)}% más alto. Rojo: acierto un ${Math.round(SEMAFOR.precisioVermell * 100)}% más bajo durante ${SEMAFOR.setmanesVermell} semanas, o ${SEMAFOR.diesSenseJugarVermell} días o más sin jugar. La dificultad cambia sola: un resultado debe leerse junto con el nivel del juego. La eficacia de los juegos no se ha validado clínicamente.` : `Totes les comparacions són amb la mateixa persona, mai amb una norma de població. Semàfor: mínim ${SEMAFOR.minSessions} sessions en 8 setmanes; línia base, mitjana de les 4 setmanes anteriors. Groc: encert ${Math.round(SEMAFOR.precisioGroc * 100)}% més baix durant ${SEMAFOR.setmanesGroc} setmanes, dies actius al ${Math.round(SEMAFOR.constanciaGroc * 100)}% o menys de la base, ${SEMAFOR.diesSenseJugarGroc} dies o més sense jugar (si abans hi havia ritme), més d'un ${Math.round(SEMAFOR.abandonamentsGroc * 100)}% de partides deixades a mitges, o temps de reacció un ${Math.round(SEMAFOR.tempsReaccioGroc * 100)}% més alt. Vermell: encert ${Math.round(SEMAFOR.precisioVermell * 100)}% més baix durant ${SEMAFOR.setmanesVermell} setmanes, o ${SEMAFOR.diesSenseJugarVermell} dies o més sense jugar. La dificultat canvia sola: un resultat s'ha de llegir junt amb el nivell del joc. L'eficàcia dels jocs no s'ha validat clínicament.`, 8.5, INF.S);
  } else {
    const idees = [], sense = jocsSenseJugarDies(d);
    if (sense != null && sense >= 3) idees.push('Fa uns dies que no juga: un missatge o una partida junts sol ajudar.');
    if (D.social.ambAlgu + D.social.grup === 0) idees.push('Proveu «Jugar amb algú»: jugar acompanyat és el que més enganxa.');
    if (D.a28.ab >= 3) idees.push('Deixa alguns jocs a mitges: potser convé amagar els que no li agraden, des de la pestanya Jocs.');
    if (mai.length && jugats.length) idees.push(`Proposeu-li un joc que encara no ha provat, com ${mai[0].nom}.`);
    if (idees.length < 2) idees.push('Digueu-li com ho està fent de bé: el reconeixement ajuda a mantenir el costum.');
    sec('Idees per a aquesta setmana'); idees.slice(0, 4).forEach(x => paragraf('•  ' + x));
  }
  lloc(30); color(INF.GC, 'fill'); doc.roundedRect(M, y, W, 22, 2, 2, 'F'); lletra(9, false, INF.S); doc.text(doc.splitTextToSize('Avís important. Aquests indicadors són orientatius i mesuren el rendiment en uns jocs, no la salut. MentA no és un dispositiu sanitari ni fa diagnòstics. Si observeu canvis que us preocupen, consulteu un professional de la salut.', W - 10), M + 5, y + 6.5);

  // Capçalera i peu a totes les pàgines
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i); lletra(7.5, false, INF.S);
    if (i > 1) { doc.text(`MentA · ${pro ? 'Informe per al professional' : 'Informe per a la família'} · ${nom}`, M, 12); color(INF.G, 'draw'); doc.setLineWidth(.2); doc.line(M, 14, M + W, 14); }
    doc.text(`Generat per MentA v${VERSIO_CURTA} al dispositiu. Les dades no s'han enviat enlloc.`, M, 290); doc.text(`Pàgina ${i} de ${total}`, M + W, 290, { align: 'right' });
  }
  const url = URL.createObjectURL(doc.output('blob')), a = document.createElement('a');
  a.href = url; a.download = `MentA-informe-${pro ? 'professional' : 'familia'}-${nom.replace(/[^\w-]+/g, '_')}-${avuiISO()}.pdf`; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
  if (!opcions.propi) registraAcces('informe', variant);
  soVictoria(); toast('Informe descarregat', 2800, 'exit');
}
