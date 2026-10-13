"""Depuració: mostra què desborda en un joc. Ús: python tests/depura_joc.py domino mobil-petit extragran"""
import sys, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, nou_context
joc, mida, zoom = sys.argv[1:4]
with sync_playwright() as p:
    nav, ctx = nou_context(p, mida, 'clar', zoom)
    pg = ctx.new_page(); pg.goto(APP); pg.wait_for_timeout(300)
    pg.evaluate(f"obrirJoc('{joc}')"); pg.wait_for_timeout(500)
    if pg.locator('#modalDificultat.actiu').count(): pg.locator('#dificultatGrid button').nth(2).click(); pg.wait_for_timeout(600)
    print(pg.evaluate("""() => { const d = document.documentElement; scrollTo(0, 400);
      const fora = [...document.querySelectorAll('.screen.active *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5); }).map(e => (e.className.baseVal ?? e.className) + '#' + e.id + ' r=' + Math.round(e.getBoundingClientRect().right) + ' b=' + Math.round(e.getBoundingClientRect().bottom)).slice(0, 8);
      return JSON.stringify({ sh: d.scrollHeight, sw: d.scrollWidth, iw: innerWidth, ih: innerHeight, y: scrollY, fora }); }"""))
    pg.screenshot(path=str(pathlib.Path(__file__).parent.parent / 'docs' / 'captures' / 'depura.png'))
    nav.close()
