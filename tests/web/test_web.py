"""Proves de la web d'aterratge (v1.9.3): menú mòbil, filtres i carrusel, formulari, tema, barra de CTA, demostració sense efectes sobre
localStorage, moviment reduït, contingut sense JavaScript i CSP sense violacions. Ús: python tests/web/test_web.py"""
import functools, json, http.server, io, pathlib, re, shutil, socketserver, sys, tempfile, threading
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

class Silenci(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serveix(directori):
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Silenci, directory=str(directori))); threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv, srv.server_address[1]

def copia_amb_contacte(email):
    """Còpia mínima de la web amb un correu a config.js, per provar el formulari (config.js no es toca a l'original)."""
    d = pathlib.Path(tempfile.mkdtemp(prefix='menta_web_'))
    for r in ('index.html', 'web', 'img', 'app/js/config.js', 'app/img', 'app/fonts', 'legal'):
        o = ARREL / r; t = d / r; t.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(o, t) if o.is_dir() else shutil.copy(o, t)
    cfg = d / 'app/js/config.js'; cfg.write_text(re.sub(r"email: '[^']*'", f"email: '{email}'", cfg.read_text(encoding='utf-8'), 1), encoding='utf-8')
    if not email: cfg.write_text(re.sub(r"instagram: '[^']*'", "instagram: ''", cfg.read_text(encoding='utf-8'), 1), encoding='utf-8')
    return d

