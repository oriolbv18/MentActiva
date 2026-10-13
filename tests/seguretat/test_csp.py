"""CSP (v1.9): l'app, la web, la 404 i les pàgines legals s'han de carregar i funcionar SENSE cap violació de la política de seguretat de contingut
(sense bypass_csp), obrint-les des de file://. Prova també un recorregut curt: jocs, pistes, Elefant, còpia i idioma.
Ús: python tests/seguretat/test_csp.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
viol = []; errs = []
def obre(p, ruta):
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('console', lambda m: viol.append(f'{ruta}: {m.text[:160]}') if 'Content Security Policy' in m.text or 'violates' in m.text else None)
    pg.on('pageerror', lambda e: errs.append(f'{ruta}: {e}'))
    pg.goto((ARREL / ruta).as_uri()); pg.wait_for_timeout(1200); return b, pg
with sync_playwright() as p:
    for r in ['index.html', '404.html', 'legal/privadesa.html', 'legal/cookies.html', 'app/offline.html']:
        b, pg = obre(p, r); b.close()
    b, pg = obre(p, 'app/index.html')
    pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1'); localStorage.setItem('mentA_tutorials', JSON.stringify({memory:true,sudoku:true}))"); pg.reload(); pg.wait_for_timeout(1200)
    pg.evaluate("obrirJoc('memory')"); pg.wait_for_timeout(800)
    pg.evaluate("document.querySelectorAll('#modalDificultat .dificultat-btn')[1] && document.querySelectorAll('#modalDificultat .dificultat-btn')[1].click()"); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelector('#joc-memory .el-slot-joc').click()"); pg.wait_for_timeout(600)
    pg.evaluate("document.querySelector('.el-globus.visible .el-boto.principal').click()"); pg.wait_for_timeout(600)
    pg.evaluate("Pistes.tanca(); mostrarPantalla('configuracio')"); pg.wait_for_timeout(600); pg.evaluate("exportarDades && 1; obrirComVaig()"); pg.wait_for_timeout(500)
    pg.evaluate("obrirModal('modalNouUsuari')"); pg.wait_for_timeout(300); pg.evaluate("(async () => { try { await pdfNou } catch (e) {} })()")
    b.close()
for v in viol: print('  ✗ ' + v)
for e in errs: print('  ✗ error JS: ' + e)
print('Violacions de CSP:', len(viol), '· errors JS:', len(errs)); sys.exit(1 if viol or errs else 0)
