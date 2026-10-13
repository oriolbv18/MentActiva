"""Caça d'errors als jocs: partides automàtiques completes (rellotge fals), vigilància d'animacions i proves d'estrès.

Ús:
  python tests/jocs/test_jocs.py --tot --n 100          totes les partides de tots els jocs (en paral·lel)
  python tests/jocs/test_jocs.py --joc memory --n 20    un sol joc
  python tests/jocs/test_jocs.py --animacions           només les proves d'animacions (Memory, Dames, Dòmino)
  python tests/jocs/test_jocs.py --estres               només les proves d'estrès
Escriu tests/jocs/resultats.json i surt amb codi 1 si hi ha cap error."""
import argparse, json, pathlib, random, subprocess, sys, traceback
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from playwright.sync_api import sync_playwright  # noqa: E402
from comu import Partida, ARREL  # noqa: E402
from bots import BOTS, sudoku  # noqa: E402

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass


# ---------------------------------------------------------------- partides senceres
def jocs_partides(joc, n, seed=1, mida='mobil'):
    fn, admet2, nivells = BOTS[joc]
    rng = random.Random(seed); errors, no_acabades, ok, llista_no = [], 0, 0, []
    with sync_playwright() as p:
        par = None
        for k in range(n):
            if par is None or k % 20 == 0:
                if par: par.tanca()
                par = Partida(p, mida)
            dos = admet2 and k % 5 == 4
            nivell = (k % 3) if (nivells and not dos) else None
            etiqueta = f'{joc} #{k} ({"2J" if dos else "1J"}{", nivell " + str(nivell) if nivell is not None else ""})'
            try:
                par.errors.clear()
                par.obre_joc(joc, dos, nivell)
                if joc == 'sudoku' and k % 7 == 6: sudoku(par, rng, perd=True)
                else: fn(par, rng, dos, nivell)
                if par.errors: errors.append(f'{etiqueta}: {par.errors[:2]}')
                brut = par.text_brut()
                if brut: errors.append(f'{etiqueta}: valors no vàlids a la pantalla {brut}')
                if par.acabada(): ok += 1
                else: no_acabades += 1; llista_no.append(etiqueta)
                if par.js("_timers.size") and par.acabada() and not dos and joc not in ('nback',):
                    pass
            except Exception as e:
                errors.append(f'{etiqueta}: EXCEPCIÓ {type(e).__name__}: {str(e)[:160]}')
                if par: par.tanca()
                par = None
        if par: par.tanca()
    return {'joc': joc, 'partides': n, 'acabades': ok, 'no_acabades': no_acabades, 'llista_no': llista_no, 'errors': errors}


# ---------------------------------------------------------------- animacions
def id_carta(a):
    return a['id']


def prova_animacions_memory(p):
    errors = []
    for nivell in (0, 1, 2):
        par = Partida(p)
        par.obre_joc('memory', False, nivell); par.avanca(3500)
        emojis = par.js("[...document.querySelectorAll('#memory-grid .carta')].map(c => c.querySelector('.carta-davant').textContent)")
        ja = set()
        for ronda in range(40):
            lliures = [i for i in range(len(emojis)) if not par.js(f"document.querySelectorAll('#memory-grid .carta')[{i}].classList.contains('girada')")]
            if len(lliures) < 2: break
            a = random.choice(lliures); coincidents = [i for i in lliures if i != a and emojis[i] == emojis[a]]
            b = coincidents[0] if (coincidents and ronda % 2 == 0) else random.choice([i for i in lliures if i != a])
            for idx in (a, b):
                par.js(f"document.querySelectorAll('#memory-grid .carta')[{idx}].click()"); par.avanca(120)
                actives = par.animacions_actives()
                extra = [x for x in actives if 'carta' in x['cls'] and x['id'].isdigit() and int(x['id']) not in (a, b)]
                if extra: errors.append(f'Memory nivell {nivell}: s\'anima una carta que no s\'ha tocat: {extra[:2]}')
            par.avanca(1300)
            # en repòs: les cartes ja encertades no s'han de tornar a animar mai
            quietes = [x for x in par.animacions_actives() if x['id'] and 'encertada' in x['cls']]
            par.pg.wait_for_timeout(700)       # temps REAL: les transicions CSS no depenen del rellotge fals
            quietes = [x for x in par.animacions_actives() if 'carta' in x['cls']]
            if quietes: errors.append(f'Memory nivell {nivell}: animacions en repòs {quietes[:3]}')
            if emojis[a] == emojis[b]: ja.update((a, b))
        # clics ràpids: mai més de 2 cartes girades i no encertades alhora
        par.js("mostrarPantalla('inici')"); par.obre_joc('memory', False, 1)
        for rep in range(30):
            idxs = [random.randrange(16) for _ in range(5)]
            par.js("(idxs => idxs.forEach(i => { const c = document.querySelectorAll('#memory-grid .carta')[i]; c.click(); c.click(); }))(" + json.dumps(idxs) + ")")
            girades = par.js("document.querySelectorAll('#memory-grid .carta.girada:not(.encertada)').length")
            if girades > 2: errors.append(f'Memory: {girades} cartes girades alhora després de tocs ràpids')
            par.avanca(1200)
        if par.errors: errors.append('errors de consola: ' + str(par.errors[:3]))
        par.tanca()
    return errors


