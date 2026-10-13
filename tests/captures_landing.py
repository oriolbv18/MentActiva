"""Genera les captures per a la pàgina d'aterratge (app/img/captura-*.webp) amb dades d'exemple.
Ús: python tests/captures_landing.py"""
import pathlib, sys, io
from playwright.sync_api import sync_playwright
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, ARREL

SORTIDA = ARREL / 'app' / 'img'
ESCENES = [
    ('inici', "mostrarPantalla('inici')"),
    ('joc', "obrirJoc('memory')"),
    ('progres', "mostrarPantalla('estadistiques');triaPestanyaProgres('resum')"),
    ('dominis', "mostrarPantalla('estadistiques');triaPestanyaProgres('dominis')"),
]
with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}, device_scale_factor=2, color_scheme='light', offline=True)
    ctx.add_init_script("try{localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({memory:true}));localStorage.setItem('mentA_ajustes',JSON.stringify({efectesSo:false,dificultatMode:'manual'}));}catch(e){}")
    pg = ctx.new_page(); pg.goto(APP); pg.wait_for_timeout(500)
    pg.evaluate("""() => { carregarDemo(); const u = usuaris.find(x => x.demo); u.nom = 'Maria'; u.avatar = 'inicial'; u.color = '#2e8b57'; delete u.demo; actualitzarHeaderUsuari(); renderBanerDemo(); refrescarTot(); }""")
    for nom, js in ESCENES:
        pg.evaluate(js); pg.wait_for_timeout(700)
        if pg.locator('#modalDificultat.actiu').count():
            pg.locator('#dificultatGrid button').nth(1).click(); pg.wait_for_timeout(800)
        if nom == 'joc':
            pg.evaluate("document.querySelectorAll('#memory-grid .carta').forEach((c,i)=>{ if(i<2) c.click(); })"); pg.wait_for_timeout(500)
        pg.evaluate("document.querySelector('.bottom-nav') && (document.querySelector('.bottom-nav').style.display='none')") if nom == 'joc' else None
        png = pg.screenshot()
        Image.open(io.BytesIO(png)).convert('RGB').save(SORTIDA / f'captura-{nom}.webp', 'WEBP', quality=82, method=6)
        print('ok', nom)
    nav.close()
