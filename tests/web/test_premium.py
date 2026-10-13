"""Proves de la part «premium» de la web (v1.9.3): mòbil viu (sticky) que canvia de pantalla amb el scroll sense scroll-jacking, vídeo del hero que es carrega
després del LCP i es pausa fora de la vista, ulls de l'Elefant que segueixen el cursor, capçalera que es compacta, color de la barra del navegador, aparador amb
files que s'aturen, bento que s'encén una sola vegada, tasques llargues en fer scroll i pes de la pàgina. Ús: python tests/web/test_premium.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

def main():
    url = (ARREL / 'index.html').as_uri(); errors = []
    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script("window.__long = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}")
        pg.goto(url); pg.wait_for_timeout(3200)
        # --- hero: vídeo, poster, ulls, inclinació
        comprova(pg.evaluate("document.querySelector('.hero-video').currentSrc") != '' and pg.evaluate("document.querySelector('.hero-video').classList.contains('on')"), 'hero: el vídeo es carrega i es mostra a sobre del poster (després del LCP)')
        comprova(pg.evaluate("document.querySelector('.hero-video').getAttribute('preload')") == 'none' and pg.evaluate("document.querySelector('.poster').getAttribute('fetchpriority')") == 'high', 'hero: el poster és el LCP (fetchpriority=high) i el vídeo té preload=none')
        comprova(pg.evaluate("!document.querySelector('.hero-video').paused"), 'hero: el vídeo es reprodueix amb el hero a la vista')
        pg.mouse.move(100, 800); pg.wait_for_timeout(700); a = pg.evaluate("document.querySelector('#elefantHero .el-ull i').style.transform")
        pg.mouse.move(1400, 100); pg.wait_for_timeout(700); b = pg.evaluate("document.querySelector('#elefantHero .el-ull i').style.transform")
        comprova(a != b and a != '' and b != '', f"Elefant: les pupil·les segueixen el cursor ({a} → {b})")
        import re
        valors = [float(x) for x in re.findall(r'-?\d+\.?\d*', a + ' ' + b)]; comprova(all(abs(v) <= 3.6 * 1.4 for v in valors), 'Elefant: el moviment dels ulls és limitat (≈ ±3,6 unitats de dibuix)')
        pg.mouse.move(1070, 520); pg.wait_for_timeout(800)
        comprova('rotate' in pg.evaluate("document.querySelector('.l-hero-visual .mobil').style.transform"), "hero: el mòbil s'inclina amb un moll cap al cursor")
        pg.evaluate("window.scrollTo(0, 1800)"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("document.querySelector('.hero-video').paused"), 'hero: el vídeo es pausa quan surt de la vista')
        # --- mòbil viu: les 4 captures canvien amb el bloc que és al centre, amb scroll natural
        pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
        vist = []
        for i in range(4):
            pg.evaluate(f"(() => {{ const b = document.querySelectorAll('.bloc')[{i}]; const r = b.getBoundingClientRect(); window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2); }})()"); pg.wait_for_timeout(700)
            on = pg.evaluate("[...document.querySelectorAll('.dia-fix .capa')].map((c, k) => c.classList.contains('on') ? k : -1).filter(k => k >= 0)"); vist.append(on)
            comprova(on == [i] and pg.evaluate(f"document.querySelectorAll('.bloc')[{i}].classList.contains('on')"), f'mòbil viu: al bloc {i + 1} es veu només la pantalla {i + 1} ({on})')
        comprova(pg.evaluate("getComputedStyle(document.querySelector('.dia-fix')).position") == 'sticky' and pg.evaluate("document.querySelector('.dia-fix').getBoundingClientRect().top") < 200, 'mòbil viu: el mòbil és sticky (no hi ha scroll-jacking: el scroll és el del navegador)')
        comprova(pg.evaluate("document.querySelector('.dia-fix').getAttribute('aria-hidden')") == 'true' and pg.evaluate("document.querySelectorAll('.bloc-mobil img[alt]:not([alt=\"\"])').length") == 4, 'mòbil viu: el mòbil sticky és decoratiu; cada bloc té la seva captura amb text alternatiu')
        fons_nit = pg.evaluate("getComputedStyle(document.querySelector('.dia')).backgroundImage.indexOf('gradient') > -1")
        comprova(fons_nit, 'fil del dia: el fons de la seqüència és un degradat alba → tarda → vespre')
        comprova(pg.evaluate("document.querySelector('meta[name=theme-color]').content") in ('#0e2e1d', '#faf7f2', '#fbefd9'), 'theme-color: la barra del navegador segueix el fons visible')
        # --- capçalera
        comprova(pg.evaluate("document.getElementById('capcalera').classList.contains('compacta')") and pg.evaluate("document.getElementById('capcalera').dataset.hora") != '', 'capçalera: es compacta en fer scroll i pren l\'hora del dia')
        # --- bento: s'encén una vegada
        pg.evaluate("document.querySelector('.bento').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1800)
        comprova(pg.evaluate("document.querySelector('.bento').classList.contains('viu')") and pg.evaluate("getComputedStyle(document.querySelector('.bento .linia')).strokeDashoffset") in ('0px', '0'), 'bento: les micro-visuals s\'encenen en entrar a la vista (el gràfic es dibuixa)')
        comprova(pg.evaluate("document.querySelectorAll('.bento .fictici').length") >= 2 and 'fictícies' in pg.inner_text('.bento'), 'bento: les dades dels gràfics diuen que són fictícies')
        # --- progrés de lectura
        comprova(pg.evaluate("document.querySelector('.progres-lectura')") is None, "crítica de disseny: la barra de progrés de lectura és un accessori i s'ha retirat")
        # --- aparador: pausa per hover/focus i fora de vista
        pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(500)
        pg.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("document.querySelector('.fila').classList.contains('fora')"), 'aparador: les files es pausen quan són fora de la vista')
        # --- rendiment: tasques llargues i errors
        long = pg.evaluate("window.__long.filter(d => d > 50)"); comprova(len(long) == 0, f'rendiment: cap tasca llarga (> 50 ms) durant la càrrega i el scroll ({long[:3]})')
        ctx.close()
        # --- capçalera, theme-color i hero a mòbil + tàctil: sense inclinació, els ulls miren cap al mòbil
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(2500)
        comprova(pg.evaluate("document.querySelector('#elefantHero .el-ull i').style.transform") != '', 'tàctil: els ulls de l\'Elefant miren cap al mòbil (sense cursor)')
        comprova(pg.evaluate("getComputedStyle(document.querySelector('.dia-fix')).display") == 'none' and pg.evaluate("document.querySelectorAll('.bloc-mobil').length") == 4, 'mòbil: sense sticky; cada bloc porta el seu mòbil en línia')
        amples = pg.evaluate("[...document.querySelectorAll('.bloc-mobil')].map(e => Math.round(e.getBoundingClientRect().width))"); comprova(all(a >= 260 for a in amples), f'mòbil: les captures dels blocs fan ≥ 260 px ({amples})')
        pg.evaluate("document.getElementById('contacte').scrollIntoView()"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("[...document.querySelectorAll('input:not([type=checkbox]), select, textarea')].filter(e => e.offsetParent && !e.closest('.honeypot')).every(e => parseFloat(getComputedStyle(e).fontSize) >= 16)"), 'mòbil: els camps del formulari tenen ≥ 16 px (cap zoom sobtat a iOS)')
        ctx.close()
        # --- break-ui: el vídeo no carrega (xarxa tallada només per al vídeo): el poster es queda i no hi ha errors de JS
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); ctx.route('**/hero.*', lambda r: r.abort()); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(url); pg.wait_for_timeout(3500)
        comprova(not pg.evaluate("document.querySelector('.hero-video').classList.contains('on')") and pg.evaluate("getComputedStyle(document.querySelector('.poster')).visibility") == 'visible' and pg.evaluate("document.querySelector('.poster').naturalWidth") > 0, 'break-ui: si el vídeo no carrega, es queda el poster (sense errors)')
        ctx.close()
        # --- break-ui: Save-Data i prefers-reduced-data: el vídeo no es descarrega
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.add_init_script("Object.defineProperty(navigator, 'connection', { value: { saveData: true } })"); pg.goto(url); pg.wait_for_timeout(3000)
        comprova(pg.evaluate("document.querySelector('.hero-video').querySelectorAll('source').length") == 0, 'break-ui: amb «Estalvi de dades» el vídeo no es descarrega')
        ctx.close()
        # --- tema fosc amb View Transitions: no peta i queda desat
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(url); pg.wait_for_timeout(800)
        pg.click('#btnTema'); pg.wait_for_timeout(900); comprova(pg.evaluate("document.documentElement.dataset.tema") == 'fosc' and pg.evaluate("document.querySelector('meta[name=theme-color]').content") in ('#241b11', '#15120e', '#0b2417'), 'tema: el canvi clar/fosc (amb revelació circular) funciona i canvia el theme-color')
        ctx.close(); nav.close()
    comprova(not errors, f'cap error de JS ({errors[:2]})')
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
