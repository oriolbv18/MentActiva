'use strict';
// ==========================================================
//  MentA · ESPAI DEL CUIDADOR (v1.8) — accés, seguretat, consentiment i semàfor
//  Una sola app, dues capes: la persona gran no mira mai aquest espai (PIN de 4 xifres).
//  Tot són indicadors ORIENTATIUS del rendiment en uns jocs, no de la salut.
// ==========================================================
const CLAU_CUIDADOR = 'mentA_cuidador', CLAU_ACCESSOS = 'mentA_registre_accessos';
let cuidadorObert = false, _tempsInactiu = null;
const TEMPS_INACTIVITAT_CUIDADOR = 5 * 60 * 1000;

// ---------- SHA-256 (SubtleCrypto si hi és; si no, versió en JS pur) ----------
function sha256Js(text) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const b = Array.from(new TextEncoder().encode(text)), l = b.length * 8; b.push(0x80); while (b.length % 64 !== 56) b.push(0);
  for (let i = 7; i >= 0; i--) b.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < b.length; o += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) w[i] = (b[o + i * 4] << 24) | (b[o + i * 4 + 1] << 16) | (b[o + i * 4 + 2] << 8) | b[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) { const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rot(e, 6) ^ rot(e, 11) ^ rot(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0, S0 = rot(a, 2) ^ rot(a, 13) ^ rot(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H = [H[0] + a, H[1] + bb, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map(x => x | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
async function hashPin(pin, sal) {
  const text = sal + ':' + pin;
  try { if (window.crypto && crypto.subtle) { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { /* cau a la versió en JS */ }
  return sha256Js(text);
}
const salAleatoria = () => { const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); return [...a].map(x => x.toString(16).padStart(2, '0')).join(''); };
const dadesCuidador = () => lsGet(CLAU_CUIDADOR, null);
const teCuidadorPin = () => { const c = dadesCuidador(); return !!(c && c.hash); };

// ---------- Registre d'accessos (qui ha vist o exportat dades i quan) ----------
function registraAcces(accio, detall) {
  const l = lsGet(CLAU_ACCESSOS, []), c = dadesCuidador();
  l.push({ ts: Date.now(), accio, persona: getUsuariActual().nom, qui: (c && c.nom) || 'Cuidador', detall: detall || '' }); lsSet(CLAU_ACCESSOS, l.slice(-200));
}

// ---------- Teclat de PIN (gran, pensat per a mans no gaire fermes) ----------
// El bloqueig després de 5 errors es desa (no es perd en recarregar la pàgina). Clau no exportable: no viatja amb les còpies.
const CLAU_PIN_BLOQUEIG = 'mentA_pin_bloqueig';
const _bloqueigPin = lsGet(CLAU_PIN_BLOQUEIG, null) || {};
let _pin = { mode: 'entrar', digits: '', primer: '', cb: null, intents: +_bloqueigPin.intents || 0, bloquejatFins: +_bloqueigPin.fins || 0 };
function desaBloqueigPin() { if (_pin.intents || _pin.bloquejatFins > Date.now()) lsSet(CLAU_PIN_BLOQUEIG, { intents: _pin.intents, fins: _pin.bloquejatFins }); else { try { localStorage.removeItem(CLAU_PIN_BLOQUEIG); } catch (e) { /* ignorat */ } } }
function construeixTeclatPin() {
  const t = $('pinTecles'); if (!t || t.children.length) return;
  t.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="pin-tecla" data-pin="${n}">${n}</button>`).join('') +
    `<span></span><button type="button" class="pin-tecla" data-pin="0">0</button><button type="button" class="pin-tecla pin-esborra" data-pin="x" aria-label="Esborrar l'última xifra">${ico('desfer')}</button>`;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-pin]'); if (b) pinTecla(b.dataset.pin); });
document.addEventListener('keydown', e => {
  if (!$('modalPin') || !$('modalPin').classList.contains('actiu')) return;
  if (/^[0-9]$/.test(e.key)) pinTecla(e.key); else if (e.key === 'Backspace') pinTecla('x');
});
function pintaPunts() { document.querySelectorAll('#pinPunts i').forEach((p, i) => p.classList.toggle('ple', i < _pin.digits.length)); }
function demanaPin(mode, cb) {
  construeixTeclatPin(); _pin = Object.assign(_pin, { mode, digits: '', primer: '', cb });
  const t = { entrar: ['Espai del cuidador', 'Escriu el PIN de 4 xifres.'], crear: ['Crea un PIN', 'Tria 4 xifres que només sàpigues tu o el cuidador.'], confirmar: ['Repeteix el PIN', 'Torna a escriure les mateixes 4 xifres.'], verificar: ['PIN actual', 'Escriu el PIN actual per continuar.'] }[mode];
  setText('pinTitol', t[0]); setText('pinText', t[1]); setText('pinError', ''); pintaPunts();
  mostra('pinOblidat', mode === 'entrar' || mode === 'verificar', 'inline-flex');
  obrirModal('modalPin', false);
}
async function pinTecla(k) {
  const ara_ = Date.now();
  if (_pin.bloquejatFins > ara_) { setText('pinError', `Massa intents. Espera ${Math.ceil((_pin.bloquejatFins - ara_) / 1000)} segons.`); return; }
  if (k === 'x') { _pin.digits = _pin.digits.slice(0, -1); pintaPunts(); setText('pinError', ''); return; }
  if (_pin.digits.length >= 4) return;
  _pin.digits += k; soClic(); pintaPunts();
  if (_pin.digits.length < 4) return;
  const pin = _pin.digits; _pin.digits = '';
  if (_pin.mode === 'entrar' || _pin.mode === 'verificar') {
    const c = dadesCuidador(), ok = c && (await hashPin(pin, c.sal)) === c.hash;
    if (ok) { _pin.intents = 0; _pin.bloquejatFins = 0; desaBloqueigPin(); tancarModal('modalPin'); const cb = _pin.cb; if (cb) cb(); return; }
    _pin.intents++; soError(); vibrar(150); pintaPunts();
    if (_pin.intents >= 5) { _pin.bloquejatFins = Date.now() + 30000; _pin.intents = 0; setText('pinError', 'Massa intents. Torna-ho a provar d\'aquí a 30 segons.'); }
    else setText('pinError', `PIN incorrecte. ${5 - _pin.intents} ${5 - _pin.intents === 1 ? 'intent' : 'intents'} més.`);
    desaBloqueigPin();
    return;
  }
  if (_pin.mode === 'crear') { _pin.primer = pin; _pin.mode = 'confirmar'; setText('pinTitol', 'Repeteix el PIN'); setText('pinText', 'Torna a escriure les mateixes 4 xifres.'); pintaPunts(); return; }
  if (_pin.mode === 'confirmar') {
    if (pin !== _pin.primer) { _pin.mode = 'crear'; _pin.primer = ''; setText('pinTitol', 'Crea un PIN'); setText('pinText', 'Tria 4 xifres que només sàpigues tu o el cuidador.'); setText('pinError', 'No coincideixen. Torna-ho a provar.'); soError(); pintaPunts(); return; }
    await desaPin(pin); tancarModal('modalPin'); toast('PIN guardat', 2500, 'exit'); const cb = _pin.cb; if (cb) cb();
  }
}
async function desaPin(pin) { const sal = salAleatoria(), c = dadesCuidador() || {}; lsSet(CLAU_CUIDADOR, Object.assign(c, { hash: await hashPin(pin, sal), sal, creat: c.creat || Date.now() })); }
function pinOblidat() {
  mostrarConfirmacio('Has oblidat el PIN?', 'No hi ha cap servidor que el pugui recuperar. L\'única manera és esborrar les dades d\'aquesta app i començar de nou. Si encara tens una còpia de seguretat, la podràs importar després (sense el PIN).', () => {
    tancarModal('modalPin'); setTimeout(() => esborrarTotesLesDades(), 300);
  }, { boto: 'Continuar', cancela: 'Tornar enrere' });
}

// ---------- Entrar i sortir de l'Espai del Cuidador ----------
const PANTALLES_PROTEGIDES = ['cuidador', 'configuracio', 'resumFamilia', 'testCognitiu'];
function pantallaProtegida(id) {
  if (!PANTALLES_PROTEGIDES.includes(id) || cuidadorObert || modeLectura) return false;
  if (!teCuidadorPin() && ajustes.rol !== 'cuidat' && ajustes.rol !== 'residencia') { cuidadorObert = true; return false; }   // «Jo mateix/a» sense PIN: accés lliure
  setTimeout(() => obrirEspaiCuidador(), 0); return true;
}
function obrirEspaiCuidador() {
  if (modeLectura) { mostrarPantalla('cuidador'); return; }
  if (cuidadorObert) { mostrarPantalla('cuidador'); return; }
  if (teCuidadorPin()) { demanaPin('entrar', entraCuidador); return; }
  if (ajustes.rol === 'cuidat' || ajustes.rol === 'residencia') { demanaPin('crear', entraCuidador); return; }   // calia un PIN i no n'hi havia
  entraCuidador();
}
function entraCuidador() { cuidadorObert = true; registraAcces('entra'); reiniciaInactivitatCuidador(); mostrarPantalla('cuidador'); }
function tancaEspaiCuidador(silenci) {
  cuidadorObert = false; clearTimeout(_tempsInactiu); if (modeLectura) { sortirModeLectura(); return; }
  if (!silenci) soClic(); anarAInici();
}
function reiniciaInactivitatCuidador() {
  clearTimeout(_tempsInactiu);
  if (!cuidadorObert || modeLectura) return;
  _tempsInactiu = setTimeout(() => { if (cuidadorObert) { tancaEspaiCuidador(true); toast('S\'ha tancat l\'Espai del cuidador per inactivitat.', 4000); } }, TEMPS_INACTIVITAT_CUIDADOR);
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (cuidadorObert) reiniciaInactivitatCuidador(); }, true));
// En sortir del cuidador cap a una pantalla de la persona, es tanca la sessió del cuidador
const _pantallesCuidadorSessio = ['cuidador', 'configuracio', 'resumFamilia', 'privadesa', 'condicions', 'sobre', 'feedback', 'testCognitiu', 'album', 'missatgeria', 'calFamiliar'];
const _mostrarPantallaOriginal = mostrarPantalla;
mostrarPantalla = function (id, opcions) {
  if (pantallaProtegida(id)) return;
  if (cuidadorObert && !_pantallesCuidadorSessio.includes(id) && !id.startsWith('joc-')) { cuidadorObert = false; clearTimeout(_tempsInactiu); }
  return _mostrarPantallaOriginal(id, opcions);
};
// Accés amagat: mantenir premut el logotip 3 segons
(function logoLlarg() {
  let t = null;
  const inici = e => { if (!e.target.closest('.menta-logo')) return; clearTimeout(t); t = setTimeout(() => { t = null; obrirEspaiCuidador(); }, 3000); };
  const fi = () => { clearTimeout(t); t = null; };
  document.addEventListener('pointerdown', inici); ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach(ev => document.addEventListener(ev, fi));
})();

// ---------- Consentiment i transparència (§ amb la persona gran) ----------
const CONSENT_TEXT = { si: 'La persona hi està d\'acord', tutor: 'Ho gestiona la família o el tutor legal', no: 'No ho vol (de moment)', pendent: 'Pendent de confirmar' };
const estatConsent = () => { const c = getUsuariActual().dades.consentiment; return c ? c.estat : (ajustes.rol === 'jo' ? 'si' : 'pendent'); };
function establirConsent(estat) {
  if (modeLectura) return;
  getUsuariActual().dades.consentiment = { estat, data: avuiISO(), qui: (dadesCuidador() || {}).nom || '' }; guardarDadesUsuari();
  registraAcces('consentiment', CONSENT_TEXT[estat]); renderCuidador();
}

// ---------- Mode lectura (un familiar obre un paquet de dades; no es pot canviar res) ----------
function importaPaquetLectura(ev) {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  const l = new FileReader();
  l.onload = () => {
    let p; try { p = JSON.parse(l.result); } catch (e) { toast('Aquest fitxer no és un paquet de MentA.', 4500, 'error'); return; }
    if (!p || p.app !== 'MentA' || p.tipus !== 'paquet-lectura' || !p.persona || !p.dades || !Array.isArray(p.dades.historial)) { toast('Aquest fitxer no és un paquet de lectura de MentA.', 4500, 'error'); return; }
    _lectura = { id: 'lectura', nom: String(p.persona.nom || 'Persona').slice(0, 30), color: p.persona.color || '#5a5146', avatar: p.persona.avatar || 'inicial', foto: null, dades: migraDades(p.dades), generat: p.generat };
    modeLectura = true; cuidadorObert = true; registraAcces('lectura', 'paquet de ' + _lectura.nom); mostrarPantalla('cuidador'); toast('Mode lectura: només es poden mirar les dades.', 4500);
  };
  l.readAsText(f);
}
function sortirModeLectura() { modeLectura = false; _lectura = null; cuidadorObert = false; refrescarTot(); anarAInici(); toast('Has sortit del mode lectura.', 2500); }

// ==========================================================
//  MÈTRIQUES I SEMÀFOR
// ==========================================================
const mediana = a => { if (!a.length) return null; const o = [...a].sort((x, y) => x - y), m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
// Setmana k = els 7 dies que acaben fa k setmanes (k = 0 → últims 7 dies)
function setmanaDades(d, k) {
  const fi = dataMenys(k * 7), ini = dataMenys(k * 7 + 6), s = d.historial.filter(h => h.data >= ini && h.data <= fi), ab = (d.abandonaments || []).filter(h => h.data >= ini && h.data <= fi);
  const trs = s.map(h => h.tempsReaccioMediana).filter(Boolean), vars = s.map(h => h.variabilitatTR).filter(v => v != null);
  return { k, ini, fi, n: s.length, dies: new Set(s.map(h => h.data)).size, minuts: Math.round(s.reduce((t, h) => t + (h.durada || 0), 0) / 60), pct: s.length ? mitjana(s.map(h => h.pct)) : null,
    tr: mediana(trs), variab: vars.length ? mitjana(vars) : null, abandonades: ab.length, ajudes: s.reduce((t, h) => t + (h.ajudesUsades || 0), 0), pauses: s.reduce((t, h) => t + (h.pausesFetes || 0), 0) };
}
const mitjanaSet = (ws, camp) => { const v = ws.map(w => w[camp]).filter(x => x != null); return v.length ? mitjana(v) : null; };
function jocsSenseJugarDies(d) { const ult = d.historial.length ? d.historial[d.historial.length - 1].data : null; return ult ? Math.round((dataDeISO(avuiISO()) - dataDeISO(ult)) / 86400000) : null; }

// Retorna { estat: 'verd'|'groc'|'vermell'|'gris', frase, indicadors: [...], avisos: [...] }
function calculaSemafor(d) {
  const ws = Array.from({ length: 8 }, (_, k) => setmanaDades(d, k)), totalSessions = ws.reduce((t, w) => t + w.n, 0), R = SEMAFOR;
  const avisos = [], notaPeriode = (ini, fi) => (d.notes || []).filter(n => n.data >= ini && n.data <= fi).map(n => n.text)[0];
  if (totalSessions < R.minSessions) return { estat: 'gris', frase: 'Encara no hi ha prou dades per valorar tendències (calen almenys ' + R.minSessions + ' sessions en 8 setmanes).', indicadors: [], avisos, ws, totalSessions };
  const addAvis = (nivell, id, titol, text, interpreta, periode) => avisos.push({ nivell, id, titol, text, interpreta, nota: periode ? notaPeriode(periode[0], periode[1]) : null });
  // 1) Precisió respecte a la línia base (mitjana de les 4 setmanes anteriors)
  const baseGroc = mitjanaSet(ws.slice(2, 6).filter(w => w.n >= 1), 'pct'), baseVerm = mitjanaSet(ws.slice(3, 7).filter(w => w.n >= 1), 'pct');
  const baixa = (w, base, llindar) => base != null && w.n >= 2 && w.pct < base * (1 - llindar);
  if (baseGroc != null && baixa(ws[0], baseGroc, R.precisioGroc) && baixa(ws[1], baseGroc, R.precisioGroc))
    addAvis('groc', 'precisio', 'Precisió més baixa del normal', `La precisió ha estat un ${Math.round((1 - mitjana([ws[0].pct, ws[1].pct]) / baseGroc) * 100)}% més baixa que la seva mitjana de les 4 setmanes anteriors, durant ${R.setmanesGroc} setmanes seguides.`, 'Una baixada puntual és normal (cansament, mal dia, un joc nou). Aquí es veu un canvi sostingut: convé preguntar com es troba i mirar les notes.', [ws[1].ini, ws[0].fi]);
  if (baseVerm != null && [0, 1, 2].every(k => baixa(ws[k], baseVerm, R.precisioVermell)))
    addAvis('vermell', 'precisio3', 'Baixada sostinguda de la precisió', `La precisió porta ${R.setmanesVermell} setmanes seguides més d'un ${Math.round(R.precisioVermell * 100)}% per sota de la seva mitjana habitual.`, 'No indica cap malaltia: només que ha canviat de manera sostinguda. Pot ser útil parlar-ne amb la persona i, si us preocupa, amb un professional de la salut.', [ws[2].ini, ws[0].fi]);
  // 2) Constància: dies actius per setmana
  const baseDies = mitjanaSet(ws.slice(2, 6), 'dies');
  if (baseDies != null && baseDies >= 3 && ws[0].dies <= baseDies * R.constanciaGroc && ws[1].dies <= baseDies * R.constanciaGroc)
    addAvis('groc', 'constancia', 'Juga molt menys que abans', `Fa ${ws[0].dies} i ${ws[1].dies} dies per setmana, quan abans en feia ${Math.round(baseDies * 10) / 10} de mitjana.`, 'Sovint és per motius pràctics (viatge, visites, un mal dia). Pot ajudar proposar un moment fix per jugar.', [ws[1].ini, ws[0].fi]);
  const sense = jocsSenseJugarDies(d);
  if (sense != null && baseDies != null && baseDies >= 2) {
    if (sense >= R.diesSenseJugarVermell) addAvis('vermell', 'inactivitat', 'Fa molts dies que no juga', `Fa ${sense} dies que no fa cap partida.`, 'Pot ser per vacances o una pausa. Si no és així, convé preguntar-li com es troba i si necessita ajuda per començar.', [dataMenys(sense), avuiISO()]);
    else if (sense >= R.diesSenseJugarGroc) addAvis('groc', 'inactivitat', 'Fa uns dies que no juga', `Fa ${sense} dies que no fa cap partida.`, 'Un recordatori amable o una estona acompanyada sol ser suficient.', null);
  }
  // 3) Abandonaments (últims 14 dies)
  const ab = ws[0].abandonades + ws[1].abandonades, com = ws[0].n + ws[1].n;
  if (ab + com >= 5 && ab / (ab + com) > R.abandonamentsGroc)
    addAvis('groc', 'abandonaments', 'Deixa molts jocs a mitges', `Ha deixat a mitges ${ab} de ${ab + com} partides en 14 dies.`, 'Pot voler dir que alguns jocs la frustren. Al pla es poden amagar els jocs que no li agraden o baixar-ne el nivell màxim.', [ws[1].ini, ws[0].fi]);
  // 4) Temps de reacció
  const baseTR = mitjanaSet(ws.slice(2, 6), 'tr');
  if (baseTR && ws[0].tr && ws[1].tr && ws[0].tr > baseTR * (1 + R.tempsReaccioGroc) && ws[1].tr > baseTR * (1 + R.tempsReaccioGroc))
    addAvis('groc', 'tr', 'Respon més a poc a poc', `El temps de reacció és un ${Math.round((mitjana([ws[0].tr, ws[1].tr]) / baseTR - 1) * 100)}% més llarg que el seu habitual durant 2 setmanes.`, 'Depèn molt del cansament, de la medicació o de si és al matí o a la tarda. Compareu amb les notes i l\'hora de joc.', [ws[1].ini, ws[0].fi]);
  // 5) Ànim (observació)
  const hist = (d.salut && d.salut.historial) || {}, ultims = [...Array(7)].map((_, k) => (hist[dataMenys(k)] || {}).anim).filter(Boolean), dolents = ultims.filter(a => a === 'Baix' || a === 'Cansat').length;
  if (ultims.length >= 5 && dolents >= R.animBaixDies) addAvis('groc', 'anim', 'Ànim baix o cansament repetit', `Ha anotat ànim «baix» o «cansat» ${dolents} de ${ultims.length} dies aquesta setmana.`, 'És una observació, no una conclusió. Pot ser bon moment per conversar amb ella i, si dura, comentar-ho amb el seu metge.', [dataMenys(6), avuiISO()]);
  const estat = avisos.some(a => a.nivell === 'vermell') ? 'vermell' : avisos.length ? 'groc' : 'verd';
  const frases = { verd: 'Constància estable i resultats dins del seu nivell habitual.', groc: avisos.slice(0, 2).map(a => a.titol).join('. ') + '. Convé fixar-s\'hi.', vermell: 'Hi ha canvis sostinguts respecte al seu nivell habitual. Convé parlar-ne amb calma.' };
  const ult4 = setmanaDades(d, 0), bas = baseGroc;
  if (estat === 'verd' && bas && ult4.pct != null) frases.verd += ` Precisió recent: ${Math.round(ult4.pct)}% (habitual: ${Math.round(bas)}%).`;
  return { estat, frase: frases[estat], avisos, ws, totalSessions, baseDies, baseTR, baseGroc };
}
const SEMAFOR_ICO = { verd: ['check', 'Tot en ordre'], groc: ['info', 'Convé fixar-s\'hi'], vermell: ['fletxa-avall', 'Canvis sostinguts'], gris: ['igual', 'Sense prou dades'] };
const htmlSemaforXip = s => `<span class="semafor ${s.estat}">${ico(SEMAFOR_ICO[s.estat][0])}<span>${SEMAFOR_ICO[s.estat][1]}</span></span>`;
