'use strict';
// ==========================================================
//  MentA · TUTORIALS INTERACTIUS (v1.10)
//  La primera vegada que s'entra a un joc (i sempre que es prem «?»), en lloc de llegir unes normes, es juga una
//  mini-partida guiada: cada pas diu què cal fer i no avança fins que la persona ho prova. Si s'equivoca, se li marca
//  la fitxa bona, sense cap penalització. Al final surt el resum de les normes. Es pot saltar en qualsevol moment.
//
//  Cada pas: { text, mostra?: html de l'exemple, fitxes?: [...], bona?: índex, ok?: text després d'encertar, marca?: false }
//  Fitxa: 'text' | { t: text visible, r: el que ensenya en tocar-la (carta girada), s: estil, cls: classe }
//  Un pas sense «bona» només s'ha de llegir: surt el botó «Següent».
// ==========================================================
const COLORS_TUT = { vermell: 'background:#d94f4f;color:#fff', verd: 'background:#2e8b57;color:#fff', blau: 'background:#3a86c8;color:#fff', groc: 'background:#e0a800;color:#2d1904', taronja: 'background:#f08a24;color:#2d1904' };
const filaTut = (...x) => `<div class="tut-fila">${x.map(v => `<span class="tut-x">${v}</span>`).join('')}</div>`;
const TUTORIALS = {
  memory: [
    { text: 'Les cartes estan girades. Toca la carta marcada.', fitxes: [{ t: '?', r: '🌻' }, { t: '?', r: '🍎' }, { t: '?', r: '🌻' }, { t: '?', r: '🍎' }], bona: 0, ok: 'És un gira-sol. Recorda on és!' },
    { text: 'Ara busca l\'altre gira-sol. Toca la carta marcada.', fitxes: [{ t: '🌻', cls: 'oberta' }, { t: '?', r: '🍎' }, { t: '?', r: '🌻' }, { t: '?', r: '🍎' }], bona: 2, ok: 'Són iguals! La parella queda descoberta.' },
    { text: 'Si les dues cartes no són iguals, es tornen a tapar. No passa res: recorda on eren i torna-ho a provar.' }
  ],
  nback: [
    { text: 'Surt una lletra. Fixa-t\'hi bé i recorda-la.', mostra: '<div class="tut-carta">B</div>' },
    { text: 'La fitxa es gira i surt una altra lletra. És la mateixa que abans?', mostra: '<div class="tut-carta">B</div>', fitxes: [{ t: 'Sí', s: COLORS_TUT.verd }, { t: 'No', s: COLORS_TUT.taronja }], bona: 0, ok: 'Sí! Abans també hi havia una B.' },
    { text: 'La fitxa es torna a girar. És la mateixa que abans?', mostra: '<div class="tut-carta">K</div>', fitxes: [{ t: 'Sí', s: COLORS_TUT.verd }, { t: 'No', s: COLORS_TUT.taronja }], bona: 1, ok: 'Molt bé! Abans era una B i ara és una K.' }
  ],
  stroop: [
    { text: 'La paraula diu VERMELL, però està escrita de color blau. Toca el color de la tinta, no el que diu.', mostra: '<div class="tut-gran" style="color:#3a86c8">VERMELL</div>', fitxes: [{ t: 'Vermell', s: COLORS_TUT.vermell }, { t: 'Blau', s: COLORS_TUT.blau }, { t: 'Verd', s: COLORS_TUT.verd }], bona: 1, ok: 'Això és: la tinta és blava.' },
    { text: 'Una altra. De quin color està escrita?', mostra: '<div class="tut-gran" style="color:#2e8b57">GROC</div>', fitxes: [{ t: 'Groc', s: COLORS_TUT.groc }, { t: 'Vermell', s: COLORS_TUT.vermell }, { t: 'Verd', s: COLORS_TUT.verd }], bona: 2, ok: 'Perfecte! La tinta és verda.', marca: false }
  ],
  span: [
    { text: 'Surten uns números d\'un en un. Aquí han sortit aquests tres, en aquest ordre:', mostra: filaTut('4', '7', '2') },
    { text: 'Ara toca\'ls en el mateix ordre. Primer, el 4.', mostra: filaTut('4', '7', '2'), fitxes: ['2', '4', '7'], bona: 1 },
    { text: 'Ara el 7.', mostra: filaTut('4', '7', '2'), fitxes: ['2', '4', '7'], bona: 2 },
    { text: 'I l\'últim, el 2.', mostra: filaTut('4', '7', '2'), fitxes: ['2', '4', '7'], bona: 0, ok: 'Molt bé! Cada vegada n\'hi haurà un de més.' }
  ],
  fluidesa: [
    { text: 'Quina paraula NO és un animal? Toca-la.', fitxes: ['Gos', 'Gat', 'Cadira'], bona: 2, ok: 'Això és! La cadira és un moble.' },
    { text: 'Una altra: quina paraula NO és una fruita?', fitxes: ['Poma', 'Cotxe', 'Pera'], bona: 1, ok: 'Molt bé! Ja saps com funciona.', marca: false }
  ],
  calcul: [
    { text: 'Fes el compte amb calma i toca el resultat. Tens 3 € i et donen 2 €. Quants en tens?', fitxes: ['4 €', '5 €', '6 €'], bona: 1, ok: 'Això és: 3 + 2 = 5.', marca: false },
    { text: 'Si falles, no passa res: veuràs la resposta correcta i podràs seguir.' }
  ],
  seqlog: [
    { text: 'Els números van de 2 en 2. Quin falta al lloc del «?»?', mostra: filaTut('2', '4', '6', '?', '10'), fitxes: ['7', '8', '9'], bona: 1, ok: 'Això és: després del 6 ve el 8.' },
    { text: 'No sempre són números. Quin dia falta?', mostra: filaTut('dilluns', '?', 'dimecres'), fitxes: ['dimarts', 'dijous', 'diumenge'], bona: 0, ok: 'Molt bé! Dilluns, dimarts, dimecres.', marca: false }
  ],
  quefalta: [
    { text: 'Mira aquests objectes. A dalt hi ha un compte enrere que et diu quants segons queden per memoritzar-los.', mostra: filaTut('🍎', '🐶', '🌳') },
    { text: 'Ara n\'ha desaparegut un. Quin era? Toca\'l.', mostra: filaTut('🍎', '?', '🌳'), fitxes: ['🚗', '🐶', '☕'], bona: 1, ok: 'Això és: faltava el gos.' }
  ],
  sudoku: [
    { text: 'A cada fila hi han de ser tots els números, sense repetir-ne cap. Quin falta aquí?', mostra: filaTut('1', '2', '?', '4'), fitxes: ['2', '3', '4'], bona: 1, ok: 'Això és! Al joc, primer toques la casella buida i després el número.' },
    { text: 'El mateix passa a cada columna i a cada quadrat de la graella. Tens 3 errors i 3 pistes.' }
  ],
  sequencia: [
    { text: 'Els botons s\'il·luminen en un ordre: primer el taronja, després el blau. Repeteix-lo. Toca el taronja.', fitxes: [{ t: '●', s: COLORS_TUT.taronja }, { t: '■', s: COLORS_TUT.blau }, { t: '▲', s: COLORS_TUT.verd }, { t: '◆', s: COLORS_TUT.groc }], bona: 0 },
    { text: 'Ara el blau.', fitxes: [{ t: '●', s: COLORS_TUT.taronja }, { t: '■', s: COLORS_TUT.blau }, { t: '▲', s: COLORS_TUT.verd }, { t: '◆', s: COLORS_TUT.groc }], bona: 1, ok: 'Molt bé! Cada ronda s\'hi afegeix un color nou.' }
  ],
  sopa: [
    { text: 'Busca la paraula SOL. Toca la seva primera lletra: la S.', fitxes: ['K', 'S', 'O', 'L', 'M'], bona: 1 },
    { text: 'Ara toca l\'última lletra: la L. Així queda marcada la paraula.', fitxes: [{ t: 'K' }, { t: 'S', cls: 'oberta' }, { t: 'O' }, { t: 'L' }, { t: 'M' }], bona: 3, ok: 'Trobada! També pots arrossegar el dit per sobre de les lletres.' }
  ],
  domino: [
    { text: 'Al tauler hi ha aquesta fitxa. Un extrem té un 5. Toca la fitxa de la teva mà que també té un 5.', mostra: filaTut('2 | 5'), fitxes: ['1 | 3', '5 | 6', '2 | 4'], bona: 1, ok: 'Encaixa! El 5 toca amb el 5.' },
    { text: 'Si no tens cap fitxa que encaixi, robes del pou. Guanya qui es queda primer sense fitxes.' }
  ],
  dames: [
    { text: 'Tu jugues amb les blanques. Toca la teva peça.', fitxes: [{ t: '⚪' }, { t: '' }, { t: '' }], bona: 0, ok: 'Ara ja la tens seleccionada.' },
    { text: 'Es mou en diagonal, cap endavant. Toca la casella marcada.', fitxes: [{ t: '⚪', cls: 'oberta' }, { t: '' }, { t: '·' }], bona: 2, ok: 'Moguda!' },
    { text: 'Si una peça teva pot saltar una rival, HAS de menjar. T\'ho avisem: les peces que poden menjar es marquen en vermell.' }
  ],
  bingo: [
    { text: 'Surt una bola: el 23. Si el tens al cartró, toca\'l.', mostra: '<div class="tut-bola">23</div>', fitxes: ['5', '23', '41', '67'], bona: 1, ok: 'Marcat!' },
    { text: 'Quan tinguis una fila sencera, canta. Toca el botó.', fitxes: ['CANTO!'], bona: 0, ok: 'Primer es canta la línia i, després, el bingo: tot el cartró.' }
  ],
  tertulia: [
    { text: 'Llegeix la pregunta i toca la resposta. Quants dies té una setmana?', fitxes: ['5', '7', '10'], bona: 1, ok: 'Això és! Si no ho saps, no passa res: veuràs la resposta.', marca: false }
  ],
  refranys: [
    { text: 'Et donem el començament d\'un refrany i tu tries com acaba: A poc a poc i bona…', fitxes: ['sopa', 'lletra', 'nit'], bona: 1, ok: 'Això és: a poc a poc i bona lletra!', marca: false }
  ],
  paraules: [
    { text: 'Hi ha una paraula amagada. La pista diu: «El lloc on vius». Té 4 lletres. Toca la A.', mostra: filaTut('_', '_', '_', '_'), fitxes: ['A', 'Z', 'K'], bona: 0, ok: 'Hi és! Han sortit dues A.' },
    { text: 'Ara ja es veuen les A. Toca una altra lletra: la C.', mostra: filaTut('_', 'A', '_', 'A'), fitxes: ['Q', 'C', 'W'], bona: 1, ok: 'Molt bé! Tens fins a 6 errors per paraula.' }
  ]
};

