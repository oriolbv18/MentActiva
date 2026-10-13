'use strict';
// ==========================================================
//  MentA · FAMÍLIA
//  Tot funciona dins d'aquest dispositiu (no hi ha servidor):
//  àlbum de records, diari familiar, aniversaris i quedades,
//  i «Compartir el progrés» amb la Web Share API (WhatsApp, correu…).
//  Capes: les dades (obtenirX / desaX) estan separades de la UI (renderX),
//  així en el futur es podrà substituir el magatzem local per un backend (veure docs/ROADMAP.md).
// ==========================================================

// ---------- Resum de la setmana per compartir ----------
function resumFamiliaDades() {
  const u = getUsuariActual(), d = u.dades, a = resum(entre(d.historial, rangSetmana(0).ini, rangSetmana(0).fi)), b = resum(entre(d.historial, rangSetmana(-1).ini, rangSetmana(-1).fi));
  const dom = DOMINIS.map(k => ({ k, v: pctDomini(d, k, dataMenys(27), avuiISO()).v })).filter(x => x.v != null).sort((x, y) => y.v - x.v);
  return { nom: u.nom, a, b, ratxa: calcularRatxa(), fort: dom[0] || null, medalles: d.medalles.length };
}
function textResumFamilia() {
  const r = resumFamiliaDades();
  if (!r.a.partides) return `Hola! Aquesta setmana encara no he jugat a MentA, però ho tinc a punt. Una abraçada, ${r.nom}.`;
  let t = `${r.nom} a MentA aquesta setmana:\n`;
  t += `• ${fraseSetmana(r.a, r.b)}\n• ${r.a.partides} ${plural(r.a.partides, 'partida', 'partides')}${r.a.tempsConegut ? ' i ' + r.a.minuts + ' minuts jugats' : ''}\n`;
  if (r.ratxa > 1) t += `• Ratxa de ${r.ratxa} dies seguits\n`;
  if (r.fort) t += `• Es dona millor: ${NOMS_DOMINI[r.fort.k].toLowerCase()}\n`;
  return t + '\nMentA: jocs per mantenir la ment activa.';
}
function renderResumFamilia() {
  const r = resumFamiliaDades(); const cont = $('resumFamiliaCos'); if (!cont) return;
  cont.innerHTML = `<div class="targeta-resum"><p>${esc(r.nom)} · setmana del ${new Date(rangSetmana(0).ini + 'T12:00:00').toLocaleDateString(localeApp(), { day: 'numeric', month: 'long' })}</p>
    <p class="frase">${esc(fraseSetmana(r.a, r.b))}</p>
    <div class="nums"><div><b>${r.a.partides}</b><small>${plural(r.a.partides, 'partida', 'partides')}</small></div><div><b>${r.a.tempsConegut ? r.a.minuts : '—'}</b><small>minuts</small></div><div><b>${r.ratxa}</b><small>dies seguits</small></div></div>
    ${r.fort ? `<p style="margin-top:.8rem">Es dona millor: <strong>${NOMS_DOMINI[r.fort.k].toLowerCase()}</strong></p>` : ''}</div>
    <p class="ajuda-camp">Aquest resum només mostra números senzills. No inclou dades de salut ni les teves fotos.</p>`;
}
function dibuixaTargetaCompartir() {
  const r = resumFamiliaDades(), W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1d6b40'); g.addColorStop(1, '#134a2c');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 90; x.beginPath(); x.arc(W - 40, 40, 330, 0, 7); x.stroke();
  x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
  const f = (mida, pes) => { x.font = `${pes || 700} ${mida}px "MentA Titols", "MentA Text", system-ui, sans-serif`; };
  const lines = (txt, xx, yy, maxW, lh) => { const ps = txt.split(' '); let l = ''; ps.forEach(p => { const t = l ? l + ' ' + p : p; if (x.measureText(t).width > maxW && l) { x.fillText(l, xx, yy); yy += lh; l = p; } else l = t; }); x.fillText(l, xx, yy); return yy + lh; };
  f(44, 600); x.fillStyle = '#cfe9da'; x.fillText('MentA · jocs per mantenir la ment activa', 80, 120);
  f(84, 700); x.fillStyle = '#fff'; x.fillText(r.nom, 80, 280);
  f(54, 500); x.fillStyle = '#cfe9da'; x.fillText('la seva setmana', 80, 350);
  f(62, 600); x.fillStyle = '#fff'; let y = lines(fraseSetmana(r.a, r.b), 80, 520, 920, 84);
  const caixes = [[r.a.partides, plural(r.a.partides, 'partida', 'partides')], [r.a.tempsConegut ? r.a.minuts : '—', 'minuts'], [r.ratxa, 'dies seguits']];
  caixes.forEach(([v, t], i) => { const bx = 80 + i * 320; x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.roundRect ? x.roundRect(bx, 880, 290, 220, 28) : x.rect(bx, 880, 290, 220); x.fill(); x.fillStyle = '#fff'; f(96, 700); x.textAlign = 'center'; x.fillText(String(v), bx + 145, 1000); f(36, 500); x.fillStyle = '#cfe9da'; x.fillText(t, bx + 145, 1062); x.textAlign = 'left'; });
  f(40, 500); x.fillStyle = '#cfe9da'; x.fillText(r.fort ? 'Es dona millor: ' + NOMS_DOMINI[r.fort.k].toLowerCase() : '', 80, 1190);
  f(34, 500); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('Entreteniment i benestar cognitiu · mentactiva', 80, 1290);
  return c;
}
async function compartirProgres() {
  const text = textResumFamilia(), d = dadesActuals();
  const marca = () => { d.salut.compartit = (d.salut.compartit || 0) + 1; guardarDadesUsuari(); comprovarMedalles(); };
  try {
    const canvas = dibuixaTargetaCompartir();
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (blob && navigator.canShare && navigator.share) {
      const fitxer = new File([blob], 'MentA-setmana.png', { type: 'image/png' });
      if (navigator.canShare({ files: [fitxer] })) { await navigator.share({ files: [fitxer], text, title: 'El meu progrés a MentA' }); marca(); soVictoria(); return; }
    }
    if (navigator.share) { await navigator.share({ text, title: 'El meu progrés a MentA' }); marca(); soVictoria(); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  // Sense Web Share: es copia el text al porta-retalls i, si no, es baixa la targeta
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); marca(); toast('Resum copiat. Ara el pots enganxar a WhatsApp o al correu.', 4500, 'exit'); return; }
  } catch (e) { /* segueix */ }
  try { const a = document.createElement('a'); a.href = dibuixaTargetaCompartir().toDataURL('image/png'); a.download = 'MentA-setmana.png'; document.body.appendChild(a); a.click(); a.remove(); marca(); toast('S\'ha descarregat la targeta per enviar-la.', 4500, 'exit'); }
  catch (e) { toast('No s\'ha pogut compartir. Copia el text des de la pantalla.', 4500, 'error'); }
}

