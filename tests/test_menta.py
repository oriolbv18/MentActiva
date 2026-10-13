"""Proves automàtiques de MentA (Playwright per a Python, file:// i xarxa bloquejada).

Ús:  python tests/test_menta.py            (tot)
     python tests/test_menta.py --rapid    (menys combinacions)
Surt amb codi 1 si hi ha cap error.
"""
import argparse, json, pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from captures import APP, MIDES, JOCS, nou_context, PANTALLES

ARREL = pathlib.Path(__file__).resolve().parent.parent
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
errors, avisos = [], []
def ko(m): errors.append(m); print('  ✗', m)
def ok(m): print('  ✓', m)

def obre(p, mida='mobil', tema='clar', zoom='normal', dades_js=''):
    nav, ctx = nou_context(p, mida, tema, zoom, dades_js)
    pg = ctx.new_page(); logs = []
    pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: logs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto(APP); pg.wait_for_timeout(350)
    return nav, pg, logs

def sense_scroll(pg):
    return pg.evaluate("""() => { const s = document.querySelector('.screen.active'); const d = document.documentElement;
      const cos = s.querySelector('.joc-cos');
      const desbord = [...s.querySelectorAll('.joc-cos > *, .barra-joc')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.left < -1; }).map(e => e.id || e.className).slice(0, 4);
      scrollTo(0, 400); const y = scrollY; scrollTo(0, 0);
      return { docH: y ? d.scrollHeight : innerHeight, winH: innerHeight, docW: d.scrollWidth, winW: innerWidth, desbord, cosScroll: cos ? cos.scrollHeight - cos.clientHeight : 0 }; }""")

def prova_pantalles(p, mides, temes, zooms):
    print('· Errors de JS i desbordaments a cada pantalla')
    for mida in mides:
        for tema in temes:
            for zoom in zooms:
                nav, pg, logs = obre(p, mida, tema, zoom)
                for s in PANTALLES:
                    pg.evaluate(f"mostrarPantalla('{s}')"); pg.wait_for_timeout(120)
                    w = pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
                    if w[0] > w[1] + 1: ko(f'{s} {mida}/{tema}/{zoom}: scroll horitzontal ({w[0]}>{w[1]})')
                if logs: ko(f'{mida}/{tema}/{zoom}: ' + ' | '.join(logs[:3]))
                nav.close()
    ok('pantalles revisades')

def prova_jocs(p, mides, zooms, dos=False):
    print('· Cap joc fa scroll' + (' (2 jugadors)' if dos else ''))
    for mida in mides:
        for zoom in zooms:
            nav, pg, logs = obre(p, mida, 'clar', zoom)
            for j in JOCS:
                try:
                    pg.evaluate(f"obrirJoc('{j}', {'true' if dos else 'false'})")
                    try: pg.wait_for_function(f"document.querySelector('.screen.active').id === 'joc-{j}'", timeout=3000)
                    except Exception:
                        if dos and j not in ('tertulia', 'refranys', 'paraules', 'memory', 'sequencia', 'domino', 'dames', 'bingo', 'calcul', 'seqlog'): continue
                        ko(f"joc {j} {mida}: no s'obre la pantalla del joc"); continue
                    pg.wait_for_timeout(350)
                    if pg.locator('#modalDificultat.actiu').count(): pg.locator('#dificultatGrid button').nth(2).click(); pg.wait_for_timeout(500)
                    if j == 'bingo':
                        if dos: pg.evaluate("document.getElementById('bingo-comencar').click()")
                        else: pg.evaluate("bingoOpcio.cartrons('4'); bingoOpcio.rivals('3'); bingoOpcio.velocitat('lenta'); document.getElementById('bingo-comencar').click()")
                        pg.wait_for_timeout(400)
                    r = sense_scroll(pg)
                    if r['docH'] > r['winH'] + 1 or r['docW'] > r['winW'] + 1 or r['desbord'] or r['cosScroll'] > 2:
                        ko(f'joc {j} {mida}/{zoom}{" 2J" if dos else ""}: scroll doc {r["docH"]}>{r["winH"]}, desbord {r["desbord"]}, cos {r["cosScroll"]}')
                except Exception as e:
                    ko(f'joc {j} {mida}: {e}')
            if logs: ko(f'jocs {mida}/{zoom}: ' + ' | '.join(logs[:3]))
            nav.close()
    ok('jocs revisats')

