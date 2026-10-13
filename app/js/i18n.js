'use strict';
// ==========================================================
//  MentA · IDIOMES (v1.9): català (original) i castellà (traducció real), amb canvi en calent sense recarregar.
//  El codi i el HTML estan escrits en català; el diccionari castellà (js/i18n/es.js) s'aplica sobre el que es veu:
//   · text i atributs (aria-label, placeholder, title, alt) de tot el DOM, també el que s'afegeix després (MutationObserver);
//   · blocs amb marques en línia (<strong>…) es tradueixen sencers per innerHTML;
//   · frases amb variables: clau amb {nom} (p. ex. «Portes {n} dies seguits»), s'omple amb el que hi ha al text original;
//   · el JS pur (veu, PDF, formats) fa servir t() i localeApp().
//  El contingut cultural (preguntes, refranys, paraules, cants del bingo, diàlegs de l'Elefant) té bancs propis a
//  js/i18n/continguts.es.js i js/elefant/dialegs.es.js: NO són traduccions literals.
//  Si el diccionari no hi és (o no es carrega), el selector d'idioma s'amaga: mai una traducció a mitges.
// ==========================================================
const I18N = (() => {
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt', 'aria-valuetext'];
  const exact = new Map(), patrons = [];
  let llengua = 'ca', obs = null, carregat = false; const vistos = new Set();       // Set<WeakRef> dels nodes que hem canviat
  const norm = s => String(s).replace(/\s+/g, ' ').trim();

  function carrega(dic) {
    Object.keys(dic).forEach(k => {
      if (/\{\w+\}/.test(k)) {
        const noms = []; const re = '^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, (m, n) => { noms.push(n); return '(.+?)'; }) + '$';
        patrons.push({ re: new RegExp(re), noms, es: dic[k], pes: k.length });
      } else exact.set(norm(k), dic[k]);
    });
    patrons.sort((a, b) => b.pes - a.pes); carregat = exact.size > 50;
  }
  // El diccionari castellà (≈150 KB) no es descarrega fins que algú tria el castellà: l'arrencada en català no el paga.
  const FITXERS = ['js/i18n/es-1-html.js', 'js/i18n/es-2-dinamic.js', 'js/i18n/es-3-resta.js', 'js/i18n/es-4-tutorials.js', 'js/i18n/continguts.es.js', 'js/elefant/dialegs.es.js'];
  let carregant = null;
  function assegura(cb) {
    if (carregat) { if (cb) cb(true); return Promise.resolve(true); }
    if (!carregant) carregant = new Promise(res => {
      let n = FITXERS.length;
      FITXERS.forEach(f => {
        const s = document.createElement('script'); s.src = f; s.async = false;          // async = false: s'executen en ordre
        s.onload = s.onerror = () => { if (--n === 0) res(); };
        document.head.appendChild(s);
      });
    }).then(() => {
      if (window.I18N_ES) { carrega(window.I18N_ES); if (window.BANCS_ES && BANCS_ES.memory) carrega(BANCS_ES.memory); }
      if (!carregat) carregant = null;                                                    // si ha fallat, es podrà tornar a provar
      return carregat;
    });
    carregant.then(ok => { if (cb) cb(ok); });
    return carregant;
  }
  const disponible = () => carregat || FITXERS.length > 0;

  // Traducció d'un fragment de text pla (conserva els espais de la vora)
  function t(text) {
    if (llengua === 'ca' || text == null) return text;
    const s = String(text), n = norm(s); if (!n || !/[A-Za-zÀ-ÿ]/.test(n)) return s;
    const r = tradueix(n); if (r == null) return s;
    const m = /^(\s*)[\s\S]*?(\s*)$/.exec(s); return (m[1] || '') + r + (m[2] || '');
  }
  const regles = [];       // [RegExp global, substitució]: s'apliquen a les frases que no tenen traducció exacta ni plantilla
  const afegeixRegles = llista => llista.forEach(r => regles.push(r));
  function tradueix(n, estricte) {
    if (exact.has(n)) return exact.get(n);
    for (const p of patrons) {
      const m = p.re.exec(n); if (!m) continue;
      let r = p.es; p.noms.forEach((nom, i) => { const v = m[i + 1], tv = tradueix(norm(v)); r = r.split('{' + nom + '}').join(tv == null ? v : tv); });
      return r;
    }
    if (!estricte && regles.length) { let r = n; regles.forEach(([re, sub]) => { r = r.replace(re, sub); }); if (r !== n) return r; }
    return null;
  }

  // ---- DOM ----
  const SALTA = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'NOSCRIPT']);
  const saltaEl = e => !e || SALTA.has(e.tagName) || (e.closest && e.closest('[data-no-i18n], svg'));
  const recorda = n => { vistos.add(new WeakRef(n)); };
  function node(n) {
    if (n.nodeType === 3) {
      if (n.__es === n.data) return;                                    // l'escriptura és nostra
      if (saltaEl(n.parentElement)) return;
      const orig = n.data, r = t(orig);
      if (r !== orig) { n.__ca = orig; n.__es = r; n.data = r; recorda(n); } else { n.__ca = undefined; n.__es = undefined; }
    } else if (n.nodeType === 1) element(n);
  }
  const ENLINIA = new Set(['STRONG', 'EM', 'B', 'I', 'SPAN', 'SMALL', 'A', 'U', 'MARK', 'BR', 'ABBR']);
  function mixt(e) {      // text barrejat amb marques en línia: es tradueix l'innerHTML sencer
    if (e.__esHtml === e.innerHTML) return true;
    let text = false, marca = false;
    for (const c of e.childNodes) { if (c.nodeType === 3 && c.data.trim()) text = true; else if (c.nodeType === 1) { if (!ENLINIA.has(c.tagName) || c.children.length > 1) return false; marca = true; } }
    if (!(text && marca)) return false;
    const orig = e.innerHTML, r = tradueix(norm(orig), true); if (r == null) return false;
    e.__caHtml = orig; e.__esHtml = r; e.innerHTML = r; e.__esHtml = e.innerHTML; recorda(e); return true;
  }
  function element(e) {
    if (e.closest && e.closest('[data-no-i18n], svg')) return;          // (els textarea/input sí que tenen placeholder traduïble)
    ATTRS.forEach(a => {
      if (!e.hasAttribute || !e.hasAttribute(a)) return; const v = e.getAttribute(a);
      if (e.__esAttrs && e.__esAttrs[a] === v) return; const r = t(v);
      if (r !== v) { (e.__caAttrs = e.__caAttrs || {})[a] = v; (e.__esAttrs = e.__esAttrs || {})[a] = r; e.setAttribute(a, r); recorda(e); }
    });
    if (SALTA.has(e.tagName) || mixt(e)) return;
    for (const c of Array.from(e.childNodes)) { if (c.nodeType === 3) node(c); else if (c.nodeType === 1) element(c); }
  }
  function arbre(arrel) { if (!arrel) return; if (arrel.nodeType === 3) node(arrel); else if (arrel.nodeType === 1 || arrel.nodeType === 9 || arrel.nodeType === 11) element(arrel.nodeType === 9 ? arrel.documentElement : arrel); }
  function restaura() {
    vistos.forEach(ref => {
      const n = ref.deref(); if (!n) { vistos.delete(ref); return; }
      if (n.nodeType === 3 && n.__ca != null && n.data === n.__es) n.data = n.__ca;
      if (n.nodeType === 1) {
        if (n.__caHtml != null && n.innerHTML === n.__esHtml) n.innerHTML = n.__caHtml;
        if (n.__caAttrs) Object.keys(n.__caAttrs).forEach(a => { if (n.getAttribute(a) === n.__esAttrs[a]) n.setAttribute(a, n.__caAttrs[a]); });
      }
      n.__ca = n.__es = n.__caHtml = n.__esHtml = n.__caAttrs = n.__esAttrs = undefined;
    }); vistos.clear();
  }
  function observa() {
    if (obs || !document.body) return;
    obs = new MutationObserver(muts => {
      if (llengua === 'ca') return;
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach(arbre);
        else if (m.type === 'characterData') node(m.target);
        else if (m.type === 'attributes') element(m.target);
        if (m.type === 'childList' && m.target.nodeType === 1 && m.target.__esHtml !== undefined && m.target.innerHTML !== m.target.__esHtml) { m.target.__esHtml = undefined; element(m.target); }
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function canvia(nova, desa) {
    if (nova === 'es' && !carregat) { assegura(ok => { if (ok) canvia(nova, desa); }); return llengua; }      // primer cal el diccionari
    if (nova !== 'ca' && nova !== 'es') nova = 'ca';
    if (nova === llengua && !desa) { return llengua; }
    if (llengua !== 'ca') restaura();
    llengua = nova; window.__llengua = nova; document.documentElement.lang = nova;
    if (nova !== 'ca') { observa(); arbre(document.body); const ti = document.querySelector('title'); if (ti) { ti.__ca = ti.__ca || ti.textContent; ti.textContent = t(ti.__ca); } }
    else { const ti = document.querySelector('title'); if (ti && ti.__ca) ti.textContent = ti.__ca; }
    document.dispatchEvent(new CustomEvent('menta:idioma', { detail: { llengua: nova } }));
    return llengua;
  }
  return { _regles: regles, carrega, assegura, afegeixRegles, canvia, t, disponible, arbre, get llengua() { return llengua; }, _exact: exact, _patrons: patrons, tradueix: n => tradueix(norm(n)) };
})();
const t = s => I18N.t(s);
const localeApp = () => (I18N.llengua === 'es' ? 'es-ES' : 'ca-ES');
const bancIdioma = (id, ca) => (I18N.llengua === 'es' && window.BANCS_ES && window.BANCS_ES[id]) || ca;
const idiomaBanc = id => (I18N.llengua === 'es' && window.BANCS_ES && window.BANCS_ES[id] ? id + '_es' : id);

// Informes PDF: tot el text que arriba a jsPDF passa pel diccionari
function pdfNou(opcions) {
  const doc = new window.jspdf.jsPDF(opcions);
  if (I18N.llengua === 'ca') return doc;
  const tx = doc.text.bind(doc), sp = doc.splitTextToSize.bind(doc);
  const tr = v => Array.isArray(v) ? v.map(tr) : (typeof v === 'string' ? t(v) : v);
  doc.text = (txt, ...r) => tx(tr(txt), ...r); doc.splitTextToSize = (txt, w, ...r) => sp(tr(txt), w, ...r);
  return doc;
}
