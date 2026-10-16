/* MentA · service worker
   Estratègia: precache de tots els recursos i «cache-first» amb versió.
   En publicar una versió nova, canvia CACHE: les cachés antigues s'esborren soles. */
const CACHE = 'menta-1.9.4';
const RECURSOS = [
  './', 'index.html', 'offline.html', 'manifest.webmanifest', 'css/estils.css', 'css/elefant.css',
  'fonts/atkinson-latin.woff2', 'fonts/atkinson-latin-ext.woff2', 'fonts/lexend-latin.woff2', 'fonts/lexend-latin-ext.woff2',
  'img/logo.webp', 'img/logo-fosc.webp', 'img/favicon.svg', 'img/icona-192.png', 'img/icona-512.png', 'img/icona-maskable-192.png', 'img/icona-maskable-512.png', 'img/apple-touch-icon.png', 'img/social-1200x630.png',
  'vendor/jspdf.umd.min.js',
  'js/config.js', 'js/i18n.js', 'js/i18n/es-1-html.js', 'js/i18n/es-2-dinamic.js', 'js/i18n/es-3-resta.js', 'js/i18n/es-4-tutorials.js', 'js/i18n/continguts.es.js', 'js/elefant/dialegs.es.js', 'js/1-nucli.js', 'js/elefant/elefant-dibuix.js', 'js/elefant/elefant-motor.js', 'js/elefant/dialegs.ca.js', 'js/elefant/elefant-comportament.js', 'js/pistes.js', 'js/3-progres.js', 'js/6-estadistiques.js', 'js/4-familia.js', 'js/7-dades.js', 'js/8-producte.js', 'js/9-persona.js', 'js/10-cuidador.js', 'js/10-cuidador-panells.js', 'js/11-residencia.js', 'js/12-parella.js', 'js/13-onboarding.js', 'js/14-copia.js', 'js/15-pilot.js', 'js/bingo-cants.js', 'js/5-init.js',
  'js/2-jocs/_quiz.js', 'js/2-jocs/tertulia.js', 'js/2-jocs/refranys.js', 'js/2-jocs/paraules.js', 'js/2-jocs/fluidesa.js', 'js/2-jocs/memory.js', 'js/2-jocs/sequencia.js',
  'js/2-jocs/nback.js', 'js/2-jocs/span.js', 'js/2-jocs/quefalta.js', 'js/2-jocs/domino.js', 'js/2-jocs/dames.js', 'js/2-jocs/bingo.js', 'js/2-jocs/sopa.js',
  'js/2-jocs/stroop.js', 'js/2-jocs/calcul.js', 'js/2-jocs/seqlog.js', 'js/2-jocs/sudoku.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(RECURSOS)));      // no fa skipWaiting: l'usuari tria quan actualitzar
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('menta-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'saltaEspera') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(resp => {
    if (resp.ok) { const c = resp.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); }
    return resp;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('offline.html') : Response.error())));
});
