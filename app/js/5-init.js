'use strict';
// ==========================================================
//  MentA · ARRENCADA
//  S'executa quan tot el DOM i els scripts anteriors estan carregats.
// ==========================================================
(function arrenca() {
  carregarAjustesUI();
  // Idiomes: el castellà només s'ofereix si el diccionari s'ha carregat sencer (mai una traducció a mitges)
  mostra('selectorIdioma', I18N.disponible(), 'block'); mostra('idiomaNomesCa', !I18N.disponible(), 'block');
  if (ajustes.idioma && ajustes.idioma !== 'ca') { document.documentElement.classList.add('carregant-idioma'); setTimeout(() => document.documentElement.classList.remove('carregant-idioma'), 2500); }   // evita veure un instant el català
  if (ajustes.idioma && ajustes.idioma !== 'ca') I18N.assegura(ok => {          // el diccionari es carrega només si cal
    if (ok) { I18N.canvia(ajustes.idioma, true); if (typeof pintarToggles === 'function') pintarToggles(); if (typeof refrescarTot === 'function') refrescarTot(); }
    else { ajustes.idioma = 'ca'; guardarAjustes(); if (typeof pintarToggles === 'function') pintarToggles(); }
    document.documentElement.classList.remove('carregant-idioma');
  });
  muntaCapcaleresJoc();
  renderMenuJocs();
  refrescarTot();
  renderBanerDemo();
  if (!_lsDisponible) { const b = $('banerSistema'); if (b) b.innerHTML = '<div class="avis-caixa"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span><strong>El navegador no deixa guardar dades.</strong> Pots jugar, però el progrés es perdrà en tancar. Prova d\'obrir MentA fora del mode privat.</span></div>'; }
  // Ruta inicial: només es recupera una pantalla que no sigui de joc (un joc no es pot reprendre en recarregar)
  const ruta = (location.hash || '').replace(/^#\/?/, '');
  const base = ajustes.rol === 'residencia' && !modeLectura ? 'selectorResident' : 'inici';
  const inicial = ruta && $(ruta) && !ruta.startsWith('joc-') && !PANTALLES_PROTEGIDES.includes(ruta) && ruta !== 'inici' ? ruta : base;
  mostrarPantalla(inicial, { senseHash: false, senseFocus: true });
  if (inicial === 'inici' || inicial === 'selectorResident') { _ignoraHash = true; try { history.replaceState(null, '', '#/' + inicial); } catch (e) { location.hash = '#/' + inicial; } _ignoraHash = false; _navProfunditat = 0; }
  document.body.classList.add('arrencat');
  iniciarOnboarding();
  if (ajustes.ambient) setTimeout(() => iniciarAmbient(ajustes.ambientTipus), 1000);
  registraSW(); vigilaRecordatori(); renderBanerInstalar();

  // L'àudio del navegador només es pot activar després del primer toc de l'usuari
  document.addEventListener('pointerdown', () => getAudio(), { once: true });
  // Si es torna a una pestanya oberta d'un altre dia, es refresca la data
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pantallaActiva('inici')) refrescarInici(); });
  if (typeof elefantInicialitza === 'function') elefantInicialitza();
  if (typeof pilotInicialitza === 'function') pilotInicialitza();
})();
