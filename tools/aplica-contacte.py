#!/usr/bin/env python3
"""Adapta la CSP als serveis externs que hagis posat a app/js/config.js.

Sense això, el navegador bloquejaria l'enviament (la CSP només deixa connectar amb el mateix origen):
  · CONTACTE.formulari → formulari de contacte de la WEB (index.html de l'arrel).
  · FEEDBACK_URL       → feedback de l'APP (app/index.html).
Només s'afegeix l'ORIGEN del servei (https://formspree.io, per exemple) a `connect-src`; mai `connect-src *`.
Si el valor és buit, es torna a la CSP base.

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

def origen_de(url, nom):
    if not url: return ''
    u = urlparse(url)
    if u.scheme != 'https' or not u.hostname: sys.exit(f"✗ {nom} ha de ser una URL https (ara: «{url}»)")
    return f'{u.scheme}://{u.netloc}'

def aplica(fitxer, origen, simula):
    p = ARREL / fitxer; t = p.read_bytes().decode('utf-8')
    nou = re.sub(r"connect-src [^;\"]*;", f"connect-src {BASE}{(' ' + origen) if origen else ''};", t, count=1)
    if nou == t: print(f'  (cap canvi a {fitxer}: ja estava així)'); return
    print(f'  ✎ {fitxer} (connect-src)')
    if not simula: p.write_bytes(nou.encode('utf-8'))

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); ap.add_argument('--simula', action='store_true'); a = ap.parse_args()
    cfg = (ARREL / 'app' / 'js' / 'config.js').read_text(encoding='utf-8')
    m = re.search(r"CONTACTE = \{[^}]*?formulari: '([^']*)'", cfg); web = origen_de(m.group(1).strip() if m else '', 'CONTACTE.formulari')
    m = re.search(r"const FEEDBACK_URL = '([^']*)'", cfg); app = origen_de(m.group(1).strip() if m else '', 'FEEDBACK_URL')
    print(('SIMULACIÓ · ' if a.simula else '') + f'Web: {web or "CSP base"} · App (feedback): {app or "CSP base"}')
    aplica('index.html', web, a.simula)
    aplica('app/index.html', app, a.simula)
    return 0

if __name__ == '__main__': sys.exit(main())