// ---------- Àlbum de records ----------
const MAX_FOTOS = 40;
const clauAlbum = () => 'mentA_album_' + getUsuariActual().id;
const obtenirAlbum = () => lsGet(clauAlbum(), {});
function albumPujar(ev) {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  comprimirImatge(f, { ampladaMax: 640, qualitat: 0.68 }, url => {
    if (!url) { toast("No s'ha pogut llegir la foto. Prova amb una altra.", 4000, 'error'); return; }
    const album = obtenirAlbum(); album[avuiISO()] = url;
    const claus = Object.keys(album).sort(); while (claus.length > MAX_FOTOS) delete album[claus.shift()];
    if (!lsSet(clauAlbum(), album)) return;
    soVictoria(); celebracioCompleta(); toast('Foto guardada', 2500, 'exit'); renderAlbum(); comprovarMedalles();
  });
}
function renderAlbum() {
  const album = obtenirAlbum(), claus = Object.keys(album).sort().reverse(), cont = $('albumGaleria');
  cont.innerHTML = claus.length ? claus.map(k => `<div class="album-item"><img src="${fotoSegura(album[k])}" alt="Foto del ${esc(k)}" loading="lazy"><div class="data">${esc(k)}</div>
    <button type="button" class="album-esborra" data-album-esborra="${esc(k)}" aria-label="Esborrar la foto del ${esc(k)}">${ico('paperera')}</button></div>`).join('')
    : '<div class="estat-buit" style="grid-column:1/-1"><span class="targeta-ico gran dom-llenguatge">' + ico('foto') + '</span><p>Encara no hi ha fotos. Puja la d\'avui: un lloc, una persona, un plat…</p></div>';
}

