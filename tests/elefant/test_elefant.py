"""L'Elefantet (v1.9, redisseny): petit i fix a baix a la dreta, no xerra sol, surt pel costat als jocs per oferir ajuda, controls de presència,
moviment reduït, Espai del Cuidador, bucle d'animació i rendiment amb la CPU frenada ×4.
Ús: python tests/elefant/test_elefant.py"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades, APP
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

PREPARA = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({memory:true,tertulia:true,sudoku:true}))"

def inici(p, w=390, h=844, presencia=None):
    b, pg = nou(p, w, h); pg.evaluate(PREPARA)
    if presencia: pg.evaluate(f"ajustes.elefantPresencia='{presencia}'; ajustes.elefant = '{presencia}' !== 'apagat'; guardarAjustes()")
    pg.reload(); pg.wait_for_timeout(1700); return b, pg

def obre_memory(pg):
    pg.evaluate("obrirJoc('memory')"); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelectorAll('#modalDificultat .dificultat-btn')[1] && document.querySelectorAll('#modalDificultat .dificultat-btn')[1].click()"); pg.wait_for_timeout(900)

def rect(pg, sel):
    return pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; }", sel)

def prova_inici(p):
    for w, h in ((390, 844), (360, 640), (820, 1180), (1440, 900)):
        b, pg = inici(p, w, h); r = rect(pg, '#elefantFlotant .el-figura'); vp = pg.evaluate("[innerWidth, innerHeight]")
        comprova(r is not None and r['w'] <= 70 and r['h'] <= 70, f'{w}×{h}: l\'Elefant és petit ({r and round(r["w"])}×{r and round(r["h"])} px)')
        comprova(r is not None and vp[0] - r['r'] < 40 and vp[1] - r['b'] < 40, f'{w}×{h}: és sempre a baix a la dreta')
        comprova(pg.evaluate("document.documentElement.scrollWidth <= innerWidth"), f'{w}×{h}: sense scroll horitzontal')
        b.close()
    b, pg = inici(p)
    comprova(pg.evaluate("!document.querySelector('.el-globus.visible')"), 'no xerra sol: cap globus en obrir l\'app')
    pg.wait_for_timeout(3000); comprova(pg.evaluate("!document.querySelector('.el-globus.visible')"), 'no xerra sol: cap globus després de 5 s')
    pg.click('#elefantFlotant .el-figura'); pg.wait_for_timeout(400)
    botons = pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].map(b => [b.textContent, Math.round(b.getBoundingClientRect().height)])")
    comprova(len(botons) == 3 and all(h >= 44 for _, h in botons), f'en tocar-lo ofereix un menú petit amb accions grans {botons}')
    comprova(pg.evaluate("(() => { const g = document.querySelector('.el-globus.visible').getBoundingClientRect(); return g.left >= 0 && g.right <= innerWidth && g.top >= 0; })()"), 'el globus cap dins de la pantalla')
    comprova(pg.evaluate("document.querySelector('#elefantFlotant .el-figura').getAttribute('role') === 'button' && document.querySelector('#elefantFlotant .el-svg').getAttribute('aria-hidden') === 'true'"), 'accessible: botó amb teclat i dibuix decoratiu')
    comprova(pg.evaluate("document.querySelector('.el-globus').getAttribute('aria-live') === 'polite'"), 'el globus és aria-live=polite')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200); comprova(pg.evaluate("!document.querySelector('.el-globus.visible')"), 'Esc tanca el menú')
    pg.evaluate("document.querySelector('#elefantFlotant .el-figura').focus()"); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    comprova(pg.evaluate("!!document.querySelector('.el-globus.visible')"), 'amb teclat (Enter) s\'obre el menú')
    pg.evaluate("mostrarPantalla('menuJocs')"); pg.wait_for_timeout(500)
    r = rect(pg, '#elefantFlotant .el-figura'); nav = rect(pg, '#bottomNav')
    comprova(r is not None and (nav is None or nav['h'] == 0 or r['b'] <= nav['y'] + 1), 'a les altres pantalles tampoc tapa la barra de baix')
    b.close()

def prova_jocs(p):
    b, pg = inici(p); obre_memory(pg)
    comprova(pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')") and pg.evaluate("getComputedStyle(document.querySelector('#elefantFlotant')).visibility") == 'hidden', 'dins d\'un joc l\'Elefant no hi és (queda fora de la pantalla)')
    comprova(pg.evaluate("(() => { const x = document.querySelector('#joc-memory .el-slot-joc'); return !!x && !x.hidden && x.getBoundingClientRect().width >= 44; })()"), 'al joc hi ha el botó de la bombeta (≥ 44 px) per demanar una pista')
    pg.evaluate("for (let i = 0; i < 3; i++) soError()"); pg.wait_for_timeout(300)
    comprova(pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'després de 3 errors (nivell Discret) encara no molesta')
    pg.evaluate("soError()"); pg.wait_for_timeout(900)
    oferta = pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].map(b => b.textContent)")
    comprova(oferta == ['Sí', 'Ara no'], f'després de 4 errors seguits surt per la dreta i pregunta «Vols una pista?» {oferta}')
    r = rect(pg, '#elefantFlotant .el-figura'); vp = pg.evaluate("[innerWidth, innerHeight]")
    comprova(r['r'] <= vp[0] and vp[0] - r['r'] < 40 and vp[1] - r['b'] < 40, 'surt a baix a la dreta')
    pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Ara no').click()"); pg.wait_for_timeout(1200)
    comprova(pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'amb «Ara no» se\'n torna a anar pel costat')
    pg.evaluate("Pistes._E.ultimaOferta = 0; for (let i = 0; i < 5; i++) soError();"); pg.wait_for_timeout(600)
    pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Ara no') && [...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Ara no').click()"); pg.wait_for_timeout(1200)
    pg.evaluate("Pistes._E.ultimaOferta = 0; for (let i = 0; i < 6; i++) soError();"); pg.wait_for_timeout(600)
    comprova(pg.evaluate("document.querySelectorAll('.el-globus.visible .el-boto').length") == 0, 'si es rebutja dues vegades, deixa d\'oferir-la en aquesta partida')
    pg.click('#joc-memory .el-slot-joc'); pg.wait_for_timeout(700)
    comprova(pg.evaluate("!!document.querySelector('.el-globus.visible')") and not pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'amb la bombeta surt a ajudar-te')
    pg.evaluate("Pistes.tanca()"); pg.wait_for_timeout(1500)
    comprova(pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'en acabar, torna a marxar')
    pg.evaluate("mostrarPantalla('inici')"); pg.wait_for_timeout(500)
    comprova(pg.evaluate("!document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'en sortir del joc, és altre cop a baix a la dreta')
    b.close()

def prova_presencia(p):
    b, pg = inici(p, presencia='apagat')
    comprova(pg.evaluate("!ELEF.inst || document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'apagat: no es veu enlloc')
    obre_memory(pg); pg.click('#joc-memory .el-slot-joc'); pg.wait_for_timeout(500)
    comprova(pg.evaluate("!!document.querySelector('#pistaTargeta') && document.querySelector('#pistaTargeta').innerText.length > 10"), 'apagat: la pista funciona igualment (targeta de text)')
    b.close()
    b, pg = inici(p, presencia='normal'); obre_memory(pg)
    pg.evaluate("for (let i = 0; i < 3; i++) soError()"); pg.wait_for_timeout(800)
    comprova(pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].length") == 2, 'normal: ofereix la pista als 3 errors')
    b.close()

def prova_cuidador(p):
    b, pg = inici(p)
    pg.evaluate("cuidadorObert = true; mostrarPantalla('cuidador')"); pg.wait_for_timeout(700)
    comprova(pg.evaluate("document.querySelector('#elefantFlotant').classList.contains('amagat')"), 'Espai del Cuidador: l\'Elefant no hi és')
    b.close()

def prova_onboarding(p):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.goto(APP); pg.wait_for_timeout(1800)
    comprova(pg.evaluate("!document.querySelector('.onb-mascota, .onb-elefant') && (!document.querySelector('#elefantFlotant') || document.querySelector('#elefantFlotant').classList.contains('amagat'))"), 'la benvinguda no té Elefant (sencera i sense distraccions)')
    b.close()

def prova_moviment_reduit(p):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(APP); pg.evaluate(PREPARA); pg.reload(); pg.wait_for_timeout(1500)
    comprova(pg.evaluate("ELEF.inst && ELEF.inst.estatica === true"), 'moviment reduït: l\'Elefant és estàtic (no s\'anima)')
    pg.evaluate("ELEF.inst.estat('celebra')"); pg.wait_for_timeout(300)
    comprova(pg.evaluate("ELEF.inst.estatActual === 'celebra'"), 'moviment reduït: però canvia de postura')
    n = pg.evaluate("new Promise(r => { let k = 0; const o = ELEF.inst.pas; ELEF.inst.pas = function (...a) { k++; return o.apply(this, a); }; setTimeout(() => r(k), 800); })")
    comprova(n == 0, f'moviment reduït: cap fotograma d\'animació en 0,8 s ({n})')
    b.close()

def prova_dialegs(p):
    b, pg = inici(p)
    rep = pg.evaluate("(() => { let ult = '', rep = 0; for (let i = 0; i < 400; i++) { const t = Dialegs.tria('pista_oferta', {}); if (t === ult) rep++; ult = t; } return rep; })()")
    comprova(rep == 0, f'mai la mateixa frase dues vegades seguides ({rep} repeticions en 400)')
    n = pg.evaluate("Dialegs.quantes()"); comprova(n >= 150, f'diàlegs: {n} frases (≥ 150)')
    sense = pg.evaluate("Dialegs.contextos().filter(c => { const t = Dialegs.tria(c, { nom: 'Maria', joc: 'Memory', n: 3, ratxa: 4 }); return !t || /[{}]/.test(t) || /undefined|NaN/.test(t); })")
    comprova(not sense, f'diàlegs: cap frase amb variables sense omplir {sense}')
    b.close()

def prova_rendiment(p):
    b, pg = inici(p)
    cdp = pg.context.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.evaluate("ELEF.inst.estat('celebra')"); pg.wait_for_timeout(500)
    res = pg.evaluate("""new Promise(r => { let k = 0, t0 = performance.now(), tot = 0; const o = ELEF.inst.pas;
        ELEF.inst.pas = function (...a) { const t = performance.now(); const x = o.apply(this, a); tot += performance.now() - t; k++; return x; };
        setTimeout(() => r({ k, ms: performance.now() - t0, mitja: tot / Math.max(1, k) }), 3000); })""")
    fps = res['k'] / (res['ms'] / 1000)
    print(f'  · CPU ×4 en celebració: {fps:.0f} fps, {res["mitja"]:.2f} ms/fotograma')
    comprova(fps >= 15, f'rendiment: ≥ 15 fps (l\'icona petita va a 20) amb la CPU ×4 ({fps:.0f})')
    comprova(res['mitja'] < 8, f'rendiment: < 8 ms de JS per fotograma amb la CPU ×4 ({res["mitja"]:.2f})')
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); pg.evaluate("ELEF.inst.estat('repos')"); pg.wait_for_timeout(500)
    rep = pg.evaluate("""new Promise(r => { let tot = 0; const o = ELEF.inst.pas; ELEF.inst.pas = function (...a) { const t = performance.now(); const x = o.apply(this, a); tot += performance.now() - t; return x; }; setTimeout(() => r(tot), 2000); })""")
    print(f'  · repòs: {rep / 2:.1f} ms de JS per segon')
    comprova(rep / 2 < 40, f'rendiment: repòs < 40 ms de JS per segon ({rep / 2:.1f})')
    pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));"); pg.wait_for_timeout(300)
    n = pg.evaluate("new Promise(r => { let k = 0; const o = ELEF.inst.pas; ELEF.inst.pas = function (...a) { k++; return o.apply(this, a); }; setTimeout(() => r(k), 800); })")
    comprova(n <= 1, f'rendiment: amb la pestanya oculta el bucle s\'atura ({n} fotogrames)')
    b.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        for f in (prova_inici, prova_jocs, prova_presencia, prova_cuidador, prova_onboarding, prova_moviment_reduit, prova_dialegs, prova_rendiment):
            print('·', f.__name__); f(p)
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades))
    sys.exit(1 if errors or fallades else 0)
