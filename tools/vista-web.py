"""Captures de revisió de la web per seccions (el viewport en cada punt clau), per mirar-les amb ulls. No és un test.
Ús: python tools/vista-web.py --sortida docs/web-premium/1440-clar --ample 1440 --alt 900 [--tema clar|fosc] [--pagina index.html]"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
PUNTS = [('01-hero', 'window.scrollTo(0,0)'), ('02-fets', "document.querySelector('.l-fets').scrollIntoView({block:'center'})")]
for i in range(4): PUNTS.append((f'0{3 + i}-dia{i + 1}', f"(()=>{{const b=document.querySelectorAll('.bloc')[{i}];const r=b.getBoundingClientRect();window.scrollBy(0,r.top+r.height/2-innerHeight/2)}})()"))
PUNTS += [('07-demo', "document.getElementById('demo').scrollIntoView({block:'center'})"), ('08-aparador', "document.getElementById('jocs').scrollIntoView({block:'start'})"), ('09-aparador-peces', "document.getElementById('bingo').scrollIntoView({block:'center'})"),
          ('10-bento', "document.querySelector('.bento').scrollIntoView({block:'start'})"), ('11-bento2', "document.querySelector('.peca-pin').scrollIntoView({block:'start'})"), ('12-residencies', "document.getElementById('residencies').scrollIntoView({block:'center'})"),
          ('13-enfocament', "document.getElementById('enfocament').scrollIntoView({block:'start'})"), ('14-preguntes', "document.getElementById('preguntes').scrollIntoView({block:'start'})"), ('15-contacte', "document.getElementById('contacte').scrollIntoView({block:'start'})"),
          ('16-final', "document.querySelector('.l-final').scrollIntoView({block:'center'})"), ('17-peu', "window.scrollTo(0, document.documentElement.scrollHeight)")]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sortida', default='docs/web-premium/vista'); ap.add_argument('--ample', type=int, default=1440); ap.add_argument('--alt', type=int, default=900)
    ap.add_argument('--tema', default='clar'); ap.add_argument('--pagina', default='index.html'); ap.add_argument('--nomes', default='')
    a = ap.parse_args(); out = ARREL / a.sortida; out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': a.ample, 'height': a.alt}, color_scheme='dark' if a.tema == 'fosc' else 'light', device_scale_factor=1); pg = ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text[:140]) if m.type == 'error' else None)
        pg.goto((ARREL / a.pagina).as_uri()); pg.wait_for_timeout(2600)
        pg.evaluate("document.documentElement.style.scrollBehavior='auto'")
        alt = pg.evaluate('document.documentElement.scrollHeight'); y = 0
        while y < alt: pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(90); y += a.alt // 2; alt = pg.evaluate('document.documentElement.scrollHeight')
        for nom, js in PUNTS:
            if a.nomes and not any(n in nom for n in a.nomes.split(',')): continue
            if nom.startswith('01'): pg.evaluate('window.scrollTo(0,0)')
            try: pg.evaluate(js)
            except Exception as e: print('  ✗', nom, str(e)[:80]); continue
            pg.wait_for_timeout(1300 if nom.startswith(('01', '10', '11', '07', '12')) else 700); pg.screenshot(path=str(out / f'{nom}.jpg'), type='jpeg', quality=72); print('  ', nom)
        print('errors:', errs[:4]); b.close()

if __name__ == '__main__': main()
