"""Moviment reduït (prefers-reduced-motion: reduce) a la web 1.9.3: tot el que és nou queda estàtic o es redueix a un canvi d'opacitat curt.
Comprova que cap element de la pàgina té una animació CSS que es mogui (només opacitat), que l'aparador no té cap invitació ni moviment, que no hi ha inclinació,
vídeo ni compte, i que la navegació entre pàgines es redueix a un *crossfade* curt.  Ús: python tests/web/test_moviment_reduit.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

# animacions de CSS en marxa que moguin alguna cosa (transform) a qualsevol element
MOGUDES = """() => document.getAnimations().filter(a => { const k = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; return a.playState === 'running' && k.some(f => f.transform && f.transform !== 'none'); }).map(a => (a.animationName || a.transitionProperty || '?') + '@' + ((a.effect.target && (a.effect.target.className || a.effect.target.tagName)) + '').slice(0, 24))"""

def main():
    url = (ARREL / 'index.html').as_uri(); errors = []
    with sync_playwright() as p:
        nav = p.chromium.launch(); ctx = nav.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(2500)
        comprova(pg.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == 'auto', 'scroll-behavior: auto (sense desplaçament suau)')
        mogudes = pg.evaluate(MOGUDES); comprova(not mogudes, f'cap animació de moviment en marxa al carregar ({mogudes[:3]})')
        comprova(pg.evaluate("document.querySelector('.hero-video').querySelectorAll('source').length") == 0, 'el vídeo del hero no es carrega')
        comprova(pg.evaluate("document.querySelector('.l-hero-visual .mobil').style.transform") == '', "el mòbil no s'inclina")
        # fets: visibles sense esperar cap entrada
        pg.evaluate("document.querySelector('.l-fets').scrollIntoView()"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("[...document.querySelectorAll('.l-fets li')].every(l => getComputedStyle(l).opacity === '1' && getComputedStyle(l).transform === 'none')"), 'els fets es veuen sense moviment')
        # mòbil viu: només canvi d'opacitat
        pg.evaluate("document.querySelectorAll('.bloc')[2].scrollIntoView({block:'center'})"); pg.wait_for_timeout(700)
        comprova(pg.evaluate("[...document.querySelectorAll('.dia-fix .capa')].every(c => getComputedStyle(c).transform === 'none' && getComputedStyle(c).filter === 'none')"), 'mòbil viu: sense escala, desplaçament ni blur (només opacitat)')
        # aparador: res
        pg.evaluate("document.getElementById('filaJocs').scrollIntoView({block:'center'})"); pg.wait_for_timeout(2500)
        comprova(pg.evaluate("document.getElementById('filaJocs').scrollLeft") == 0, "aparador: cap invitació ni deriva")
        pg.click('#jocSeg'); pg.wait_for_timeout(300); comprova(pg.evaluate("document.getElementById('filaJocs').scrollLeft") > 100, "aparador: les fletxes mouen la fila a l'instant (sense desplaçament suau)")
        # compte del 17: sense compte, el valor final des del principi
        comprova(pg.evaluate("document.querySelector('#titolJocs [data-num-jocs]').textContent") == '17', 'el «17» és ja el valor final (sense compte)')
        # elefant: clic = només opacitat
        pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(300); pg.click('#elefantHero'); pg.wait_for_timeout(120)
        comprova(pg.evaluate("document.getAnimations().filter(a => a.effect && a.effect.target === document.getElementById('elefantHero')).length") == 0, "Elefant: el toc no fa cap salt (només el canvi de pose)")
        # transició de pàgines: crossfade curt
        css = (ARREL / 'web' / 'web.css').read_text(encoding='utf-8')
        comprova('::view-transition-group(root) { animation-duration: 100ms; }' in css, 'CSS: dins prefers-reduced-motion la transició de pàgines dura 100 ms')
        comprova(not pg.evaluate("document.documentElement.classList.contains('tema-vt')"), 'la classe de la transició del tema no queda mai penjada')
        ctx.close(); nav.close()
    comprova(not errors, f'cap error de JS ({errors[:2]})')
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
