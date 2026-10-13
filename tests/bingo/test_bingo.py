"""Proves del Bingo de 90 boles: cartrons vàlids (10 000), bombo complet i sense repeticions, números en català,
cantades falses i certes, premis en ordre (línia → bingo), rivals que acaben la partida i 2 jugadors.
Ús: python tests/bingo/test_bingo.py"""
import sys, pathlib, random
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'jocs'))
from playwright.sync_api import sync_playwright
from comu import Partida
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

errors = []
def comprova(cond, msg):
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: errors.append(msg)

LLEGEIX_CARTRO = """() => { const g = {}; document.querySelectorAll('#bingo-cartrons .bingo-grid').forEach(gr => { const m = [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]];
  gr.querySelectorAll('[data-n]').forEach(b => { m[+b.style.getPropertyValue('--f') - 1][+b.style.getPropertyValue('--c') - 1] = +b.dataset.n; }); g[gr.dataset.p + '_' + gr.dataset.k] = m; }); return g; }"""
SORTITS = "[...document.querySelectorAll('#bingo-taulell-graella .tau-n.sortit')].map(e => +e.textContent)"

def prova_generador(p):
    par = Partida(p); par.js("assegurarJoc('bingo')"); par.pg.wait_for_function("typeof BINGO !== 'undefined'", timeout=8000, polling=50)
    r = par.js("""() => { let mal = []; for (let i = 0; i < 10000; i++) { const c = BINGO.generaCartro(), nums = c.flat().filter(Boolean);
      if (c.length !== 3 || c.some(f => f.length !== 9)) mal.push('forma'); if (nums.length !== 15) mal.push('15 números'); if (new Set(nums).size !== 15) mal.push('repetits');
      c.forEach(f => { if (f.filter(Boolean).length !== 5) mal.push('5 per fila'); });
      for (let col = 0; col < 9; col++) { const ini = col === 0 ? 1 : col * 10, fi = col === 8 ? 90 : col * 10 + 9, v = c.map(f => f[col]).filter(Boolean);
        if (v.length < 1 || v.length > 3) mal.push('1-3 per columna'); if (v.some(n => n < ini || n > fi)) mal.push('rang columna ' + col); if (v.some((n, k) => k && n <= v[k - 1])) mal.push('ordre'); } }
      return [...new Set(mal)]; }""")
    comprova(not r, '10 000 cartrons 3×9 vàlids' + (f' (errors: {r})' if r else ''))
    n = par.js("[21, 31, 11, 90, 17, 45, 1, 80].map(BINGO.numeroCatala)")
    comprova(n == ['vint-i-un', 'trenta-un', 'onze', 'noranta', 'disset', 'quaranta-cinc', 'un', 'vuitanta'], f'números en català ({n})')
    par.tanca()

def configura(par, ajuda='sol', vel='manual', cartrons=1, rivals=0, dos=False):
    par.obre_joc('bingo', dos)
    if not dos: par.js(f"bingoOpcio.cartrons('{cartrons}'); bingoOpcio.rivals('{rivals}')")
    par.js(f"bingoOpcio.ajuda('{ajuda}'); bingoOpcio.velocitat('{vel}')")
    par.js("document.getElementById('bingo-comencar').click()"); par.avanca(300)

