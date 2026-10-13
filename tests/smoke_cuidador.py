"""Fum de l'Espai del Cuidador i de Residència amb les dades de demostració (8 residents).
Recorre totes les pestanyes, comprova 0 errors de JS i fa captures a docs/captures-1.8/.
Ús: python tests/smoke_cuidador.py"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = os.environ.get('MENTA_APP') or (ARREL / 'app' / 'index.html').as_uri()
if not APP.startswith('file:') and os.path.exists(APP): APP = pathlib.Path(APP).as_uri()
CAP = ARREL / 'docs' / 'captures-1.8'; CAP.mkdir(parents=True, exist_ok=True)
PESTANYES = ['resum', 'evolucio', 'jocs', 'salut', 'notes', 'pla', 'informe']

def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': 1280, 'height': 900}); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e))); pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' else None)
        pg.goto(APP); pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1')"); pg.reload(); pg.wait_for_timeout(600)
        pg.evaluate("carregarDemo()"); pg.wait_for_timeout(600)
        print('pantalla:', pg.evaluate("idPantallaActiva()"), '| usuaris:', pg.evaluate("usuaris.length"))
        pg.evaluate("mostrarPantalla('selectorResident')"); pg.wait_for_timeout(400); pg.screenshot(path=str(CAP / 'residencia-selector.png'))
        pg.evaluate("entraCuidador()"); pg.wait_for_timeout(500); print('cuidador:', pg.evaluate("idPantallaActiva()")); pg.screenshot(path=str(CAP / 'cuidador-planta.png'), full_page=True)
        for i in range(8):
            pg.evaluate(f"cuidadorTriaPersona('u_demo_{i}'); pestanyaCu='resum'; renderCuidador()"); pg.wait_for_timeout(150)
            for t in PESTANYES:
                pg.evaluate(f"cuTria('{t}')"); pg.wait_for_timeout(120)
                txt = pg.evaluate("document.getElementById('cuidador').innerText")
                if 'undefined' in txt or 'NaN' in txt or '[object' in txt: errors.append(f'resident {i} pestanya {t}: text sospitós (undefined/NaN)')
                if i in (2, 6) or t == 'resum' and i == 0: pg.screenshot(path=str(CAP / f'cuidador-r{i}-{t}.png'), full_page=True)
            sem = pg.evaluate(f"calculaSemafor(usuaris[{i}].dades)"); print(i, usuaris_nom(pg, i), '→', {k: (v if not isinstance(v, (dict, list)) else '…') for k, v in sem.items()} if isinstance(sem, dict) else sem)
        pg.evaluate("alternaQuiosc && 0"); b.close()
    print('\nErrors:', len(errors)); [print('  ', e) for e in errors[:15]]
    return 1 if errors else 0

def usuaris_nom(pg, i): return pg.evaluate(f"usuaris[{i}].nom")

if __name__ == '__main__': sys.exit(main())
