"""Eina de depuració: llista els elements que fan desbordar horitzontalment una pantalla.
Ús: python tests/depura_ample.py menuJocs mobil gegant"""
import sys, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, nou_context

pant, mida, zoom = (sys.argv[1:4] + ['menuJocs', 'mobil', 'normal'][len(sys.argv) - 1:])[:3] if len(sys.argv) > 1 else ('menuJocs', 'mobil', 'gegant')
with sync_playwright() as p:
    nav, ctx = nou_context(p, mida, 'clar', zoom)
    pg = ctx.new_page(); pg.goto(APP); pg.wait_for_timeout(300)
    pg.evaluate(f"mostrarPantalla('{pant}')"); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => { const W = innerWidth; return [...document.querySelectorAll('.screen.active *')].filter(e => e.getBoundingClientRect().right > W + 1)
      .map(e => (e.tagName + '.' + (e.className.baseVal ?? e.className) + '#' + e.id).slice(0, 70) + ' ' + Math.round(e.getBoundingClientRect().right)).slice(0, 15); }""")
    print('\n'.join(r))
    nav.close()
