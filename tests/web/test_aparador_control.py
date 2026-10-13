"""L'aparador de jocs (v1.9.3): «l'usuari mana, el moviment només convida».
Criteris d'acceptació de la F1 del pla: es poden veure els 17 jocs en < 10 s amb roda, arrossegament o fletxes; el hover no atura ni mou res; res es mou sol
després de la primera interacció; teclat complet; objectius ≥ 44 px; moviment reduït = cap deriva; sense JS = scroller natiu amb totes les cartes; cap tasca llarga en arrossegar.
Amb la variable MENTA_ARREL es pot apuntar a una altra versió (p. ex. la 1.9.2, on aquestes proves han de fallar).  Ús: python tests/web/test_aparador_control.py"""
import os, pathlib, sys, time
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(os.environ.get('MENTA_ARREL') or pathlib.Path(__file__).resolve().parent.parent.parent)
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

# Quin és el scroller i les cartes reals (sense còpies): amb el marquee de la 1.9.2 hi ha còpies `.clon`; a la 1.9.3 no n'hi ha
VISIBLES = """() => { const f = document.querySelector('#carrusel .fila'); const r = f.getBoundingClientRect();
  return [...f.querySelectorAll('.l-joc:not(.clon)')].filter(c => { const b = c.getBoundingClientRect(); return b.right > r.left + 8 && b.left < r.right - 8; }).map(c => c.dataset.id); }"""

