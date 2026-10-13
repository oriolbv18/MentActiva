"""Captures de la 1.8 (Persona, Espai del cuidador, Residència, onboarding) a docs/captures-1.8/.
Ús: python tests/captures18.py [--sizes mobil,ordinador] [--temes clar,fosc]"""
import argparse, os, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = os.environ.get('MENTA_APP') or str(ARREL / 'app' / 'index.html')
APP = APP if APP.startswith('file:') else pathlib.Path(APP).as_uri()
MIDES = {'mobil': (390, 844), 'tauleta': (820, 1180), 'ordinador': (1280, 900)}
PEST = ['resum', 'evolucio', 'jocs', 'salut', 'notes', 'pla', 'informe', 'ajustos']

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sizes', default='mobil,ordinador'); ap.add_argument('--temes', default='clar,fosc'); ap.add_argument('--out', default=str(ARREL / 'docs' / 'captures-1.8')); a = ap.parse_args()
    out = pathlib.Path(a.out); errors = []
    with sync_playwright() as p:
        for mida in a.sizes.split(','):
            for tema in a.temes.split(','):
                w, h = MIDES[mida]; b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, color_scheme='dark' if tema == 'fosc' else 'light'); pg = ctx.new_page()
                pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
                suf = f'{mida}__{tema}'; (out / 'persona').mkdir(parents=True, exist_ok=True); (out / 'cuidador').mkdir(exist_ok=True); (out / 'residencia').mkdir(exist_ok=True); (out / 'onboarding').mkdir(exist_ok=True)
                def shot(carpeta, nom, full=False): pg.wait_for_timeout(350); pg.evaluate('scrollTo(0,0)'); pg.screenshot(path=str(out / carpeta / f'{nom}__{suf}.png'), full_page=full)
                # --- onboarding (rol «Una persona gran»)
                pg.goto(APP); pg.wait_for_timeout(700)
                if tema == 'fosc': pg.evaluate("ajustes.tema = 'fosc'; guardarAjustes(); aplicarTema()")
                import onboarding.test_onboarding as TO
                TO.recorre(pg, 'cuidat', 'Rosa', '2468', captura='cuidat', suf='__' + suf, zoom='normal')
                pg.wait_for_timeout(1300)
                shot('persona', 'guia-1')
                for _ in range(4):
                    if pg.evaluate("!document.getElementById('guiaCapa').hidden"): pg.click('#guiaSeguent'); pg.wait_for_timeout(250)
                shot('persona', 'inici')
                pg.evaluate("obrirMeusJocs()"); shot('persona', 'els-meus-jocs', True)
                pg.evaluate("anarAInici(); iniciarSessio()"); pg.wait_for_timeout(900)
                for k in range(3):
                    joc = pg.evaluate("sessio.jocs[sessio.idx]"); pg.wait_for_function(f"!!JOCS['{joc}']", timeout=8000)
                    if k == 0: pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') || 1"); shot('persona', 'tutorial-o-joc')
                    pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') && tancarTutorial()"); pg.wait_for_timeout(500)
                    if k == 0: shot('persona', 'joc-a-sessio')
                    pg.evaluate(f"finalitzarPartida('{joc}', 8, 2, '')"); pg.wait_for_timeout(1700)
                    if k == 0: shot('persona', 'descans')
                    if k < 2: pg.click('#btnContinuarSessio'); pg.wait_for_timeout(600)
                shot('persona', 'sessio-final'); pg.evaluate("sessioAcabar()"); pg.wait_for_timeout(300)
                pg.evaluate("obrirComVaig()"); shot('persona', 'com-vaig', True)
                pg.evaluate("anarAInici()"); pg.evaluate("obrirModal('modalAjuda')"); shot('persona', 'ajuda'); pg.evaluate("tancarModal('modalAjuda')")
                pg.evaluate("obrirJugarAmbAlgu()"); shot('persona', 'jugar-amb-algu', True)
                pg.evaluate("parellaTriaJoc('calcul')"); pg.wait_for_timeout(500); shot('persona', 'duel-relleu')
                pg.evaluate("anarAInici(); obrirJoc('bingo')"); pg.wait_for_timeout(600); pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') && tancarTutorial()"); pg.wait_for_timeout(600); shot('persona', 'bingo-opcions')
                pg.evaluate("bingoOpcio.cartrons('2'); bingoOpcio.rivals('2'); bingoOpcio.velocitat('rapida'); document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(9000); shot('persona', 'bingo-joc')
                pg.evaluate("anarAInici()")
                # --- PIN i espai del cuidador
                pg.evaluate("obrirEspaiCuidador()"); shot('cuidador', 'pin')
                for d in '2468': pg.click(f'#pinTecles [data-pin="{d}"]'); pg.wait_for_timeout(60)
                pg.wait_for_timeout(700); shot('cuidador', 'resum-sense-dades', True)
                pg.evaluate("tancaEspaiCuidador()")
                # --- demo amb 8 residents
                pg.evaluate("carregarDemo()"); pg.wait_for_timeout(600)
                pg.evaluate("mostrarPantalla('selectorResident')"); shot('residencia', 'selector', True)
                pg.evaluate("entraCuidador()"); pg.wait_for_timeout(500)
                pg.evaluate("cuTria('residencia')"); shot('residencia', 'panell-planta', True)
                for i in (2, 7):
                    pg.evaluate(f"cuidadorTriaPersona('u_demo_{i}')")
                    for t in PEST:
                        pg.evaluate(f"cuTria('{t}')"); shot('cuidador', f'r{i}-{t}', True)
                pg.evaluate("tancaEspaiCuidador()"); pg.evaluate("residentTria('u_demo_1')"); pg.wait_for_timeout(500); shot('persona', 'inici-resident')
                b.close()
    print('Fet. Errors:', len(errors)); [print(' -', e) for e in errors[:20]]
    return 1 if errors else 0

if __name__ == '__main__': sys.exit(main())
