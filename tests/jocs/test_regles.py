"""Proves de REGLES i de contingut dels jocs, amb una implementació independent a Python.
  · Dames: els moviments permesos (captura obligatòria, caps de fila, dames) i les jugades de l'ordinador es comproven contra una altra implementació.
  · Dòmino: conservació de les 28 fitxes i només s'activen les fitxes que encaixen.
  · Sudoku: solució única.  · Càlcul: cada resposta correcta es recalcula.  · Bancs de preguntes: integritat.
  · N-back, Stroop i Span: l'encert/error que mostra el joc es recalcula a partir del que es veu a pantalla.
Ús: python tests/jocs/test_regles.py [--n 20]"""
import argparse, json, random, re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from playwright.sync_api import sync_playwright
from comu import Partida
import bots

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

# ----------------------------------------------------------------------- Dames (implementació independent)
N = 8
def dins(f, c): return 0 <= f < N and 0 <= c < N
def dirs(v): return [(-1, -1), (-1, 1), (1, -1), (1, 1)] if abs(v) == 2 else ([(-1, -1), (-1, 1)] if v > 0 else [(1, -1), (1, 1)])
def ultima(v): return 0 if v > 0 else N - 1
def sgn(x): return (x > 0) - (x < 0)
def captures(t, f, c, v, cami, caps, sortida):
    estesa = False
    for df, dc in dirs(v):
        mf, mc, tf, tc = f + df, c + dc, f + 2 * df, c + 2 * dc
        if not dins(tf, tc): continue
        mig = t[mf * N + mc]
        if mig == 0 or sgn(mig) == sgn(v) or (mf * N + mc) in caps or t[tf * N + tc] != 0: continue
        estesa = True
        nc, ncaps = cami + [(tf, tc)], caps + [mf * N + mc]
        if abs(v) == 1 and tf == ultima(v): sortida.append((nc, ncaps))
        else: captures(t, tf, tc, v, nc, ncaps, sortida)
    if not estesa and caps: sortida.append((cami, caps))
def moviments(t, color):
    caps, simples = [], []
    for f in range(N):
        for c in range(N):
            v = t[f * N + c]
            if not v or sgn(v) != color: continue
            t2 = list(t); t2[f * N + c] = 0
            captures(t2, f, c, v, [(f, c)], [], caps)
            for df, dc in dirs(v):
                if dins(f + df, c + dc) and t[(f + df) * N + c + dc] == 0: simples.append(([(f, c), (f + df, c + dc)], []))
    return caps if caps else simples
def aplica(t, mv):
    cami, caps = mv; (f0, c0), (f1, c1) = cami[0], cami[-1]
    t = list(t); v = t[f0 * N + c0]; t[f0 * N + c0] = 0
    for i in caps: t[i] = 0
    if abs(v) == 1 and f1 == ultima(v): v *= 2
    t[f1 * N + c1] = v; return t

LLEGEIX_TAULER = """() => [...document.querySelectorAll('#dames-tauler .casella')].map((e, i) => { const p = e.querySelector('.peca'); if (!p) return 0; const rei = p.classList.contains('rei'); return (p.classList.contains('blanca') ? 1 : -1) * (rei ? 2 : 1); })"""
def tauler(par): return par.js(LLEGEIX_TAULER)
def origens_dom(par): return set(map(tuple, par.js("[...document.querySelectorAll('#dames-tauler .casella.movible')].map(e => [+e.dataset.f, +e.dataset.c])")))
def possibles_dom(par): return set(map(tuple, par.js("[...document.querySelectorAll('#dames-tauler .casella.possible')].map(e => [+e.dataset.f, +e.dataset.c])")))