def prova_bombo_i_cantades(p):
    par = Partida(p); configura(par)
    comprova(par.js("document.getElementById('bingo-bingo').click(); document.getElementById('bingo-feedback').textContent").startswith('Encara no'), 'BINGO! sense tenir-lo és una cantada falsa')
    vistes = []; linia_ok = False; bingo_fet = False
    for k in range(95):
        if par.acabada(): break
        par.js("document.getElementById('bingo-seguent').click()"); par.avanca(100)
        t = par.js("document.getElementById('bingo-numero').textContent")
        if t.isdigit(): vistes.append(int(t))
        sort = set(par.js(SORTITS)); cart = list(par.js(LLEGEIX_CARTRO).values())[0]
        for f in cart:   # marca
            for n in f:
                if n in sort: par.js(f"document.querySelector('#bingo-cartrons [data-n=\"{n}\"]').click()") if not par.js(f"document.querySelector('#bingo-cartrons [data-n=\"{n}\"]').classList.contains('marcada')") else None
        fila_feta = any(all(n in sort for n in f if n) for f in cart); tot = all(n in sort for f in cart for n in f if n)
        fase = par.js("document.getElementById('bingo-premi').textContent")
        if fila_feta and 'LÍNIA' in fase:
            par.js("document.getElementById('bingo-linia').click()"); par.avanca(100); linia_ok = 'BINGO' in par.js("document.getElementById('bingo-premi').textContent")
            # bingo abans d'hora = fals
            if not tot: comprova(par.js("document.getElementById('bingo-bingo').click(); document.getElementById('bingo-feedback').textContent").startswith('Encara no'), 'BINGO! amb només una línia és fals')
        if tot and not par.acabada(): par.js("document.getElementById('bingo-bingo').click()"); par.avanca(900); bingo_fet = par.acabada(); break
    comprova(len(vistes) == len(set(vistes)), f'cap bola repetida ({len(vistes)} boles)')
    comprova(linia_ok, 'cantar LÍNIA vàlida porta al premi BINGO')
    comprova(bingo_fet, 'cantar BINGO vàlid acaba la partida')
    par.tanca()
    # bombo complet: 90 boles diferents
    par = Partida(p); configura(par, rivals=0, ajuda='auto'); vistes = []
    for k in range(90): par.js("document.getElementById('bingo-seguent').click()"); par.avanca(60); t = par.js("document.getElementById('bingo-numero').textContent"); vistes.append(int(t)) if t.isdigit() else None
    comprova(sorted(set(vistes)) == list(range(1, 91)) or par.acabada(), 'el bombo té 90 boles diferents (o la partida acaba abans amb bingo)')
    par.tanca()

def prova_rivals(p):
    acabades = 0
    for k in range(8):
        par = Partida(p); configura(par, ajuda='sol', vel='rapida', cartrons=1, rivals=3)
        for _ in range(300):
            if par.acabada(): break
            par.avanca(1000)
        txt = par.js("document.getElementById('bingo-feedback').textContent"); acabades += par.acabada() and 'BINGO' in txt
        par.tanca()
    comprova(acabades == 8, f'amb 3 rivals i sense cantar, la partida acaba sempre amb un BINGO rival ({acabades}/8)')
    par = Partida(p); configura(par, ajuda='sol', vel='rapida', cartrons=1, rivals=2); vist_linia = False
    for _ in range(300):
        if par.acabada(): break
        par.avanca(1000); vist_linia = vist_linia or 'ha cantat línia' in par.js("document.getElementById('bingo-feedback').textContent") or 'BINGO' in par.js("document.getElementById('bingo-premi').textContent")
    comprova(vist_linia, 'els rivals canten línia abans del bingo'); par.tanca()

def prova_dos(p):
    par = Partida(p); configura(par, ajuda='ajuda', vel='rapida', dos=True)
    comprova(par.js("document.querySelectorAll('#bingo-cartrons .bingo-grid').length") == 2, 'a 2 jugadors es veuen dos cartrons')
    for _ in range(300):
        if par.acabada(): break
        par.avanca(900)
        par.js("""() => { const s = new Set([...document.querySelectorAll('#bingo-taulell-graella .tau-n.sortit')].map(e => e.textContent));
          document.querySelectorAll('#bingo-cartrons .bingo-casella:not(.marcada)').forEach(b => { if (s.has(b.dataset.n)) b.click(); }); document.querySelectorAll('[data-canto]').forEach(b => b.click()); }""")
    comprova(par.acabada(), 'la partida de 2 jugadors acaba amb un guanyador'); par.tanca()

def prova_sense_orfes(p):
    par = Partida(p); configura(par, vel='rapida', rivals=2); par.avanca(4000)
    par.js("anarAInici()"); par.avanca(500)
    comprova(par.js("_timers.size") == 0, 'en sortir del Bingo no queden temporitzadors orfes'); par.tanca()

if __name__ == '__main__':
    with sync_playwright() as p:
        for f in (prova_generador, prova_bombo_i_cantades, prova_rivals, prova_dos, prova_sense_orfes):
            print('·', f.__name__); f(p)
    print('\nRESULTAT:', 'TOT CORRECTE' if not errors else f'{len(errors)} errors'); sys.exit(1 if errors else 0)