def main():
    JOCS_JSON = json.loads((ARREL / 'web' / 'jocs.js').read_text(encoding='utf-8').split('=', 1)[1].rstrip().rstrip(';'))
    url = (ARREL / 'index.html').as_uri(); errors = []; csp = []
    with sync_playwright() as p:
        nav = p.chromium.launch()
        # ---- mòbil: menú, barra de CTA, tema
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: csp.append(m.text) if ('Content Security Policy' in m.text or 'Refused to' in m.text) else None)
        pg.goto(url); pg.wait_for_timeout(800)
        comprova(pg.evaluate("getComputedStyle(document.getElementById('menuMobil')).visibility") == 'hidden', 'mòbil: el menú està tancat al principi')
        pg.click('#btnMenu'); pg.wait_for_timeout(400)
        comprova(pg.get_attribute('#btnMenu', 'aria-expanded') == 'true' and pg.evaluate("document.getElementById('menuMobil').classList.contains('obert')"), 'mòbil: el botó obre el menú (aria-expanded)')
        comprova(pg.evaluate("document.querySelector('main').hasAttribute('inert')"), 'mòbil: el contingut de darrere és inert amb el menú obert')
        comprova(pg.evaluate("document.getElementById('menuMobil').contains(document.activeElement)"), 'mòbil: el focus entra al menú')
        for _ in range(12): pg.keyboard.press('Tab')
        comprova(pg.evaluate("document.getElementById('menuMobil').contains(document.activeElement)"), 'mòbil: el focus queda atrapat dins el menú després de 12 tabuladors')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        comprova(not pg.evaluate("document.getElementById('menuMobil').classList.contains('obert')") and pg.evaluate("document.activeElement.id") == 'btnMenu', 'mòbil: Escape tanca el menú i torna el focus al botó')
        comprova(not pg.evaluate("document.querySelector('main').hasAttribute('inert')"), 'mòbil: en tancar, el contingut deixa de ser inert')
        pg.click('#btnMenu'); pg.wait_for_timeout(300); pg.click('#menuMobil nav a[href$="#jocs"]'); pg.wait_for_timeout(1200)
        comprova(not pg.evaluate("document.getElementById('menuMobil').classList.contains('obert')") and pg.evaluate("location.hash") == '#jocs', 'mòbil: un enllaç del menú el tanca i porta a la secció')
        pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0)"); pg.wait_for_timeout(500)
        comprova(not pg.evaluate("document.getElementById('barraCta').classList.contains('visible')"), 'mòbil: la barra de CTA no es veu amb el hero a la pantalla')
        pg.evaluate("document.getElementById('com-funciona').scrollIntoView()"); pg.wait_for_timeout(700)
        comprova(pg.evaluate("document.getElementById('barraCta').classList.contains('visible')"), 'mòbil: la barra de CTA apareix en sortir el hero')
        pg.evaluate("document.getElementById('contacte').scrollIntoView()"); pg.wait_for_timeout(700)
        comprova(not pg.evaluate("document.getElementById('barraCta').classList.contains('visible')"), "mòbil: la barra de CTA s'amaga al contacte (no tapa el formulari)")
        t0 = pg.evaluate("document.documentElement.dataset.tema"); pg.click('#btnTema'); t1 = pg.evaluate("document.documentElement.dataset.tema")
        comprova(t0 != t1 and pg.evaluate("localStorage.getItem('mentA_web_tema')") == t1, f'tema: el botó alterna ({t0} → {t1}) i ho recorda')
        # ---- galeria: filtres i carrusel
        pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(500)
        total = pg.evaluate("document.querySelectorAll('#carrusel .l-joc:not(.clon)').length"); comprova(total == 17 and pg.evaluate("document.querySelectorAll('#carrusel .fila').length") == 2, f"aparador: 17 jocs en dues files ({total})")
        pg.click('#filtresJocs button[data-filtre="memoria"]'); pg.wait_for_timeout(300)
        vis = pg.evaluate("[...document.querySelectorAll('#carrusel .l-joc:not(.clon)')].filter(l => !l.hidden).length"); esperat = len([j for j in JOCS_JSON if j['domini'] == 'memoria'])
        comprova(vis == esperat and vis > 0, f'galeria: el filtre «Memòria» mostra {vis} jocs (esperats {esperat})')
        comprova(pg.get_attribute('#filtresJocs button[data-filtre="memoria"]', 'aria-pressed') == 'true' and pg.get_attribute('#filtresJocs button[data-filtre="tots"]', 'aria-pressed') == 'false', 'galeria: aria-pressed correcte als filtres')
        pg.click('#filtresJocs button[data-filtre="tots"]'); pg.wait_for_timeout(200)
        pg.set_viewport_size({'width': 1280, 'height': 800}); pg.wait_for_timeout(500); pg.evaluate("document.getElementById('jocs').scrollIntoView()"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-pista')).animationName") == 'marquee' and pg.evaluate("document.querySelectorAll('#carrusel .clon').length") == 17, "aparador: les files es mouen (marquee) i tenen còpies ocultes per al bucle")
        comprova(not pg.evaluate("document.getElementById('jocPausa').hidden"), "aparador: hi ha el botó per aturar el moviment (WCAG 2.2.2)")
        pg.click('#jocPausa'); pg.wait_for_timeout(200)
        comprova(pg.get_attribute('#jocPausa', 'aria-pressed') == 'true' and pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-pista')).animationPlayState") == 'paused', "aparador: el botó atura les files")
        comprova(pg.evaluate("[...document.querySelectorAll('#carrusel .clon')].every(e => e.getAttribute('aria-hidden') === 'true' && e.inert)"), 'aparador: les còpies són ocultes per als lectors de pantalla i no es poden enfocar')
        pg.click('#filtresJocs button[data-filtre="memoria"]'); pg.wait_for_timeout(500)
        comprova(pg.evaluate("[...document.querySelectorAll('#carrusel .fila')].every(f => f.hidden || f.classList.contains('estatica') || f.querySelectorAll('.l-joc:not(.clon):not([hidden])').length >= 5)"), "aparador: amb pocs jocs la fila es queda quieta i centrada (no es repeteix)")
        pg.click('#filtresJocs button[data-filtre="tots"]'); pg.wait_for_timeout(300)
        comprova(pg.evaluate("getComputedStyle(document.getElementById('btnMenu')).display") == 'none' and pg.evaluate("getComputedStyle(document.querySelector('.l-nav')).display") != 'none', 'escriptori: navegació visible i botó de menú ocult')
        ctx.close()
        # ---- contacte real de config.js: el correu i l'Instagram del projecte
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(600)
        comprova(not pg.evaluate("document.getElementById('formContacte').hidden") and pg.evaluate("document.getElementById('contacteSense').hidden"), 'contacte: amb el correu del projecte a config.js es mostra el formulari')
        comprova(pg.evaluate("[...document.querySelectorAll('#xarxesContacte a')].some(a => a.href === 'mailto:menta.app.upc@gmail.com')") and pg.evaluate("[...document.querySelectorAll('#xarxesContacte a')].some(a => a.href === 'https://www.instagram.com/menta.upc/' && a.rel.includes('noopener'))"), "contacte: es veuen el correu i l'Instagram (@menta.upc) reals")
        comprova(pg.evaluate("document.querySelectorAll('#xarxesPeu a').length") == 2, 'contacte: el peu porta els mateixos contactes')
        ctx.close()
        # ---- sense correu ni xarxes: no es mostra cap formulari que no porti enlloc, i s'ofereix feedback des de l'app
        d0 = copia_amb_contacte(''); ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.goto((d0 / 'index.html').as_uri()); pg.wait_for_timeout(600)
        comprova(pg.evaluate("document.getElementById('formContacte').hidden") and not pg.evaluate("document.getElementById('contacteSense').hidden"), 'contacte: sense correu ni formulari no es mostra cap formulari que no porti enlloc')
        comprova(pg.evaluate("[...document.querySelectorAll('a')].some(a => /feedback$/.test(a.getAttribute('href')))") and pg.evaluate("document.getElementById('xarxesContacte').hidden"), "contacte: enllaç al feedback de l'app i cap xarxa inventada")
        ctx.close(); shutil.rmtree(d0, ignore_errors=True)
        # ---- formulari amb correu (còpia temporal de la web)
        d = copia_amb_contacte('hola@exemple.cat'); ctx = nav.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page()
        pg.goto((d / 'index.html').as_uri() + '?motiu=residencia'); pg.wait_for_timeout(700)
        comprova(not pg.evaluate("document.getElementById('formContacte').hidden"), 'formulari: es mostra quan hi ha un correu')
        comprova(pg.evaluate("document.getElementById('fMotiu').value") == 'residencia', 'formulari: ?motiu=residencia preselecciona «Demo per a una residència»')
        pg.evaluate("document.getElementById('contacte').scrollIntoView()"); pg.click('#formContacte button[type=submit]'); pg.wait_for_timeout(300)
        comprova(pg.is_visible('#eNom') and pg.is_visible('#eCorreu') and pg.is_visible('#eConsent') and pg.get_attribute('#fNom', 'aria-invalid') == 'true', 'formulari: en enviar buit surten els tres missatges i aria-invalid')
        pg.fill('#fNom', 'Maria'); pg.fill('#fCorreu', 'no-es-un-correu'); pg.click('#formContacte button[type=submit]'); pg.wait_for_timeout(200)
        comprova(pg.is_visible('#eCorreu') and not pg.is_visible('#eNom'), 'formulari: un correu invàlid només marca el correu')
        pg.evaluate("document.getElementById('residencies').scrollIntoView()"); pg.fill('#fMotiu', 'residencia') if False else None
        pg.select_option('#fMotiu', 'prova'); pg.click('#ctaResidencia'); pg.wait_for_timeout(900)
        comprova(pg.evaluate("document.getElementById('fMotiu').value") == 'residencia' and pg.evaluate("location.search") == '?motiu=residencia', 'formulari: «Demana una demo» no recarrega la pàgina i selecciona el motiu')
        ctx.close(); shutil.rmtree(d, ignore_errors=True)
        # ---- moviment reduït
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
        comprova(pg.evaluate("[...document.querySelectorAll('.par > span')].every(e => getComputedStyle(e).animationName === 'none') && getComputedStyle(document.getElementById('elefantHero').querySelector('.el-saluda')).animationName === 'none'"), 'moviment reduït: les animacions del hero i la salutació de la trompa queden anul·lades')
        comprova(pg.evaluate("document.querySelector('.hero-video').querySelectorAll('source').length") == 0 and pg.evaluate("document.querySelector('.hero-video').currentSrc") == '', 'moviment reduït: el vídeo no es carrega (queda el poster)')
        comprova(pg.evaluate("getComputedStyle(document.querySelector('#carrusel .l-pista')).animationName") == 'none', 'moviment reduït: les files de jocs no es mouen soles')
        comprova(pg.evaluate("document.querySelector('.mobil[data-inclina]').style.transform") == '', "moviment reduït: el mòbil no s'inclina")
        comprova(pg.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == 'auto', 'moviment reduït: sense desplaçament suau')
        ctx.close()
        # ---- sense JavaScript
        ctx = nav.new_context(viewport={'width': 1280, 'height': 800}, java_script_enabled=False); pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(500)
        txt = pg.inner_text('main'); comprova(all(x in txt for x in ('Un botó gran', 'Qui cuida, a la vista', 'Informació clara, sense alarmes', 'Preguntes freqüents', 'Parlem-ne')), 'sense JS: el text de totes les seccions hi és')
        comprova(pg.evaluate("[...document.querySelectorAll('.bloc-mobil')].every(e => getComputedStyle(e).display !== 'none') && getComputedStyle(document.querySelector('.dia-fix')).display === 'none'"), 'sense JS: el mòbil viu és una llista de blocs, cadascun amb la seva captura')
        from PIL import Image
        img = Image.open(io.BytesIO(pg.screenshot(full_page=True))).convert('L'); w, h = img.size
        def varia(y0, y1): reg = img.crop((0, int(h * y0), w, int(h * y1))); mn, mx = reg.getextrema(); return mx - mn
        comprova(all(varia(a, a + .05) > 60 for a in (.3, .5, .7)), 'sense JS: el contingut es veu (no hi ha seccions buides per opacity: 0)')
        css = (ARREL / 'web' / 'web.css').read_text(encoding='utf-8')
        mals = [l.strip()[:80] for l in css.splitlines() if re.search(r'opacity:\s*0\b', l) and 'html.js' not in l and '@keyframes' not in l and not any(k in l for k in ('visibility', '.l-menu', '.l-barra', 'disabled', '[disabled]', '::after', '::details-content', '@media', '@starting-style'))]
        comprova(not mals, f'sense JS: cap regla de CSS amaga contingut amb opacity: 0 sense html.js ({mals[:2]})')
        ctx.close()
        # ---- demostració: no escriu al localStorage real (origen http per tenir un localStorage de debò)
        srv, port = serveix(ARREL); base = f'http://127.0.0.1:{port}/'
        c0 = nav.new_context(); p0 = c0.new_page(); p0.goto(base + 'app/index.html?demo=1'); p0.wait_for_timeout(2000)
        comprova(p0.evaluate("navigator.serviceWorker.getRegistrations().then(r => r.length)") == 0, 'demo: no registra service worker'); c0.close()
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.goto(base + 'app/index.html'); pg.wait_for_timeout(600)
        pg.evaluate("localStorage.clear(); localStorage.setItem('canari', 'real')")
        pg.goto(base + 'app/index.html?demo=1'); pg.wait_for_timeout(1200)
        comprova(pg.evaluate("window.__MODE_DEMO === true") and 'Mode demostració' in pg.inner_text('#bandaDemo'), 'demo: es mostra la banda «Mode demostració — no es desa res»')
        comprova(pg.evaluate("localStorage.getItem('canari')") is None, "demo: l'app no veu les dades reals de l'origen")
        comprova(not pg.evaluate("!!document.querySelector('#onboardingOverlay.actiu')"), 'demo: sense benvinguda')
        pg.evaluate("lsSet('mentA_prova_demo', 1); ajustes.zoom = 'gran'; guardarAjustes()"); pg.evaluate("obrirJoc('memory')"); pg.wait_for_timeout(800)
        pg.goto(base + 'app/index.html'); pg.wait_for_timeout(800)
        comprova(pg.evaluate("localStorage.getItem('canari')") == 'real' and pg.evaluate("localStorage.getItem('mentA_prova_demo')") is None and pg.evaluate("localStorage.getItem('mentA_ajustes')") is None or 'gran' not in (pg.evaluate("localStorage.getItem('mentA_ajustes')") or ''), 'demo: el localStorage real continua intacte després de jugar a la demo')
        pg.goto(base + 'index.html'); pg.wait_for_timeout(700); pg.evaluate("document.getElementById('demo').scrollIntoView()"); pg.wait_for_timeout(300)
        comprova(pg.locator('#demoPantalla iframe').count() == 0, "demo web: l'iframe NO es carrega fins que es prem")
        pg.click('#demoPlay'); pg.wait_for_timeout(2500)
        fr = pg.frame_locator('#demoPantalla iframe'); comprova(fr.locator('#bandaDemo').count() == 1 and pg.locator('#demoSurt').is_visible(), "demo web: en prémer, l'app es carrega dins del marc de mòbil")
        pg.click('#demoSurt'); comprova(pg.locator('#demoPantalla iframe').count() == 0 and pg.locator('#demoPlay').is_visible(), 'demo web: «Surt de la demostració» torna a la portada')
        ctx.close(); srv.shutdown()
        # ---- demo amb file:// (sense servidor)
        ctx = nav.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.goto(url); pg.evaluate("document.getElementById('demo').scrollIntoView()"); pg.click('#demoPlay'); pg.wait_for_timeout(2500)
        comprova(pg.frame_locator('#demoPantalla iframe').locator('#bandaDemo').count() == 1, 'demo web: també funciona amb file://')
        ctx.close(); nav.close()
    comprova(not errors, f'cap error de JS ({errors[:2]})'); comprova(not csp, f'cap violació de CSP ({csp[:2]})')
    print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
