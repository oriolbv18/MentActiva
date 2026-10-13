#!/usr/bin/env python3
"""Aplica un domini propi a tota la web i a l'app amb UNA sola comanda.

Ús:
  python tools/aplica-domini.py elmeudomini.cat            aplica el domini
  python tools/aplica-domini.py elmeudomini.cat --simula   només ensenya què canviaria
  python tools/aplica-domini.py --treu                     torna a l'estat «sense domini» (rutes relatives)

Què toca (només aquests llocs; res més):
  · <link rel="canonical">, og:url, og:image i twitter:image de la web, de les pàgines legals i de la 404 (etiquetes amb data-domini="/ruta")
  · JSON-LD de la web (només es genera quan hi ha domini), sitemap.xml i robots.txt (el marcador https://__DOMINI__)
  · .well-known/security.txt (es genera si hi ha domini I un correu a CONTACTE.email de config.js; si no, s'esborra)
  · CNAME (el crea o l'esborra) i la constant DOMINI de app/js/config.js (enllaços de compartir)
És idempotent: executar-lo dues vegades amb el mateix domini no canvia res. Recorda l'últim domini a tools/.domini
i el substitueix (així pots canviar d'un domini a un altre). Al final comprova que no queda cap marcador ni cap URL antiga.
"""
import argparse, pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
MEMORIA = ARREL / 'tools' / '.domini'
HTML = ['index.html', '404.html', 'legal/privadesa.html', 'legal/avis-legal.html', 'legal/condicions.html', 'legal/cookies.html', 'app/index.html']
TEXT = ['index.html', 'sitemap.xml', 'robots.txt', '404.html']
MARCADOR = '__DOMINI__'
RE_DOMINI = re.compile(r'^(?=.{4,253}$)(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,24}$')

def normalitza(d):
    d = d.strip().lower()
    d = re.sub(r'^https?://', '', d).split('/')[0]
    if d.startswith('www.'): d = d[4:]                      # sempre el domini sense www; el www es redirigeix al registrador (vegeu docs/DOMINI.md)
    if not RE_DOMINI.match(d): sys.exit(f'✗ «{d}» no sembla un domini vàlid (exemple: mentactiva.cat)')
    return d

def llegeix(p):
    b = (ARREL / p).read_bytes(); crlf = b'\r\n' in b
    return b.decode('utf-8').replace('\r\n', '\n'), crlf
def escriu(p, s, crlf):
    (ARREL / p).write_bytes((s.replace('\n', '\r\n') if crlf else s).encode('utf-8'))

LD = re.compile(r'<!--LD-->.*?<!--/LD-->', re.S)
def json_ld(dom):
    """JSON-LD de la web: només existeix quan hi ha un domini real (mai amb un marcador que no és una URL vàlida)."""
    import json
    d = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "MentA", "alternateName": "MentActiva", "applicationCategory": "GameApplication",
         "operatingSystem": "Web (Android, iOS, ordinador)", "inLanguage": "ca", "url": f"https://{dom}/",
         "description": "Jocs de memòria, atenció, llenguatge, càlcul i lògica per a persones grans, amb un espai a part per a qui les cuida.", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}
    return '<!--LD--><script type="application/ld+json">' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + '</script><!--/LD-->'

TAG = re.compile(r'<(link|meta)\b[^>]*\bdata-domini="[^"]*"[^>]*>')
def aplica_html(s, dom):
    """Posa href/content de les etiquetes amb data-domini; sense domini deixa el valor relatiu (data-domini-rel) o buit."""
    def una(m):
        t = m.group(0); ruta = re.search(r'data-domini="([^"]*)"', t).group(1); rel = re.search(r'data-domini-rel="([^"]*)"', t)
        attr = 'href' if m.group(1) == 'link' else 'content'
        valor = f'https://{dom}{ruta}' if dom else (rel.group(1) if rel else '')
        return re.sub(rf'\b{attr}="[^"]*"', f'{attr}="{valor}"', t, count=1)
    s = LD.sub(lambda m: json_ld(dom) if dom else '<!--LD--><!--/LD-->', s)
    return TAG.sub(una, s)