def prova_pulsos(p, joc):
    """Les animacions infinites (pistes) no s'han de reiniciar en repintar: mateix element = mateix startTime."""
    errors = []; par = Partida(p)
    par.obre_joc(joc, False, 0); par.avanca(1500)
    rng = random.Random(3)
    for passa in range(25):
        abans = par.js("""() => { const m = {}; document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity).forEach(a => { const t = a.effect.target; const k = (t.closest('[data-f]') ? t.closest('[data-f]').dataset.f + ',' + t.closest('[data-f]').dataset.c : t.closest('[data-i]') ? 'i' + t.closest('[data-i]').dataset.i : t.className); m[k] = a.startTime; }); return m; }""")
        if joc == 'dames':
            n = par.js("document.querySelectorAll('#dames-tauler .casella.possible').length")
            if n: par.js(f"document.querySelectorAll('#dames-tauler .casella.possible')[0].click()"); par.avanca(900)
            else:
                m = par.js("document.querySelectorAll('#dames-tauler .casella.movible').length")
                if m: par.js(f"document.querySelectorAll('#dames-tauler .casella.movible')[{rng.randrange(m)}].click()")
                par.avanca(150)
        else:
            n = par.js("document.querySelectorAll('#domino-ma .fitxa:not(.disabled)').length")
            if par.js("document.getElementById('domino-costats').classList.contains('visible')"): par.js("document.querySelector('#domino-costats button').click()"); par.avanca(900)
            elif n: par.js("document.querySelector('#domino-ma .fitxa:not(.disabled)').click()"); par.avanca(900)
            else: par.avanca(1500)
        despres = par.js("""() => { const m = {}; document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity).forEach(a => { const t = a.effect.target; const k = (t.closest('[data-f]') ? t.closest('[data-f]').dataset.f + ',' + t.closest('[data-f]').dataset.c : t.closest('[data-i]') ? 'i' + t.closest('[data-i]').dataset.i : t.className); m[k] = a.startTime; }); return m; }""")
        reiniciades = [k for k in abans if k in despres and abans[k] != despres[k]]
        if reiniciades and passa > 0: errors.append(f'{joc}: animació infinita reiniciada sense canviar l\'element {reiniciades[:3]}')
        if par.acabada(): break
    if par.errors: errors.append('errors de consola: ' + str(par.errors[:3]))
    par.tanca(); return errors


