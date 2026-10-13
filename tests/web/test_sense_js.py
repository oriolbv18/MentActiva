"""Sense JavaScript, la web 1.9.3 continua sent completa i llegible: tot el text hi és, els mòbils dels blocs es veuen en línia, l'aparador és un scroller natiu amb les
17 cartes (i res no queda amagat per `opacity: 0`), els fets es veuen, i les imatges no tenen cap placeholder buit.  Ús: python tests/web/test_sense_js.py"""
import io, pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

def main():
    url = (ARREL / 'index.html').as_uri()
    with sync_playwright() as p:
        nav = p.chromium.launch()
        for w, h, nom in ((1440, 900, 'escriptori'), (390, 844, 'mòbil')):
            ctx = nav.new_context(viewport={'width': w, 'height': h}, java_script_enabled=False); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(600)
            txt = pg.inner_text('main')
            comprova(all(x in txt for x in ('Simple per a l\'avi', 'Un botó gran', 'Una estona de jocs', 'Quan arriba el nét', 'Qui cuida, a la vista', 'Informació clara, sense alarmes', 'Preguntes freqüents', 'Parlem-ne', '17 jocs')), f'{nom}: tot el text de la pàgina hi és (incloent «17 jocs» ja escrit)')
            comprova(pg.evaluate("[...document.querySelectorAll('.l-fets li')].every(l => getComputedStyle(l).opacity === '1')"), f'{nom}: els fets es veuen sense JS')
            comprova(pg.evaluate("document.querySelectorAll('#carrusel .l-joc').length") == 17 and pg.evaluate("getComputedStyle(document.getElementById('filaJocs')).overflowX") == 'auto', f'{nom}: l\'aparador és un scroller natiu amb les 17 cartes')
            comprova(pg.evaluate("document.getElementById('filaJocs').scrollWidth > document.getElementById('filaJocs').clientWidth"), f'{nom}: la fila es pot lliscar (hi ha més cartes que ample)')
            comprova(pg.evaluate("[...document.querySelectorAll('.bloc-mobil')].every(e => getComputedStyle(e).display !== 'none') && getComputedStyle(document.querySelector('.dia-fix')).display === 'none'"), f'{nom}: els blocs del mòbil viu porten la seva captura en línia')
            comprova(pg.evaluate("document.querySelector('.poster').naturalWidth") > 0, f'{nom}: el poster del hero es veu (és el LCP)')
            comprova(pg.evaluate("document.getElementById('jocPos') && document.querySelector('.l-controls').hidden"), f'{nom}: les fletxes (que necessiten JS) queden amagades, no trencades')
            from PIL import Image
            img = Image.open(io.BytesIO(pg.screenshot(full_page=True))).convert('L'); W, H = img.size
            ys = pg.evaluate("[...document.querySelectorAll('main > section')].map(s => { const r = s.getBoundingClientRect(); return [s.className.split(' ')[0] || s.id, Math.round(r.top + scrollY + r.height / 2), Math.round(r.height)]; })")
            buits = [n for n, y, alt in ys if alt > 80 and (lambda e: e[1] - e[0] < 40)(img.crop((0, max(0, min(H - 160, y - 80)), W, max(0, min(H - 160, y - 80)) + 160)).getextrema())]
            comprova(not buits, f'{nom}: el centre de cada secció té contingut visible (cap secció buida: {buits})')
            ctx.close()
        nav.close()
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
