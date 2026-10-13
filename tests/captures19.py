"""Captures de la v1.9 amb l'Elefant a cada pantalla i rol → docs/captures-1.9/
Ús: python tests/captures19.py [--mides mobil,tauleta,ordinador] [--nomes inici,onboarding,...]"""
import argparse, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = (ARREL / 'app' / 'index.html').as_uri()
OUT = ARREL / 'docs' / 'captures-1.9'
MIDES = {'mobil-petit': (360, 640), 'mobil': (390, 844), 'tauleta': (820, 1180), 'ordinador': (1440, 900)}
PREPARA = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_guia_vista','1');localStorage.setItem('mentA_tutorials',JSON.stringify({%s}))" % ','.join(f'{j}:true' for j in ['memory', 'sudoku', 'dames', 'domino', 'bingo', 'sopa', 'tertulia', 'sequencia'])

def nou(p, w, h, fosc=False):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, color_scheme='dark' if fosc else 'light'); pg = ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(APP); pg.evaluate(PREPARA)
    if fosc: pg.evaluate("ajustes.tema = 'fosc'; guardarAjustes(); aplicarTema()")
    pg.reload(); pg.wait_for_timeout(1500); return b, pg, errs

def obre(pg, joc, nivell=1):
    pg.evaluate(f"obrirJoc('{joc}')"); pg.wait_for_timeout(900)
    pg.evaluate(f"document.querySelectorAll('#modalDificultat .dificultat-btn')[{nivell}] && document.querySelectorAll('#modalDificultat .dificultat-btn')[{nivell}].click()"); pg.wait_for_timeout(1200)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--mides', default='mobil,tauleta,ordinador'); ap.add_argument('--nomes', default=''); a = ap.parse_args()
    nomes = set(x for x in a.nomes.split(',') if x)
    for k in (nomes or {'x'}): pass
    tot = lambda n: not nomes or n in nomes
    (OUT / 'persona').mkdir(parents=True, exist_ok=True); (OUT / 'onboarding').mkdir(exist_ok=True); (OUT / 'pistes').mkdir(exist_ok=True); (OUT / 'residencia').mkdir(exist_ok=True); (OUT / 'config').mkdir(exist_ok=True)
    with sync_playwright() as p:
        for mida in a.mides.split(','):
            w, h = MIDES[mida]
            for fosc in (False, True):
                t = 'fosc' if fosc else 'clar'
                b, pg, errs = nou(p, w, h, fosc)
                if tot('inici'):
                    pg.screenshot(path=str(OUT / 'persona' / f'inici-{mida}-{t}.png'))
                    pg.click('#elefantFlotant .el-figura'); pg.wait_for_timeout(600); pg.screenshot(path=str(OUT / 'persona' / f'inici-accions-{mida}-{t}.png'))
                if tot('jocs'):
                    for joc, niv in (('memory', 1), ('sudoku', 0), ('dames', 0), ('domino', 0), ('sopa', 0), ('bingo', 0)):
                        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); mostrarPantalla('inici')"); pg.wait_for_timeout(300)
                        obre(pg, joc, niv)
                        if joc == 'bingo': pg.evaluate("document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(9000)
                        if joc == 'memory': pg.evaluate("document.querySelectorAll('#memory-grid .carta')[0].click()"); pg.wait_for_timeout(300); pg.evaluate("document.querySelectorAll('#memory-grid .carta')[1].click()"); pg.wait_for_timeout(1300)
                        pg.screenshot(path=str(OUT / 'pistes' / f'{joc}-0-{mida}-{t}.png'))
                        if joc == 'memory':      # l'Elefant surt pel costat dret quan veu que t'encalles
                            pg.evaluate("for (let i = 0; i < 4; i++) soError()"); pg.wait_for_timeout(1200); pg.screenshot(path=str(OUT / 'pistes' / f'oferta-{mida}-{t}.png')); pg.evaluate("Pistes.tanca()"); pg.wait_for_timeout(500)
                        pg.evaluate(f"document.querySelector('#joc-{joc} .el-slot-joc').click()"); pg.wait_for_timeout(700)
                        for n in (1, 2, 3):
                            pg.screenshot(path=str(OUT / 'pistes' / f'{joc}-nivell{n}-{mida}-{t}.png'))
                            clicat = pg.evaluate("(() => { const b = [...document.querySelectorAll('.el-globus.visible .el-boto.principal')].find(x => /assenyala|mostra/i.test(x.textContent)); if (b) { b.click(); return true; } return false; })()")
                            pg.wait_for_timeout(1400)
                            if not clicat: break
                        pg.evaluate("Pistes.tanca()")
                if tot('config'):
                    pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(700)
                    pg.evaluate("document.getElementById('blocElefant').scrollIntoView()"); pg.wait_for_timeout(400); pg.screenshot(path=str(OUT / 'config' / f'config-elefant-{mida}-{t}.png'))
                if tot('residencia'):
                    pg.evaluate("carregarDemo()"); pg.wait_for_timeout(900); pg.screenshot(path=str(OUT / 'residencia' / f'selector-{mida}-{t}.png'))
                    pg.evaluate("residentTria(usuaris[0].id)"); pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'residencia' / f'benvinguda-{mida}-{t}.png'))
                if tot('parella'):
                    pg.evaluate("obrirJugarAmbAlgu()"); pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'persona' / f'parella-{mida}-{t}.png'))
                if tot('benestar'):
                    pg.evaluate("mostrarPantalla('inici'); iniciarRespiracio()"); pg.wait_for_timeout(2500); pg.screenshot(path=str(OUT / 'persona' / f'respiracio-inhala-{mida}-{t}.png'))
                    pg.wait_for_timeout(9500); pg.screenshot(path=str(OUT / 'persona' / f'respiracio-aguanta-{mida}-{t}.png'))
                if errs: print(mida, t, 'ERRORS', errs[:3])
                b.close()
            if tot('onboarding'):
                b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.goto(APP); pg.wait_for_timeout(1800)
                for i in range(6):
                    pg.screenshot(path=str(OUT / 'onboarding' / f'pas{i + 1}-{mida}.png'))
                    if i == 2: pg.fill('#onboardingNom', 'Maria'); pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'onboarding' / f'pas3-nom-{mida}.png'))
                    if i == 4:
                        for _ in range(3): pg.evaluate("document.querySelector('.onb-cercle.brilla') && document.querySelector('.onb-cercle.brilla').click()"); pg.wait_for_timeout(900)
                        pg.screenshot(path=str(OUT / 'onboarding' / f'pas5-fet-{mida}.png'))
                    pg.click('#onboardingNext'); pg.wait_for_timeout(1300)
                if errs: print(mida, 'onboarding ERRORS', errs[:3])
                b.close()
    print('captures a', OUT)

if __name__ == '__main__': main()
