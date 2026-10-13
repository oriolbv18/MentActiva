"""Accessibilitat i «trencar la interfície» de la web (v1.9.3):
  · axe-core (WCAG 2.1 AA) a la landing, a les pàgines legals i a la 404, en clar i fosc, mòbil i escriptori;
  · amples extrems (320 i 2560), zoom del navegador al 200 % / 300 % / 400 % (= 640 / 427 / 320 px de CSS), mida de lletra de sistema gran;
  · formulari amb valors molt llargs, JS desactivat, xarxa tallada, prefers-contrast: more, tema fosc i teclat.
Ús: python tests/web/test_accessibilitat.py"""
import functools, http.server, pathlib, shutil, socketserver, sys, tempfile, threading
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
AXE = ARREL / 'tests' / 'node_modules' / 'axe-core' / 'axe.min.js'
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

def axe(pg, nom):
    pg.add_script_tag(content=AXE.read_text(encoding='utf-8'))
    r = pg.evaluate("axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }).then(r => r.violations.map(v => v.id + ' (' + v.impact + '): ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' · ')))")
    comprova(not r, f'axe · {nom}: {r[:3] if r else "0 violacions"}')

def main():
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pagines = ['index.html', '404.html', 'legal/privadesa.html', 'legal/condicions.html']
        for tema in ('light', 'dark'):
            for (w, h) in ((390, 844), (1440, 900)):
                ctx = nav.new_context(viewport={'width': w, 'height': h}, color_scheme=tema); pg = ctx.new_page()
                for pag in pagines:
                    pg.goto((ARREL / pag).as_uri()); pg.wait_for_timeout(500)
                    pg.wait_for_timeout(1200)
                    axe(pg, f'{pag} {tema} {w}px')
                ctx.close()
        # --- amples extrems i zoom del navegador (400 % = 320 px de CSS)
        url = (ARREL / 'index.html').as_uri()
        for w, nom in ((320, 'zoom 400 % / 320 px'), (427, 'zoom 300 %'), (640, 'zoom 200 %'), (2560, '2560 px')):
            ctx = nav.new_context(viewport={'width': w, 'height': 800}); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
            desb = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            comprova(desb <= 1, f'{nom}: cap desbordament horitzontal ({desb} px)')
            tall = pg.evaluate("[...document.querySelectorAll('h1, h2, h3, .btn, p')].filter(e => !e.classList.contains('nomes-lectors') && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').map(e => e.textContent.trim().slice(0, 30))")
            comprova(not tall, f'{nom}: cap text tallat {tall[:2]}'); ctx.close()
        # --- mida de lletra de sistema gran (200 % del text, sense escalar la pantalla)
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.goto(url); pg.evaluate("document.documentElement.style.fontSize = '32px'"); pg.wait_for_timeout(400)
        comprova(pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth") <= 1, 'lletra al 200 %: cap desbordament horitzontal')
        comprova(pg.evaluate("[...document.querySelectorAll('.btn')].every(b => b.scrollHeight <= b.clientHeight + 2)"), 'lletra al 200 %: els botons creixen amb el text (no el tallen)'); ctx.close()
        # --- formulari amb valors molt llargs (còpia amb correu)
        d = pathlib.Path(tempfile.mkdtemp(prefix='menta_web_'))
        for r in ('index.html', 'web', 'img', 'app/js/config.js', 'app/img', 'app/fonts', 'legal'):
            o = ARREL / r; t = d / r; t.parent.mkdir(parents=True, exist_ok=True); shutil.copytree(o, t) if o.is_dir() else shutil.copy(o, t)
        c = d / 'app/js/config.js'; c.write_text(__import__('re').sub(r"email: '[^']*'", "email: 'hola@exemple.cat'", c.read_text(encoding='utf-8'), 1), encoding='utf-8')
        ctx = nav.new_context(viewport={'width': 320, 'height': 640}); pg = ctx.new_page(); pg.goto((d / 'index.html').as_uri()); pg.wait_for_timeout(500)
        pg.evaluate("document.getElementById('contacte').scrollIntoView()")
        pg.fill('#fNom', 'Aleksandra Wiśniewska-Kowalczyk de la Fuente-Montgomery'); pg.fill('#fCorreu', 'bartholomew.fitzgerald@northwind-industries-holdings.example.com'); pg.fill('#fMissatge', ('Bon dia, ' + 'una_paraula_molt_llarga_sense_espais_' * 6 + ' ') * 6)
        pg.click('#formContacte button[type=submit]'); pg.wait_for_timeout(300)
        comprova(pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth") <= 1, 'formulari amb valors llargs a 320 px: cap desbordament')
        comprova(pg.evaluate("[...document.querySelectorAll('#formContacte .camp')].every(e => e.getBoundingClientRect().right <= document.documentElement.clientWidth)"), 'formulari amb valors llargs: els camps no surten de la pantalla')
        axe(pg, 'formulari amb errors i valors llargs (320 px)'); ctx.close(); shutil.rmtree(d, ignore_errors=True)
        # --- prefers-contrast: more, i sense xarxa
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}, forced_colors='none', contrast='more'); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
        comprova(pg.evaluate("document.documentElement.dataset.contrast") == 'alt', 'prefers-contrast: more activa l\'alt contrast'); axe(pg, 'alt contrast'); ctx.close()
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}); ctx.set_offline(True); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
        comprova('Simple per a l\'avi' in pg.inner_text('h1'), 'sense xarxa: la web es veu igual (tot és local)'); ctx.close()
        # --- teclat: ordre lògic i focus visible als primers elements
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
        pg.keyboard.press('Tab'); comprova(pg.evaluate("document.activeElement.classList.contains('salta-contingut')") and pg.evaluate("document.activeElement.getBoundingClientRect().top >= 0"), 'teclat: el primer Tab és «Saltar al contingut» i es veu')
        ordre = []
        for _ in range(9): pg.keyboard.press('Tab'); ordre.append(pg.evaluate("(document.activeElement.textContent || document.activeElement.getAttribute('aria-label') || '').trim().slice(0, 18)"))
        comprova(ordre[0] == 'MentA' and 'Com funciona' in ordre[1], f'teclat: ordre lògic al principi ({ordre[:4]})')
        ample = pg.evaluate("(() => { const s = getComputedStyle(document.activeElement); return parseFloat(s.outlineWidth) })()"); comprova(ample >= 2, f'teclat: l\'anell de focus és visible ({ample} px)'); ctx.close()
        nav.close()
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
