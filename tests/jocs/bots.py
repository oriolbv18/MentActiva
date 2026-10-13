"""Jugadors automàtics (bots) de cada joc. Juguen partides senceres amb el rellotge fals de Playwright.
Cada funció rep la Partida (navegador), un generador aleatori i el mode (dos jugadors / nivell)."""


def clica(par, selector, k=0):
    par.js(f"document.querySelectorAll({selector!r})[{k}].click()")


def compta(par, selector):
    return par.js(f"document.querySelectorAll({selector!r}).length")


def visible(par, id_):
    return par.js(f"(() => {{ const e = document.getElementById({id_!r}); return !!e && getComputedStyle(e).display !== 'none'; }})()")


# ---------- Jocs de preguntes (Tertúlia, Refranys, Càlcul, Seqüències lògiques) ----------
def quiz(par, rng, joc, dos=False, nivell=None):
    for _ in range(60):
        if par.acabada(): break
        n = compta(par, f"#{joc}-opcions .opcio:not(:disabled)")
        if n: clica(par, f"#{joc}-opcions .opcio:not(:disabled)", rng.randrange(n)); par.avanca(80)
        if visible(par, f'{joc}-seguent'): par.js(f"document.getElementById('{joc}-seguent').click()"); par.avanca(60)
    par.avanca(900)


def paraules(par, rng, dos=False, nivell=None):
    for _ in range(600):
        if par.acabada(): break
        n = compta(par, '#paraules-teclat .tecla:not(:disabled)')
        if n: clica(par, '#paraules-teclat .tecla:not(:disabled)', rng.randrange(n)); par.avanca(40)
        elif visible(par, 'paraules-seguent'): par.js("document.getElementById('paraules-seguent').click()"); par.avanca(60)
        else: break
    par.avanca(900)


# ---------- Memory ----------
def memory(par, rng, dos=False, nivell=None):
    par.avanca(3200)                                       # vista prèvia del nivell fàcil
    emojis = par.js("[...document.querySelectorAll('#memory-grid .carta')].map(c => c.querySelector('.carta-davant').textContent)")
    llest = rng.random() < 0.5                             # la meitat de les vegades juga recordant les cartes
    for _ in range(500):
        if par.acabada(): break
        lliures = par.js("[...document.querySelectorAll('#memory-grid .carta')].map((c, i) => c.classList.contains('girada') ? -1 : i).filter(i => i >= 0)")
        if len(lliures) < 2: break
        a = rng.choice(lliures); b = None
        if llest:
            parella = [i for i in lliures if i != a and emojis[i] == emojis[a]]
            b = parella[0] if parella else None
        if b is None: b = rng.choice([i for i in lliures if i != a])
        clica(par, '#memory-grid .carta', a); par.avanca(60); clica(par, '#memory-grid .carta', b); par.avanca(1000)
    par.avanca(900)


# ---------- Recorda la seqüència ----------
def sequencia(par, rng, dos=False, nivell=None):
    for _ in range(4 if dos else 1):
        if par.acabada(): break
        if not visible(par, 'seq-iniciar'): par.avanca(2000)
        par.js("document.getElementById('seq-iniciar').click()")
        encerts_previstos = rng.randint(0, 5)
        for ronda in range(encerts_previstos + 1):
            patro, abans, passes = [], -1, 0
            while par.js("document.getElementById('seq-area').classList.contains('mostrant')") and passes < 600:
                par.avanca(50); passes += 1
                lit = par.js("[...document.getElementById('seq-area').children].findIndex(b => b.classList.contains('encesa'))")
                if lit != -1 and lit != abans: patro.append(lit)
                abans = lit
            if not patro: break
            ultim = ronda == encerts_previstos
            for k, idx in enumerate(patro):
                tria = (idx + 1) % 4 if (ultim and k == len(patro) - 1) else idx
                par.js(f"document.querySelectorAll('#seq-area .seq-boto')[{tria}].click()"); par.avanca(300)
            par.avanca(1500)
            if not par.js("document.querySelector('#joc-sequencia').classList.contains('active')") or par.acabada(): break
        par.avanca(2200)
    par.avanca(900)