// Pinta el tutorial interactiu dins de `cont`. Retorna false si el joc no en té.
function tutorialInteractiu(id, cont, resum, botoFi) {
  const passos = TUTORIALS[id]; if (!passos) return false;
  let i = 0, fet = false;
  const punts = () => `<div class="tut-punts" aria-hidden="true">${passos.map((_, k) => `<i class="${k < i ? 'fet' : k === i ? 'ara' : ''}"></i>`).join('')}</div>`;
  function final() {
    cont.innerHTML = `<div class="tut-final"><p class="tut-text">Ja ho saps!</p>${resum || ''}</div>`;
    botoFi(); if (cont.parentElement) cont.parentElement.scrollTop = 0;
  }
  function seguent() { soClic(); i++; if (i >= passos.length) final(); else pas(); }
  function pas() {
    const p = passos[i], fitxes = p.fitxes || []; fet = false;
    cont.innerHTML = `${punts()}<p class="tut-text" id="tutText" aria-live="polite">${esc(p.text)}</p>${p.mostra ? `<div class="tut-mostra">${p.mostra}</div>` : ''}
      ${fitxes.length ? `<div class="tut-fitxes">${fitxes.map((f, k) => { const x = typeof f === 'string' ? { t: f } : f; return `<button type="button" class="tut-fitxa ${x.cls || ''}${p.marca !== false && k === p.bona ? ' guia' : ''}" data-k="${k}"${x.s ? ` style="${x.s}"` : ''}>${esc(x.t)}</button>`; }).join('')}</div>` : ''}
      <p class="tut-ok" id="tutOk" role="status"></p>
      <button type="button" class="boto-principal boto-gran boto-ample" id="tutSeguent"${p.bona != null ? ' hidden' : ''}>Següent</button>`;
    if (typeof llegirText === 'function') llegirText(p.text);
    const seg = cont.querySelector('#tutSeguent'); seg.onclick = seguent;
    if (p.bona == null) setTimeout(() => seg.focus({ preventScroll: true }), 40);
    cont.querySelectorAll('.tut-fitxa').forEach(b => {
      b.onclick = () => {
        if (fet) return;
        const k = +b.dataset.k, x = typeof fitxes[k] === 'string' ? {} : fitxes[k];
        if (k !== p.bona) {
          b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); soError();
          cont.querySelector('#tutOk').textContent = 'Gairebé! Prova amb la que està marcada.';
          cont.querySelector(`.tut-fitxa[data-k="${p.bona}"]`).classList.add('guia'); return;
        }
        fet = true; soEncert(); vibrar(30); b.classList.remove('guia'); b.classList.add('encertada');
        if (x.r) b.textContent = x.r;
        cont.querySelector('#tutOk').textContent = p.ok || 'Molt bé!';
        seg.hidden = false; seg.focus({ preventScroll: true });
      };
    });
    const c = cont.parentElement; if (c) c.scrollTop = 0;
  }
  pas();
  return true;
}
