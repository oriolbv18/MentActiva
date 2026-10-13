"""Utilitats comunes de les proves de jocs: rellotge fals (partides senceres en pocs segons),
registre d'errors i vigilància d'animacions."""
import pathlib, sys, time, re
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ARREL / 'tests'))
from captures import APP, MIDES, nou_context  # noqa: E402

T0 = 1_760_000_000_000  # instant inicial del rellotge fals (ms)

# Vigilància: registra les animacions CSS que arrenquen i els elements que es creen/modifiquen durant una acció
VIGILANT = """
(() => {
  if (window.__vig) return;
  window.__vig = { animacions: [], errors: [] };
  const clau = e => e && e.nodeType === 1 ? (e.id || e.dataset.i || (e.dataset.f !== undefined ? e.dataset.f + ',' + e.dataset.c : '') || e.className) : '';
  document.addEventListener('animationstart', e => { window.__vig.animacions.push({ nom: e.animationName, el: clau(e.target), cls: String(e.target.className && e.target.className.baseVal !== undefined ? e.target.className.baseVal : e.target.className) }); }, true);
  window.addEventListener('error', e => window.__vig.errors.push(String(e.message)));
})();
"""


class Partida:
    """Una sessió de navegador amb rellotge fals i captura d'errors."""
    def __init__(self, p, mida='mobil', tema='clar', zoom='normal'):
        self.nav, self.ctx = nou_context(p, mida, tema, zoom)
        self.pg = self.ctx.new_page()
        self.errors = []
        self.pg.on('pageerror', lambda e: self.errors.append('pageerror: ' + str(e)))
        self.pg.on('console', lambda m: self.errors.append('console: ' + m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text else None)
        self.pg.clock.install(time=T0)
        self.pg.add_init_script(VIGILANT)
        self.pg.add_init_script('window.__elefantEstatic = true')     # l'Elefant no s'anima en aquestes proves (rellotge fals): les seves proves són a tests/elefant
        self.pg.goto(APP)
        self.pg.clock.pause_at(T0 + 2000)
        self.avanca(800)

    def avanca(self, ms):
        self.pg.clock.run_for(int(ms))

    def js(self, codi, arg=None):
        return self.pg.evaluate(codi) if arg is None else self.pg.evaluate(codi, arg)

    def tanca(self):
        self.nav.close()

    def obre_joc(self, joc, dos=False, nivell=None):
        """Obre un joc; si té nivells i se'n demana un, usa el mode manual i el tria."""
        self.js("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); mostrarPantalla('inici')")
        if nivell is not None:
            self.js("ajustes.dificultatMode = 'manual'")
        else:
            self.js("ajustes.dificultatMode = 'adaptatiu'; dadesActuals().nivells = {}")
        self.js(f"assegurarJoc('{joc}')")                                     # els jocs es carreguen sota demanda (xarxa real)
        self.pg.wait_for_function(f"!!JOCS['{joc}']", timeout=8000, polling=50)
        self.js(f"obrirJoc('{joc}', {'true' if dos else 'false'})")
        self.avanca(400)
        if nivell is not None and self.js("document.getElementById('modalDificultat').classList.contains('actiu')"):
            self.js(f"document.querySelectorAll('#dificultatGrid button')[{nivell}].click()")
            self.avanca(500)
        self.avanca(300)
        actiu = self.js("document.querySelector('.screen.active').id")
        if actiu != 'joc-' + joc:
            raise RuntimeError(f'el joc {joc} no s\'ha obert (pantalla {actiu})')

    def acabada(self):
        return bool(self.js("partidaAcabada"))

    def modal_fi(self):
        return bool(self.js("document.getElementById('modalFi').classList.contains('actiu')"))

    def text_brut(self):
        """Busca valors invàlids visibles a la pantalla activa."""
        t = self.js("document.querySelector('.screen.active').innerText + ' ' + (document.getElementById('modalFi').classList.contains('actiu') ? document.getElementById('modalFi').innerText : '')")
        return re.findall(r'\bNaN\b|\bundefined\b|\[object|\bnull\b|Infinity', t)

    def animacions_actives(self):
        """Llista (tipus, element) de les animacions/transicions en marxa."""
        return self.js("""() => document.getAnimations().filter(a => a.playState === 'running').map(a => {
          const t = a.effect && a.effect.target; const c = t ? String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className) : '';
          return { tipus: a instanceof CSSTransition ? 'transicio:' + a.transitionProperty : 'animacio:' + a.animationName, id: t ? (t.id || (t.closest && t.closest('[data-i]') ? t.closest('[data-i]').dataset.i : '') || '') : '', cls: c,
                   inici: a.startTime, infinita: a.effect.getComputedTiming().iterations === Infinity }; }) """)

    def neteja_vigilant(self):
        self.js("window.__vig.animacions.length = 0")

    def animacions_arrencades(self):
        return self.js("window.__vig.animacions.slice()")