# ---------------------------------------------------------------- estrès
def estres_joc(p, joc):
    errors = []; par = Partida(p)
    try:
        par.obre_joc(joc, False, None); par.avanca(600)
        # 1) girar el mòbil i canviar la mida de la lletra a mig joc
        par.pg.set_viewport_size({'width': 740, 'height': 360}); par.avanca(300)
        par.js("aplicarZoom('gegant')"); par.avanca(300); par.js("aplicarZoom('normal')")
        par.pg.set_viewport_size({'width': 390, 'height': 844}); par.avanca(300)
        d = par.js("(() => { scrollTo(0, 400); const y = scrollY; scrollTo(0, 0); return y; })()")
        if d: errors.append(f'{joc}: hi ha scroll després de girar/canviar la lletra')
        # 2) pausa i represa: els temporitzadors es retomen i no es dupliquen
        par.js("pausarJoc()"); par.avanca(3000)
        if par.js("_timers.size") and not par.js("enPausa"): errors.append(f'{joc}: pausa sense aturar temporitzadors')
        par.js("reprendreJoc()"); par.avanca(300)
        # 3) botó «enrere» del navegador a mig joc → demana confirmació (si la partida és en curs) o surt net
        par.js("document.querySelector('#joc-" + joc + " .joc-cos').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))")
        par.js("history.back()"); par.avanca(500)
        if par.js("document.querySelector('.screen.active').id") == 'joc-' + joc and not par.js("document.getElementById('modalConfirm').classList.contains('actiu')"):
            errors.append(f'{joc}: «enrere» del navegador no demana confirmació a mig joc')
        par.js("document.getElementById('modalConfirm').classList.contains('actiu') && confirmarAccio()"); par.avanca(500)
        # 4) sortir: cap temporitzador orfe, cap veu ni so en marxa
        par.js("mostrarPantalla('inici')"); par.avanca(300)
        timers = par.js("_timers.size")
        if timers: errors.append(f'{joc}: queden {timers} temporitzadors en sortir')
        if par.js("window.speechSynthesis ? speechSynthesis.speaking : false"): errors.append(f'{joc}: la veu continua en sortir')
        # 5) tornar a entrar i sortir 5 vegades seguides
        for _ in range(5):
            par.obre_joc(joc, False, None); par.js("mostrarPantalla('menuJocs')"); par.avanca(100)
        if par.js("_timers.size"): errors.append(f'{joc}: temporitzadors orfes després d\'entrar/sortir 5 cops')
        if par.errors: errors.append(f'{joc}: errors de consola {par.errors[:2]}')
    except Exception as e:
        errors.append(f'{joc}: EXCEPCIÓ {type(e).__name__}: {str(e)[:160]}')
    par.tanca(); return errors


def estres_tot(p):
    errs = []
    for j in BOTS:
        if j == 'bingo': continue
        errs += estres_joc(p, j)
    return errs


# ---------------------------------------------------------------- execució
def un_joc(args):
    joc, n = args
    r = subprocess.run([sys.executable, str(pathlib.Path(__file__)), '--joc', joc, '--n', str(n), '--json'], capture_output=True, text=True, encoding='utf-8')
    try: return json.loads(r.stdout.strip().splitlines()[-1])
    except Exception: return {'joc': joc, 'partides': n, 'acabades': 0, 'no_acabades': n, 'errors': ['no s\'ha pogut executar: ' + (r.stderr or r.stdout)[-300:]]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--joc'); ap.add_argument('--n', type=int, default=100); ap.add_argument('--tot', action='store_true')
    ap.add_argument('--animacions', action='store_true'); ap.add_argument('--estres', action='store_true'); ap.add_argument('--json', action='store_true')
    ap.add_argument('--fils', type=int, default=4)
    a = ap.parse_args(); resultats = {}; tots_errors = []
    if a.joc and a.json:
        print(json.dumps(jocs_partides(a.joc, a.n))); return 0
    if a.joc:
        r = jocs_partides(a.joc, a.n); resultats['partides'] = [r]; tots_errors += r['errors']
        print(f"{r['joc']}: {r['acabades']}/{r['partides']} acabades, {len(r['errors'])} errors, sense acabar: {r.get('llista_no')}")
    if a.tot:
        with ThreadPoolExecutor(a.fils) as ex: llista = list(ex.map(un_joc, [(j, a.n) for j in BOTS]))
        resultats['partides'] = llista
        for r in llista:
            print(f"{r['joc']:10s} {r['acabades']:3d}/{r['partides']} acabades · {r['no_acabades']} sense acabar {r.get('llista_no', [])[:4]} · {len(r['errors'])} errors"); tots_errors += r['errors']
    if a.animacions or a.tot:
        with sync_playwright() as p:
            e = prova_animacions_memory(p) + prova_pulsos(p, 'dames') + prova_pulsos(p, 'domino')
        resultats['animacions'] = e; tots_errors += e; print('animacions:', 'cap problema' if not e else e)
    if a.estres or a.tot:
        with sync_playwright() as p: e = estres_tot(p)
        resultats['estres'] = e; tots_errors += e; print('estrès:', 'cap problema' if not e else e)
    (pathlib.Path(__file__).parent / 'resultats.json').write_text(json.dumps(resultats, ensure_ascii=False, indent=1), encoding='utf-8')
    for e in tots_errors[:60]: print(' ✗', e)
    print('\nRESULTAT:', 'TOT CORRECTE' if not tots_errors else f'{len(tots_errors)} errors')
    return 1 if tots_errors else 0


if __name__ == '__main__':
    sys.exit(main())
