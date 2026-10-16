'use strict';
// ==========================================================
//  MentA · CONFIGURACIÓ DEL PRODUCTE
//  Canvia aquí els valors per a la fase de proves; no cal tocar res més.
// ==========================================================
const VERSIO = '1.9.4';
const VERSIO_CURTA = '1.9.4';
const DATA_VERSIO = '2026-10-16';  // data de la versió (es veu a «Sobre MentA» i al mode pilot)
const CODI_PILOT = 'daniceo';      // codi que activa el mode pilot (Configuració → Mode pilot); no distingeix majúscules. Només el saben l'equip i l'observador.
// Domini propi (vegeu docs/DOMINI.md). El posa tools/aplica-domini.py; buit = tot funciona amb rutes relatives i file://.
const DOMINI = 'mentactiva.app';
function urlBase() {
  if (DOMINI) return 'https://' + DOMINI + '/';
  try { return /^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/[^/]*$/, '').replace(/app\/$/, '') : ''; } catch (e) { return ''; }
}
const ELEFANT_NOM = "L'Elefant";   // nom de la mascota (l'usuari el pot canviar a Configuració o a l'onboarding)
const SCHEMA = 3;                 // versió de l'esquema de dades (clau mentA_schema)

// Feedback: si hi poses una URL (Google Forms, Formspree…) el formulari hi enviarà les respostes.
// Si no, es prepara el missatge per compartir-lo (Web Share) o per enviar-lo per correu (FEEDBACK_EMAIL).
const FEEDBACK_URL = '';          // p. ex. 'https://formspree.io/f/xxxxxxx'
const FEEDBACK_EMAIL = 'menta.app.upc@gmail.com';        // p. ex. 'proves@el-teu-domini.cat'
// Contacte i xarxes: TOTS buits fins que hi hagi comptes reals. L'app i la web només mostren els camps omplerts i amb format vàlid.
// valors antics de la 1.6, NO VERIFICATS (no els facis servir si no són teus): wa.me/34600000000 · instagram.com/menta_app · facebook.com/mentaapp · youtube.com/@mentaapp · info@menta.app · menta.app
const CONTACTE = { titular: '', email: 'menta.app.upc@gmail.com', formulari: '', web: '', whatsapp: '', instagram: 'https://www.instagram.com/menta.upc/', facebook: '', youtube: '', tiktok: '', linkedin: '', equip: [] };
const CONTACTE_EMAIL = CONTACTE.email;
// Retorna només els contactes omplerts i amb un format vàlid: [{ clau, etiqueta, href }]. Compartida per l'app i per la web.
function contactesValids() {
  const https = (v, domini) => { try { const u = new URL(v); return u.protocol === 'https:' && (!domini || u.hostname === domini || u.hostname.endsWith('.' + domini)) ? u.href : null; } catch (e) { return null; } };
  const regles = {
    email: ['Correu', v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'mailto:' + v : null],
    web: ['Web', v => https(v)], whatsapp: ['WhatsApp', v => { const n = v.replace(/[\s()-]/g, ''); return /^\+?\d{9,15}$/.test(n) ? 'https://wa.me/' + n.replace('+', '') : https(v, 'wa.me'); }],
    instagram: ['Instagram', v => https(v, 'instagram.com')], facebook: ['Facebook', v => https(v, 'facebook.com')], youtube: ['YouTube', v => https(v, 'youtube.com')],
    tiktok: ['TikTok', v => https(v, 'tiktok.com')], linkedin: ['LinkedIn', v => https(v, 'linkedin.com')]
  };
  return Object.keys(regles).map(k => { const v = String(CONTACTE[k] || '').trim(), href = v ? regles[k][1](v) : null; return href ? { clau: k, etiqueta: regles[k][0], href } : null; }).filter(Boolean);
}

// Regles del semàfor de l'Espai del Cuidador. Són VISIBLES a l'app (Cuidador → Resum → «Com es calcula») i es poden ajustar aquí.
// Principi: conservador. Només s'avisa davant de canvis SOSTINGUTS respecte a la línia base de la mateixa persona
// (mai respecte a una norma poblacional) i amb prou dades. Millor no avisar que alarmar per un mal dia.
const SEMAFOR = {
  minSessions: 6,            // sessions mínimes en les últimes 8 setmanes per poder valorar tendències
  precisioGroc: 0.15,        // la precisió baixa més d'un 15 % respecte a la mitjana de les 4 setmanes anteriors…
  setmanesGroc: 2,           // …durant 2 setmanes seguides  → groc
  precisioVermell: 0.25,     // la precisió baixa més d'un 25 %…
  setmanesVermell: 3,        // …durant 3 setmanes seguides → vermell
  constanciaGroc: 0.5,       // els dies actius per setmana cauen a la meitat (o menys) de la línia base durant 2 setmanes → groc
  diesSenseJugarGroc: 5,     // dies sense jugar → groc (si abans hi havia ritme)
  diesSenseJugarVermell: 10, // dies sense jugar → vermell
  abandonamentsGroc: 0.4,    // més d'un 40 % de partides abandonades (mínim 5 intents en 14 dies) → groc
  tempsReaccioGroc: 0.25,    // el temps de reacció augmenta més d'un 25 % durant 2 setmanes → groc
  animBaixDies: 4            // 4 o més dies amb ànim «Baix» o «Cansat» en l'última setmana (mínim 5 dies anotats) → observació (groc)
};

// Registre local dels últims errors de JavaScript (mentA_errors), per poder-los enviar des de Configuració.
(function registreErrors() {
  function reg(missatge) {
    try {
      const llista = JSON.parse(localStorage.getItem('mentA_errors') || '[]');
      llista.push({ t: new Date().toISOString(), m: String(missatge).slice(0, 400), p: location.hash });
      localStorage.setItem('mentA_errors', JSON.stringify(llista.slice(-50)));
    } catch (e) { /* sense emmagatzematge: no es pot registrar */ }
  }
  window.addEventListener('error', e => reg((e.message || 'error') + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => reg('promesa: ' + ((e.reason && e.reason.message) || e.reason)));
})();
