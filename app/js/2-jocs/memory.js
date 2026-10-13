'use strict';
// ==========================================================
//  MEMORY (troba les parelles)
//  Les cartes es creen UNA sola vegada per partida; en cada toc només canvien
//  les classes de les cartes afectades (cap repintat de la graella: així
//  només s'anima la carta que es gira i les parelles encertades queden quietes).
// ==========================================================
(() => {
  const EMOJIS = [['🌻', 'girasol'], ['🌼', 'margarida'], ['🌷', 'tulipa'], ['🌹', 'rosa'], ['🍀', 'trèvol'], ['🌳', 'arbre'], ['🍎', 'poma'], ['🐦', 'ocell'], ['🐶', 'gos'],
    ['🐱', 'gat'], ['🦋', 'papallona'], ['🍓', 'maduixa'], ['🌈', 'arc de Sant Martí'], ['⭐', 'estrella'], ['🌸', 'flor de cirerer'], ['🐟', 'peix'], ['🍇', 'raïm'], ['🍋', 'llimona']];
  // parelles, columnes, files per nivell
  const NIVELLS = { facil: { parelles: 4, cols: 4, files: 2 }, mig: { parelles: 8, cols: 4, files: 4 }, dificil: { parelles: 12, cols: 6, files: 4 } };
  const NOMS = { facil: 'Fàcil', mig: 'Mig', dificil: 'Difícil' };
  let nivell = 'mig', cartes = [], girades = [], bloquejat = false, moviments = 0, parelles = 0, total = 8, graella = null;
  let vistes = new Set(), dos = false, torn = 1, punts = [0, 0], usaFotos = lsRawGet('mentA_memory_fotos') === '1';
  const fotosAlbum = () => Object.values(obtenirAlbum()).filter(u => typeof u === 'string' && u.startsWith('data:'));

  function reiniciar() {
    aturaTemps(esperaPrevia);
    const cfg = NIVELLS[nivell]; total = cfg.parelles;
    const fotos = usaFotos && !dos ? barreja(fotosAlbum()).slice(0, total) : [];       // Memory amb fotos de la família (reminiscència)
    const triats = barreja(EMOJIS).slice(0, total).map((e, i) => fotos[i] ? [fotos[i], 'foto de la família'] : e);
    cartes = barreja([...triats, ...triats]).map(([emoji, nom]) => ({ emoji, nom, girada: false, encertada: false, propietari: null }));
    girades = []; bloquejat = false; moviments = 0; parelles = 0; torn = 1; punts = [0, 0]; vistes = new Set();
    setText('memory-moviments', 0); setText('memory-parelles', 0); setText('memory-total', total);
    setText('memory-nivell-text', NOMS[nivell]); mostra('memory-nivell-info', !dos, 'block');
    setFeedback('memory', ''); mostra('memory-reiniciar', false);
    graella = $('memory-grid'); graella.style.setProperty('--cols', cfg.cols); graella.style.setProperty('--rows', cfg.files);
    graella.innerHTML = cartes.map((c, i) => htmlCartaMemory(i)).join('');   // es crea una sola vegada
    cartes.forEach((_, i) => actualitzaCarta(i));
    marcador(); actualitzaBotoFotos();
    if (nivell === 'facil' && !dos) vistaPrevia();
  }
  function actualitzaBotoFotos() {
    const b = $('memory-fotos'); if (!b) return;
    const hi = fotosAlbum().length >= 2 && !dos; b.style.display = hi ? '' : 'none';
    b.setAttribute('aria-pressed', usaFotos); b.classList.toggle('actiu', usaFotos);
    b.setAttribute('aria-label', usaFotos ? 'Fotos de la família: activades. Toca per tornar a les icones' : 'Jugar amb les fotos de la família');
  }
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#memory-fotos')) { usaFotos = !usaFotos; lsRawSet('mentA_memory_fotos', usaFotos ? '1' : '0'); soClic(); reiniciarJocActual(); } });
  let esperaPrevia = null;
  // vista prèvia de 2 segons al nivell fàcil (només el girat de cartes; la graella no es torna a crear)
  function vistaPrevia() {
    bloquejat = true; setFeedback('memory', 'Memoritza les cartes…');
    esperaPrevia = temps(() => {
      cartes.forEach((c, i) => { c.girada = true; vistes.add(i); actualitzaCarta(i); });
      esperaPrevia = temps(() => { cartes.forEach((c, i) => { c.girada = false; actualitzaCarta(i); }); bloquejat = false; setFeedback('memory', ''); }, 2200);
    }, 350);
  }
  const marcador = () => renderMarcador2P('memory', punts[0], punts[1], dos ? torn : null);

  // Actualitza NOMÉS la carta i (classes i text per a lectors de pantalla)
  function actualitzaCarta(i) {
    const c = cartes[i], el = graella.children[i]; if (!el) return;
    const visible = c.girada || c.encertada;
    el.classList.toggle('girada', visible);
    el.classList.toggle('encertada', c.encertada && !dos);
    el.classList.toggle('encertada-j1', c.encertada && dos && c.propietari === 1);
    el.classList.toggle('encertada-j2', c.encertada && dos && c.propietari === 2);
    el.setAttribute('aria-label', visible ? `Carta ${i + 1}: ${c.nom}${c.encertada ? ', parella trobada' : ''}` : `Carta ${i + 1}, tapada`);
    el.setAttribute('aria-pressed', visible);
    el.disabled = false;
    const davant = el.querySelector('.carta-davant');
    if (davant && c.emoji.startsWith('data:')) { if (davant.dataset.foto !== String(i)) { davant.dataset.foto = i; davant.innerHTML = '<img class="carta-foto" alt="">'; davant.firstChild.src = c.emoji; } }
    else if (davant && davant.textContent !== c.emoji) davant.textContent = c.emoji;
  }
  // petit «pop» únic en el moment d'encertar una parella
  function popParella(...idx) {
    idx.forEach(i => { const el = graella.children[i]; if (!el) return; el.classList.add('pop'); el.addEventListener('animationend', () => el.classList.remove('pop'), { once: true }); });
  }

  function clic(i) {
    const c = cartes[i];
    if (bloquejat || !c || c.girada || c.encertada || girades.length >= 2) return;    // protegit davant de tocs ràpids i dobles
    soClic(); c.girada = true; girades.push(i); vistes.add(i); actualitzaCarta(i);
    if (girades.length < 2) return;
    moviments++; setText('memory-moviments', moviments);
    const [a, b] = girades;
    if (cartes[a].emoji === cartes[b].emoji) {
      cartes[a].encertada = cartes[b].encertada = true;
      if (dos) { cartes[a].propietari = cartes[b].propietari = torn; punts[torn - 1]++; }
      parelles++; girades = []; setText('memory-parelles', parelles);
      actualitzaCarta(a); actualitzaCarta(b); popParella(a, b);
      soEncert(); vibrar([40, 30, 40]); elefantCelebra(); marcador();
      if (parelles === total) acabar();
    } else {
      bloquejat = true; soError(); vibrar(80);
      temps(() => {
        cartes[a].girada = cartes[b].girada = false; girades = []; bloquejat = false;
        actualitzaCarta(a); actualitzaCarta(b);
        if (dos) { torn = 3 - torn; marcador(); }
      }, 900);
    }
  }
  function acabar() {
    soVictoria(); celebracioCompleta(); mostra('memory-reiniciar', true);
    if (dos) { setFeedback('memory', finalPartida2P(textGuanyador2P(punts[0], punts[1])), 'correcte'); marcador(); return; }
    setFeedback('memory', `Has guanyat en ${moviments} moviments!`, 'correcte');
    // resultat = parelles / intents; puntuació = 100 punts menys 4 per cada intent de més
    finalitzarPartida('memory', total, Math.max(0, moviments - total), `${moviments} intents per ${total} parelles`, { puntuacio: Math.max(0, 100 - (moviments - total) * 4) });
  }
  $('memory-grid').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) clic(+b.dataset.i); });

  // Pista: una carta que ja has vist i la posició de la seva parella
  function parellaVista() {
    for (const i of vistes) {
      const c = cartes[i]; if (!c || c.encertada || girades.includes(i)) continue;
      const j = cartes.findIndex((d, k) => k !== i && !d.encertada && d.emoji === c.emoji); if (j < 0) continue;
      return { i, j, jaVista: vistes.has(j) };
    }
    return null;
  }
  const pista = {
    obtenir(n) {
      if (dos || !cartes.length || bloquejat && !girades.length && false) return null;
      const p = parellaVista(), tapades = cartes.filter(c => !c.encertada).length; if (tapades < 2) return null;
      if (n === 1) return { text: p ? 'Ja has girat cartes que tenen parella. Recordes on era cada dibuix?' : "Gira cartes noves i fixa't bé on són els dibuixos: més tard et serviran." };
      if (!p) return n === 2 ? { text: 'Encara no coneixes cap parella. Prova una carta que no hagis girat mai.', objectiu: () => graella.children[cartes.findIndex((c, k) => !c.encertada && !vistes.has(k))] } : null;
      if (n === 2) return { text: 'Aquesta carta ja la coneixes. La seva parella és a una altra posició!', objectiu: () => graella.children[p.i] };
      return { text: `La parella és aquí: ${cartes[p.i].nom}.`, explica: `Aquestes dues cartes són iguals (${cartes[p.i].nom}). Gira primer una i després l'altra.`, objectiu: () => graella.children[p.j], aplica: () => [p.i, p.j].forEach(k => { const el = graella.children[k]; el.classList.add('pista-flash'); setTimeout(() => el.classList.remove('pista-flash'), 4500); }) };
    }
  };

  registrarJoc({
    id: 'memory', pista,
    tutorial: { titol: 'Memory', cos: '<p>Gira les cartes de dues en dues i <strong>troba les parelles</strong>.</p><div class="exemple"><span>🌻</span><span>🍎</span><span>🌻</span></div><p>Si no coincideixen, es tornen a tapar: recorda on eren! Com menys intents facis, més puntuació.</p>' },
    obrir: ds => {
      dos = ds;
      if (ds) { nivell = 'mig'; reiniciar(); mostrarPantalla('joc-memory'); return; }
      triaDificultat('memory', 'Troba les parelles', 'Tria la dificultat', ['4 parelles · veus les cartes 2 segons', '8 parelles', '12 parelles'],
        n => { nivell = n; reiniciar(); mostrarPantalla('joc-memory'); });
    },
    reiniciar
  });
})();
