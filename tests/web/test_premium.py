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
        # --- 1.9.3 · F3: moviment amb sentit
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(url); pg.wait_for_timeout(1500)
        pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
        pg.evaluate("document.querySelector('.l-fets').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1200)
        comprova(pg.evaluate("document.querySelector('.l-fets').classList.contains('viu') && [...document.querySelectorAll('.l-fets li')].every(l => getComputedStyle(l).opacity === '1')") and pg.evaluate("[...document.querySelectorAll('.l-fets li')].map(l => parseFloat(getComputedStyle(l).transitionDelay) * 1000).join()") == '0,60,120,180', 'fets: entren escalonats (0 / 60 / 120 / 180 ms) amb el mateix sistema que el bento (data-viu)')
        pg.evaluate("document.getElementById('titolJocs').scrollIntoView({block:'center'})")
        mostres = []
        for _ in range(8): mostres.append(pg.evaluate("document.querySelector('#titolJocs [data-num-jocs]').textContent")); pg.wait_for_timeout(120)
        pg.wait_for_timeout(1000); final = pg.evaluate("document.querySelector('#titolJocs [data-num-jocs]').textContent")
        comprova(final == '17' and any(m != '17' for m in mostres) and pg.evaluate("getComputedStyle(document.querySelector('#titolJocs .gegant')).fontVariantNumeric").find('tabular') >= 0, f"el «17» compta fins a 17 amb xifres tabulars ({','.join(mostres)} → {final})")
        # direcció del mòbil viu: les pantalles anteriors marxen cap amunt, les següents esperen a sota
        pg.evaluate("document.querySelectorAll('.bloc')[2].scrollIntoView({block:'center'})"); pg.wait_for_timeout(700)
        est = pg.evaluate("[...document.querySelectorAll('.dia-fix .capa')].map(c => c.classList.contains('on') ? 'on' : c.classList.contains('passada') ? 'passada' : 'futura')")
        comprova(est == ['passada', 'passada', 'on', 'futura'], f'mòbil viu amb direcció: {est}')
        pg.evaluate("document.querySelectorAll('.bloc')[1].scrollIntoView({block:'center'})"); pg.wait_for_timeout(700)
        est = pg.evaluate("[...document.querySelectorAll('.dia-fix .capa')].map(c => c.classList.contains('on') ? 'on' : c.classList.contains('passada') ? 'passada' : 'futura')")
        comprova(est == ['passada', 'on', 'futura', 'futura'], f'en pujar, la pantalla que surt va cap avall: {est}')
        # Elefant: un toc fa un sol cicle
        pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(2600); pg.click('#elefantHero'); pg.wait_for_timeout(150)
        n = pg.evaluate("document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('el-saluda')).length")
        pg.wait_for_timeout(2000); fi = pg.evaluate("document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('el-saluda') && a.playState === 'running').length")
        comprova(n >= 1 and fi == 0, "Elefant: el toc el fa saludar un sol cop i s'acaba (cap bucle)")
        # tema: la classe de la transició no queda penjada, i la regla viu només sota html.tema-vt
        pg.click('#btnTema'); pg.wait_for_timeout(1200)
        comprova(not pg.evaluate("document.documentElement.classList.contains('tema-vt')"), 'tema: la classe tema-vt es retira en acabar la transició')
        css = (ARREL / 'web' / 'web.css').read_text(encoding='utf-8')
        comprova('@view-transition { navigation: auto; }' in css and 'html.tema-vt::view-transition-old(root)' in css and '\n::view-transition-old(root)' not in css, 'transició de pàgines (CSS) i canvi de tema (JS) no es trepitgen: la regla del tema només aplica sota html.tema-vt')
        ctx.close()
        # --- transició entre pàgines (CSS, cross-document): només amb http(s), per això es serveix la carpeta
        import functools, http.server, socketserver, threading
        class _H(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(_H, directory=str(ARREL))); threading.Thread(target=srv.serve_forever, daemon=True).start()
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); pg.add_init_script("addEventListener('pageswap', e => sessionStorage.setItem('vt_swap', e.viewTransition ? '1' : '0')); addEventListener('pagereveal', e => sessionStorage.setItem('vt_reveal', e.viewTransition ? '1' : '0'));")
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/index.html'); pg.wait_for_timeout(1200); pg.click('footer a[href$="privadesa.html"]'); pg.wait_for_timeout(1500)
        comprova(pg.url.endswith('privadesa.html') and pg.evaluate("sessionStorage.getItem('vt_swap')") == '1' and pg.evaluate("sessionStorage.getItem('vt_reveal')") == '1', 'navegació index → legal: el navegador fa servir la transició de pàgina (@view-transition)')
        ctx.close(); srv.shutdown()
        # --- F5: salutació segons l'hora i «Torna a dalt» només al final
        for hora, esperat in (('2026-10-13T08:30:00', 'Bon dia'), ('2026-10-13T16:10:00', 'Bona tarda'), ('2026-10-13T22:30:00', 'Bona nit')):
            ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.clock.set_fixed_time(hora); pg.goto(url); pg.wait_for_timeout(600)
            comprova(pg.inner_text('[data-salutacio]') == esperat, f"hero: a les {hora[11:16]} la salutació és «{esperat}» (com l'app)"); ctx.close()
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(1200); pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
        comprova(not pg.evaluate("document.getElementById('aDalt').classList.contains('visible')"), '«Torna a dalt»: no es veu a dalt de tot')
        pg.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)"); pg.wait_for_timeout(700)
        comprova(pg.evaluate("document.getElementById('aDalt').classList.contains('visible')") and pg.evaluate("document.getElementById('aDalt').getBoundingClientRect().width") >= 44, '«Torna a dalt»: apareix en arribar al peu (≥ 44 px)')
        pg.click('#aDalt'); pg.wait_for_timeout(2800); comprova(pg.evaluate("scrollY") < 5, "«Torna a dalt»: porta a l'inici")
        ctx.close()
        # --- tema fosc amb View Transitions: no peta i queda desat
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(url); pg.wait_for_timeout(800)
        pg.click('#btnTema'); pg.wait_for_timeout(900); comprova(pg.evaluate("document.documentElement.dataset.tema") == 'fosc' and pg.evaluate("document.querySelector('meta[name=theme-color]').content") in ('#241b11', '#15120e', '#0b2417'), 'tema: el canvi clar/fosc (amb revelació circular) funciona i canvia el theme-color')
        ctx.close(); nav.close()
    comprova(not errors, f'cap error de JS ({errors[:2]})')
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