# ---------- Dòmino ----------
def domino(par, rng, dos=False, nivell=None):
    for _ in range(700):
        if par.acabada(): break
        if par.js("document.getElementById('domino-costats').classList.contains('visible')"):
            clica(par, '#domino-costats button', rng.randrange(2)); par.avanca(900); continue
        if compta(par, '#domino-ma [data-mostrar]'): par.js("document.querySelector('#domino-ma [data-mostrar]').click()"); par.avanca(100); continue
        n = compta(par, '#domino-ma .fitxa:not(.disabled)')
        if n: clica(par, '#domino-ma .fitxa:not(.disabled)', rng.randrange(n)); par.avanca(900)
        else: par.avanca(1500)
    par.avanca(900)


# ---------- Dames ----------
def dames(par, rng, dos=False, nivell=None):
    for _ in range(900):
        if par.acabada(): break
        if compta(par, '#dames-tauler .casella.possible'): clica(par, '#dames-tauler .casella.possible', rng.randrange(compta(par, '#dames-tauler .casella.possible'))); par.avanca(900); continue
        n = compta(par, '#dames-tauler .casella.movible')
        if n: clica(par, '#dames-tauler .casella.movible', rng.randrange(n)); par.avanca(100)
        else: par.avanca(1300)
    par.avanca(900)


# ---------- Bingo (1 jugador amb rivals, o 2 jugadors) ----------
def bingo(par, rng, dos=False, nivell=None):
    if not dos:
        par.js("bingoOpcio.ajuda(%r); bingoOpcio.velocitat('rapida'); bingoOpcio.cartrons(%r); bingoOpcio.rivals(%r)" % (rng.choice(['sol', 'ajuda', 'auto']), str(rng.randint(1, 3)), str(rng.randint(0, 3))))
    else:
        par.js("bingoOpcio.ajuda(%r); bingoOpcio.velocitat('rapida')" % rng.choice(['sol', 'ajuda']))
    par.js("document.getElementById('bingo-comencar').click()")
    for pas in range(400):
        if par.acabada(): break
        par.avanca(900)
        # marca tot el que ha sortit (taulell) als cartrons visibles
        par.js("""() => { const s = new Set([...document.querySelectorAll('#bingo-taulell-graella .tau-n.sortit')].map(e => e.textContent));
          document.querySelectorAll('#bingo-cartrons .bingo-casella:not(.marcada)').forEach(b => { if (s.has(b.dataset.n)) b.click(); }); }""")
        if rng.random() < .15 and not dos:      # alguna cantada falsa, també cal que l'app ho aguanti
            par.js("document.getElementById('bingo-linia').click()")
        if dos:
            par.js("document.querySelectorAll('[data-canto]').forEach(b => b.click())")
        else:
            par.js("(() => { const l = document.getElementById('bingo-linia'), g = document.getElementById('bingo-bingo'); if (!l.disabled) l.click(); g.click(); })()")
        if not dos and rng.random() < .1: par.js("document.querySelectorAll('#bingo-tabs [data-tab]').forEach((b, i) => i === 1 && b.click())")
    par.avanca(900)


# ---------- Sopa de lletres ----------
SOLUCIONA_SOPA = """() => {
  const cel = [...document.querySelectorAll('#sopa-grid .sopa-casella')], n = Math.round(Math.sqrt(cel.length));
  const g = Array.from({ length: n }, (_, f) => Array.from({ length: n }, (_, c) => cel[f * n + c].textContent));
  const mots = [...document.querySelectorAll('#sopa-paraules .sopa-paraula')].map(e => e.textContent);
  const dirs = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]], res = [];
  mots.forEach(m => { for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) for (const [df, dc] of dirs) {
    let ok = true; for (let i = 0; i < m.length && ok; i++) { const a = f + df * i, b = c + dc * i; ok = a >= 0 && a < n && b >= 0 && b < n && g[a][b] === m[i]; }
    if (ok && !res.find(r => r.m === m)) res.push({ m, f1: f, c1: c, f2: f + df * (m.length - 1), c2: c + dc * (m.length - 1) }); } });
  return { n, res };
}"""


