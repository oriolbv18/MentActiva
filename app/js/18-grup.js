'use strict';
// ==========================================================
//  MentA · ACTIVITAT DE GRUP (v2.0)
//  Per a la sala de la residència (P05: «el bingo s'omplia perquè hi anaven les amistats»; S06).
//  Una persona de l'equip porta la tauleta o la projecta: pregunta en lletra molt gran, es comenta entre tots i es destapa.
//  Sense puntuació individual. Es marca qui hi ha participat i queda anotat com a activitat social a la seva fitxa,
//  que és el que les famílies pregunten («l'ànim i la participació», P05).
// ==========================================================
let grup = null;
const GRUP_TIPUS = { tertulia: 'Preguntes de cultura', refranys: 'Refranys' };
function grupObrir() { soClic(); grup = { pas: 'triar', tipus: 'tertulia', assist: new Set(usuaris.filter(u => !u.dades.consentiment || u.dades.consentiment.estat !== 'no').map(u => u.id)), items: [], idx: 0, vista: false }; mostrarPantalla('grupActivitat'); }
function grupRender() {
  const c = $('grupCos'); if (!c) return;
  if (!grup) { c.innerHTML = ''; return; }
  if (grup.pas === 'triar') {
    c.innerHTML = `<p class="joc-subtitol">Una pregunta per pantalla, per comentar-la entre tots. Sense punts.</p>
      <div class="segmentat" role="radiogroup" aria-label="Tipus d'activitat">${Object.keys(GRUP_TIPUS).map(k => `<button type="button" role="radio" aria-checked="${grup.tipus === k}" class="${grup.tipus === k ? 'sel' : ''}" onclick="grupTipus('${k}')">${GRUP_TIPUS[k]}</button>`).join('')}</div>
      <h2 class="titol-seccio">Qui hi participa?</h2>
      <div class="grup-llista">${usuaris.map(u => `<label class="grup-persona"><input type="checkbox" ${grup.assist.has(u.id) ? 'checked' : ''} onchange="grupMarca('${esc(u.id)}', this.checked)"><span>${esc(u.nom)}</span></label>`).join('') || '<p class="ajuda-camp">Encara no hi ha cap resident.</p>'}</div>
      <p class="ajuda-camp">Només s'anota que hi ha participat. Qui ha dit que no vol compartir dades no surt marcat.</p>
      <button type="button" class="boto-jugar" onclick="grupComenca()"><span class="jugar-fila">${ico('play')}Començar</span></button>`;
    return;
  }
  if (grup.pas === 'joc') {
    const p = grup.items[grup.idx];
    c.innerHTML = `<p class="mov-pas">${grup.idx + 1} / ${grup.items.length}</p>
      <div class="grup-pregunta">${esc(p.q)}</div>
      <div class="grup-opcions">${p.o.map((x, i) => `<div class="grup-opcio${grup.vista && i === p.c ? ' bona' : ''}">${grup.vista && i === p.c ? ico('check') : ''}<span>${esc(x)}</span></div>`).join('')}</div>
      ${grup.vista ? `<button type="button" class="boto-jugar" onclick="grupSeguent()"><span class="jugar-fila">${ico('play')}${grup.idx === grup.items.length - 1 ? 'Acabar' : 'Següent pregunta'}</span></button>` : `<button type="button" class="boto-jugar" onclick="grupDestapa()"><span class="jugar-fila">${ico('ull')}Veure la resposta</span></button>`}
      <button type="button" class="boto-fantasma boto-ample" onclick="grupAcaba()">Acabar ara</button>`;
    return;
  }
  c.innerHTML = `<div class="mov-fi"><h2 class="joc-titol">Quina bona estona!</h2><p class="cv-frase">${grup.anotats ? `Hem anotat que hi han participat ${grup.anotats} ${plural(grup.anotats, 'persona', 'persones')}.` : 'No s\'ha anotat cap participant.'}</p><button type="button" class="boto-jugar" onclick="grupTanca()"><span class="jugar-fila">Tornar al panell</span></button></div>`;
}
PANTALLA_ENTRA.grupActivitat = grupRender;
function grupTipus(k) { grup.tipus = k; soClic(); grupRender(); }
function grupMarca(id, on) { if (on) grup.assist.add(id); else grup.assist.delete(id); }
async function grupComenca() {
  if (!(await assegurarJoc(grup.tipus))) return;
  const es = I18N.llengua === 'es' && window.BANCS_ES;
  if (grup.tipus === 'tertulia') grup.items = trianSenseRepetir(idiomaBanc('grup_tertulia'), es ? BANCS_ES.tertulia.map(([q, ...o]) => ({ q, o, c: 0 })) : BARALLA_TERTULIA, 10).map(p => { const o = barreja(p.o); return { q: p.q, o, c: o.indexOf(p.o[p.c]) }; });
  else grup.items = trianSenseRepetir(idiomaBanc('grup_refranys'), es ? BANCS_ES.refranys.map(([inici, correcta, ...falses]) => ({ inici, correcta, falses })) : BARALLA_REFRANYS, 10).map(r => { const { o, c } = opcionsBarrejades(r.correcta, r.falses); return { q: `«${r.inici} …»`, o, c }; });
  soClic(); grup.pas = 'joc'; grup.idx = 0; grup.vista = false; grupRender(); llegirText(grup.items[0].q);
}
function grupDestapa() { soEncert(); grup.vista = true; grupRender(); }
function grupSeguent() { soClic(); if (grup.idx >= grup.items.length - 1) { grupAcaba(); return; } grup.idx++; grup.vista = false; grupRender(); window.scrollTo({ top: 0 }); llegirText(grup.items[grup.idx].q); }
function grupAcaba() {
  aturarVeu(); let n = 0;
  usuaris.filter(u => grup.assist.has(u.id)).forEach(u => { u.dades.social = (u.dades.social || []).concat([{ data: avuiISO(), joc: grup.tipus, mode: 'grup', amb: 'Grup', resultat: 'junts' }]).slice(-300); n++; });
  guardarUsuaris(); registraAcces('grup', `${GRUP_TIPUS[grup.tipus]}: ${n} participants`); grup.anotats = n; grup.pas = 'fi'; soVictoria(); grupRender();
}
function grupTanca() { soClic(); grup = null; pestanyaCu = 'residencia'; mostrarPantalla('cuidador'); }