def prova_recorregut(p):
    print('· Recorregut: onboarding → joc → final → Com vaig → config → exportar/importar → esborrar')
    nav, ctx = nou_context(p, 'mobil', 'clar', 'normal')
    ctx.clear_cookies(); pg = ctx.new_page(); logs = []
    pg.on('pageerror', lambda e: logs.append(str(e)))
    pg.add_init_script("try{if(!sessionStorage.getItem('_p')){sessionStorage.setItem('_p','1');localStorage.removeItem('mentA_onboarding_vist');localStorage.removeItem('mentA_tutorials');}}catch(e){}")
    pg.goto(APP); pg.wait_for_timeout(500)
    if not pg.locator('#onboardingOverlay.actiu').count(): ko("no surt l'onboarding"); nav.close(); return
    sys.path.insert(0, str(pathlib.Path(__file__).parent / 'onboarding')); import test_onboarding as TO
    TO.recorre(pg, 'jo', 'Maria', None)
    if pg.locator('#onboardingOverlay.actiu').count(): ko("l'onboarding no es tanca")
    if pg.inner_text('#usuariNom') != 'Maria': ko("no es crea l'usuari de l'onboarding")
    ok('onboarding')
    pg.wait_for_timeout(900)
    if not pg.locator('#guiaCapa:not([hidden])').count(): ko('no surt la guia de primer ús')
    else:
        for _ in range(4):
            if pg.locator('#guiaCapa:not([hidden])').count(): pg.click('#guiaSeguent'); pg.wait_for_timeout(200)
        ok('guia de primer ús (3 passos)')
    pg.evaluate("obrirJoc('calcul')"); pg.wait_for_timeout(400)
    if not pg.locator('#tutorialOverlay.actiu').count(): ko('no surt el tutorial')
    pg.click('#tutorialOk'); pg.wait_for_timeout(600)
    for i in range(10):
        pg.locator('#calcul-opcions .opcio').first.click(); pg.wait_for_timeout(120)
        pg.locator('#calcul-seguent').click(); pg.wait_for_timeout(120)
    pg.wait_for_timeout(1200)
    if not pg.locator('#modalFi.actiu').count(): ko('no surt la pantalla final')
    else: ok('fi de partida: ' + pg.inner_text('#puntuacioFinal').replace(chr(10), ' '))
    pg.evaluate("tancarModal('modalFi')")
    n = pg.evaluate("dadesActuals().historial.length")
    if n != 1: ko(f'sessions guardades: {n}')
    s = pg.evaluate("dadesActuals().historial[0]")
    camps = ['id', 'usuari', 'joc', 'domini', 'data', 'horaInici', 'durada', 'nivell', 'mode', 'encerts', 'errors', 'pct', 'abandonada', 'ajudesUsades', 'pausesFetes']
    falten = [c for c in camps if c not in s]
    if falten or not s.get('durada'): ko('sessió sense camps del registre ampliat: ' + ', '.join(falten))
    else: ok('registre de sessió ampliat (' + str(len(s)) + ' camps)')
    pg.evaluate("obrirComVaig()"); pg.wait_for_timeout(300)
    if len(pg.inner_text('#comVaig')) < 40: ko('«Com vaig» buit')
    pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('[data-tria=tema] [data-valor=fosc]').click()")
    if pg.evaluate("document.documentElement.dataset.tema") != 'fosc': ko("el tema fosc no s'aplica")
    pg.evaluate("document.querySelector('[data-tria=tema] [data-valor=auto]').click()")
    pg.evaluate("document.querySelector('[data-tria=zoom] [data-valor=gegant]').click()")
    if pg.evaluate("document.documentElement.dataset.zoom") != 'gegant': ko("el zoom no s'aplica")
    pg.evaluate("document.querySelector('[data-tria=zoom] [data-valor=normal]').click()")
    ok('configuració')
    # exportar → esborrar → importar
    paquet = pg.evaluate("""() => { const c = {}; totesLesClaus().filter(k => !CLAUS_NO_EXPORTABLES.includes(k)).forEach(k => c[k] = lsRawGet(k)); return {app:'MentA', versio: VERSIO, schema: SCHEMA, exportat: new Date().toISOString(), claus: c}; }""")
    f = ARREL / 'tests' / '_copia.json'; f.write_text(json.dumps(paquet), encoding='utf8')
    pg.evaluate("totesLesClaus().forEach(k => localStorage.removeItem(k))"); pg.reload(); pg.wait_for_timeout(400)
    if pg.locator('#onboardingOverlay.actiu').count(): pg.click('#onboardingSkip'); pg.wait_for_timeout(200)
    pg.evaluate("mostrarPantalla('configuracio')")
    pg.set_input_files('#inputImportar', str(f)); pg.wait_for_timeout(300)
    pg.click('#modalImporta .boto-perill'); pg.wait_for_timeout(3000); pg.wait_for_load_state('load')
    if pg.evaluate("dadesActuals().historial.length") != 1 or pg.inner_text('#usuariNom') != 'Maria': ko('la importació no restaura les dades')
    else: ok('exportar/importar')
    f.unlink()
    # importar un fitxer invàlid
    bad = ARREL / 'tests' / '_dolent.json'; bad.write_text('{"x":1}', encoding='utf8')
    pg.set_input_files('#inputImportar', str(bad)); pg.wait_for_timeout(300)
    if pg.locator('#modalConfirm.actiu').count() or pg.locator('#modalImporta.actiu').count(): ko('s\'accepta un fitxer invàlid')
    bad.unlink()
    pg.evaluate("esborrarTotesLesDades()"); pg.wait_for_timeout(200); pg.click('#confirmOk'); pg.wait_for_timeout(500); pg.click('#confirmOk'); pg.wait_for_timeout(1500)
    if pg.evaluate("getUsuariActual().nom + '|' + dadesActuals().historial.length + '|' + usuaris.length") != 'Convidat|0|0': ko('no s\'ha esborrat tot')
    else: ok('esborrar dades')
    if logs: ko('errors JS al recorregut: ' + ' | '.join(logs[:3]))
    nav.close()