def prova_dames(p, partides):
    errors = []
    for k in range(partides):
        par = Partida(p); rng = random.Random(k)
        par.obre_joc('dames', False, k % 3)
        for pas in range(300):
            if par.acabada(): break
            t = tauler(par)
            if len(t) != 64 or any(t[i] and (i // 8 + i % 8) % 2 == 0 for i in range(64)): errors.append(f'dames #{k}: peces en caselles clares o tauler incomplet'); break
            if sum(1 for v in t if v > 0) > 12 or sum(1 for v in t if v < 0) > 12: errors.append(f'dames #{k}: més de 12 peces'); break
            legals = moviments(t, 1); orig_py = {m[0][0] for m in legals}
            dom = origens_dom(par)
            if dom:
                if dom != orig_py: errors.append(f'dames #{k} pas {pas}: orígens del joc {sorted(dom)} ≠ regles {sorted(orig_py)}'); break
                f, c = sorted(dom)[rng.randrange(len(dom))]
                par.js(f"document.querySelector('#dames-tauler [data-f=\"{f}\"][data-c=\"{c}\"]').click()"); par.avanca(60)
                pos = possibles_dom(par); esperats = {m[0][1] for m in legals if m[0][0] == (f, c)}
                if pos != esperats: errors.append(f'dames #{k} pas {pas}: destinacions del joc {sorted(pos)} ≠ regles {sorted(esperats)}'); break
                # tria una destinació i, si la captura continua, la resta de passos
                cami_tria = rng.choice([m for m in legals if m[0][0] == (f, c)]); passos = cami_tria[0][1:]
                for (pf, pc) in passos:
                    par.js(f"document.querySelector('#dames-tauler [data-f=\"{pf}\"][data-c=\"{pc}\"]').click()"); par.avanca(80)
                esperat = aplica(t, cami_tria)
                par.avanca(50); despres = tauler(par)
                # l'ordinador pot haver respost ja: només comprovem el tauler just després de la jugada humana quan el joc encara espera
                par.avanca(1200); final = tauler(par)
                negres = moviments(esperat, -1)
                if final != esperat:
                    if not any(final == aplica(esperat, m) for m in negres): errors.append(f'dames #{k} pas {pas}: jugada de l\'ordinador il·legal'); break
            else:
                par.avanca(1300)
        par.tanca()
    return errors

# ----------------------------------------------------------------------- Dòmino
def prova_domino(p, partides):
    errors = []
    for k in range(partides):
        par = Partida(p); rng = random.Random(100 + k); par.obre_joc('domino', False, k % 3)
        for pas in range(400):
            if par.acabada(): break
            m = par.js("[+document.getElementById('domino-ma-count').textContent, +document.getElementById('domino-ia-count').textContent, +document.getElementById('domino-pou').textContent, document.querySelectorAll('#domino-tauler .fitxa').length]")
            if sum(m) != 28: errors.append(f'domino #{k} pas {pas}: les fitxes no sumen 28 {m}'); break
            ext = par.js("document.getElementById('domino-extrems').textContent")
            esq, dret = [int(x) for x in re.findall(r'\d', ext)][:2]
            valides = par.js("[...document.querySelectorAll('#domino-ma .fitxa:not(.disabled)')].map(b => [...b.querySelectorAll('.meitat')].map(h => h.querySelectorAll('i.on').length))")
            for a, b in valides:
                if not ({a, b} & {esq, dret}): errors.append(f'domino #{k}: s\'activa la fitxa {a}-{b} que no encaixa amb {esq}·{dret}'); break
            if par.js("document.getElementById('domino-costats').classList.contains('visible')"): par.js("document.querySelectorAll('#domino-costats button')[%d].click()" % rng.randrange(2)); par.avanca(900); continue
            n = par.js("document.querySelectorAll('#domino-ma .fitxa:not(.disabled)').length")
            if n: par.js("document.querySelectorAll('#domino-ma .fitxa:not(.disabled)')[%d].click()" % rng.randrange(n)); par.avanca(900)
            else: par.avanca(1500)
        par.tanca()
    return errors

# ----------------------------------------------------------------------- Sudoku, càlcul, bancs
def prova_sudoku(p, n):
    errors = []; par = Partida(p)
    for k in range(n):
        par.obre_joc('sudoku', False, k % 3)
        r = par.js("""() => { const cel = [...document.querySelectorAll('#sudoku-grid .sudoku-cell')], N = Math.round(Math.sqrt(cel.length));
          let bc = N, br = N; cel.forEach((e, i) => { const f = Math.floor(i / N), c = i % N; if (e.classList.contains('bd-dret') && c + 1 < bc) bc = c + 1; if (e.classList.contains('bd-baix') && f + 1 < br) br = f + 1; });
          const g = cel.map(e => parseInt(e.textContent) || 0);
          const val = (i, v) => { const f = Math.floor(i / N), c = i % N; for (let k = 0; k < N; k++) if (g[f * N + k] === v || g[k * N + c] === v) return false; const f0 = f - f % br, c0 = c - c % bc; for (let a = 0; a < br; a++) for (let b = 0; b < bc; b++) if (g[(f0 + a) * N + c0 + b] === v) return false; return true; };
          let sols = 0; const rec = () => { if (sols > 1) return; const i = g.indexOf(0); if (i < 0) { sols++; return; } for (let v = 1; v <= N; v++) if (val(i, v)) { g[i] = v; rec(); g[i] = 0; } }; rec();
          // les pistes inicials no es poden contradir entre elles
          const orig = cel.map(e => parseInt(e.textContent) || 0); let conflicte = false; orig.forEach((v, i) => { if (v) { g[i] = 0; if (!val(i, v)) conflicte = true; g[i] = v; } });
          return { N, sols, conflicte, buides: orig.filter(v => !v).length }; }""")
        if r['sols'] != 1: errors.append(f'sudoku #{k}: {r["sols"]} solucions (ha de ser exactament 1)')
        if r['conflicte']: errors.append(f'sudoku #{k}: pistes inicials en conflicte')
    par.tanca(); return errors

def prova_calcul(p, n):
    errors = []; par = Partida(p)
    mostres = par.js("(() => Array.from({length: %d}, () => calculGenerar()))()" % 0) if False else None
    par.js("assegurarJoc('calcul')"); par.pg.wait_for_function("typeof calculGenerar === 'function'", timeout=8000, polling=50)
    qs = par.js("Array.from({ length: %d }, () => calculGenerar())" % n)
    eur = lambda x: f'{x:.2f}'.replace('.', ',') + ' €'
    for q in qs:
        t = q['q']; resposta = q['o'][q['c']]
        m1 = re.match(r'Si un producte costa ([\d,]+) €, quant costen (\d+) unitats\?', t); m2 = re.match(r'Pagues amb (\d+) € un producte de ([\d,]+) €\. Quant et tornen\?', t)
        m3 = re.match(r'Un producte de (\d+) € té un (\d+)% de descompte\. Quant pagues\?', t); m4 = re.match(r'(\d+) \+ (\d+) = \?', t)
        num = lambda s: float(s.replace(',', '.'))
        if m1: esp = eur(round(num(m1.group(1)) * int(m1.group(2)), 2))
        elif m2: esp = eur(round(int(m2.group(1)) - num(m2.group(2)), 2))
        elif m3: esp = eur(round(int(m3.group(1)) * (100 - int(m3.group(2))) / 100, 2))
        elif m4: esp = str(int(m4.group(1)) + int(m4.group(2)))
        else: errors.append(f'càlcul: pregunta no reconeguda «{t}»'); continue
        if resposta != esp: errors.append(f'càlcul: «{t}» → el joc marca {resposta} però és {esp}')
        if len(set(q['o'])) != len(q['o']): errors.append(f'càlcul: opcions repetides a «{t}»')
    par.tanca(); return errors

def prova_bancs(p):
    errors = []; par = Partida(p)
    for j in ('tertulia', 'refranys', 'paraules', 'seqlog', 'quefalta'):
        par.js(f"assegurarJoc('{j}')")
    par.pg.wait_for_function("typeof BARALLA_TERTULIA !== 'undefined' && typeof BARALLA_REFRANYS !== 'undefined' && typeof BARALLA_PARAULES !== 'undefined' && typeof seqlogGenerar === 'function'", timeout=8000, polling=50)
    ter = par.js("BARALLA_TERTULIA"); ref = par.js("BARALLA_REFRANYS"); par_ = par.js("BARALLA_PARAULES")
    vistes = set()
    for i, q in enumerate(ter):
        if q['q'] in vistes: errors.append(f'tertúlia: pregunta repetida «{q["q"]}»')
        vistes.add(q['q'])
        if not (0 <= q['c'] < len(q['o'])) or len(set(q['o'])) != len(q['o']) or any(not o.strip() for o in q['o']): errors.append(f'tertúlia #{i}: opcions invàlides «{q["q"]}»')
    vi = set()
    for i, r in enumerate(ref):
        if r['inici'] in vi: errors.append(f'refranys: inici repetit «{r["inici"]}»')
        vi.add(r['inici'])
        if r['correcta'] in r['falses'] or len(set(r['falses'])) != len(r['falses']) or not r['correcta'].strip(): errors.append(f'refranys #{i}: opcions invàlides «{r["inici"]}»')
    vp = set()
    for w in par_:
        if not re.fullmatch(r"[A-ZÀÈÉÍÒÓÚÇÏÜ]+", w['paraula']): errors.append(f'paraules: caràcters no vàlids a «{w["paraula"]}»')
        if w['paraula'] in vp or not w['pista'].strip(): errors.append(f'paraules: repetida o sense pista «{w["paraula"]}»')
        vp.add(w['paraula'])
    qs = par.js("Array.from({ length: 1500 }, () => seqlogGenerar())")
    for q in qs:
        if len(set(q['o'])) != 4 or any(int(x) <= 0 for x in q['o']) or '?' not in q['q']: errors.append(f'seqlog: pregunta invàlida {q}'); break
    par.tanca(); return errors

# ----------------------------------------------------------------------- N-back, Stroop, Span: l'encert que mostra el joc coincideix amb el que es veu
def prova_nback(p, partides):
    errors = []
    for k in range(partides):
        par = Partida(p); rng = random.Random(7 + k); nivell = k % 3; n = [1, 2, 3][nivell]
        par.obre_joc('nback', False, nivell)
        par.js("window._nb = []; new MutationObserver(() => { const t = document.getElementById('nback-display').textContent; if (/^[A-L]$/.test(t)) window._nb.push(t); }).observe(document.getElementById('nback-display'), { childList: true, characterData: true, subtree: true })")
        par.js("document.getElementById('nback-iniciar').click()")
        for pas in range(400):
            if par.acabada(): break
            par.avanca(100)
            if par.js("document.getElementById('nback-btn-igual').disabled"): continue
            lletres = par.js("window._nb")
            esperat_igual = len(lletres) > n and lletres[-1] == lletres[-1 - n]
            diu_igual = rng.random() < .5
            par.js(f"document.getElementById('{'nback-btn-igual' if diu_igual else 'nback-btn-diferent'}').click()")
            fb = par.js("document.getElementById('nback-feedback').className")
            if ('correcte' in fb.split()) != (diu_igual == esperat_igual): errors.append(f'nback n={n}: lletres {lletres[-n - 1:]}; ha dit {"igual" if diu_igual else "diferent"} i el joc ho puntua «{fb}»')
            par.avanca(1000)
        par.tanca()
    return errors

def prova_stroop(p, partides):
    errors = []; colors = {'VERMELL': 'rgb(217, 79, 79)', 'VERD': 'rgb(46, 139, 87)', 'BLAU': 'rgb(58, 134, 200)', 'GROC': 'rgb(224, 168, 0)'}
    for k in range(partides):
        par = Partida(p); rng = random.Random(40 + k); par.obre_joc('stroop'); par.js("document.getElementById('stroop-iniciar').click()")
        for pas in range(18):
            if par.acabada(): break
            tinta = par.js("getComputedStyle(document.getElementById('stroop-paraula')).color"); noms = par.js("[...document.querySelectorAll('#stroop-botons .stroop-btn')].map(b => b.dataset.c)")
            if not noms: par.avanca(300); continue
            esperat = next((n for n, c in colors.items() if c == tinta), None)
            if esperat is None: errors.append(f'stroop: color de tinta desconegut {tinta}'); break
            tria = esperat if rng.random() < .5 else rng.choice([x for x in noms if x != esperat])
            par.js(f"document.querySelector('#stroop-botons [data-c=\"{tria}\"]').click()")
            fb = par.js("document.getElementById('stroop-feedback').className")
            if ('correcte' in fb.split()) != (tria == esperat): errors.append(f'stroop: tinta {esperat}, ha triat {tria}, puntuació «{fb}»')
            par.avanca(800)
        par.tanca()
    return errors

def prova_span(p, partides):
    errors = []
    for k in range(partides):
        par = Partida(p); rng = random.Random(70 + k); par.obre_joc('span'); par.js("document.getElementById('span-iniciar').click()")
        digits, passes = [], 0
        while not par.js("document.querySelectorAll('#span-input .span-tap').length") and passes < 300:
            par.avanca(100); passes += 1
            d = par.js("(() => { const e = document.querySelector('#span-display .span-digit.gran'); if (e && !e._vist) { e._vist = 1; return e.textContent; } return null; })()")
            if d is not None: digits.append(d)
        if len(digits) != 3: errors.append(f'span: al nivell 3 s\'han mostrat {len(digits)} dígits {digits}')
        correcte = rng.random() < .5; ent = list(digits)
        if not correcte: ent[-1] = str((int(ent[-1]) + 1) % 10)
        for d in ent: par.js(f"document.querySelector('#span-input [data-d=\"{d}\"]').click()"); par.avanca(40)
        fb = par.js("document.getElementById('span-feedback').className"); par.avanca(300)
        if ('correcte' in fb.split()) != correcte: errors.append(f'span: seqüència {digits}, entrada {ent}, puntuació «{fb}»')
        par.tanca()
    return errors

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--n', type=int, default=12); a = ap.parse_args(); errors = []
    with sync_playwright() as p:
        for nom, fn in [('dames', lambda: prova_dames(p, a.n)), ('domino', lambda: prova_domino(p, a.n)), ('sudoku', lambda: prova_sudoku(p, a.n * 3)), ('càlcul', lambda: prova_calcul(p, 600)),
                        ('bancs de contingut', lambda: prova_bancs(p)), ('n-back', lambda: prova_nback(p, 3)), ('stroop', lambda: prova_stroop(p, 4)), ('span', lambda: prova_span(p, 10))]:
            e = fn(); errors += e; print(f'{nom:20s}', 'correcte' if not e else f'{len(e)} errors'); [print('   ✗', x) for x in e[:5]]
    print('\nRESULTAT:', 'TOT CORRECTE' if not errors else f'{len(errors)} errors')
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main())
