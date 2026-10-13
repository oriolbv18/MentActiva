"""Captura estats especials (benvinguda, final de partida, pausa, dificultat manual, confirmació) a docs/captures/estats-*.png"""
import pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, nou_context, ARREL
sortida = ARREL / 'docs' / 'captures'
with sync_playwright() as p:
    for tema in ('clar', 'fosc'):
        nav, ctx = nou_context(p, 'mobil', tema, 'normal'); pg = ctx.new_page(); pg.goto(APP); pg.wait_for_timeout(400)
        pg.evaluate("localStorage.removeItem('mentA_onboarding_vist'); iniciarOnboarding(true)"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(sortida / f'estats-benvinguda-1__mobil__{tema}.png'))
        pg.evaluate("onboardingSlide=3; actualitzarOnboardingSlide()"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(sortida / f'estats-benvinguda-demo__mobil__{tema}.png'))
        pg.evaluate("finalitzarOnboarding(true)")
        pg.evaluate("obrirJoc('calcul')"); pg.wait_for_timeout(700)
        for i in range(10):
            pg.locator('#calcul-opcions .opcio').first.click(); pg.locator('#calcul-seguent').click(); pg.wait_for_timeout(80)
        pg.wait_for_timeout(1800); pg.screenshot(path=str(sortida / f'estats-final-partida__mobil__{tema}.png'))
        pg.evaluate("tancarModal('modalFi'); mostrarPantalla('inici'); obrirJoc('memory')"); pg.wait_for_timeout(800)
        pg.evaluate("pausarJoc()"); pg.wait_for_timeout(300); pg.screenshot(path=str(sortida / f'estats-pausa__mobil__{tema}.png'))
        pg.evaluate("reprendreJoc(); mostrarPantalla('inici'); ajustes.dificultatMode='manual'; obrirJoc('nback')"); pg.wait_for_timeout(900)
        pg.screenshot(path=str(sortida / f'estats-dificultat__mobil__{tema}.png'))
        pg.evaluate("tancarModal('modalDificultat'); mostrarPantalla('inici'); obrirModalUsuaris()"); pg.wait_for_timeout(400)
        pg.screenshot(path=str(sortida / f'estats-usuaris__mobil__{tema}.png'))
        nav.close()
print('fet')
