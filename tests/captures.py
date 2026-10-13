"""Captures automàtiques de totes les pantalles de MentA.

Ús:  python tests/captures.py [--out docs/captures] [--sizes mobil,ordinador] [--temes clar,fosc]
Obre l'app amb file:// i amb la xarxa bloquejada (només es permeten fitxers locals).
"""
import argparse, pathlib, sys, json
from playwright.sync_api import sync_playwright

ARREL = pathlib.Path(__file__).resolve().parent.parent
import os
APP = pathlib.Path(os.environ.get('MENTA_APP') or (ARREL / 'app' / 'index.html')).resolve().as_uri()   # MENTA_APP permet provar una altra còpia de l'app
MIDES = {
    'mobil-petit': (360, 640), 'mobil': (390, 844), 'mobil-apaisat': (740, 360),
    'tauleta': (820, 1180), 'ordinador': (1440, 900),
}
PANTALLES = ['inici', 'meusJocs', 'comVaig', 'sessioDescans', 'sessioFi', 'selectorResident', 'cuidador', 'menuJocs', 'menu2vs2', 'testCognitiu', 'configuracio', 'familia', 'resumFamilia',
             'album', 'missatgeria', 'calFamiliar', 'privadesa', 'condicions', 'sobre', 'feedback']
PESTANYES = []
JOCS = ['tertulia', 'refranys', 'paraules', 'memory', 'sequencia', 'domino', 'dames', 'sopa',
        'nback', 'stroop', 'span', 'fluidesa', 'calcul', 'seqlog', 'quefalta', 'sudoku', 'bingo']

INIT = """
try {
  localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1');
  const t = {}; %s.forEach(j => t[j] = true); localStorage.setItem('mentA_tutorials', JSON.stringify(t));
  const a = JSON.parse(localStorage.getItem('mentA_ajustes') || '{}');
  a.fosc = %s; a.tema = '%s'; a.zoom = '%s'; a.altContrast = %s; a.efectesSo = false; a.elefant = true;
  localStorage.setItem('mentA_ajustes', JSON.stringify(a));
} catch (e) {}
"""


def nou_context(p, mida, tema, zoom, dades_js=''):
    nav = p.chromium.launch()
    w, h = MIDES[mida]
    ctx = nav.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, color_scheme='dark' if tema == 'fosc' else 'light', offline=True)
    # Xarxa bloquejada: només fitxers locals
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:', 'blob:')) else r.abort())
    idioma_js = "try { const a = JSON.parse(localStorage.getItem('mentA_ajustes') || '{}'); a.idioma = '%s'; localStorage.setItem('mentA_ajustes', JSON.stringify(a)); } catch (e) {}" % __import__('os').environ.get('MENTA_IDIOMA', 'ca')
    ctx.add_init_script(INIT % (json.dumps(JOCS), 'true' if tema == 'fosc' else 'false', tema, zoom, 'true' if tema == 'contrast' else 'false') + idioma_js + dades_js)
    return nav, ctx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ARREL / 'docs' / 'captures'))
    ap.add_argument('--sizes', default='mobil,ordinador')
    ap.add_argument('--temes', default='clar,fosc')
    ap.add_argument('--zoom', default='normal')
    ap.add_argument('--demo', action='store_true', help='carrega dades de demostració')
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        for mida in a.sizes.split(','):
            for tema in a.temes.split(','):
                nav, ctx = nou_context(p, mida, tema, a.zoom)
                pg = ctx.new_page()
                pg.on('pageerror', lambda e: errors.append(str(e)))
                pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
                pg.goto(APP); pg.wait_for_timeout(400)
                if a.demo:
                    pg.evaluate("typeof carregarDemo==='function' && carregarDemo()"); pg.wait_for_timeout(300)
                for s in PANTALLES + ['joc-' + j for j in JOCS]:
                    js = f"mostrarPantalla('{s}')" if s in PANTALLES else f"obrirJoc('{s[4:]}')"
                    try:
                        pg.evaluate(js); pg.wait_for_timeout(500)
                        # si ha sortit el selector de dificultat, tria el mig
                        if pg.locator('#modalDificultat.actiu').count():
                            pg.locator('#dificultatGrid button').nth(1).click(); pg.wait_for_timeout(700)
                        pg.screenshot(path=str(out / f'{s}__{mida}__{tema}__{a.zoom}.png'), full_page=s in PANTALLES)
                    except Exception as e:
                        errors.append(f'{s}: {e}')
                for t in PESTANYES:
                    try:
                        pg.evaluate(f"mostrarPantalla('estadistiques');triaPestanyaProgres('{t}')"); pg.wait_for_timeout(450)
                        pg.screenshot(path=str(out / f'estadistiques-{t}__{mida}__{tema}__{a.zoom}.png'), full_page=True)
                    except Exception as e:
                        errors.append(f'pestanya {t}: {e}')
                nav.close()
    print('Fet. Errors:', len(errors))
    for e in errors[:40]:
        print(' -', e)
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
