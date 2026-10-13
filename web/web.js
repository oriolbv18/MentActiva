'use strict';
// MentA · web d'aterratge (v1.9.3 «Un dia amb MentA»): tema, capçalera, menú mòbil, barra de CTA, hero viu (vídeo, ulls de l'Elefant, inclinació amb moll),
// mòbil viu per blocs, demo, aparador de jocs, micro-visuals del cuidador i contacte real. Sense llibreries; web/mol.js posa els molls.
// Només es mostra el contacte que existeix de debò a app/js/config.js (CONTACTE). Tot el que és moviment es desactiva amb prefers-reduced-motion.
(() => {
  const $ = id => document.getElementById(id), qa = (s, r) => [...(r || document).querySelectorAll(s)], q1 = (s, r) => (r || document).querySelector(s);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const html = document.documentElement, mq = s => !!(window.matchMedia && matchMedia(s).matches), reduit = () => mq('(prefers-reduced-motion: reduce)');
  const ct = typeof contactesValids === 'function' ? contactesValids() : [];
  const CONF = typeof CONTACTE !== 'undefined' ? CONTACTE : {};
  const IO = 'IntersectionObserver' in window;

  // ---------- Dades comunes ----------
  qa('[data-versio]').forEach(e => { if (typeof VERSIO_CURTA !== 'undefined') e.textContent = VERSIO_CURTA; });
  qa('[data-any]').forEach(e => { e.textContent = new Date().getFullYear(); });
  qa('[data-titular]').forEach(e => { e.textContent = CONF.titular || 'El projecte MentA (titular pendent d\'indicar a config.js)'; });
  const html_xarxes = ct.map(c => `<li><a href="${esc(c.href)}" ${c.clau === 'email' ? '' : 'target="_blank" rel="noopener noreferrer"'}>${c.clau === 'email' ? esc(c.href.replace('mailto:', '')) : esc(c.etiqueta + (c.clau === 'instagram' ? ' @' + c.href.replace(/\/+$/, '').split('/').pop() : ''))}</a></li>`).join('');
  ['xarxesContacte', 'xarxesPeu'].forEach(id => { const e = $(id); if (e) { e.innerHTML = html_xarxes; e.hidden = !html_xarxes; } });
  const correu = ct.find(c => c.clau === 'email');
  qa('[data-nomes-si-correu]').forEach(e => { e.hidden = !correu; });
  qa('[data-correu]').forEach(e => { if (correu) { e.href = correu.href; e.textContent = correu.href.replace('mailto:', ''); } });
  const equip = $('equipNoms'); if (equip && Array.isArray(CONF.equip) && CONF.equip.length) { equip.innerHTML = CONF.equip.map(n => `<li>${esc(n)}</li>`).join(''); equip.hidden = false; }
  const can = q1('link[rel=canonical]'); if (can && /^https:\/\//.test(CONF.web || '')) can.href = CONF.web; else if (can && !can.getAttribute('href')) can.remove();

  // ---------- Tema clar/fosc (només una preferència de la web). Revelació circular amb View Transitions quan el navegador ho permet ----------
  const colors = { clar: { alba: '#fbefd9', tarda: '#faf7f2', vespre: '#0e2e1d' }, fosc: { alba: '#241b11', tarda: '#15120e', vespre: '#0b2417' } };
  let horaActual = 'alba'; const cap0 = document.getElementById('capcalera');
  const pintaTheme = () => { if (cap0) cap0.dataset.hora = horaActual; qa('meta[name=theme-color]').forEach(m => m.setAttribute('content', colors[html.getAttribute('data-tema') === 'fosc' ? 'fosc' : 'clar'][horaActual])); };
  const btnTema = $('btnTema');
  if (btnTema) btnTema.addEventListener('click', () => {
    const nou = html.getAttribute('data-tema') === 'fosc' ? 'clar' : 'fosc';
    const canvia = () => { html.setAttribute('data-tema', nou); pintaTheme(); try { localStorage.setItem('mentA_web_tema', nou); } catch (e) { /* sense emmagatzematge: el tema val només per a aquesta visita */ } };
    if (document.startViewTransition && !reduit()) {
      const r = btnTema.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, fi = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(canvia);
      vt.ready.then(() => html.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${fi}px at ${x}px ${y}px)`] }, { duration: 520, easing: 'cubic-bezier(.23,1,.32,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    } else canvia();
  });

  // ---------- Capçalera: es compacta en fer scroll ----------
  const cap = $('capcalera');
  if (cap) { const f = () => cap.classList.toggle('compacta', window.scrollY > 40); window.addEventListener('scroll', f, { passive: true }); setTimeout(f, 400); }   // scrollY força un maquetat: no es llegeix abans de la primera pintura

  // ---------- Menú mòbil: fulla amb focus atrapat, Escape i inert al fons ----------
  const menu = $('menuMobil'), btnMenu = $('btnMenu'), btnTanca = $('btnTancaMenu');
  const fons = () => qa('main, body > footer, #capcalera, #barraCta, .salta-contingut');
  const focusables = () => qa('a[href], button:not([disabled])', menu).filter(e => e.offsetParent !== null);
  function obreMenu() { if (!menu) return; menu.classList.add('obert'); html.classList.add('menu-obert'); btnMenu.setAttribute('aria-expanded', 'true'); fons().forEach(e => e.setAttribute('inert', '')); setTimeout(() => btnTanca.focus(), 30); }
  function tancaMenu(tornaFocus) { if (!menu || !menu.classList.contains('obert')) return; menu.classList.remove('obert'); html.classList.remove('menu-obert'); btnMenu.setAttribute('aria-expanded', 'false'); fons().forEach(e => e.removeAttribute('inert')); if (tornaFocus) btnMenu.focus(); }
  if (menu) {
    btnMenu.addEventListener('click', obreMenu); btnTanca.addEventListener('click', () => tancaMenu(true));
    menu.addEventListener('click', e => { if (e.target.closest('a')) tancaMenu(false); });
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('obert')) return;
      if (e.key === 'Escape') { e.preventDefault(); tancaMenu(true); return; }
      if (e.key === 'Tab') { const f = focusables(); if (!f.length) return; const a = document.activeElement, primer = f[0], ultim = f[f.length - 1]; if (e.shiftKey && a === primer) { e.preventDefault(); ultim.focus(); } else if (!e.shiftKey && a === ultim) { e.preventDefault(); primer.focus(); } }
    });
    window.addEventListener('resize', () => { if (window.innerWidth >= 1080) tancaMenu(false); });
  }

  // ---------- Barra de CTA fixa (mòbil): surt quan el hero ja no es veu i s'amaga prop del contacte i del peu ----------
  const barra = $('barraCta'), heroi = q1('.l-heroi');
  if (barra && heroi && IO) {
    let heroVisible = true, finalVisible = false; const mostra = () => barra.classList.toggle('visible', !heroVisible && !finalVisible);
    new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; mostra(); }).observe(heroi);
    const fi = new IntersectionObserver(es => { finalVisible = es.some(x => x.isIntersecting); mostra(); }); [$('contacte'), q1('body > footer')].forEach(e => e && fi.observe(e));
  }

  // ---------- Enllaç actiu segons la secció que es veu ----------
  const enllacos = qa('.l-nav a[href*="#"]');
  if (enllacos.length && IO && !q1('.l-legal')) {
    const seccions = enllacos.map(a => $(a.getAttribute('href').split('#')[1])).filter(Boolean);
    const o = new IntersectionObserver(es => es.forEach(x => { const a = enllacos.find(l => l.getAttribute('href').endsWith('#' + x.target.id)); if (a) { if (x.isIntersecting) { enllacos.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current'); } }), { rootMargin: '-40% 0px -55% 0px' });
    seccions.forEach(s => o.observe(s));
  }

  // Tot el que és decoració o moviment s'inicialitza quan el navegador és en repòs: la primera pintura i els controls bàsics (menú, tema) no hi esperen.
  const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 700 }) : setTimeout(f, 80));
  idle(() => {
    // ---------- Hero viu: vídeo després del LCP, ulls de l'Elefant, inclinació, brillantor i imant (molls de mol.js) ----------
    const fina = mq('(hover: hover) and (pointer: fine)');
    const video = q1('.hero-video');
    if (video) {
      const lleuger = reduit() || mq('(prefers-reduced-data: reduce)') || (navigator.connection && navigator.connection.saveData);
      const arrenca = () => {
        if (lleuger) return;
        [['webm', 'video/webm; codecs="vp9"'], ['mp4', 'video/mp4']].forEach(([k, t]) => { const s = document.createElement('source'); s.src = video.dataset[k]; s.type = t; video.appendChild(s); });
        video.addEventListener('playing', () => video.classList.add('on'), { once: true }); video.load(); const p = video.play(); if (p && p.catch) p.catch(() => { /* el navegador no deixa reproduir: queda el poster */ });
        if (IO) new IntersectionObserver(es => { es[0].isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: .1 }).observe(video);
      };
      // El vídeo és decoració: s'espera que la pàgina estigui carregada i el fil principal en repòs (o, com a molt, 3 s després de la càrrega)
      const quan = () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(arrenca, { timeout: 2500 }) : arrenca()), 1200);
      if (document.readyState === 'complete') quan(); else window.addEventListener('load', quan);
    }
    // Els mòbils s'inclinen amb un moll; en acabar l'animació d'entrada es retira perquè no mani sobre el transform en línia.
    if (window.Mol && fina && !reduit()) {
      qa('[data-inclina]').forEach(m => {
        const host = m.closest('.l-hero-visual, .dia-fix') || m; let rx = 0, ry = 0;
        const pinta = () => { m.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`; };
        const mx = Mol(v => { ry = v; pinta(); }, { rigidesa: 120, amortiment: 18 }), my = Mol(v => { rx = v; pinta(); }, { rigidesa: 120, amortiment: 18 });
        const lliura = () => { m.style.animation = 'none'; };
        m.addEventListener('animationend', lliura, { once: true }); if (!m.closest('.l-hero-visual')) lliura();
        window.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const px = (e.clientX - (r.left + r.width / 2)) / innerWidth, py = (e.clientY - (r.top + r.height / 2)) / innerHeight; mx.cap(Math.max(-6, Math.min(6, px * 18))); my.cap(Math.max(-6, Math.min(6, -py * 14))); }, { passive: true });
      });
    }
    // Ulls: les dues pupil·les de l'Elefant segueixen el cursor (rang limitat); a tàctil o amb moviment reduït, miren cap al mòbil.
    const eh = $('elefantHero'), pupilles = eh ? qa('.el-ull i', eh) : [];
    if (pupilles.length) {
      let ox = 0, oy = 0; const aplica = () => { const k = eh.clientWidth / 200; pupilles.forEach(p => { p.style.transform = `translate(${(ox * k).toFixed(2)}px, ${(oy * k).toFixed(2)}px)`; }); };
      if (window.Mol && fina && !reduit()) {
        const sx = Mol(v => { ox = v; aplica(); }, { rigidesa: 260, amortiment: 24 }), sy = Mol(v => { oy = v; aplica(); }, { rigidesa: 260, amortiment: 24 });
        window.addEventListener('pointermove', e => { const r = eh.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .42), d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 260); sx.cap(dx / d * f * 3.4); sy.cap(dy / d * f * 2.8); }, { passive: true });
      } else { oy = 2.2; aplica(); }
    }
    // Botons: brillantor que segueix el cursor (limitada per rAF) i imant de ≤ 6 px a l'escriptori
    if (fina) {
      let rafBtn = 0, ult = null; document.addEventListener('pointermove', e => { const b = e.target.closest && e.target.closest('.btn'); if (!b) return; ult = [b, e.clientX, e.clientY]; if (!rafBtn) rafBtn = requestAnimationFrame(() => { rafBtn = 0; const [bb, x, y] = ult, r = bb.getBoundingClientRect(); bb.style.setProperty('--mx', (x - r.left) + 'px'); bb.style.setProperty('--my', (y - r.top) + 'px'); }); }, { passive: true });
      if (window.Mol && !reduit()) qa('.btn-accio, .btn-final').forEach(b => {
        let tx = 0, ty = 0; const pinta = () => { b.style.translate = `${tx.toFixed(2)}px ${ty.toFixed(2)}px`; };
        const sx = Mol(v => { tx = v; pinta(); }, { rigidesa: 220, amortiment: 20 }), sy = Mol(v => { ty = v; pinta(); }, { rigidesa: 220, amortiment: 20 });
        b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); sx.cap(Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) * .12))); sy.cap(Math.max(-4, Math.min(4, (e.clientY - (r.top + r.height / 2)) * .16))); });
        b.addEventListener('pointerleave', () => { sx.cap(0); sy.cap(0); });
      });
    }

    // ---------- Un dia amb MentA: el bloc al centre de la pantalla decideix quina captura es veu al mòbil (sense scroll-jacking) ----------
    const dia = q1('.dia');
    if (dia && IO) {
      const blocs = qa('.bloc', dia), capes = qa('.capa', dia);
      const activa = i => { blocs.forEach((b, k) => b.classList.toggle('on', k === i)); capes.forEach((c, k) => c.classList.toggle('on', k === i)); };
      const o = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) activa(blocs.indexOf(x.target)); }), { rootMargin: '-45% 0px -45% 0px' });
      blocs.forEach(b => o.observe(b));
    }
    // color de la barra del navegador: el del fons que es veu a dalt de tot
    if (IO) {
      const peces = qa('section[data-hora]:not(.dia), .bloc'), oh = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting && x.target.dataset.hora) { horaActual = x.target.dataset.hora; pintaTheme(); } }), { rootMargin: '-2% 0px -96% 0px' });
      peces.forEach(p => oh.observe(p));
    }

    // ---------- Aparador de jocs: files que es mouen en sentits oposats, filtres per àrea i entrada escalonada ----------
    const files = qa('.fila'), carrusel = $('carrusel');
    const iniciaAparador = () => {
    if (files.length) {
      const cartes = qa('.l-joc', carrusel); qa('[data-num-jocs]').forEach(e => { e.textContent = cartes.length; });
      files.forEach(f => { const p = q1('.l-pista', f); [...p.children].forEach(li => { const c = li.cloneNode(true); c.classList.add('clon'); c.setAttribute('aria-hidden', 'true'); c.inert = true; qa('img', c).forEach(i => { i.alt = ''; }); p.appendChild(c); }); });
      const filtres = $('filtresJocs'), noms = []; cartes.forEach(li => { const d = li.dataset.domini; if (d && !noms.some(n => n[0] === d)) noms.push([d, li.querySelector('.xip').textContent]); });
      const revisaFiles = reinicia => files.forEach(f => { const vis = qa('.l-joc:not(.clon):not([hidden])', f).length; f.hidden = vis === 0; f.classList.toggle('estatica', vis < 5); if (reinicia) { const p = q1('.l-pista', f); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; } });
      if (filtres) {
        filtres.hidden = false; filtres.innerHTML = [['tots', 'Tots'], ...noms, ['dos', '2 jugadors']].map(([v, t], i) => `<button type="button" data-filtre="${esc(v)}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('') + '<span class="nomes-lectors" id="filtreEstat" role="status" aria-live="polite"></span>';
        filtres.addEventListener('click', e => {
          const b = e.target.closest('button[data-filtre]'); if (!b) return; const v = b.dataset.filtre;
          qa('button[data-filtre]', filtres).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          let n = 0; qa('.l-joc', carrusel).forEach(li => { const ok = v === 'tots' || (v === 'dos' ? li.dataset.dos === '1' : li.dataset.domini === v); li.hidden = !ok; if (ok && !li.classList.contains('clon')) n++; });
          revisaFiles(true); $('filtreEstat').textContent = `${n} ${n === 1 ? 'joc' : 'jocs'}`;
          if (!reduit()) qa('.l-joc:not(.clon):not([hidden])', carrusel).slice(0, 10).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 40, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
        });
      }
      revisaFiles();
      const pausa = $('jocPausa');
      if (pausa && fina && !reduit()) { pausa.hidden = false; pausa.addEventListener('click', () => { const on = carrusel.classList.toggle('en-pausa'); pausa.setAttribute('aria-pressed', String(on)); pausa.setAttribute('aria-label', on ? 'Reprèn el moviment de les files de jocs' : 'Atura el moviment de les files de jocs'); }); }
      if (IO) { const of = new IntersectionObserver(es => es.forEach(x => x.target.classList.toggle('fora', !x.isIntersecting)), { rootMargin: '100px' }); files.forEach(f => of.observe(f)); }
    }
    };
    const sec = $('jocs'); if (sec && IO) { const oa = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { oa.disconnect(); iniciaAparador(); } }, { rootMargin: '900px 0px' }); oa.observe(sec); } else iniciaAparador();

    // ---------- Bento: les micro-visuals s'encenen una sola vegada, quan es veuen ----------
    qa('.bento[data-viu]').forEach(b => { if (!IO || reduit()) { b.classList.add('viu'); return; } const o = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { b.classList.add('viu'); o.disconnect(); } }, { threshold: .18 }); o.observe(b); });


  });

  // ---------- Demo: l'iframe només es carrega quan es prem «Prova-la aquí» ----------
  const pant = $('demoPantalla'), surt = $('demoSurt');
  if (pant && surt) {
    const portada = pant.innerHTML;
    pant.addEventListener('click', e => {
      if (!e.target.closest('#demoPlay')) return;
      const f = document.createElement('iframe'); f.src = 'app/index.html?demo=1'; f.title = 'Demostració interactiva de MentA'; f.allow = '';
      pant.innerHTML = ''; pant.appendChild(f); surt.hidden = false; f.focus();
    });
    surt.addEventListener('click', () => { pant.innerHTML = portada; surt.hidden = true; const p = $('demoPlay'); if (p) p.focus(); });
  }

  // ---------- Contacte ----------
  const f = $('formContacte'), sense = $('contacteSense'), teCanal = !!(correu || CONF.formulari);
  if (f && sense) { f.hidden = !teCanal; sense.hidden = teCanal; }
  const motiu = new URLSearchParams(location.search).get('motiu'), selMotiu = $('fMotiu');
  const ponMotiu = m => { if (selMotiu && [...selMotiu.options].some(o => o.value === m)) selMotiu.value = m; };
  if (motiu) ponMotiu(motiu);
  qa('a[href*="motiu="]').forEach(a => a.addEventListener('click', e => {      // sense recarregar la pàgina
    const m = new URL(a.href, location.href).searchParams.get('motiu'); if (!m || !$('contacte')) return; e.preventDefault(); tancaMenu && tancaMenu(false); ponMotiu(m);
    $('contacte').scrollIntoView({ behavior: reduit() ? 'auto' : 'smooth' }); if (f && !f.hidden) setTimeout(() => $('fNom').focus({ preventScroll: true }), reduit() ? 0 : 500);
  }));
  const error = (id, camp, text) => { const p = $(id); if (!p) return; p.textContent = text || ''; p.hidden = !text; camp.setAttribute('aria-invalid', text ? 'true' : 'false'); if (text) camp.setAttribute('aria-describedby', id); else camp.removeAttribute('aria-describedby'); return !text; };
  if (f) f.addEventListener('submit', async e => {
    e.preventDefault(); if (f.querySelector('[name=web2]').value) return;           // trampa per a robots (honeypot)
    const nom = $('fNom'), mail = $('fCorreu'), cons = $('fConsent'), msg = $('formMissatge');
    const ok = [error('eNom', nom, nom.value.trim() ? '' : 'Escriu el teu nom.'), error('eCorreu', mail, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()) ? '' : 'Escriu un correu vàlid, per exemple nom@exemple.cat.'), error('eConsent', cons, cons.checked ? '' : 'Cal que hi estiguis d\'acord per poder respondre\'t.')];
    if (ok.includes(false)) { msg.textContent = 'Revisa els camps marcats.'; (ok[0] === false ? nom : ok[1] === false ? mail : cons).focus(); return; }
    const dades = Object.fromEntries(new FormData(f).entries()); delete dades.web2; const text = `Nom: ${dades.nom}\nCorreu: ${dades.correu}\nMotiu: ${selMotiu.selectedOptions[0].textContent}\n\n${dades.missatge || ''}`;
    if (CONF.formulari) {
      msg.textContent = 'S\'està enviant…';
      try { const r = await fetch(CONF.formulari, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(dades) }); msg.textContent = r.ok ? 'Gràcies! Hem rebut el missatge i et respondrem.' : 'No s\'ha pogut enviar. Prova-ho una mica més tard.'; if (r.ok) f.reset(); } catch (err) { msg.textContent = 'No s\'ha pogut enviar. Comprova la connexió i torna-ho a provar.'; }
    } else if (correu) { location.href = correu.href + '?subject=' + encodeURIComponent('MentA · ' + selMotiu.selectedOptions[0].textContent) + '&body=' + encodeURIComponent(text); msg.textContent = 'S\'obrirà el teu programa de correu amb el missatge preparat.'; }
  });
})();
