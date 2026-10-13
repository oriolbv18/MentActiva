"""Auditoria de botons de la web (index.html i legal/*.html) a 5 resolucions × clar/fosc, amb el mateix auditor que l'app.
Ús: python tests/layout/auditoria-web.py"""
import importlib.util, pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
spec = importlib.util.spec_from_file_location('aud', pathlib.Path(__file__).parent / 'auditoria-botons.py'); aud = importlib.util.module_from_spec(spec); spec.loader.exec_module(aud)
SIZES = {'mobil-petit': (360, 640), 'mobil': (390, 844), 'apaisat': (740, 360), 'tauleta': (820, 1180), 'ordinador': (1440, 900)}
PAGINES = ['index.html', 'legal/privadesa.html', 'legal/avis-legal.html', 'legal/condicions.html', 'legal/cookies.html']

def main():
    inc = {}; errors = []
    with sync_playwright() as p:
        for nom, (w, h) in SIZES.items():
            for fosc in (False, True):
                b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, color_scheme='dark' if fosc else 'light'); pg = ctx.new_page()
                pg.on('pageerror', lambda e: errors.append(str(e)))
                for pag in PAGINES:
                    pg.goto((ARREL / pag).as_uri()); pg.wait_for_timeout(500)
                    pg.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'))")
                    # el contingut de la web fa scroll: auditem per trams de pantalla (els controls només compten si són a la finestra)
                    alt = pg.evaluate("document.documentElement.scrollHeight"); y = 0
                    while y < alt:
                        pg.evaluate(f"scrollTo(0, {y})"); pg.wait_for_timeout(120)
                        for i in pg.evaluate(aud.AUDITOR, {'elements': [], 'tactil': ['l-nav']}):
                            r = i['rect']
                            if r[1] < -5 or r[1] > h: continue
                            inc.setdefault((pag, i['check'], i['el'], i['text']), []).append(f'{nom}/{"fosc" if fosc else "clar"}')
                        y += max(h - 100, 200)
                    if pg.evaluate("document.documentElement.scrollWidth") > w + 1: inc.setdefault((pag, 'scroll-horitzontal', 'html', ''), []).append(f'{nom}/{"fosc" if fosc else "clar"}')
                b.close()
    for (pag, c, el, tx), v in list(inc.items())[:60]: print(f'  ✗ {pag} [{c}] {el[-60:]} «{tx}» · {len(set(v))} combinacions ({v[0]})')
    print(f'\nIncidències úniques a la web: {len(inc)} · Errors JS: {len(errors)}')
    return 1 if inc or errors else 0

if __name__ == '__main__': sys.exit(main())