def centre(par, f, c):
    return par.js(f"(() => {{ const r = document.querySelector('#sopa-grid [data-f=\"{f}\"][data-c=\"{c}\"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }})()")


def sopa(par, rng, dos=False, nivell=None):
    sol = par.js(SOLUCIONA_SOPA)
    n = sol['n']
    for _ in range(2):                                      # dos intents equivocats a propòsit
        f1, c1, f2, c2 = rng.randrange(n), rng.randrange(n), rng.randrange(n), rng.randrange(n)
        for f, c in ((f1, c1), (f2, c2)):
            x, y = centre(par, f, c); par.pg.mouse.click(x, y); par.avanca(60)
    par.js("document.querySelectorAll('#sopa-grid .sopa-casella.sel').length")
    for r in sol['res']:
        if par.acabada(): break
        for f, c in ((r['f1'], r['c1']), (r['f2'], r['c2'])):
            x, y = centre(par, f, c); par.pg.mouse.click(x, y); par.avanca(80)
    par.avanca(1200)


# ---------- Sudoku ----------
SOLUCIONA_SUDOKU = """() => {
  const cel = [...document.querySelectorAll('#sudoku-grid .sudoku-cell')], N = Math.round(Math.sqrt(cel.length));
  let bc = N, br = N; cel.forEach((e, i) => { const f = Math.floor(i / N), c = i % N; if (e.classList.contains('bd-dret') && c + 1 < bc) bc = c + 1; if (e.classList.contains('bd-baix') && f + 1 < br) br = f + 1; });
  const g = cel.map(e => parseInt(e.textContent) || 0), orig = g.slice();
  const val = (i, v) => { const f = Math.floor(i / N), c = i % N; for (let k = 0; k < N; k++) { if (g[f * N + k] === v || g[k * N + c] === v) return false; }
    const f0 = f - f % br, c0 = c - c % bc; for (let a = 0; a < br; a++) for (let b = 0; b < bc; b++) if (g[(f0 + a) * N + c0 + b] === v) return false; return true; };
  const rec = () => { const i = g.indexOf(0); if (i < 0) return true; for (let v = 1; v <= N; v++) if (val(i, v)) { g[i] = v; if (rec()) return true; g[i] = 0; } return false; };
  const ok = rec(); return { N, ok, sol: g, buits: orig.map((v, i) => v ? -1 : i).filter(i => i >= 0) };
}"""


def sudoku(par, rng, dos=False, nivell=None, perd=False):
    s = par.js(SOLUCIONA_SUDOKU)
    if not s['ok']: raise RuntimeError('el sudoku generat no té solució')
    buits = s['buits']
    if perd:                                                # tres errors seguits: la partida es perd amb elegància
        i = buits[0]; par.js(f"document.querySelectorAll('#sudoku-grid .sudoku-cell')[{i}].click()")
        for _ in range(3):
            malament = next(v for v in range(1, s['N'] + 1) if v != s['sol'][i])
            par.js(f"document.querySelector('#sudoku-numpad [data-n=\"{malament}\"]').click()"); par.avanca(900)
        par.avanca(1200); return
    equivocat = False
    for i in buits:
        if par.acabada(): break
        par.js(f"document.querySelectorAll('#sudoku-grid .sudoku-cell')[{i}].click()"); par.avanca(30)
        if not equivocat and rng.random() < 0.1:
            malament = next(v for v in range(1, s['N'] + 1) if v != s['sol'][i]); equivocat = True
            par.js(f"document.querySelector('#sudoku-numpad [data-n=\"{malament}\"]').click()"); par.avanca(900)
        par.js(f"document.querySelector('#sudoku-numpad [data-n=\"{s['sol'][i]}\"]').click()"); par.avanca(30)
    par.avanca(1200)


