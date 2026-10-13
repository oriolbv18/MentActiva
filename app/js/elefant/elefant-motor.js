'use strict';
// ==========================================================
//  MentA · L'ELEFANT (v1.9) · MOTOR D'ANIMACIÓ
//  - Un únic bucle requestAnimationFrame compartit (s'atura amb la pestanya oculta o sense instàncies actives; 30 fps si va lent).
//  - Trompa: espina de 8 punts amb amplada decreixent; el camí es recalcula a cada fotograma (FK per a les postures, FABRIK
//    amb límits d'angle per a assenyalar).
//  - Respecta prefers-reduced-motion i l'ajust «Animacions»: sense moviment, canvia de postura però no s'anima.
//  API: Elefant.crea(contenidor, { mida:'gran|mitjana|mini', rol:'escenari|company' }) → instància amb
//       estat, mira, miraElement, miraAlJugador, assenyala, diu, vesteix, nom, tema, pausa, reprèn, destrueix.
// ==========================================================
const Elefant = (() => {
  const P = ElefantDibuix.PIVOTS, NS = 'http://www.w3.org/2000/svg';
  const SEG = 7, LSEG = 11, AMPLE0 = 21, AMPLE1 = 11;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mou = (cur, tgt, k, dt) => cur + (tgt - cur) * (1 - Math.exp(-k * dt));
  const rnd = (a, b) => a + Math.random() * (b - a);
  // window.__elefantEstatic: només per a les proves automàtiques amb rellotge fals (milers de fotogrames simulats)
  const menysMoviment = () => !!window.__elefantEstatic || (typeof prefereixMenysMoviment === 'function' && prefereixMenysMoviment()) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (typeof ajustes !== 'undefined' && ajustes && ajustes.animacions === false);

  // ---- Postures de la trompa: angle d'arrencada (0 = cap avall, positiu = cap a l'esquerra, davant) + angles relatius per segment ----
  const TROMPA = {
    penja:    { a0: 0.08, rel: [0.02, 0.07, 0.11, 0.15, 0.2, 0.26, 0.32] },
    alca:     { a0: 3.2, rel: [-0.06, -0.08, -0.1, -0.12, -0.16, -0.2, -0.26] },
    saluda:   { a0: 2.95, rel: [-0.06, -0.08, -0.1, -0.12, -0.14, -0.18, -0.22] },
    enrotlla: { a0: 0.35, rel: [0.34, 0.4, 0.46, 0.52, 0.58, 0.64, 0.7] },
    penca:    { a0: 0.55, rel: [0.12, 0.16, 0.2, 0.26, 0.32, 0.4, 0.5] },       // com tocant-se la barbeta (pensant)
    baixa:    { a0: -0.1, rel: [0.0, 0.03, 0.05, 0.08, 0.1, 0.12, 0.14] },
    ruixa:    { a0: 2.6, rel: [-0.06, -0.08, -0.1, -0.12, -0.16, -0.2, -0.26] },
    inhala:   { a0: 2.9, rel: [-0.04, -0.06, -0.08, -0.1, -0.12, -0.16, -0.2] }
  };

  // ---- Estats: objectius suaus (la mà al cap, la boca…). Les claus que falten hereten d'«repos» ----
  const BASE = { trompa: 'penja', boca: 'somriure', lid: 0, galta: 0.25, cella: 0, cellaRot: 0, orella: 0, orellaEsc: 1, capRot: 0, capDx: 0, capDy: 0, mirx: 0, miry: 0, bot: 0, alenar: 1, onada: 1, ballaGrau: 0, cua: 1 };
  const ESTATS = {
    repos:   {},
    content: { galta: 0.6, cella: -1.5, orella: -4, orellaEsc: 1.04, capRot: -2, onada: 1.4 },
    pensant: { boca: 'neutra', trompa: 'penca', capRot: 7, mirx: 0.6, miry: -0.7, cella: -3, cellaRot: 6, onada: 0.3 },
    sorpres: { boca: 'o', trompa: 'alca', lid: -0.3, orellaEsc: 1.18, orella: -16, capDy: -4, cella: -5, onada: 0.5 },
    trist:   { boca: 'trista', trompa: 'baixa', capRot: -3, capDy: 4, orella: 12, orellaEsc: 0.94, cella: 3, cellaRot: 8, miry: 0.5, onada: 0.3, alenar: 0.6 },
    dorm:    { boca: 'neutra', trompa: 'baixa', lid: 1, capDy: 6, capRot: 5, onada: 0.2, alenar: 2.4, cua: 0.3, orella: 8 },
    celebra: { boca: 'oberta', trompa: 'alca', galta: 1, cella: -4, orella: -10, orellaEsc: 1.12, bot: 1, onada: 1.8, cua: 2.5 },
    saluda:  { boca: 'oberta', trompa: 'saluda', galta: 0.7, capRot: -4, cella: -3, orella: -6, onada: 2.2 },
    parla:   { boca: 'somriure', galta: 0.4, onada: 0.8 },
    anima:   { galta: 0.8, cella: -2, orella: -8, orellaEsc: 1.06, onada: 2, bot: 0.4 },
    balla:   { boca: 'oberta', galta: 0.9, trompa: 'saluda', ballaGrau: 1, onada: 2, cua: 2.5 },
    respira: { boca: 'neutra', trompa: 'inhala', capRot: 0, alenar: 1, orella: -4 }
  };
  // ----- Mides de la geometria de la trompa -----
  const ample = i => AMPLE0 + (AMPLE1 - AMPLE0) * (i / SEG);
  const radiansDe = (x, y) => Math.atan2(-x, y);          // 0 = cap avall, positiu cap a l'esquerra
  const dirDe = a => [-Math.sin(a), Math.cos(a)];

  function puntsTrompa(a0, rel) {
    const pts = [[P.basTrompa[0], P.basTrompa[1]]]; let a = a0;
    for (let i = 0; i < SEG; i++) { a += rel[i]; const d = dirDe(a); const q = pts[i]; pts.push([q[0] + d[0] * LSEG, q[1] + d[1] * LSEG]); }
    return pts;
  }
  // FABRIK amb límits d'angle (convertim a FK i fixem els angles entre iteracions)
  function ikTrompa(objectiu, partida) {
    const base = P.basTrompa; let rel = partida.rel.slice(), a0 = partida.a0;
    const dx = objectiu[0] - base[0], dy = objectiu[1] - base[1];
    for (let ronda = 0; ronda < 4; ronda++) {
      let pts = puntsTrompa(a0, rel);
      for (let it = 0; it < 8; it++) {
        pts[SEG] = [objectiu[0], objectiu[1]];
        for (let i = SEG - 1; i >= 0; i--) { const dd = Math.hypot(pts[i][0] - pts[i + 1][0], pts[i][1] - pts[i + 1][1]) || 1; pts[i] = [pts[i + 1][0] + (pts[i][0] - pts[i + 1][0]) * LSEG / dd, pts[i + 1][1] + (pts[i][1] - pts[i + 1][1]) * LSEG / dd]; }
        pts[0] = [base[0], base[1]];
        for (let i = 0; i < SEG; i++) { const dd = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1; pts[i + 1] = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * LSEG / dd, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * LSEG / dd]; }
      }
      const abs = []; for (let i = 0; i < SEG; i++) abs.push(radiansDe(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]));
      a0 = clamp(abs[0], -2.2, 3.1); let prev = a0;
      for (let i = 0; i < SEG; i++) { let r = abs[i] - prev; while (r > Math.PI) r -= 2 * Math.PI; while (r < -Math.PI) r += 2 * Math.PI; r = i === 0 ? 0 : clamp(r, -0.62, 0.62); rel[i] = r; prev += r; }
    }
    return { a0, rel, alcanca: Math.hypot(dx, dy) <= LSEG * SEG * 1.02 };
  }

  // Camí suau (Catmull-Rom → cúbiques de Bézier) d'un contorn de punts
  function suau(punts, tanca) {
    const n = punts.length; if (n < 2) return '';
    let d = `M${punts[0][0].toFixed(1)},${punts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = punts[Math.max(0, i - 1)], p1 = punts[i], p2 = punts[i + 1], p3 = punts[Math.min(n - 1, i + 2)];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + (tanca ? 'Z' : '');
  }
  function contornTrompa(pts) {
    const esq = [], dre = [];
    for (let i = 0; i <= SEG; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(SEG, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = ample(i) / 2;
      esq.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); dre.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    const f = pts[SEG], g = pts[SEG - 1], tx = f[0] - g[0], ty = f[1] - g[1], l = Math.hypot(tx, ty) || 1, r = ample(SEG) / 2;
    const punta = [[f[0] + tx / l * r * 0.9, f[1] + ty / l * r * 0.9]];
    return suau(esq.concat(punta, dre.reverse()), true);
  }
  function arruguesTrompa(pts) {
    let d = '';
    for (let i = 2; i < SEG; i++) {
      const a = pts[i - 1], b = pts[i + 1], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = ample(i) / 2 * 0.8;
      d += `M${(pts[i][0] + nx * w).toFixed(1)},${(pts[i][1] + ny * w).toFixed(1)} L${(pts[i][0] - nx * w).toFixed(1)},${(pts[i][1] - ny * w).toFixed(1)} `;
    }
    return d;
  }
  function ombraTrompa(pts) {     // franja fosca al costat dret (volum)
    const dre = [];
    for (let i = 0; i <= SEG; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(SEG, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = ample(i) / 2;
      dre.push([pts[i][0] - nx * w * 0.9, pts[i][1] - ny * w * 0.9]);
    }
    const dins = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(SEG, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l; return [p[0] - nx * ample(i) * 0.12, p[1] - ny * ample(i) * 0.12]; });
    return suau(dre.concat(dins.reverse()), true);
  }

  // ---------------- Bucle compartit ----------------
  const instancies = new Set(); let raf = 0, ultim = 0, acumulat = 0, intervalMin = 0, mostres = [];
  function bucle(ts) {
    raf = 0; if (document.hidden) { ultim = 0; return; }
    const actives = [...instancies].filter(e => e.viu && !e.pausada && !e.estatica);
    if (!actives.length) { ultim = 0; return; }
    if (!ultim) ultim = ts; let dt = Math.min(0.1, (ts - ultim) / 1000); ultim = ts;
    mostres.push(dt); if (mostres.length > 40) { const mitja = mostres.reduce((a, b) => a + b, 0) / mostres.length; intervalMin = mitja > 0.026 ? 1 / 30 : 0; mostres = []; }
    acumulat += dt;
    if (acumulat >= intervalMin) { const pas = acumulat; acumulat = 0; actives.forEach(e => { try { e._acu = (e._acu || 0) + pas; if (e.el.dataset.mida === 'mini' && e._acu < 0.05) return; const q = e._acu; e._acu = 0; e.pas(q); } catch (x) { console.error(x); } }); }
    raf = requestAnimationFrame(bucle);
  }
  function desperta() { if (!raf && !document.hidden) raf = requestAnimationFrame(bucle); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { ultim = 0; desperta(); } });

  // ---------------- Instància ----------------
  function crea(contenidor, opcions) {
    const o = Object.assign({ mida: 'gran', rol: 'escenari', estat: 'repos', nom: 'L\'Elefant', animat: true }, opcions || {});
    const env = document.createElement('div');
    env.className = 'el-wrap'; env.dataset.mida = o.mida; env.dataset.rol = o.rol;
    env.innerHTML = '<div class="el-globus" role="status" aria-live="polite" hidden><p class="el-globus-text"></p><div class="el-globus-accions"></div></div><div class="el-figura">' + ElefantDibuix.svg() + '</div>';
    contenidor.appendChild(env);
    const svg = env.querySelector('svg'), q = s => svg.querySelector(s);
    const G = {
      escena: q('.el-escena'), cap: q('.el-cap'), cos: q('.el-cos'), cua: q('.el-cua'), oe: q('.el-orella-esq'), od: q('.el-orella-dre'),
      potes: [...svg.querySelectorAll('.el-pota')].sort((a, b) => a.dataset.pota - b.dataset.pota),
      parpE: q('[data-ull="esq"] .el-parpella'), parpD: q('[data-ull="dre"] .el-parpella'), cellaE: q('[data-ull="esq"] .el-cella'), cellaD: q('[data-ull="dre"] .el-cella'),
      pupE: q('[data-ull="esq"] .el-pupilla'), pupD: q('[data-ull="dre"] .el-pupilla'), galtes: [...svg.querySelectorAll('.el-galta')],
      trompa: q('.el-trompa-cos'), tromOmbra: q('.el-trompa-ombra'), tromArr: q('.el-trompa-arrugues'), punta: q('.el-punta'), aigua: q('.el-aigua'), boca: q('.el-boca'), ombra: q('.el-ombra')
    };
    const BOQUES = { neutra: '.el-boca-neutra', somriure: '.el-boca-somriure', oberta: '.el-boca-oberta, .el-llengua', o: '.el-boca-o', trista: '.el-boca-trista' };
    const e = {
      el: env, svg, grups: G, viu: true, pausada: false, estatica: false, nom: o.nom, estatActual: 'repos', _bocaForma: '', _globus: env.querySelector('.el-globus'), _vestit: new Set(),
      _t: Math.random() * 100, _estat: Object.assign({}, BASE), _cur: { capRot: 0, capDx: 0, capDy: 0, lid: 0, orella: 0, orellaEsc: 1, galta: 0.25, mirx: 0, miry: 0, cella: 0, cellaRot: 0, alenar: 1, onada: 1, cua: 1, bot: 0, ballaGrau: 0 },
      _trompa: { a0: TROMPA.penja.a0, rel: TROMPA.penja.rel.slice() }, _trompaObj: null, _ik: null, _pestanyeig: 0, _propParpelleig: rnd(2, 6), _propOrella: rnd(3, 7), _orellaPuls: { e: 0, d: 0 }, _propPes: rnd(5, 9), _pes: 0, _mirada: null, _parla: 0, _timerGlobus: 0, _veuActiva: false, _salta: 0
    };
    e.estatica = !o.animat || menysMoviment();

    // ---- dibuix ----
    function setT(el, t) { el.setAttribute('transform', t); }
    function dibuixaTrompa() {
      const pts = puntsTrompa(e._trompa.a0, e._trompa.rel);
      G.trompa.setAttribute('d', contornTrompa(pts)); G.tromOmbra.setAttribute('d', ombraTrompa(pts)); G.tromArr.setAttribute('d', arruguesTrompa(pts));
      const f = pts[SEG], g = pts[SEG - 1]; const ang = Math.atan2(f[1] - g[1], f[0] - g[0]) * 180 / Math.PI + 90;
      setT(G.punta, `translate(${f[0].toFixed(1)} ${f[1].toFixed(1)}) rotate(${(ang).toFixed(1)})`);
      e._punta = f;
    }
    function dibuixa() {
      const c = e._cur, t = e._t, vol = !e.estatica;
      const al = 1 + (c.alenar - 1) * 0.0 + Math.sin(t * 1.6 * (c.alenar > 1.5 ? 0.45 : 1)) * 0.012 * c.alenar;
      const saltFase = c.bot ? Math.abs(Math.sin(t * 6.5)) : 0, ball = c.ballaGrau ? Math.sin(t * 5) : 0;
      const dy = -saltFase * 12 * c.bot - Math.abs(ball) * 5 * c.ballaGrau, dx = ball * 3 * c.ballaGrau;
      setT(G.escena, `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
      setT(G.cos, `translate(0 ${(1 - al) * 120}) scale(1 ${al.toFixed(4)})`);
      const cap = c.capRot + (c.ballaGrau ? ball * 6 : 0) + (e._parla ? Math.sin(t * 9) * 1.6 : 0);
      setT(G.cap, `translate(${(c.capDx).toFixed(2)} ${(c.capDy + (c.alenar - 1) * 2).toFixed(2)}) rotate(${cap.toFixed(2)} ${P.cap[0]} ${P.cap[1]})`);
      const fe = e._orellaPuls.e, fd = e._orellaPuls.d, aleteig = Math.sin(t * 2.3) * 2.5 * c.onada, fast = c.cua > 2 ? Math.sin(t * 11) * 6 : 0;
      setT(G.oe, `rotate(${(c.orella + aleteig + fe + fast).toFixed(2)} ${P.orellaEsq[0]} ${P.orellaEsq[1]}) translate(${P.orellaEsq[0]} 0) scale(${(c.orellaEsc).toFixed(3)} 1) translate(${-P.orellaEsq[0]} 0)`);
      setT(G.od, `rotate(${(-(c.orella) - aleteig * 0.8 - fd - fast).toFixed(2)} ${P.orellaDre[0]} ${P.orellaDre[1]}) translate(${P.orellaDre[0]} 0) scale(${(c.orellaEsc).toFixed(3)} 1) translate(${-P.orellaDre[0]} 0)`);
      setT(G.cua, `rotate(${(Math.sin(t * 2.1) * 9 * c.cua + 4).toFixed(2)} ${P.cua[0]} ${P.cua[1]})`);
      G.potes.forEach((p, i) => { const r = c.ballaGrau ? Math.sin(t * 5 + i * Math.PI * 0.5) * 6 : (e._pes ? Math.sin(Math.min(1, e._pes) * Math.PI) * (i % 2 ? -1 : 1) * 3 : 0); setT(p, `rotate(${r.toFixed(2)} ${P.potes[i][0]} ${P.potes[i][1]})`); });
      // ulls: parpella (0 = oberta, 1 = tancada), mirada i celles
      const lid = clamp(c.lid + e._pestanyeig, -0.3, 1);
      [[G.parpE, P.ull.esq], [G.parpD, P.ull.dre]].forEach(([el, [cx, cy, rx, ry]]) => setT(el, `translate(${cx} ${cy - ry}) scale(1 ${Math.max(0, lid).toFixed(3)}) translate(${-cx} ${-(cy - ry)}) translate(0 ${lid < 0 ? lid * 4 : 0})`));
      G.pupE.setAttribute('transform', `translate(${(c.mirx * 2.2).toFixed(2)} ${(c.miry * 2).toFixed(2)})`); G.pupD.setAttribute('transform', `translate(${(c.mirx * 2.2).toFixed(2)} ${(c.miry * 2).toFixed(2)})`);
      setT(G.cellaE, `translate(0 ${(c.cella).toFixed(2)}) rotate(${c.cellaRot} 80 68)`); setT(G.cellaD, `translate(0 ${(c.cella * (c.cellaRot > 0 ? -1.4 : 1)).toFixed(2)}) rotate(${-c.cellaRot} 120 68)`);
      G.galtes.forEach(g => { g.style.opacity = clamp(c.galta, 0, 1).toFixed(2); });
      dibuixaTrompa();
      setT(G.ombra, `translate(100 0) scale(${(1 - saltFase * 0.08).toFixed(3)} 1) translate(-100 0)`);
    }
    e.dibuixa = dibuixa;

    function posaBoca(forma) {
      if (forma === e._bocaForma) return; e._bocaForma = forma;
      G.boca.querySelectorAll('[class^="el-boca-"], .el-llengua').forEach(x => { x.style.display = 'none'; });
      G.boca.querySelectorAll(BOQUES[forma] || BOQUES.somriure).forEach(x => { x.style.display = ''; });
    }
    posaBoca('somriure');

    // ---- un pas de simulació ----
    e.pas = function (dt) {
      e._t += dt; const c = e._cur, d = e._estat, vol = !e.estatica;
      const K = vol ? 7 : 1000;
      ['capRot', 'capDx', 'capDy', 'lid', 'orella', 'orellaEsc', 'galta', 'mirx', 'miry', 'cella', 'cellaRot', 'alenar', 'onada', 'cua', 'bot', 'ballaGrau'].forEach(k => { c[k] = mou(c[k], d[k], k === 'lid' ? 14 : K, dt); });
      if (e._mirada) { c.mirx = mou(c.mirx, e._mirada[0], 10, dt); c.miry = mou(c.miry, e._mirada[1], 10, dt); }
      if (e._ik) c.capRot = mou(c.capRot, e._ik.capRot, 6, dt);
      // postura de la trompa: objectiu (posa o IK) + onada suau
      const tg = e._ik ? { a0: e._ik.a0, rel: e._ik.rel } : e._trompaObj || TROMPA[d.trompa] || TROMPA.penja;
      const w = vol ? c.onada : 0, amp = e._ik ? 0.35 : 1, tt = e._t;
      let a0t = tg.a0 + (vol ? Math.sin(tt * 0.9) * 0.05 * w * amp : 0);
      if (d.trompa === 'saluda') a0t += Math.sin(tt * 5.5) * 0.28 * w * 0.5;
      if (d.trompa === 'inhala') { e._respFase = mou(e._respFase || 0, e._respObj || 0, vol ? 1.4 : 1000, dt); const f = e._respFase; a0t = TROMPA.baixa.a0 + (TROMPA.inhala.a0 - TROMPA.baixa.a0) * f; }
      e._trompa.a0 = mou(e._trompa.a0, a0t, vol ? (e._ik ? 11 : 9) : 1000, dt);
      for (let i = 0; i < SEG; i++) {
        let r = tg.rel[i] + (vol ? Math.sin(tt * 1.3 - i * 0.55) * 0.045 * w * amp * (i / 3 + 0.4) : 0);
        if (d.trompa === 'saluda' && vol) r += Math.sin(tt * 5.5 - i * 0.7) * 0.09 * w;
        e._trompa.rel[i] = mou(e._trompa.rel[i], r, vol ? (e._ik ? 12 : 8) : 1000, dt);
      }
      if (vol) {
        // parpelleig aleatori (2–6 s) i orelles, canvis de pes
        e._propParpelleig -= dt; if (e._propParpelleig <= 0 && d.lid < 0.5) { e._pestanyeig = 1; e._propParpelleig = rnd(2, 6); }
        if (e._pestanyeig > 0) e._pestanyeig = Math.max(0, e._pestanyeig - dt * 9);
        e._propOrella -= dt; if (e._propOrella <= 0 && e.estatActual === 'repos') { e._orellaPuls.e = -14; e._propOrella = rnd(3, 8); if (Math.random() < 0.5) e._orellaPuls.d = -14; }
        e._orellaPuls.e = mou(e._orellaPuls.e, 0, 3, dt); e._orellaPuls.d = mou(e._orellaPuls.d, 0, 3, dt);
        e._propPes -= dt; if (e._propPes <= 0 && e.estatActual === 'repos') { e._pes = 0.01; e._propPes = rnd(6, 12); }
        if (e._pes > 0) { e._pes += dt * 0.8; if (e._pes > 1) e._pes = 0; }
        if (e._parla > 0) { e._parla -= dt; if (e._parla <= 0) { e._parla = 0; posaBoca(e._bocaBase()); } else posaBoca(Math.sin(e._t * 13) > -0.2 ? 'oberta' : 'somriure'); }
      }
      dibuixa();
      if (e._alFinal && e._alFinal.f()) { const cb = e._alFinal.cb; e._alFinal = null; cb(); }
    };
    e._bocaBase = () => ESTATS[e.estatActual] && ESTATS[e.estatActual].boca || 'somriure';

    // ---- API pública ----
    e.estat = function (nom) {
      if (!ESTATS[nom]) nom = 'repos';
      e.estatActual = nom; e._estat = Object.assign({}, BASE, ESTATS[nom]);
      if (nom !== 'respira') { e._respFase = 0; e._respObj = 0; }
      e._trompaObj = null; if (!e._parla) posaBoca(e._estat.boca);
      env.dataset.estat = nom;
      if (e.estatica) { e.pas(0.0001); e.pas(1); } else desperta();
      return e;
    };
    e.respiraFase = function (f) { e._respObj = clamp(f, 0, 1); if (e.estatica) { e.pas(0.01); } else desperta(); return e; };   // 0 = exhala, 1 = inhala (es mou suaument)
    e.mira = function (x, y) {            // coordenades de pantalla
      const r = G.cap.getBoundingClientRect(), cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.45, dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, l / 160); e._mirada = [dx / l * f, dy / l * f];
      e._estat.capRot = BASE.capRot + clamp(dx / 60, -1, 1) * 4 * (e.estatActual === 'repos' ? 1 : 0);
      if (e.estatica) e.pas(1); else desperta(); return e;
    };
    e.miraElement = function (el) { if (!el) { e._mirada = null; return e; } const r = el.getBoundingClientRect(); return e.mira(r.left + r.width / 2, r.top + r.height / 2); };
    e.miraAlJugador = function () { e._mirada = [0, 0.1]; e._estat.capRot = BASE.capRot; if (e.estatica) e.pas(1); return e; };
    e.deixaDeMirar = function () { e._mirada = null; return e; };
    e._anell = null;
    e.assenyala = function (objectiu, op) {
      const d = Object.assign({ durada: 4200, retorna: true, anell: true }, op || {});
      let x, y, r;
      if (objectiu && objectiu.getBoundingClientRect) { const b = objectiu.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; r = Math.max(b.width, b.height) / 2 + 6; }
      else if (Array.isArray(objectiu)) { x = objectiu[0]; y = objectiu[1]; r = 28; } else return e;
      // coordenades de pantalla → coordenades de la trompa (SVG)
      const m = G.trompa.getScreenCTM(); if (!m) return e;
      const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const loc = pt.matrixTransform(m.inverse());
      const sol = ikTrompa([loc.x, loc.y], e._trompa);
      const cx = G.cap.getBoundingClientRect(), dxCap = x - (cx.left + cx.width / 2);
      e._ik = { a0: sol.a0, rel: sol.rel, capRot: clamp(dxCap / 40, -1, 1) * 5 }; e.mira(x, y);
      if (d.anell) { e.anell(x, y, r, d.durada); }
      clearTimeout(e._tAssenyala);
      if (d.retorna) e._tAssenyala = setTimeout(() => e.deixaDAssenyalar(), d.durada);
      if (e.estatica) { e.pas(1); } else desperta(); return e;
    };
    e.deixaDAssenyalar = function () { clearTimeout(e._tAssenyala); e._ik = null; e.deixaDeMirar(); e.treuAnell(); e.estat(e.estatActual); return e; };
    e.anell = function (x, y, r, durada) {
      e.treuAnell(); const a = document.createElement('div'); a.className = 'el-anell'; a.setAttribute('aria-hidden', 'true');
      a.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(40, r * 2)}px;height:${Math.max(40, r * 2)}px`; document.body.appendChild(a); e._anell = a;
    };
    e.treuAnell = function () { if (e._anell) { e._anell.remove(); e._anell = null; } };
    e.vesteix = function (nomAcc, on) {
      const nom = nomAcc === 'llaçada' ? 'llaçada' : nomAcc, activa = on !== false;
      svg.querySelectorAll(`[data-acc="${nom}"]`).forEach(x => { x.hidden = !activa; });
      if (activa) e._vestit.add(nom); else e._vestit.delete(nom); return e;
    };
    e.desvesteix = function () { svg.querySelectorAll('[data-acc]').forEach(x => { x.hidden = true; }); e._vestit.clear(); return e; };
    e.tema = function (t) { env.dataset.tema = t; return e; };
    e.mida = function (m) { env.dataset.mida = m; return e; };
    e.parla = function (ms) { e._parla = (ms || 1500) / 1000; if (e.estatica) posaBoca('oberta'); else desperta(); return e; };
    e.diu = function (text, op) {
      const d = Object.assign({ emocio: null, veu: false, accions: [], durada: 0, animat: true }, op || {});
      if (d.emocio && ESTATS[d.emocio]) e.estat(d.emocio);
      const g = e._globus; g.querySelector('.el-globus-text').textContent = text;
      const ac = g.querySelector('.el-globus-accions'); ac.innerHTML = '';
      d.accions.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.className = 'el-boto ' + (a.principal ? 'principal' : 'secundari'); b.textContent = a.text; b.onclick = ev => { ev.stopPropagation(); if (a.tanca !== false) e.callaGlobus(); if (a.fer) a.fer(); }; ac.appendChild(b); });
      g.hidden = false; g.classList.remove('visible'); void g.offsetWidth; g.classList.add('visible');
      clearTimeout(e._timerGlobus);
      const ms = d.durada || (d.accions.length ? 0 : Math.max(3600, text.length * 70));
      if (ms) e._timerGlobus = setTimeout(() => e.callaGlobus(), ms);
      e.parla(Math.min(4000, text.length * 55));
      if (d.veu && typeof llegirText === 'function') { try { llegirText(text); } catch (x) { /* sense veu */ } }
      if (typeof e.alDir === 'function') e.alDir(text, d);
      return e;
    };
    e.callaGlobus = function () { clearTimeout(e._timerGlobus); e._globus.classList.remove('visible'); e._globus.hidden = true; e._parla = 0; posaBoca(e._bocaBase()); if (typeof e.alCallar === 'function') e.alCallar(); return e; };
    e.coloca = function (nouContenidor, rol, mida) {
      if (nouContenidor && env.parentNode !== nouContenidor) nouContenidor.appendChild(env); if (rol) env.dataset.rol = rol; if (mida) env.dataset.mida = mida;
      const g = e._globus;        // com a «company» (dins d'un botó) el globus viu al cos del document, mai dins del botó
      if (env.dataset.rol === 'company') { if (g.parentNode !== document.body) document.body.appendChild(g); g.classList.add('flotant'); }
      else { if (g.parentNode !== env) env.insertBefore(g, env.firstChild); g.classList.remove('flotant'); }
 if (e.estatica) e.pas(1); else desperta(); return e; };
    e.pausa = function () { e.pausada = true; return e; };
    e['reprèn'] = function () { e.pausada = false; ultim = 0; desperta(); return e; };
    e.destrueix = function () { e.viu = false; if (e._globus.parentNode === document.body) e._globus.remove(); clearTimeout(e._timerGlobus); clearTimeout(e._tAssenyala); e.treuAnell(); instancies.delete(e); env.remove(); };
    e.estatic = function (on) { e.estatica = on !== false || menysMoviment(); if (e.estatica) e.pas(1); else desperta(); return e; };
    e.refrescaMoviment = function () { e.estatica = menysMoviment() || !o.animat; if (e.estatica) { e.pas(1); } else desperta(); };

    instancies.add(e); e.estat(o.estat); e.pas(1); desperta();
    return e;
  }
  return { crea, TROMPA, ESTATS, ikTrompa, puntsTrompa, LONGITUD_TROMPA: LSEG * SEG, _instancies: instancies };
})();
