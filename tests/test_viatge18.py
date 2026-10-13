"""Recorregut complet de la 1.8 (de zero): 3 rols → sessió guiada → Com vaig → Cuidador amb PIN → informe PDF → exportacions
→ mode Residència → canvi de resident. Mesura també els tocs fins a un joc. 0 errors de JS exigits.
Ús: python tests/test_viatge18.py"""
import os, sys, pathlib, json
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = os.environ.get('MENTA_APP') or str(ARREL / 'app' / 'index.html')
APP = APP if APP.startswith('file:') else pathlib.Path(APP).as_uri()
errors, fallades = [], []
def comprova(cond, msg):
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: fallades.append(msg)

def nou(p, w=390, h=844):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, accept_downloads=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e))); pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto(APP); pg.wait_for_timeout(700); return b, pg

def onboarding(pg, rol, nom, pin):
    """Recorre l'onboarding nou amb clics reals (tests/onboarding)."""
    sys.path.insert(0, str(ARREL / 'tests' / 'onboarding'))
    import test_onboarding as TO
    passos = TO.recorre(pg, rol, nom or 'Maria', pin or '2468')
    comprova(not pg.evaluate("document.getElementById('onboardingOverlay').classList.contains('actiu')"), f'onboarding «{rol}» acabat ({len(passos)} passos)')

def tecleja_pin(pg, pin):
    for d in pin: pg.click(f'#pinTecles [data-pin="{d}"]'); pg.wait_for_timeout(60)
    pg.wait_for_timeout(700)

def tanca_guia(pg):
    pg.wait_for_timeout(1300)
    if not pg.evaluate("document.getElementById('guiaCapa').hidden"):
        passos = 0
        while not pg.evaluate("document.getElementById('guiaCapa').hidden") and passos < 6: pg.click('#guiaSeguent'); pg.wait_for_timeout(250); passos += 1
        comprova(passos in (2, 3), f'la guia de primer ús té 3 passos ({passos} tocs)')

def sessio_guiada(pg):
    pg.click('#btnJugar'); pg.wait_for_timeout(900)
    comprova(pg.evaluate("sessio && sessio.jocs.length") == 3, 'JUGAR inicia una sessió de 3 jocs')
    for k in range(3):
        joc = pg.evaluate("sessio.jocs[sessio.idx]"); pg.wait_for_function(f"!!JOCS['{joc}']", timeout=8000)
        pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') && tancarTutorial()"); pg.wait_for_timeout(300)
        pg.evaluate(f"finalitzarPartida('{joc}', 8, 2, '')"); pg.wait_for_timeout(1500)
        pant = pg.evaluate("idPantallaActiva()")
        if k < 2:
            comprova(pant == 'sessioDescans', f'descans després del joc {k + 1}')
            pg.click('#btnContinuarSessio'); pg.wait_for_timeout(700)
        else: comprova(pant == 'sessioFi', 'pantalla final de la sessió')
    pg.evaluate("sessioAcabar()"); pg.wait_for_timeout(400)

