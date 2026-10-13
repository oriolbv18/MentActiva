"""Captures de cada joc a mig fer (per revisar-los a ull). Ús: python tests/jocs/captures_jocs.py [mida] [tema]"""
import pathlib, random, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from playwright.sync_api import sync_playwright
from comu import Partida, ARREL
import bots
mida = sys.argv[1] if len(sys.argv) > 1 else 'mobil'; tema = sys.argv[2] if len(sys.argv) > 2 else 'clar'
sortida = ARREL / 'docs' / 'captures-1.8' / 'jocs'; sortida.mkdir(parents=True, exist_ok=True)
rng = random.Random(5)
with sync_playwright() as p:
    par = Partida(p, mida, tema)
    for joc, (fn, admet2, nivells) in bots.BOTS.items():
        if joc == 'bingo': continue
        par.obre_joc(joc, False, 1 if nivells else None); par.avanca(1500)
        # a mig fer: una acció o dues del bot sense acabar la partida
        try:
            if joc in ('tertulia', 'refranys', 'calcul', 'seqlog'): bots.clica(par, f'#{joc}-opcions .opcio', 0)
            elif joc == 'paraules': [bots.clica(par, '#paraules-teclat .tecla:not(:disabled)', k) for k in (0, 3, 7)]
            elif joc == 'memory': bots.clica(par, '#memory-grid .carta', 0); par.avanca(100); bots.clica(par, '#memory-grid .carta', 1)
            elif joc == 'sequencia': par.js("document.getElementById('seq-iniciar').click()"); par.avanca(1300)
            elif joc == 'nback': par.js("document.getElementById('nback-iniciar').click()"); par.avanca(2500)
            elif joc == 'stroop': par.js("document.getElementById('stroop-iniciar').click()"); par.avanca(300)
            elif joc == 'span': par.js("document.getElementById('span-iniciar').click()"); par.avanca(900)
            elif joc == 'fluidesa': par.js("document.getElementById('fluidesa-iniciar').click()"); par.pg.fill('#fluidesa-input', 'gos'); par.pg.press('#fluidesa-input', 'Enter'); par.avanca(5000)
            elif joc == 'quefalta': par.js("document.getElementById('qf-iniciar').click()"); par.avanca(1000)
            elif joc == 'domino': par.avanca(800)
            elif joc == 'dames': bots.clica(par, '#dames-tauler .casella.movible', 3); par.avanca(100)
            elif joc == 'sopa': par.avanca(100)
            elif joc == 'sudoku': par.js("document.querySelectorAll('#sudoku-grid .sudoku-cell:not(.fixa)')[2].click()")
        except Exception as e: print('av', joc, e)
        par.pg.wait_for_timeout(700)
        par.pg.screenshot(path=str(sortida / f'{joc}__{mida}__{tema}.png'))
    par.tanca()
print('fet', mida, tema)