def main():
    url = (ARREL / 'index.html').as_uri(); errors = []
    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script("window.__long = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}")
        pg.add_init_script("window.__cls = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}")
        pg.goto(url); pg.wait_for_timeout(1500); pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
        y = 0
        while y < 5200: pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(110); y += 384        # scroll com el de l'auditoria, fins a l'aparador
        pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(2200)
        comprova(pg.evaluate("window.__cls") <= 0.02, f"la invitació de l'aparador no suma CLS ({pg.evaluate('window.__cls'):.3f} ≤ 0,02)")
        total = pg.evaluate("document.querySelectorAll('#carrusel .l-joc:not(.clon)').length"); comprova(total == 17, f'hi ha 17 jocs ({total})')
        files = pg.evaluate("document.querySelectorAll('#carrusel .fila').length"); comprova(files == 1, f"una sola fila (no dues en sentits oposats) ({files})")
        # --- cap moviment automàtic sostingut: la fila no es mou sola després de la invitació inicial
        pg.wait_for_timeout(2500)
        x0 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft"); pg.wait_for_timeout(2500); x1 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft")
        comprova(abs(x1 - x0) < 1, f'la fila no es mou sola (scrollLeft {x0} → {x1})')
        comprova(pg.evaluate("[...document.querySelectorAll('#carrusel *')].every(e => !['marquee'].includes(getComputedStyle(e).animationName))"), 'no hi ha cap animació de marquee')
        # --- hover: ni atura ni mou
        pg.mouse.move(700, 560); pg.wait_for_timeout(300); h0 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft"); pg.mouse.move(760, 570, steps=10); pg.wait_for_timeout(600); h1 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft")
        comprova(abs(h1 - h0) < 1, 'el hover no mou la fila')
        comprova(pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-pista')).animationPlayState") != 'paused' or pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-pista')).animationName") == 'none', 'el hover no «atura» res (no hi ha res que aturar)')
        # --- fletxes: els 17 jocs en < 10 s
        t0 = time.time(); vistos = set(pg.evaluate(VISIBLES)); clics = 0
        while len(vistos) < 17 and clics < 12 and time.time() - t0 < 10:
            if pg.evaluate("document.getElementById('jocSeg').disabled"): break
            pg.click('#jocSeg'); clics += 1; pg.wait_for_timeout(700); vistos |= set(pg.evaluate(VISIBLES))
        comprova(len(vistos) == 17 and time.time() - t0 < 10, f'amb les fletxes es veuen els 17 jocs en {time.time() - t0:.1f} s ({len(vistos)}/17, {clics} clics)')
        for _ in range(3):
            if not pg.evaluate("document.getElementById('jocSeg').disabled"): pg.click('#jocSeg'); pg.wait_for_timeout(700)
        comprova(pg.evaluate("document.getElementById('jocSeg').disabled") and not pg.evaluate("document.getElementById('jocAnt').disabled"), 'a l\'extrem final la fletxa «següent» queda desactivada i l\'«anterior» activa')
        comprova(pg.evaluate("['jocAnt','jocSeg'].every(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && document.getElementById(id).getAttribute('aria-label'); })"), 'fletxes de ≥ 44 px amb aria-label')
        comprova('de 17' in pg.inner_text('#jocPos'), f"indicador de posició: «{pg.inner_text('#jocPos').strip()}»")
        # --- roda del ratolí / trackpad (horitzontal)
        pg.click('#jocAnt'); pg.wait_for_timeout(200)
        for _ in range(4): pg.click('#jocAnt'); pg.wait_for_timeout(500)
        pg.evaluate("document.querySelector('#carrusel .fila').scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(500)
        cy = pg.evaluate("(() => { const r = document.querySelector('#carrusel .l-joc .mobil').getBoundingClientRect(); return r.top + r.height / 2; })()"); pg.mouse.move(700, cy); t0 = time.time(); vistos = set(pg.evaluate(VISIBLES))
        for _ in range(14):
            pg.mouse.wheel(600, 0); pg.wait_for_timeout(120); vistos |= set(pg.evaluate(VISIBLES))
        comprova(len(vistos) == 17 and time.time() - t0 < 10, f'amb la roda (horitzontal) es veuen els 17 jocs en {time.time() - t0:.1f} s ({len(vistos)}/17)')
        # --- arrossegar amb el ratolí
        pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft = 0"); pg.wait_for_timeout(400); vistos = set(pg.evaluate(VISIBLES)); t0 = time.time()
        for _ in range(10):
            pg.mouse.move(1100, cy); pg.mouse.down()
            for k in range(1, 13): pg.mouse.move(1100 - k * 34, cy); pg.wait_for_timeout(30)           # ≈ 400 px a ≈ 1.100 px/s: un gest humà
            pg.mouse.up(); pg.wait_for_timeout(900); vistos |= set(pg.evaluate(VISIBLES))
            if len(vistos) == 17: break
        comprova(len(vistos) == 17 and time.time() - t0 < 10, f'arrossegant amb el ratolí es veuen els 17 jocs en {time.time() - t0:.1f} s ({len(vistos)}/17)')
        pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft = 0"); pg.wait_for_timeout(300); a = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft")
        pg.mouse.move(600, cy); pg.mouse.down(); pg.mouse.move(603, cy + 1); pg.mouse.up(); pg.wait_for_timeout(300)
        comprova(pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft") == a, 'un clic curt (< 6 px) no compta com a arrossegament')
        # --- després d'interactuar, res es mou sol
        pg.wait_for_timeout(1500); y0 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft"); pg.wait_for_timeout(3000); y1 = pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft")
        comprova(abs(y1 - y0) < 1, 'després d\'interactuar, la fila no es mou sola')
        # --- teclat: Tab entra a la fila i ←/→ van carta a carta
        pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft = 0; document.activeElement && document.activeElement.blur()"); pg.wait_for_timeout(300)
        pg.focus('#carrusel .fila'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(250); id1 = pg.evaluate("document.activeElement.dataset.id"); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(250); id2 = pg.evaluate("document.activeElement.dataset.id")
        comprova(id1 and id2 and id1 != id2, f'teclat: ←/→ mouen l\'enfocament carta a carta ({id1} → {id2})')
        for _ in range(8): pg.keyboard.press('ArrowRight')
        pg.wait_for_timeout(700); comprova(pg.evaluate("(() => { const c = document.activeElement.getBoundingClientRect(), f = document.querySelector('#carrusel .fila').getBoundingClientRect(); return c.left >= f.left - 1 && c.right <= f.right + 1; })()"), 'teclat: la carta enfocada queda sempre dins de la fila (scrollIntoView)')
        comprova(pg.evaluate("parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2"), 'teclat: la carta enfocada té l\'anell de focus visible')
        # --- elevació en hover (no pausa)
        pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft = 0"); pg.wait_for_timeout(300); r = pg.evaluate("(() => { const b = document.querySelector('#carrusel .l-joc .mobil').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()")
        pg.mouse.move(r[0], r[1], steps=4); pg.wait_for_timeout(500); comprova(pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-joc .mobil')).transform") not in ('none', ''), 'hover: la carta s\'eleva (translateY) en comptes d\'aturar res')
        # --- filtres: tornen a l'inici
        pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft = 900"); pg.wait_for_timeout(200); pg.click('#filtresJocs button[data-filtre="memoria"]'); pg.wait_for_timeout(1000)
        comprova(pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft") < 4, 'en filtrar, la fila torna a l\'inici')
        pg.click('#filtresJocs button[data-filtre="tots"]'); pg.wait_for_timeout(500)
        # --- tasques llargues
        long = pg.evaluate("window.__long.filter(d => d > 50)"); comprova(not long, f'cap tasca llarga (> 50 ms) amb tota la interacció ({long[:3]})')
        ctx.close()
        # --- tàctil: scroller amb snap i un tros de la carta següent a la vora (peek)
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(1200); pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(1500)
        comprova(pg.evaluate("getComputedStyle(document.querySelector('#carrusel .fila')).scrollSnapType").startswith('x'), 'tàctil: scroller amb scroll-snap')
        comprova(pg.evaluate("(() => { const f = document.querySelector('#carrusel .fila').getBoundingClientRect(); return [...document.querySelectorAll('#carrusel .l-joc')].some(c => { const b = c.getBoundingClientRect(); return b.left < f.right - 12 && b.right > f.right + 12; }); })()"), 'tàctil: es veu un tros de la carta següent (peek) perquè es noti que es pot lliscar')
        ctx.close()
        # --- moviment reduït: cap deriva ni invitació, scroll-behavior auto
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(1200); pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(2500)
        comprova(pg.evaluate("document.querySelector('#carrusel .fila').scrollLeft") == 0 and pg.evaluate("getComputedStyle(document.querySelector('#carrusel .fila')).scrollBehavior") == 'auto', 'moviment reduït: cap invitació ni deriva i scroll-behavior: auto')
        ctx.close()
        # --- sense JS: scroller natiu amb totes les cartes
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}, java_script_enabled=False); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(600)
        comprova(pg.evaluate("document.querySelectorAll('#carrusel .l-joc').length") == 17 and pg.evaluate("getComputedStyle(document.querySelector('#carrusel .fila')).overflowX") == 'auto', 'sense JS: la fila és un scroller natiu amb les 17 cartes')
        ctx.close(); nav.close()
    comprova(not errors, f'cap error de JS ({errors[:2]})')
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
