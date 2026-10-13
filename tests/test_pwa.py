"""Prova de la PWA: service worker, precache, funcionament sense xarxa, manifest i icones.
Ús: python tests/test_pwa.py   (aixeca un servidor local temporal a localhost)"""
import functools, http.server, json, pathlib, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ARREL = pathlib.Path(__file__).resolve().parent.parent
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

class Silenciós(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def main():
    errors = []
    h = functools.partial(Silenciós, directory=str(ARREL))
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{port}/app/'
    man = json.loads((ARREL / 'app' / 'manifest.webmanifest').read_text(encoding='utf8'))
    for ic in man['icons']:
        if not (ARREL / 'app' / ic['src']).exists(): errors.append('icona del manifest inexistent: ' + ic['src'])
    if not any('maskable' in i['purpose'] for i in man['icons']): errors.append('falta icona maskable')
    if not man.get('shortcuts'): errors.append('manifest sense shortcuts')
    with sync_playwright() as p:
        nav = p.chromium.launch(); ctx = nav.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); logs = []
        pg.on('pageerror', lambda e: logs.append(str(e)))
        pg.add_init_script("try{localStorage.setItem('mentA_onboarding_vist','1')}catch(e){}")
        pg.goto(base); pg.wait_for_timeout(3500)
        pg.wait_for_timeout(2500)
        reg = pg.evaluate("navigator.serviceWorker.getRegistration().then(r => !!(r && (r.active || r.waiting)))")
        if not reg: errors.append('el service worker no s\'ha registrat')
        caches = pg.evaluate("caches.keys()")
        if 'menta-1.9.3' not in caches: errors.append('no hi ha la cache menta-1.9.3: ' + str(caches))
        n = pg.evaluate("caches.open('menta-1.9.3').then(c => c.keys()).then(k => k.length)")
        print('  recursos al precache:', n)
        pg.reload(); pg.wait_for_timeout(1000)
        ctx.set_offline(True)
        pg.reload(); pg.wait_for_timeout(1200)
        txt = pg.inner_text('body')
        if 'jugar' not in txt.lower() and 'comencem' not in txt.lower(): errors.append('sense xarxa l\'app no es carrega')
        else: print('  ✓ funciona sense xarxa')
        pg.evaluate("obrirJoc('calcul')"); pg.wait_for_timeout(500)
        ok_font = pg.evaluate("document.fonts.check('16px \"MentA Text\"')")
        print('  tipografia local carregada:', ok_font)
        if logs: errors.append('errors JS: ' + ' | '.join(logs[:3]))
        nav.close()
    srv.shutdown()
    print('RESULTAT:', 'PWA CORRECTA' if not errors else errors)
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main())
