#!/usr/bin/env python3
"""Adapta la CSP de la web al servei de formulari que hagis posat a CONTACTE.formulari (app/js/config.js).

Sense això, el navegador bloquejaria l'enviament del formulari (la CSP només deixa connectar amb el mateix origen).
Només s'afegeix l'ORIGEN del servei (https://formspree.io, per exemple) a `connect-src` de index.html; mai `connect-src *`.
Si CONTACTE.formulari és buit, es torna a la CSP base.

Ús:
  python tools/aplica-contacte.py            aplica
  python tools/aplica-contacte.py --simula   només ensenya què canviaria
"""
import argparse, pathlib, re, sys
from urllib.parse import urlparse
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
BASE = "'self' blob: file:"

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); ap.add_argument('--simula', action='store_true'); a = ap.parse_args()
    cfg = (ARREL / 'app' / 'js' / 'config.js').read_text(encoding='utf-8')
    m = re.search(r"CONTACTE = \{[^}]*?formulari: '([^']*)'", cfg); url = m.group(1).strip() if m else ''
    origen = ''
    if url:
        u = urlparse(url)
        if u.scheme != 'https' or not u.hostname: sys.exit(f"✗ CONTACTE.formulari ha de ser una URL https (ara: «{url}»)")
        origen = f'{u.scheme}://{u.netloc}'
    p = ARREL / 'index.html'; t = p.read_bytes().decode('utf-8'); crlf = '\r\n' in t
    nou = re.sub(r"connect-src [^;\"]*;", f"connect-src {BASE}{(' ' + origen) if origen else ''};", t, count=1)
    print(('SIMULACIÓ · ' if a.simula else '') + (f'Formulari: {origen}' if origen else 'Sense formulari extern (CSP base)'))
    if nou == t: print('  (cap canvi: ja estava així)'); return 0
    print('  ✎ index.html (connect-src)')
    if not a.simula: p.write_bytes(nou.encode('utf-8'))
    return 0

if __name__ == '__main__': sys.exit(main())
