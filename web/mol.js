/* MentA · integrador de moll (≈ 0,7 KB). Mol(alCanviar, { rigidesa, amortiment }) → { cap(x, velocitatInicial), fixa(x), ara() }
   Es parteix sempre del valor i la velocitat actuals: es pot invertir a mig camí sense salts (interrompible). Amortiment crític = 2·√rigidesa (sense rebot). */
(function () {
  function Mol(cb, o) {
    o = o || {}; var k = o.rigidesa || 170, c = o.amortiment || 2 * Math.sqrt(k), p = 0, v = 0, t = 0, id = 0, l = 0;
    function pas(n) {
      var dt = Math.min((n - l) / 1000, .032); l = n; v += ((t - p) * k - v * c) * dt; p += v * dt; cb(p);
      if (Math.abs(v) < .02 && Math.abs(t - p) < .02) { p = t; v = 0; id = 0; cb(p); } else id = requestAnimationFrame(pas);
    }
    return {
      cap: function (x, w) { t = x; if (w !== undefined) v = w; if (!id) { l = performance.now(); id = requestAnimationFrame(pas); } },
      fixa: function (x) { if (id) cancelAnimationFrame(id); id = 0; p = t = x; v = 0; cb(p); },
      ara: function () { return p; }
    };
  }
  window.Mol = Mol;
})();
