"""Prova de fum de la v1.8: carrega l'app, obre cada pantalla nova i desa captures. Ús: python tests/fumada18.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, nou_context, ARREL
out = ARREL / 'docs' / 'captures-1.8'; out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    nav, ctx = nou_context(p, 'mobil', 'clar', 'normal'); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(APP); pg.wait_for_timeout(600)
    for nom, js in [('inici', "mostrarPantalla('inici')"), ('meusJocs', "obrirMeusJocs()"), ('comVaig', "obrirComVaig()"), ('records', "mostrarPantalla('familia')"), ('ajuda', "obrirModal('modalAjuda')"), ('pin', "tancarModal('modalAjuda'); demanaPin('crear', null)")]:
        pg.evaluate(js); pg.wait_for_timeout(450); pg.screenshot(path=str(out / f'{nom}__mobil__clar.png'))
    print('errors:', errs[:5]); nav.close()
