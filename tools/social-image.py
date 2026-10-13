"""Genera la imatge social (Open Graph / Twitter) de 1200×630: app/img/social-1200x630.png.
Es dibuixa amb els mateixos elements de la web: l'Elefant (SVG exportat de l'app), una captura real de l'app i el títol, amb les tipografies locals.
Ús: python tools/social-image.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent

HTML = """<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: 'T'; src: url('@@fonts@@/lexend-latin.woff2') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'X'; src: url('@@fonts@@/atkinson-latin.woff2') format('woff2'); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: radial-gradient(520px 420px at 22% 38%, #ffe3b3, #fbefd9 70%); font-family: 'X'; position: relative; }
.t { position: absolute; left: 76px; top: 70px; width: 640px; display: grid; gap: 26px; }
.marca { display: flex; align-items: center; gap: 14px; font: 800 36px 'T'; color: #134a2c; } .marca img { width: 54px; height: 54px; }
h1 { font: 700 84px/.98 'T'; letter-spacing: -.035em; color: #1b1712; }
p { font-size: 30px; color: #54493c; line-height: 1.3; max-width: 560px; }
.pastilla { position: absolute; left: 76px; bottom: 56px; background: #f2a65a; color: #2d1904; font: 650 27px 'T'; padding: 14px 32px; border-radius: 99px; box-shadow: 0 14px 30px -12px rgba(242,166,90,.8); }
.panell { position: absolute; right: -60px; top: -40px; width: 520px; height: 760px; background: #0e2e1d; border-radius: 120px 0 0 120px; }
.mobil { position: absolute; right: 118px; top: 150px; width: 300px; padding: 9px; border-radius: 48px; background: linear-gradient(150deg,#54545b,#17171a 30%,#17171a 70%,#3a3a40); box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 40px 70px -20px rgba(0,0,0,.7); }
.mobil .ec { border-radius: 40px; overflow: hidden; background: #faf7f2; aspect-ratio: 430/932; position: relative; } .mobil .ec img { position: absolute; left: 0; top: 5.4%; width: 100%; height: 94.6%; object-fit: contain; object-position: top; }
.mobil .illa { position: absolute; z-index: 3; top: 2.4%; left: 50%; width: 27%; height: 2.7%; transform: translateX(-50%); border-radius: 99px; background: #050506; }
.el { position: absolute; right: 196px; top: -12px; width: 180px; filter: drop-shadow(0 10px 12px rgba(0,0,0,.35)); }
</style><body>
<div class="panell"></div>
<div class="t"><div class="marca"><img src="@@logo@@"><span>MentA</span></div><h1>Simple per a l'avi, útil per a qui el cuida</h1><p>Jocs per mantenir la ment activa i un espai a part per a qui cuida.</p></div>
<span class="pastilla">Gratuïta i sense registre</span>
<div class="mobil"><div class="ec"><span class="illa"></span><img src="@@inici@@"></div></div><img class="el" src="@@elefant@@"></body>"""


def main():
    f = lambda r: (ARREL / r).as_uri()
    html = HTML
    for k, v in {'fonts': f('app/fonts'), 'logo': f('app/img/logo.webp'), 'inici': f('img/web/inici.webp'), 'elefant': f('img/web/elefant.svg')}.items(): html = html.replace('@@' + k + '@@', v)
    tmp = ARREL / 'tools' / '_social.html'; tmp.write_text(html, encoding='utf-8')
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630}); pg.goto(tmp.as_uri()); pg.wait_for_timeout(800)
        pg.screenshot(path=str(ARREL / 'app' / 'img' / 'social-1200x630.png')); b.close()
    tmp.unlink(); print('Fet: app/img/social-1200x630.png')

if __name__ == '__main__': main()