V16 = """
try { localStorage.clear();
localStorage.setItem('mentA_usuaris', JSON.stringify([{id:'u_1',nom:'Rosa',color:'#2e8b57',foto:null,dades:{partides:{memory:{jugades:3,encerts:12,errors:4,millor:80}},totalPartides:3,totalEncerts:12,totalErrors:4,millorRatxa:8,diesJugats:['2026-09-01','2026-09-02'],historial:[{data:'2026-09-01',joc:'memory',encerts:4,errors:1,domini:'memoria',nivell:'mig'}],medalles:['primer_dia'],dominis:{memoria:{encerts:12,errors:4}},salut:{xecs:2},diari:[{id:'d',data:'2026-09-01',pregunta:'p',text:'un record'}],estrelles:{memory:2},tests:[{data:'2026-09-01',punts:10,total:13}],nivellsOptims:{memory:'mig'},pla:null}}]));
localStorage.setItem('mentA_usuariActual','u_1'); localStorage.setItem('mentA_ajustes', JSON.stringify({fosc:true,zoom:'gran',volum:.5,efectesSo:false}));
localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1'); localStorage.setItem('mentA_missatges', JSON.stringify([{id:'m',autor:'Rosa',desti:'tots',text:'hola',data:'2026-09-01T10:00:00Z'}])); } catch(e){}
"""
def prova_migracio(p):
    print('· Migració de dades de la v1.6')
    nav = p.chromium.launch(); ctx = nav.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844})
    pg = ctx.new_page(); logs = []; pg.on('pageerror', lambda e: logs.append(str(e)))
    pg.goto(APP); pg.evaluate(V16); pg.reload(); pg.wait_for_timeout(500)
    r = pg.evaluate("""() => ({nom: getUsuariActual().nom, partides: dadesActuals().totalPartides, medalles: dadesActuals().medalles, dies: dadesActuals().diesJugats.length, diari: dadesActuals().diari.length, tests: dadesActuals().tests.length,
      tema: document.documentElement.dataset.tema, zoom: ajustes.zoom, fosc: ajustes.fosc, msgs: JSON.parse(localStorage.getItem('mentA_missatges')).length, schema: localStorage.getItem('mentA_schema'),
      sess: dadesActuals().historial[0], estrelles: dadesActuals().estrelles.memory})""")
    if r['nom'] != 'Rosa' or r['partides'] != 3 or 'primer_dia' not in r['medalles'] or r['dies'] != 2 or r['diari'] != 1 or r['tests'] != 1 or r['msgs'] != 1 or r['estrelles'] != 2: ko('migració perd dades: ' + json.dumps(r))
    elif r['tema'] != 'fosc' or r['zoom'] != 'gran': ko('migració d\'ajustos: ' + json.dumps(r))
    elif r['sess'].get('pct') != 80 or r['schema'] != '3': ko('sessió antiga no migrada: ' + json.dumps(r))
    else: ok('res no es perd (usuaris, partides, medalles, dies, diari, tests, missatges, ajustos)')
    pg.evaluate("obrirComVaig()"); pg.wait_for_timeout(300)
    if logs: ko('errors JS: ' + ' | '.join(logs[:3]))
    nav.close()