def main():
    with sync_playwright() as p:
        # ---- 1) Rol «Jo mateix/a» sense PIN: tocs fins al primer joc
        print('Rol: Jo mateix/a')
        b, pg = nou(p); onboarding(pg, 'jo', 'Marta', None)
        tanca_guia(pg)
        pg.wait_for_timeout(400)
        comprova(pg.evaluate("idPantallaActiva()") == 'inici', 'arriba a la pantalla d\'inici')
        tocables = pg.evaluate("[...document.querySelectorAll('#inici button, #inici a, #inici [onclick]')].filter(e => e.offsetParent !== null && !e.closest('[hidden]')).length")
        comprova(tocables <= 10, f'inici amb pocs elements tocables ({tocables})')
        # Tocs: Els meus jocs → un joc
        tocs = 0; pg.click('text=Els meus jocs'); tocs += 1; pg.wait_for_timeout(400)
        pg.evaluate("document.querySelector('#meusJocs .joc-gran, #meusJocs [onclick*=obrirJoc]').click()"); tocs += 1; pg.wait_for_timeout(900)
        comprova(pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') || idPantallaActiva().startsWith('joc')"), f'un joc concret s\'obre en {tocs} tocs')
        pg.evaluate("tancarTutorial()"); pg.wait_for_timeout(900); pg.evaluate("anarAInici()"); pg.wait_for_timeout(400)
        sessio_guiada(pg)
        pg.click('#xipComVaig'); pg.wait_for_timeout(500); comprova(pg.evaluate("idPantallaActiva()") == 'comVaig', 'Com vaig s\'obre')
        txt = pg.evaluate("document.getElementById('comVaig').innerText")
        comprova(not any(x in txt.lower() for x in ('error', 'fallat', 'pitjor', 'baixa')), 'Com vaig només té llenguatge positiu')
        pg.evaluate("anarAInici()")
        # Cuidador: crear PIN des d'Ajustos
        pg.evaluate("obrirEspaiCuidador()"); pg.wait_for_timeout(400)
        print('  pantalla després d\'obrirEspaiCuidador:', pg.evaluate("idPantallaActiva()"))
        b.close()

        # ---- 2) Rol «Una persona gran» amb PIN, informe i exportacions
        print('Rol: Una persona gran (l\'ajudo jo)')
        b, pg = nou(p, 1100, 900); onboarding(pg, 'cuidat', 'Rosa', '2468')
        tanca_guia(pg)
        sessio_guiada(pg)
        pg.evaluate("obrirEspaiCuidador()"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("document.getElementById('modalPin').classList.contains('actiu')"), 'l\'espai del cuidador demana el PIN')
        tecleja_pin(pg, '0000'); comprova(pg.evaluate("idPantallaActiva()") != 'cuidador', 'PIN erroni no deixa entrar')
        tecleja_pin(pg, '2468'); pg.wait_for_timeout(600)
        comprova(pg.evaluate("idPantallaActiva()") == 'cuidador', 'PIN correcte → Espai del cuidador')
        comprova(pg.evaluate("(lsGet('mentA_cuidador', {}).hash || '').length") > 20 and '2468' not in pg.evaluate("localStorage.getItem('mentA_cuidador')"), 'el PIN es guarda només com a hash')
        for t in ['resum', 'evolucio', 'jocs', 'salut', 'notes', 'pla', 'informe']: pg.evaluate(f"cuTria('{t}')"); pg.wait_for_timeout(100)
        txt = pg.evaluate("document.getElementById('cuidador').innerText"); comprova('no és un dispositiu sanitari' in txt or 'diagnòstics' in txt, 'avís legal visible a l\'informe')
        with pg.expect_download(timeout=20000) as dl: pg.evaluate("informeCuidadorPDF('familia')")
        f = dl.value; comprova(f.suggested_filename.lower().endswith('.pdf'), f'PDF família descarregat ({f.suggested_filename})')
        with pg.expect_download(timeout=20000) as dl: pg.evaluate("informeCuidadorPDF('professional')")
        comprova(dl.value.suggested_filename.lower().endswith('.pdf'), 'PDF professional descarregat')
        with pg.expect_download(timeout=10000) as dl: pg.evaluate("exportarCSV()")
        comprova(dl.value.suggested_filename.endswith('.csv'), 'CSV descarregat')
        with pg.expect_download(timeout=10000) as dl: pg.evaluate("exportaPaquetLectura()")
        ruta = dl.value.path(); dades = json.load(open(ruta, encoding='utf8')); comprova('mentA_cuidador' not in json.dumps(dades), 'el paquet de lectura no inclou el hash del PIN')
        pg.evaluate("tancaEspaiCuidador()"); pg.wait_for_timeout(300)
        b.close()

        # ---- 3) Rol Residència
        print('Rol: Residència')
        b, pg = nou(p, 1100, 900); onboarding(pg, 'residencia', '', '1357'); pg.wait_for_timeout(500)
        comprova(pg.evaluate("idPantallaActiva()") == 'selectorResident', 'Residència arrenca al selector de residents')
        pg.evaluate("carregarDemo()"); pg.wait_for_timeout(600); pg.evaluate("mostrarPantalla('selectorResident')"); pg.wait_for_timeout(400)
        n = pg.evaluate("document.querySelectorAll('#selectorResident .resident-targeta, #selectorResident [onclick*=residentTria]').length"); comprova(n == 8, f'selector amb 8 residents ({n})')
        pg.evaluate("residentTria('u_demo_3')"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("usuariActualId") == 'u_demo_3' and pg.evaluate("idPantallaActiva()") == 'inici', 'triar resident porta a la seva pantalla d\'inici')
        pg.evaluate("_ultimaActivitat = Date.now() - 4 * 60 * 1000"); pg.wait_for_timeout(6500)
        comprova(pg.evaluate("idPantallaActiva()") == 'selectorResident', 'torna sol al selector després d\'inactivitat')
        pg.evaluate("entraCuidador()"); pg.evaluate("cuTria('resum'); cuResidencia && cuTria('residencia')"); pg.wait_for_timeout(300)
        csv = pg.evaluate("residenciaCSV && 1"); comprova(bool(csv), 'exportació CSV de planta disponible')
        b.close()
    print('\nErrors de JS:', len(errors)); [print('  ', e) for e in errors[:10]]
    print('Comprovacions fallides:', len(fallades)); [print('  ✗', f) for f in fallades]
    return 1 if (errors or fallades) else 0

if __name__ == '__main__': sys.exit(main())