// ---------- Diari familiar (abans «missatges»: mai no sortien del dispositiu) ----------
const DESTINS = { tots: 'tota la família', avis: 'els avis', fills: 'els fills i néts' };
const obtenirMissatges = () => lsGet('mentA_missatges', []);
function missatgeEnviar() {
  const text = $('missatgeText').value.trim();
  if (!text) { toast('Escriu una nota primer'); return; }
  const u = getUsuariActual(), msgs = obtenirMissatges();
  msgs.unshift({ id: 'm_' + Date.now(), autor: u.nom, desti: $('missatgeDesti').value, text, data: new Date().toISOString() });
  msgs.length = Math.min(msgs.length, 200);
  lsSet('mentA_missatges', msgs); $('missatgeText').value = ''; soVictoria(); toast('Nota guardada', 2500, 'exit'); renderMissatges();
}
function renderMissatges() {
  const msgs = obtenirMissatges();
  $('missatgesLlista').innerHTML = msgs.length ? msgs.map(m => `<div class="missatge-item"><div><div class="cap">${esc(m.autor)} · sobre ${esc(DESTINS[m.desti] || m.desti)} · ${esc(new Date(m.data).toLocaleDateString(localeApp()))}</div><div class="cos">${esc(m.text)}</div></div>
    <button type="button" class="esborra-petit" data-missatge-esborra="${esc(m.id)}" aria-label="Esborrar la nota">${ico('paperera')}</button></div>`).join('')
    : '<div class="estat-buit"><p>Encara no hi ha notes. Escriu què heu fet avui o què voleu recordar.</p></div>';
}

// ---------- Aniversaris i quedades ----------
const obtenirCalFam = () => lsGet('mentA_calFamiliar', []);
const NOM_TIPUS = { aniversari: 'Aniversari', quedada: 'Quedada', altre: 'Altre' };
function calFamAfegir() {
  const data = $('calFamData').value, titol = $('calFamTitol').value.trim();
  if (!data || !titol) { toast('Escriu la data i què se celebra'); return; }
  const c = obtenirCalFam(); c.push({ id: 'c_' + Date.now(), data, titol, tipus: $('calFamTipus').value });
  c.sort((a, b) => a.data.localeCompare(b.data)); lsSet('mentA_calFamiliar', c);
  $('calFamTitol').value = ''; soVictoria(); toast('Data afegida', 2500, 'exit'); renderCalFam();
}
function textDies(data) {
  const dies = Math.round((dataDeISO(data) - dataDeISO(avuiISO())) / 86400000);
  return dies === 0 ? 'Avui!' : dies === 1 ? 'Demà' : dies > 1 ? `D'aquí a ${dies} dies` : '';
}
function renderCalFam() {
  const c = obtenirCalFam(), avui = avuiISO();
  $('calFamLlista').innerHTML = c.length ? c.map(x => `<div class="calFam-item${x.data < avui ? ' passat' : ''}"><span class="tipus-cf">${NOM_TIPUS[x.tipus] || 'Altre'}</span>
    <div class="info"><strong>${esc(x.titol)}</strong><small>${esc(x.data)}${x.data >= avui ? ' · ' + textDies(x.data) : ''}</small></div>
    <button type="button" class="esborra-petit" data-calfam-esborra="${esc(x.id)}" aria-label="Esborrar ${esc(x.titol)}">${ico('paperera')}</button></div>`).join('')
    : '<div class="estat-buit"><p>Encara no hi ha dates. Afegeix un aniversari o una quedada i la veuràs aquí.</p></div>';
}

// ---------- Esborrar (amb confirmació) ----------
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-album-esborra],[data-missatge-esborra],[data-calfam-esborra]'); if (!t) return;
  if (t.dataset.albumEsborra) mostrarConfirmacio('Esborrar la foto?', 'Aquesta foto es perdrà.', () => { const a = obtenirAlbum(); delete a[t.dataset.albumEsborra]; lsSet(clauAlbum(), a); renderAlbum(); });
  else if (t.dataset.missatgeEsborra) mostrarConfirmacio('Esborrar la nota?', 'Aquesta nota es perdrà.', () => { lsSet('mentA_missatges', obtenirMissatges().filter(m => m.id !== t.dataset.missatgeEsborra)); renderMissatges(); });
  else mostrarConfirmacio('Esborrar la data?', 'Aquesta data es perdrà.', () => { lsSet('mentA_calFamiliar', obtenirCalFam().filter(x => x.id !== t.dataset.calfamEsborra)); renderCalFam(); });
});

PANTALLA_ENTRA.album = renderAlbum;
PANTALLA_ENTRA.missatgeria = renderMissatges;
PANTALLA_ENTRA.calFamiliar = renderCalFam;
PANTALLA_ENTRA.resumFamilia = renderResumFamilia;
function refrescarFamilia() {
  if (pantallaActiva('album')) renderAlbum();
  if (pantallaActiva('missatgeria')) renderMissatges();
  if (pantallaActiva('calFamiliar')) renderCalFam();
  if (pantallaActiva('resumFamilia')) renderResumFamilia();
}