def prova_a11y(p):
    print('· Accessibilitat bàsica (axe-core, si està instal·lat)')
    axe = ARREL / 'tests' / 'node_modules' / 'axe-core' / 'axe.min.js'
    if not axe.exists(): print('  (axe-core no instal·lat: executa «npm install» dins tests/)'); return
    nav, pg, logs = obre(p, 'mobil', 'clar', 'normal')
    pg.add_script_tag(path=str(axe)); greus = {}
    for s in ['inici', 'meusJocs', 'jugarAmbAlgu', 'comVaig', 'sessioDescans', 'sessioFi', 'selectorResident', 'cuidador', 'menuJocs', 'configuracio', 'familia', 'privadesa', 'feedback', 'testCognitiu']:
        pg.evaluate(f"mostrarPantalla('{s}')"); pg.wait_for_timeout(300)
        res = pg.evaluate("axe.run(document, {runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes[0].target.join(' ')})))")
        for v in res:
            if v['impact'] in ('serious', 'critical'): greus.setdefault(s, []).append(v)
    # modals i jocs (estats oberts)
    estats = {'modal usuaris': "obrirModalUsuaris(true)", 'modal PIN': "demanaPin('crear', () => {})", 'modal xec': "obrirXecSalut()", 'modal nou usuari': "obrirModalNouUsuari()", 'modal informe': "obrirModalInforme()",
              'joc calcul': "obrirJoc('calcul')", 'onboarding rol': "iniciarOnboarding(true); onboardingPas = 1; actualitzarOnboardingSlide(true)", 'onboarding nom': "iniciarOnboarding(true); onbRepeticio = false; onbRol = 'jo'; passosOnb = PASSOS_ONB.jo; onboardingPas = 2; actualitzarOnboardingSlide(true)", 'onboarding zoom': "onboardingPas = 3; actualitzarOnboardingSlide(true)", 'onboarding prova': "onboardingPas = 4; actualitzarOnboardingSlide(true)", 'joc bingo': "obrirJoc('bingo'); setTimeout(() => { tancarTutorial(); document.getElementById('bingo-comencar').click(); }, 700)", 'duel relleu': "carregaParella(); duel = { joc: 'calcul', mode: 'duel', seed: 1, torn: 1, res: [null, null] }; duelRelleu(1)", 'joc memory': "obrirJoc('memory')", 'joc dames': "obrirJoc('dames')", 'joc sudoku': "obrirJoc('sudoku')", 'joc sopa': "obrirJoc('sopa')", 'joc stroop': "obrirJoc('stroop')"}
    for nom, js in estats.items():
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); tancaOverlayOnb(); duel = null; mostrarPantalla('inici')")
        pg.evaluate(js); pg.wait_for_timeout(1500)
        res = pg.evaluate("axe.run(document, {runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes[0].target.join(' ')})))")
        for v in res:
            if v['impact'] in ('serious', 'critical'): greus.setdefault(nom, []).append(v)
    for s, vs in greus.items():
        for v in vs: ko(f'axe {s}: {v["id"]} ({v["impact"]}) x{v["n"]} p. ex. {v["ex"]}')
    if not greus: ok('cap violació greu')
    nav.close()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--rapid', action='store_true'); a = ap.parse_args()
    mides = ['mobil'] if a.rapid else list(MIDES.keys())
    with sync_playwright() as p:
        prova_pantalles(p, mides, ['clar', 'fosc'] if not a.rapid else ['clar'], ['normal'] if a.rapid else ['normal', 'gegant'])
        prova_jocs(p, mides, ['normal'] if a.rapid else ['normal', 'gran', 'extragran', 'gegant'])
        prova_jocs(p, mides, ['normal'], dos=True)
        prova_recorregut(p); prova_migracio(p); prova_a11y(p)
    print('\nRESULTAT:', 'TOT CORRECTE' if not errors else f'{len(errors)} errors')
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main())
