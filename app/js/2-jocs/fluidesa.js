'use strict';
// ==========================================================
//  FLUÏDESA VERBAL (60 segons)
// ==========================================================
(() => {
  const CATEGORIES_FLUIDESA = [
    { nom: 'animals', exemple: 'gos, gat, elefant…' }, { nom: 'fruites', exemple: 'poma, plàtan, taronja…' },
    { nom: 'objectes de cuina', exemple: 'forquilla, olla, ganivet…' }, { nom: 'ciutats', exemple: 'Barcelona, París, Roma…' },
    { nom: 'colors', exemple: 'vermell, blau, groc…' }, { nom: 'oficis', exemple: 'metge, forner, mestre…' },
    { nom: 'parts del cos', exemple: 'mà, peu, cap…' }, { nom: 'verdures i hortalisses', exemple: 'ceba, enciam, tomàquet…' },
    { nom: 'peces de roba', exemple: 'jersei, camisa, mitjons…' }, { nom: 'instruments musicals', exemple: 'piano, flauta, violí…' },
    { nom: 'països', exemple: 'Itàlia, Japó, Mèxic…' }, { nom: 'mitjans de transport', exemple: 'tren, avió, bicicleta…' },
    { nom: 'flors i plantes', exemple: 'rosa, clavell, margarida…' }, { nom: 'coses de la casa', exemple: 'llit, cadira, llum…' },
    { nom: 'menjars i plats', exemple: 'paella, truita, escudella…' }
  ];
  const DURADA = 60, OBJECTIU = 10;
  let cat = null, paraules = [], restant = DURADA, actiu = false, cronometre = null;

  function reiniciar() {
    aturaTemps(cronometre); actiu = false; paraules = []; restant = DURADA;
    cat = aleatori(bancIdioma('fluidesa', CATEGORIES_FLUIDESA));
    setText('fluidesa-categoria', `Categoria: ${cat.nom} (${cat.exemple})`);
    setText('fluidesa-timer', DURADA); setText('fluidesa-count', 0);
    $('fluidesa-llista').innerHTML = ''; $('fluidesa-input').value = ''; $('fluidesa-input').disabled = true;
    $('fluidesa-afegir').disabled = true;
    setFeedback('fluidesa', 'Prem «Començar» quan estiguis a punt. Tens 60 segons!');
    $('fluidesa-iniciar').textContent = 'Començar'; mostra('fluidesa-iniciar', true);
  }
  function comencar() {
    soClic(); if (actiu) return;
    paraules = []; restant = DURADA; actiu = true; iniciTemps();
    $('fluidesa-llista').innerHTML = ''; setText('fluidesa-count', 0); setText('fluidesa-timer', DURADA);
    setFeedback('fluidesa', ''); mostra('fluidesa-iniciar', false);
    $('fluidesa-input').disabled = false; $('fluidesa-afegir').disabled = false; $('fluidesa-input').focus();
    llegirText('Digues paraules de la categoria ' + cat.nom);
    cronometre = interval(() => { restant--; setText('fluidesa-timer', restant); if (restant <= 0) acabar(); }, 1000);
  }
  // No hi ha diccionari: només es descarten entrades que clarament no són paraules (sense vocals, lletres repetides, números…)
  const base = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const paraulaValida = p => p.length >= 3 && /^[a-zà-ÿ·'\- ]+$/i.test(p) && /[aeiouàèéíòóúïü]/i.test(p) && !/(.)\1\1/.test(p);
  function afegir() {
    if (!actiu) return;
    const input = $('fluidesa-input'), p = input.value.trim().toLowerCase();
    if (!paraulaValida(p)) { setFeedback('fluidesa', 'Escriu una paraula (només lletres, mínim 3).', 'incorrecte'); soError(); input.select(); return; }
    if (paraules.some(x => base(x) === base(p))) { soError(); setFeedback('fluidesa', "Ja l'havies dit!", 'incorrecte'); input.select(); return; }
    paraules.push(p); registraTR(ara() - tempsIniciPregunta); tempsIniciPregunta = ara(); soEncert(); vibrar(20);
    const el = document.createElement('div'); el.className = 'fluidesa-item'; el.textContent = p; $('fluidesa-llista').appendChild(el);
    setText('fluidesa-count', paraules.length); setFeedback('fluidesa', ''); input.value = ''; input.focus();
  }
  function acabar() {
    aturaTemps(cronometre); actiu = false;
    $('fluidesa-input').disabled = true; $('fluidesa-afegir').disabled = true;
    const total = paraules.length;
    setFeedback('fluidesa', `Has dit ${total} paraules de «${cat.nom}»!`, 'correcte');
    $('fluidesa-iniciar').textContent = 'Tornar a jugar'; mostra('fluidesa-iniciar', true);
    // L'objectiu és dir-ne 10: el percentatge és sobre aquesta meta
    finalitzarPartida('fluidesa', total, 0, `${total} ${total === 1 ? 'paraula' : 'paraules'} en 60 segons`, { pct: Math.min(100, total / OBJECTIU * 100), puntuacio: total * 10 });
  }
  $('fluidesa-iniciar').addEventListener('click', () => { if ($('fluidesa-iniciar').textContent.includes('Tornar')) { reiniciar(); comencar(); } else comencar(); });
  $('fluidesa-afegir').addEventListener('click', afegir);
  $('fluidesa-input').addEventListener('keydown', e => { if (e.key === 'Enter') afegir(); });

  const pista = {
    proactiva: false,
    obtenir(n) {
      if (!actiu || !cat) return null;
      if (n === 1) return { text: `Pensa en ${cat.nom} que veus cada dia a casa o pel carrer. No cal que siguin rebuscades.` };
      if (n === 2) return { text: `Truc: repassa l'abecedari (A, B, C…) i pensa si se t'acut alguna cosa de «${cat.nom}» per a cada lletra.`, objectiu: () => $('fluidesa-categoria') };
      return { text: `Per exemple: ${cat.exemple}`, explica: `Algunes idees de «${cat.nom}»: ${cat.exemple} Segur que se't n'acudeixen més!`, objectiu: () => $('fluidesa-input') };
    }
  };

  registrarJoc({
    id: 'fluidesa', pista,
    tutorial: { titol: 'Digues paraules', cos: '<p>Et direm una categoria. Escriu <strong>tantes paraules com puguis</strong> en 60 segons i prem Enter (o «+») després de cadascuna.</p><p>L\'objectiu és arribar a 10. No comprovem si és una paraula de la categoria: confiem en tu!</p>' },
    obrir: obrirSenzill('fluidesa', reiniciar),
    reiniciar
  });
})();
