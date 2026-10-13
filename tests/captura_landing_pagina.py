"""Captura la pàgina d'aterratge (index.html de l'arrel) en ordinador i mòbil, clar i fosc, a docs/captures/landing-*.png"""
import pathlib
from playwright.sync_api import sync_playwright
R = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    nav = p.chromium.launch()
    for nom, (w, h), esq in [('ordinador-clar', (1440, 900), 'light'), ('mobil-clar', (390, 844), 'light'), ('mobil-fosc', (390, 844), 'dark')]:
        ctx = nav.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, color_scheme=esq); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto((R / 'index.html').as_uri()); pg.wait_for_timeout(700)
        sc = pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        pg.screenshot(path=str(R / 'docs' / 'captures' / f'landing-{nom}.png'), full_page=True)
        print(nom, 'scroll horitzontal' if sc[0] > sc[1] else 'ok', errs[:2]); ctx.close()
    nav.close()