# ---------- N-back, Stroop, Span, Fluïdesa, Què falta ----------
def nback(par, rng, dos=False, nivell=None):
    par.js("document.getElementById('nback-iniciar').click()")
    for _ in range(200):
        if par.acabada(): break
        par.avanca(rng.choice([300, 700, 1200]))
        if not par.js("document.getElementById('nback-btn-igual').disabled"):
            par.js(f"document.getElementById('{rng.choice(['nback-btn-igual', 'nback-btn-diferent'])}').click()")
    par.avanca(1200)


def stroop(par, rng, dos=False, nivell=None):
    par.js("document.getElementById('stroop-iniciar').click()")
    for _ in range(80):
        if par.acabada(): break
        n = compta(par, '#stroop-botons .stroop-btn')
        if n: clica(par, '#stroop-botons .stroop-btn', rng.randrange(n)); par.avanca(800)
        else: par.avanca(300)
    par.avanca(1200)


def span(par, rng, dos=False, nivell=None):
    par.js("document.getElementById('span-iniciar').click()")
    nivells_a_encertar = rng.randint(0, 4)
    for ronda in range(nivells_a_encertar + 1):
        digits, passes = [], 0
        while not compta(par, '#span-input .span-tap') and passes < 400:
            par.avanca(100); passes += 1
            d = par.js("(() => { const e = document.querySelector('#span-display .span-digit.gran'); if (e && !e._vist) { e._vist = 1; return e.textContent; } return null; })()")
            if d is not None: digits.append(d)
        for k, d in enumerate(digits):
            if ronda == nivells_a_encertar and k == len(digits) - 1: d = str((int(d) + 1) % 10)
            par.js(f"document.querySelector('#span-input [data-d=\"{d}\"]').click()"); par.avanca(40)
        par.avanca(1500)
        if par.acabada(): break
    par.avanca(1200)


def fluidesa(par, rng, dos=False, nivell=None):
    par.js("document.getElementById('fluidesa-iniciar').click()"); par.avanca(100)
    for w in ['gos', 'gat', 'aaaa', 'xyz1', 'gos', 'cavall', 'ov', 'ovella', 'tortuga', 'conill', 'òliba', 'ÒLIBA', 'esquirol'][:rng.randint(0, 13)]:
        par.pg.fill('#fluidesa-input', w); par.pg.press('#fluidesa-input', 'Enter'); par.avanca(100)
    par.avanca(61000)


def quefalta(par, rng, dos=False, nivell=None):
    par.js("document.getElementById('qf-iniciar').click()")
    for _ in range(8):
        par.avanca(6600)
        n = compta(par, '#qf-opcions .opcio')
        if n: clica(par, '#qf-opcions .opcio', rng.randrange(n))
        par.avanca(2200)
    par.avanca(1200)


# joc → (funció, admet 2 jugadors, té nivells)
BOTS = {
    'tertulia': (lambda p, r, d=False, n=None: quiz(p, r, 'tertulia', d), True, False),
    'refranys': (lambda p, r, d=False, n=None: quiz(p, r, 'refranys', d), True, False),
    'calcul': (lambda p, r, d=False, n=None: quiz(p, r, 'calcul', d), True, False),
    'seqlog': (lambda p, r, d=False, n=None: quiz(p, r, 'seqlog', d), True, False),
    'paraules': (paraules, True, False),
    'memory': (memory, True, True),
    'sequencia': (sequencia, True, False),
    'domino': (domino, True, True),
    'dames': (dames, True, True),
    'bingo': (bingo, True, False),
    'sopa': (sopa, False, True),
    'sudoku': (sudoku, False, True),
    'nback': (nback, False, True),
    'stroop': (stroop, False, False),
    'span': (span, False, False),
    'fluidesa': (fluidesa, False, False),
    'quefalta': (quefalta, False, False),
}
