"""«Jugar amb algú»: tocs fins al primer moviment, aleatori amb llavor, Duel de puntuació als 8 jocs, Junts, partida nativa i marcador.
Ús: python tests/test_parella.py"""
import sys, pathlib, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

DUEL = ['calcul', 'stroop', 'span', 'quefalta', 'sopa', 'seqlog', 'sudoku', 'fluidesa']
PREPARA = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({%s}))" % ','.join(f"{j}:true" for j in DUEL + ['memory', 'bingo', 'tertulia', 'sequencia'])

def prova_llavor(pg):
    r = pg.evaluate("(() => { fixaLlavor(42); const a = [barreja([1,2,3,4,5,6,7,8,9]), enter(1, 100), aleatori(['a','b','c','d'])]; fixaLlavor(42); const b = [barreja([1,2,3,4,5,6,7,8,9]), enter(1, 100), aleatori(['a','b','c','d'])]; llavorAleatoria(); return JSON.stringify(a) === JSON.stringify(b); })()")
    comprova(r, 'dues partides amb la mateixa llavor són idèntiques (regla 10)')
    comprova(pg.evaluate("(() => { const x = [barreja([1,2,3,4,5,6,7,8]), barreja([1,2,3,4,5,6,7,8])]; return JSON.stringify(x[0]) !== JSON.stringify(x[1]); })()"), 'sense llavor fixa, cada partida és diferent')

def prova_tocs(p):
    b, pg = nou(p); pg.evaluate(PREPARA); pg.reload(); pg.wait_for_timeout(900)
    t0 = time.time(); tocs = 0
    pg.click('#btnJugarAmb'); tocs += 1
    pg.click('#jocsParella .joc-gran >> nth=8'); tocs += 1          # un joc d'un sol jugador → Duel de puntuació
    pg.wait_for_timeout(500); pg.click('text=Estic llest'); tocs += 1; pg.wait_for_timeout(700)
    comprova(pg.evaluate("idPantallaActiva()").startswith('joc-'), f'inici → primer moviment en {tocs} tocs i {time.time() - t0:.1f} s')
    comprova(tocs <= 3 and time.time() - t0 < 8, 'dins l\'objectiu (≤ 3 tocs, < 8 s)')
    b.close()

def juga_duel(pg, joc):
    """Retorna la primera pregunta/estat visible de cada torn per comprovar que és la mateixa partida."""
    pg.evaluate("parellaMode('contra')"); pg.evaluate(f"parellaTriaJoc('{joc}')"); pg.wait_for_timeout(500)
    inicis = []
    for torn in (1, 2):
        pg.click('text=Estic llest'); pg.wait_for_timeout(900)
        inicis.append(pg.evaluate("[...document.querySelectorAll('.screen.active #sudoku-grid .sudoku-cell, .screen.active #sopa-grid .sopa-casella')].map(e => e.textContent).join('') || document.querySelector('.screen.active').innerText.replace(/\\d+ ?(s|:\\d+)\\b/g, '').replace(/\\s+/g, ' ').slice(0, 400)"))
        pg.evaluate("finalitzarPartida(jocActualId, %d, %d, '')" % (8 if torn == 1 else 5, 2 if torn == 1 else 5)); pg.wait_for_timeout(1200)
    return inicis

def prova_duels(p):
    b, pg = nou(p); pg.evaluate(PREPARA); pg.reload(); pg.wait_for_timeout(900)
    prova_llavor(pg)
    pg.evaluate("carregaParella()"); n = len(DUEL)
    for joc in DUEL:
        inicis = juga_duel(pg, joc)
        pant = pg.evaluate("idPantallaActiva()")
        comprova(pant == 'duelFi', f'{joc}: el duel acaba a la pantalla de resultat (és «{pant}»)')
        igual = inicis[0] == inicis[1]
        comprova(igual or joc in ('span', 'quefalta', 'fluidesa', 'stroop'), f'{joc}: els dos jugadors veuen la mateixa partida')
        txt = pg.evaluate("document.getElementById('duelTitol').textContent")
        comprova('Guanya' in txt, f'{joc}: guanyador correcte «{txt}»')
        pg.evaluate("duelAltreJoc()"); pg.wait_for_timeout(200)
    mar = pg.evaluate("parella.marcador")
    comprova(mar[0] == n and mar[1] == 0, f'marcador de la tarda acumulat {mar}')
    # Junts
    pg.evaluate("parellaMode('junts')"); pg.evaluate("parellaTriaJoc('memory')"); pg.wait_for_timeout(500)
    for torn in (1, 2): pg.click('text=Estic llest'); pg.wait_for_timeout(900); pg.evaluate("finalitzarPartida(jocActualId, 7, 3, '')"); pg.wait_for_timeout(1200)
    comprova(pg.evaluate("idPantallaActiva()") == 'duelFi' and 'junts' in pg.evaluate("document.getElementById('duelText').textContent").lower() or 'Entre els dos' in pg.evaluate("document.getElementById('duelText').textContent"), 'mode Junts: resultat comú')
    comprova(pg.evaluate("dadesActuals().historial.length") == 0, 'les partides amb algú no entren a l\'historial dels indicadors')
    # partida nativa de 2 jugadors
    pg.evaluate("parellaMode('contra'); parellaTriaJoc('tertulia')"); pg.wait_for_timeout(1200)
    comprova(pg.evaluate("idPantallaActiva()") == 'joc-tertulia' and pg.evaluate("modeActual") == '2vs2', 'Tertúlia s\'obre com a partida de 2 jugadors')
    b.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        prova_tocs(p); prova_duels(p)
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades))
    sys.exit(1 if errors or fallades else 0)
