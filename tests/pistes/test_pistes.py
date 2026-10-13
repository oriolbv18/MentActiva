"""Sistema de pistes (v1.9): als 17 jocs, 3 nivells, assenyalar amb anell, tancar sense deixar restes i sense errors ni scroll.
Ús: python tests/pistes/test_pistes.py [--mida mobil|tauleta|ordinador] [--joc id]"""
import argparse, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'jocs'))
from playwright.sync_api import sync_playwright
from comu import Partida
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

JOCS = ['memory', 'sequencia', 'domino', 'dames', 'bingo', 'sopa', 'nback', 'span', 'stroop', 'calcul', 'seqlog', 'quefalta', 'sudoku', 'tertulia', 'refranys', 'paraules', 'fluidesa']
fallades = []
def comprova(c, m):
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c: fallades.append(m)

def prepara(par, joc):
    """Deixa el joc en un punt on té sentit demanar una pista."""
    click = lambda sel: par.js(f"document.querySelector('{sel}').click()")
    if joc == 'memory':
        par.js("document.querySelectorAll('#memory-grid .carta')[0].click()"); par.avanca(200); par.js("document.querySelectorAll('#memory-grid .carta')[1].click()"); par.avanca(1300)
        par.js("document.querySelectorAll('#memory-grid .carta')[2].click()"); par.avanca(200)
    elif joc == 'sequencia': click('#seq-iniciar'); par.avanca(4500)
    elif joc == 'nback': click('#nback-iniciar'); par.avanca(2400)
    elif joc == 'span': click('#span-iniciar'); par.avanca(4800)
    elif joc == 'stroop': click('#stroop-iniciar'); par.avanca(200)
    elif joc == 'fluidesa': click('#fluidesa-iniciar'); par.avanca(300)
    elif joc == 'quefalta': click('#qf-iniciar'); par.avanca(7000)
    elif joc == 'bingo': click('#bingo-comencar'); par.avanca(9000)
    elif joc == 'domino':
        for _ in range(12):
            if par.js("document.querySelectorAll('#domino-ma .fitxa:not(.disabled)').length"): break
            par.avanca(1500)
    par.avanca(300)

def prova_joc(p, joc, mida):
    par = Partida(p, mida)
    par.js("localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1'); (() => { const t = {}; ['%s'].forEach(j => t[j] = true); localStorage.setItem('mentA_tutorials', JSON.stringify(t)); })()" % "','".join(JOCS))
    par.pg.reload(); par.avanca(900)
    par.obre_joc(joc, False, 0 if joc in ('memory', 'domino', 'dames', 'sopa', 'sudoku', 'nback') else None)
    par.js("document.querySelectorAll('#tutorialOverlay.actiu #tutorialOk').forEach(b => b.click())"); par.avanca(400)
    prepara(par, joc)
    boto = f"#joc-{joc} .el-slot-joc"
    comprova(par.js(f"(() => {{ const b = document.querySelector('{boto}'); return !!b && !b.hidden && b.getBoundingClientRect().width >= 44 && b.getBoundingClientRect().height >= 44; }})()"), f'{joc}: el botó de pista és visible i fa ≥ 44 px')
    nivells = 0; anells = 0
    par.js(f"document.querySelector('{boto}').click()"); par.avanca(500)
    for n in (1, 2, 3):
        txt = par.js("(() => { const g = document.querySelector('.el-globus.visible, #pistaTargeta'); return g ? g.innerText : ''; })()")
        if not txt.strip(): break
        nivells = n
        if par.js("document.querySelectorAll('.el-anell').length"): anells += 1
        comprova(par.js("document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1"), f'{joc} nivell {n}: sense scroll')
        mes = par.js("(() => { const bs = [...document.querySelectorAll('.el-globus.visible .el-boto.principal, #pistaTargeta .el-boto.principal')]; const b = bs.find(x => /assenyala|mostra/i.test(x.textContent)); if (b) { b.click(); return true; } return false; })()")
        par.avanca(900)
        if not mes: break
    comprova(nivells >= 1, f'{joc}: la pista de nivell 1 mostra un text')
    comprova(nivells == 3 or joc in ('memory', 'sequencia', 'bingo', 'domino', 'nback', 'span', 'sudoku'), f'{joc}: arriba al nivell 3 ({nivells})')
    if nivells >= 2: comprova(anells >= 1 or joc in ('nback',), f'{joc}: el nivell 2 assenyala amb un anell')
    par.js("(() => { const b = [...document.querySelectorAll('.el-globus .el-boto, #pistaTargeta .el-boto')].find(x => x.textContent.trim() === 'Entès'); if (b) b.click(); })()"); par.avanca(600)
    comprova(par.js("document.querySelectorAll('.el-anell, #elefantSuperposat').length") == 0, f'{joc}: en tancar la pista no queden anells ni superposat')
    errs = [e for e in par.errors if 'favicon' not in e]
    comprova(not errs, f'{joc}: cap error de consola {errs[:2]}')
    par.errors.clear(); par.tanca()

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--mida', default='mobil'); ap.add_argument('--joc', default=None); a = ap.parse_args()
    with sync_playwright() as p:
        for j in ([a.joc] if a.joc else JOCS):
            try: prova_joc(p, j, a.mida)
            except Exception as e: comprova(False, f'{j}: excepció {type(e).__name__}: {str(e)[:200]}')
    print('\nFallades:', len(fallades)); sys.exit(1 if fallades else 0)
