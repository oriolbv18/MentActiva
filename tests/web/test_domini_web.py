"""La web nova + tools/aplica-domini.py + tools/aplica-contacte.py, sobre una CÒPIA (l'original no es toca):
sense domini no hi ha cap marcador ni JSON-LD amb URL falsa; amb domini hi ha JSON-LD vàlid, canonical i sitemap; --treu torna a l'estat inicial;
amb un formulari extern la CSP només guanya l'origen del servei. Ús: python tests/web/test_domini_web.py"""
import json, pathlib, re, shutil, subprocess, sys, tempfile
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []

def comprova(cond, text):
    print(('  ✓ ' if cond else '  ✗ ') + text, flush=True)
    if not cond: fallades.append(text)

def main():
    d = pathlib.Path(tempfile.mkdtemp(prefix='menta_dom_'))
    for r in ('tools/aplica-domini.py', 'tools/aplica-contacte.py', 'index.html', '404.html', 'legal', 'sitemap.xml', 'robots.txt', 'app/index.html', 'app/js/config.js'):
        o = ARREL / r; t = d / r; t.parent.mkdir(parents=True, exist_ok=True); shutil.copytree(o, t) if o.is_dir() else shutil.copy(o, t)
    run = lambda *a: subprocess.run([sys.executable, str(d / 'tools' / a[0]), *a[1:]], capture_output=True, text=True, encoding='utf-8')
    llegeix = lambda p: (d / p).read_text(encoding='utf-8')
    idx0 = llegeix('index.html')
    comprova('__DOMINI__' not in idx0 and 'EL-TEU-DOMINI' not in idx0, 'sense domini: la landing no porta cap marcador')
    comprova('application/ld+json' not in idx0, 'sense domini: no hi ha JSON-LD (abans tenia https://__DOMINI__/, una URL no vàlida)')
    r = run('aplica-domini.py', 'exemple.cat'); comprova(r.returncode == 0 and 'Verificat' in r.stdout, f'amb domini: l\'script verifica que no queda cap marcador ({r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-200:]})')
    idx = llegeix('index.html'); m = re.search(r'<script type="application/ld\+json">(.*?)</script>', idx, re.S)
    ld = json.loads(m.group(1)) if m else {}
    comprova(ld.get('url') == 'https://exemple.cat/' and ld.get('@type') == 'SoftwareApplication', 'amb domini: JSON-LD vàlid amb la URL real')
    comprova('rel="canonical" href="https://exemple.cat/"' in idx, 'amb domini: canonical correcte')
    comprova('https://exemple.cat/app/img/social-1200x630.png' in idx, 'amb domini: imatge social amb URL absoluta')
    comprova('https://exemple.cat/legal/privadesa.html' in llegeix('sitemap.xml') and '__DOMINI__' not in llegeix('sitemap.xml'), 'amb domini: sitemap correcte')
    comprova('rel="canonical" href="https://exemple.cat/legal/privadesa.html"' in llegeix('legal/privadesa.html'), 'amb domini: canonical a les pàgines legals')
    r = run('aplica-domini.py', '--treu'); idx = llegeix('index.html')
    comprova(r.returncode == 0 and 'application/ld+json' not in idx and 'https://exemple.cat' not in idx, '--treu: torna a l\'estat sense domini (sense JSON-LD ni URL absolutes)')
    # formulari extern
    cfg = d / 'app/js/config.js'; cfg.write_text(cfg.read_text(encoding='utf-8').replace("formulari: ''", "formulari: 'https://formspree.io/f/abc123'", 1), encoding='utf-8')
    r = run('aplica-contacte.py'); csp = re.search(r'connect-src ([^;"]*);', llegeix('index.html')).group(1)
    comprova(csp == "'self' blob: file: https://formspree.io", f'contacte: la CSP només guanya l\'origen del servei ({csp})')
    comprova('connect-src *' not in llegeix('index.html'), 'contacte: mai connect-src *')
    cfg.write_text(cfg.read_text(encoding='utf-8').replace("formulari: 'https://formspree.io/f/abc123'", "formulari: ''", 1), encoding='utf-8'); run('aplica-contacte.py')
    comprova(re.search(r'connect-src ([^;"]*);', llegeix('index.html')).group(1) == "'self' blob: file:", 'contacte: en buidar el formulari, la CSP torna a la base')
    cfg.write_text(cfg.read_text(encoding='utf-8').replace("formulari: ''", "formulari: 'http://insegur.exemple/f'", 1), encoding='utf-8'); r = run('aplica-contacte.py')
    comprova(r.returncode != 0, 'contacte: rebutja una URL que no és https')
    shutil.rmtree(d, ignore_errors=True); print('\nFallades:', len(fallades)); return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