def canvis():
    prev = MEMORIA.read_text(encoding='utf-8').strip() if MEMORIA.exists() else ''
    return prev

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('domini', nargs='?'); ap.add_argument('--simula', action='store_true'); ap.add_argument('--treu', action='store_true')
    a = ap.parse_args()
    if a.treu == bool(a.domini): ap.error('indica un domini, o bé --treu (però no tots dos)')
    dom = '' if a.treu else normalitza(a.domini); prev = canvis(); fets = []

    def desa(p, nou, antic, crlf):
        if nou != antic:
            fets.append(p)
            if not a.simula: escriu(p, nou, crlf)

    for p in HTML:
        if not (ARREL / p).exists(): continue
        s, crlf = llegeix(p); desa(p, aplica_html(s, dom), s, crlf)
    for p in TEXT:
        if not (ARREL / p).exists(): continue
        s, crlf = llegeix(p); n = s
        if dom:
            n = n.replace('https://' + MARCADOR, 'https://' + dom)
            if prev and prev != dom: n = n.replace('https://' + prev, 'https://' + dom)
        elif prev: n = n.replace('https://' + prev, 'https://' + MARCADOR)
        # robots.txt: la línia «Sitemap» només hi és si hi ha domini
        if p == 'robots.txt':
            n = re.sub(r'^Sitemap:.*\n?', '', n, flags=re.M)
            if dom: n = n.rstrip('\n') + f'\nSitemap: https://{dom}/sitemap.xml\n'
        desa(p, n, s, crlf)
    # CNAME
    cn = ARREL / 'CNAME'; actual = cn.read_text(encoding='utf-8').strip() if cn.exists() else ''
    if dom != actual:
        fets.append('CNAME' + ('' if dom else ' (s\'esborra)'))
        if not a.simula:
            if dom: cn.write_text(dom + '\n', encoding='utf-8')
            elif cn.exists(): cn.unlink()
    # security.txt: només té sentit amb domini i correu de contacte reals
    sec = ARREL / '.well-known' / 'security.txt'; cfg, _ = llegeix('app/js/config.js'); mc = re.search(r"CONTACTE = \{[^}]*?email: '([^']*)'", cfg); correu = mc.group(1).strip() if mc else ''
    nou_sec = ''
    if dom and re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$', correu):
        import datetime; cad = (datetime.date.today() + datetime.timedelta(days=365)).strftime('%Y-%m-%dT00:00:00.000Z')
        nou_sec = chr(10).join([f'Contact: mailto:{correu}', f'Expires: {cad}', 'Preferred-Languages: ca, es', f'Canonical: https://{dom}/.well-known/security.txt']) + chr(10)
    ant_sec = sec.read_text(encoding='utf-8') if sec.exists() else ''
    if nou_sec.split('Expires')[0] != ant_sec.split('Expires')[0] or (not nou_sec) != (not ant_sec):
        fets.append('.well-known/security.txt' + ('' if nou_sec else " (s'esborra)"))
        if not a.simula:
            if nou_sec: sec.parent.mkdir(exist_ok=True); sec.write_text(nou_sec, encoding='utf-8')
            elif sec.exists(): sec.unlink()
    # config.js → DOMINI
    s, crlf = llegeix('app/js/config.js'); n, k = re.subn(r"^const DOMINI = '[^']*';", f"const DOMINI = '{dom}';", s, count=1, flags=re.M)
    if not k: sys.exit('✗ no trobo «const DOMINI» a app/js/config.js')
    desa('app/js/config.js', n, s, crlf)
    if not a.simula:
        if dom: MEMORIA.write_text(dom + '\n', encoding='utf-8')
        elif MEMORIA.exists(): MEMORIA.unlink()

    print(('SIMULACIÓ · ' if a.simula else '') + (f'Domini: {dom}' if dom else 'Sense domini (rutes relatives)'))
    for f in fets: print('  ✎', f)
    if not fets: print('  (cap canvi: ja estava així)')
    if a.simula: return 0
    # ---- verificació: cap marcador ni URL antiga ----
    problemes = []
    for p in HTML + TEXT:
        if not (ARREL / p).exists(): continue
        s, _ = llegeix(p)
        if dom and MARCADOR in s: problemes.append(f'{p}: queda el marcador {MARCADOR}')
        if 'EL-TEU-DOMINI' in s: problemes.append(f'{p}: queda «EL-TEU-DOMINI»')
        if dom and prev and prev != dom and ('https://' + prev) in s: problemes.append(f'{p}: queda el domini antic {prev}')
        if not dom and re.search(r'<(link|meta)\b[^>]*\bdata-domini[^>]*(href|content)="https://', s): problemes.append(f'{p}: queda alguna URL absoluta')
    if problemes:
        print('✗ PROBLEMES:'); [print('   ', x) for x in problemes]; return 1
    print('✓ Verificat: no queda cap marcador ni cap URL antiga.')
    return 0

if __name__ == '__main__': sys.exit(main())
