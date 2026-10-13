"""Domini propi (v1.9): aplica un domini d'exemple en una còpia, comprova metadades, sitemap i idempotència, i que tot torna a l'estat inicial amb --treu.
Ús: python tests/domini/test_domini.py"""
import filecmp, hashlib, pathlib, re, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
fallades = []
def comprova(c, m):
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c: fallades.append(m)
def hash_arbre(r):
    return {str(p.relative_to(r)): hashlib.md5(p.read_bytes().replace(bytes([13, 10]), bytes([10]))).hexdigest() for p in sorted(r.rglob('*')) if p.is_file() and 'img' not in p.parts and 'fonts' not in p.parts and 'vendor' not in p.parts}
def executa(tmp, *args):
    r = subprocess.run([sys.executable, str(tmp / 'tools' / 'aplica-domini.py'), *args], capture_output=True, text=True, encoding='utf-8', errors='replace'); return r.returncode, r.stdout
def main():
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='menta-dom-'))
    for n in ['index.html', '404.html', 'sitemap.xml', 'robots.txt']: shutil.copy(ARREL / n, tmp / n)
    for d in ['legal', 'web', 'tools', 'app']: shutil.copytree(ARREL / d, tmp / d, ignore=shutil.ignore_patterns('node_modules', '.git', '*.png', '*.webp', '*.woff2'))
    (tmp / 'tools' / '.domini').unlink(missing_ok=True)
    inicial = hash_arbre(tmp)
    c, o = executa(tmp, 'exemple.cat', '--simula'); comprova(c == 0 and hash_arbre(tmp) == inicial, '--simula no toca res')
    c, o = executa(tmp, 'exemple.cat'); comprova(c == 0 and 'Verificat' in o, 'aplica exemple.cat i verifica')
    h1 = hash_arbre(tmp); c, o = executa(tmp, 'https://www.exemple.cat/'); comprova(hash_arbre(tmp) == h1 and 'cap canvi' in o, 'és idempotent (també amb https://www… i barra final)')
    idx = (tmp / 'index.html').read_text(encoding='utf-8')
    comprova('rel="canonical" href="https://exemple.cat/"' in idx and 'og:url" content="https://exemple.cat/"' in idx, 'canonical i og:url absoluts')
    comprova('og:image" content="https://exemple.cat/app/img/social-1200x630.png"' in idx and '"url":"https://exemple.cat/"' in idx, 'og:image i JSON-LD amb el domini')
    sm = (tmp / 'sitemap.xml').read_text(encoding='utf-8'); locs = re.findall(r'<loc>https://exemple.cat/([^<]*)</loc>', sm)
    comprova(len(locs) == 5 and all((tmp / (l or 'index.html')).exists() for l in locs), f'sitemap: {len(locs)} URL i tots els fitxers existeixen')
    comprova('Sitemap: https://exemple.cat/sitemap.xml' in (tmp / 'robots.txt').read_text(encoding='utf-8') and (tmp / 'CNAME').read_text().strip() == 'exemple.cat', 'robots.txt i CNAME')
    comprova("const DOMINI = 'exemple.cat';" in (tmp / 'app/js/config.js').read_text(encoding='utf-8'), 'config.js té DOMINI')
    tot = ''.join(p.read_text(encoding='utf-8', errors='ignore') for p in [tmp / 'index.html', tmp / 'sitemap.xml', tmp / 'robots.txt'] + list((tmp / 'legal').glob('*.html')))
    comprova('__DOMINI__' not in tot and 'EL-TEU-DOMINI' not in tot, 'no queda cap marcador')
    c, o = executa(tmp, 'altre.cat'); comprova(c == 0 and 'exemple.cat' not in (tmp / 'sitemap.xml').read_text() and 'altre.cat' in (tmp / 'sitemap.xml').read_text(), 'es pot canviar d\'un domini a un altre sense deixar l\'antic')
    c, o = executa(tmp, 'no és un domini'); comprova(c != 0, 'rebutja un domini invàlid')
    # amb domini, l'app i la web carreguen (file://) sense errors i urlBase() torna el domini
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto((tmp / 'app' / 'index.html').as_uri()); pg.wait_for_timeout(1200); u = pg.evaluate("urlBase()")
        comprova(u == 'https://altre.cat/', f'amb DOMINI, urlBase() = {u}')
        pg.goto((tmp / 'index.html').as_uri()); pg.wait_for_timeout(800); pg.goto((tmp / '404.html').as_uri()); pg.wait_for_timeout(800)
        comprova(not errs, f'web i 404 sense errors {errs[:2]}'); b.close()
    c, o = executa(tmp, '--treu'); (tmp / 'tools' / '.domini').unlink(missing_ok=True)
    comprova(c == 0 and not (tmp / 'CNAME').exists() and hash_arbre(tmp) == inicial, '--treu torna exactament a l\'estat inicial (sense domini)')
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto((tmp / 'app' / 'index.html').as_uri()); pg.wait_for_timeout(1200); u = pg.evaluate("urlBase()")
        comprova(not u.startswith('https://altre') and not errs, f'sense DOMINI tot funciona amb file:// (urlBase="{u}")'); b.close()
    shutil.rmtree(tmp, ignore_errors=True)
    print('\nFallades:', len(fallades)); return 1 if fallades else 0
if __name__ == '__main__': sys.exit(main())
