'use strict';
// ==========================================================
//  QUÈ VA AMB QUÈ? (v2.0)
//  Uneix cada paraula amb la seva parella: cullera amb forquilla. Associació de paraules (entrevistes S02 i P06).
//  Fàcil: 4 parelles. Mig: 5. Difícil: 6, amb parelles de cultura (Picasso i Guernica). Dues rondes.
// ==========================================================
const PARELLES_CA = [['Cullera', 'Forquilla'], ['Agulla', 'Fil'], ['Sal', 'Pebre'], ['Pa', 'Tomàquet'], ['Martell', 'Clau'], ['Sabata', 'Mitjó'], ['Cafè', 'Llet'], ['Llapis', 'Goma'], ['Plat', 'Got'], ['Coixí', 'Llençol'], ['Pinzell', 'Pintura'], ['Pluja', 'Paraigua'], ['Fred', 'Abric'], ['Mar', 'Vaixell'], ['Cel', 'Avió'], ['Carta', 'Sobre'], ['Barret', 'Cap'], ['Anell', 'Dit'], ['Rellotge', 'Hora'], ['Gallina', 'Ou'], ['Abella', 'Mel'], ['Ovella', 'Llana'], ['Llibre', 'Biblioteca'], ['Metge', 'Hospital'], ['Mestre', 'Escola'], ['Forner', 'Forn'], ['Pescador', 'Xarxa'], ['Pagès', 'Camp']];
const PARELLES_CULTURA_CA = [['Romeu', 'Julieta'], ['Don Quixot', 'Sancho Panza'], ['Picasso', 'Guernica'], ['Dalí', 'Figueres'], ['Gaudí', 'Sagrada Família'], ['Colom', 'Amèrica'], ['Verdaguer', 'Canigó'], ['Mozart', 'Salzburg'], ['Beethoven', 'Novena simfonia'], ['Serrat', 'Mediterráneo'], ['Pau Casals', 'Violoncel'], ['Napoleó', 'Waterloo'], ['Velázquez', 'Les Menines']];

(() => {
  const RONDES = 2;
  let nivell = 'facil', ronda = 0, parelles = [], esq = [], dre = [], sel = null, fetes = new Set(), encerts = 0, errors = 0, fallada = new Set(), bloquejat = false;
  const TX = () => (I18N.llengua === 'es' ? { ok: 'Muy bien, van juntas.', no: 'Estas dos no van juntas. Prueba otra.', tria: 'Ahora toca su pareja, en la columna de la derecha.', primer: 'Toca primero una palabra de la izquierda.' } : { ok: 'Molt bé, van juntes.', no: 'Aquestes dues no van juntes. Prova\'n una altra.', tria: 'Ara toca la seva parella, a la columna de la dreta.', primer: 'Toca primer una paraula de l\'esquerra.' });
  const banc = () => { const b = window.BANCS_ES && I18N.llengua === 'es' && BANCS_ES.associa; return b || { facils: PARELLES_CA, cultura: PARELLES_CULTURA_CA }; };
  function novaRonda() {
    const b = banc(), n = nivell === 'facil' ? 4 : nivell === 'mig' ? 5 : 6;
    parelles = nivell === 'dificil' ? barreja(b.cultura).slice(0, 3).concat(barreja(b.facils).slice(0, n - 3)) : barreja(b.facils).slice(0, n);
    esq = barreja(parelles.map((p, i) => ({ t: p[0], i }))); dre = barreja(parelles.map((p, i) => ({ t: p[1], i })));
    sel = null; fetes = new Set(); fallada = new Set(); bloquejat = false; setText('associa-ronda', ronda + 1); setFeedback('associa', ''); pinta(); iniciTemps();
  }
  function pinta() {
    const b = (x, costat) => { const fet = fetes.has(x.i), s = costat === 'e' && sel === x.i; return `<button type="button" class="associa-fitxa${fet ? ' feta' : ''}${s ? ' triada' : ''}" data-c="${costat}" data-i="${x.i}"${fet ? ' disabled' : ''} aria-pressed="${s}">${fet ? ico('check') : ''}<span>${esc(x.t)}</span></button>`; };
    $('associa-esq').innerHTML = esq.map(x => b(x, 'e')).join(''); $('associa-dre').innerHTML = dre.map(x => b(x, 'd')).join('');
  }
  function toca(costat, i) {
    if (bloquejat || fetes.has(i)) return;
    if (costat === 'e') { sel = i; soClic(); setFeedback('associa', TX().tria); pinta(); return; }
    if (sel == null) { setFeedback('associa', TX().primer); return; }
    registraTR(ara() - tempsIniciPregunta); iniciTemps();
    if (sel === i) {
      if (!fallada.has(i)) encerts++;
      fetes.add(i); sel = null; soEncert(); vibrar([40, 30, 40]); setFeedback('associa', TX().ok, 'correcte'); setText('associa-encerts', encerts); pinta();
      if (fetes.size === parelles.length) { bloquejat = true; ronda++; temps(ronda < RONDES ? novaRonda : acaba, 900); }
    } else {
      errors++; fallada.add(sel); soError(); vibrar(150); elefantTrist(); guardarError(parelles[sel][0], parelles[sel][1], parelles[i][1]); setFeedback('associa', TX().no, 'incorrecte'); sel = null; pinta();
    }
  }
  function acaba() { const total = encerts + errors; finalitzarPartida('associa', encerts, errors, '', { pct: total ? encerts / total * 100 : 0 }); }
  function reiniciar() { ronda = 0; encerts = 0; errors = 0; setText('associa-encerts', 0); setText('associa-rondes', RONDES); novaRonda(); }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#joc-associa .associa-fitxa'); if (b && !b.disabled) toca(b.dataset.c, +b.dataset.i); });
  const pista = {
    proactiva: false,   // la bafarada que s'ofereix sola taparia les fitxes; la bombeta sempre hi és
    obtenir(n) {
      if (bloquejat || !parelles.length) return null;
      if (n === 1) return { text: I18N.llengua === 'es' ? 'Toca una palabra de la izquierda y busca a la derecha la que va con ella.' : 'Toca una paraula de l\'esquerra i busca a la dreta la que hi va.' };
      const i = sel != null ? sel : parelles.findIndex((_, k) => !fetes.has(k));
      if (n === 2) return { text: I18N.llengua === 'es' ? `Piensa con qué va «${parelles[i][0]}».` : `Pensa amb què va «${parelles[i][0]}».`, objectiu: () => document.querySelector(`#associa-esq [data-i="${i}"]`) };
      return { text: I18N.llengua === 'es' ? `«${parelles[i][0]}» va con «${parelles[i][1]}».` : `«${parelles[i][0]}» va amb «${parelles[i][1]}».`, objectiu: () => document.querySelector(`#associa-dre [data-i="${i}"]`) };
    }
  };
  registrarJoc({
    id: 'associa', pista,
    tutorial: { titol: 'Què va amb què?', cos: '<p>Toca una paraula de l\'esquerra i després <strong>la que hi va</strong> a la dreta.</p><p>Per exemple: <strong>Cullera</strong> va amb <strong>Forquilla</strong>.</p>' },
    obrir: () => triaDificultat('associa', 'Què va amb què?', 'Tria la dificultat', ['4 parelles de cada dia', '5 parelles', '6 parelles, algunes de cultura'], v => { nivell = v; reiniciar(); mostrarPantalla('joc-associa'); }),
    reiniciar
  });
})();
