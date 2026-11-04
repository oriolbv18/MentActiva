"""Proves al mòbil (v1.10.1): cada joc sencer a 360x740 amb lletra normal i gegant, comprovant a cada toc que el botó és visible,
dins de la pantalla i no el tapa res (si no, una persona no el podria tocar); tutorials amb tocs reals; desbordaments i contingut.
Ús: python tests/v110/test_mobil.py [--rapid]"""
import pathlib, random, re, sys
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ARREL / 'tests')); sys.path.insert(0, str(ARREL / 'tests' / 'jocs'))
from playwright.sync_api import sync_playwright
from comu import Partida
from bots import BOTS
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

# Cada clic fet per un bot passa per aquí: comprova que una persona el podria fer de veritat
VIGIA = r"""(() => {
  if (window.__tocs) return; window.__tocs = [];
  const nom = e => (e.id ? '#' + e.id : '') + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName;
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('button, [role=button], a, input'); if (!b || b.disabled || ev.isTrusted || b.closest('.acabat')) return;
    b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    let mal = null;
    if (r.width < 1 || r.height < 1) mal = 'invisible';
    else if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) mal = 'fora de pantalla';
    else { const t = document.elementFromPoint(x, y); if (!t || !(b === t || b.contains(t) || t.contains(b) && t === b)) mal = 'tapat per ' + (t ? nom(t) : '?'); }
    if (!mal && (r.width < 30 || r.height < 30)) mal = 'massa petit ' + Math.round(r.width) + 'x' + Math.round(r.height);
    if (mal) window.__tocs.push(document.body.dataset.pantalla + ' · ' + nom(b) + ' · ' + mal);
  }, true);
})()"""


def tutorials(p, zoom, problemes):
    par = Partida(p, 'mobil', 'clar', zoom)
    par.pg.set_viewport_size({'width': 360, 'height': 740})
    pg = par.pg
    for id in pg.evaluate("CATALEG_JOCS.map(j => j.id)"):
        pg.evaluate("localStorage.removeItem('mentA_tutorials'); document.getElementById('tutorialOverlay').classList.remove('actiu')")
        pg.evaluate("i => assegurarJoc(i)", id); par.avanca(100); pg.wait_for_function("i => !!JOCS[i]", arg=id, timeout=8000)
        pg.evaluate("i => { aturaTimers(); mostrarTutorial(i, null, false); }", id); par.avanca(100)
        for pas in range(8):
            if pg.evaluate("!document.querySelector('#tutorialCos .tut-punts')"): break
            r = pg.evaluate("""() => { const c = document.querySelector('.tutorial-card'); const fora = document.documentElement.scrollWidth > innerWidth + 1 || c.scrollWidth > c.clientWidth + 1;
              const bs = [...document.querySelectorAll('.tut-fitxa')].map(b => { b.scrollIntoView({ block: 'nearest' }); const q = b.getBoundingClientRect(); return q.width >= 40 && q.height >= 40 && q.left >= 0 && q.right <= innerWidth && document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2) === b; });
              return { fora, bs, text: document.getElementById('tutText').textContent }; }""")
            if r['fora']: problemes.append(f"tutorial {id} pas {pas} ({zoom}): desbordament lateral")
            if not all(r['bs']): problemes.append(f"tutorial {id} pas {pas} ({zoom}): alguna fitxa no es pot tocar {r['bs']}")
            bona = pg.evaluate("([i, k]) => TUTORIALS[i][k].bona", [id, pas])
            if bona is not None:
                pg.click(f'.tut-fitxa[data-k="{bona}"]', timeout=3000); par.avanca(50)
            pg.click('#tutSeguent', timeout=3000); par.avanca(100)
        if not pg.evaluate("!!document.querySelector('.tut-final')"): problemes.append(f'tutorial {id} ({zoom}): no arriba al final')
        pg.evaluate("document.getElementById('tutorialOverlay').scrollTop = 0")
        pg.click('#tutorialOk', timeout=3000); par.avanca(500)
    if par.errors: problemes.append(f'tutorials ({zoom}): errors JS {par.errors[:3]}')
    par.tanca()


def partides(p, zoom, jocs, problemes, resultats):
    for joc in jocs:
        fn, _, nivells = BOTS[joc]
        for nivell in ([0, 2] if nivells else [None]):
            dos = joc == 'bingo'
            par = Partida(p, 'mobil', 'clar', zoom)
            try:
                par.pg.set_viewport_size({'width': 360, 'height': 740})
                par.js("localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))))")
                par.js(VIGIA)
                par.obre_joc(joc, dos, nivell)
                ample = par.js("document.documentElement.scrollWidth")
                if ample > 361: problemes.append(f'{joc} ({zoom}): la pàgina fa {ample}px d\'ample a 360')
                fn(par, random.Random(7), dos, nivell) if nivells else fn(par, random.Random(7), dos)
                par.avanca(2500)
                for t in sorted(set(par.js("window.__tocs"))): problemes.append(f'{joc} n{nivell} ({zoom}): {t}')
                brut = par.text_brut()
                if brut: problemes.append(f'{joc} n{nivell} ({zoom}): text invàlid {brut}')
                if par.errors: problemes.append(f'{joc} n{nivell} ({zoom}): errors {par.errors[:2]}')
                s = par.js("dadesActuals().historial.slice(-1)[0] || null")
                if s and zoom == 'normal': resultats.append(f"{joc:10} n{nivell}: {s['encerts']} encerts, {s['errors']} errors, {s['pct']} %, {par.js('p => calcularEstrelles(p, false)', s['pct'])} estrelles")
                elif not dos and not s: problemes.append(f'{joc} n{nivell} ({zoom}): la partida no ha quedat registrada')
            except Exception as e:
                problemes.append(f'{joc} n{nivell} ({zoom}): excepció {str(e)[:200]}')
            par.tanca()


def contingut(p, problemes):
    par = Partida(p); pg = par.pg
    pg.evaluate("assegurarJoc('paraules').then(() => assegurarJoc('sopa'))"); pg.wait_for_function("typeof BARALLA_PARAULES !== 'undefined'", timeout=8000)
    r = pg.evaluate("""() => { const n = s => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); return BARALLA_PARAULES.filter(x => n(x.pista).split(/[^a-zç]+/).includes(n(x.paraula))).map(x => x.paraula + ': ' + x.pista); }""")
    for x in r: problemes.append(f'pista que revela la paraula · {x}')
    par.tanca()


def main():
    rapid = '--rapid' in sys.argv; problemes, resultats = [], []
    jocs = list(BOTS)
    with sync_playwright() as p:
        contingut(p, problemes)
        for z in ('normal', 'gegant'):
            print('tutorials', z, flush=True); tutorials(p, z, problemes)
        print('partides normal', flush=True); partides(p, 'normal', jocs, problemes, resultats)
        if not rapid: print('partides gegant', flush=True); partides(p, 'gegant', jocs, problemes, resultats)
    print('\n'.join(resultats)); print(f'\nProblemes: {len(problemes)}')
    for x in sorted(set(problemes)): print('  ·', x)
    return 1 if problemes else 0


if __name__ == '__main__': sys.exit(main())
