"""Comprova el contrast WCAG dels parells text/fons reals (tokens de app/css/estils.css).
Ús: python tests/contrast.py   → surt amb codi 1 si algun parell no arriba a AA (4,5:1 text; 3:1 elements gràfics)."""
import re, sys, pathlib
CSS = (pathlib.Path(__file__).resolve().parent.parent / 'app' / 'css' / 'estils.css').read_text(encoding='utf8')

def blocs():
    def trau(sel):
        m = re.search(re.escape(sel) + r'\s*\{(.*?)\n\}', CSS, re.S)
        ex = lambda h: '#' + ''.join(c * 2 for c in h[1:]) if len(h) == 4 else h
        return {k: ex(v) for k, v in re.findall(r'(--[\w-]+):\s*(#[0-9a-fA-F]{3,6})\b', m.group(1))} if m else {}
    clar = trau(':root')
    fosc = {**clar, **trau('html[data-tema="fosc"]')}
    alt = {**clar, **trau('html[data-contrast="alt"]')}
    altfosc = {**fosc, **trau('html[data-contrast="alt"]'), **trau('html[data-tema="fosc"][data-contrast="alt"]')}
    return {'clar': clar, 'fosc': fosc, 'alt contrast': alt, 'fosc + alt contrast': altfosc}

def lum(h):
    h = h.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)
def mescla(a, b, pa):  # color-mix(in srgb, a pa%, b)
    a, b = a.lstrip('#'), b.lstrip('#'); return '#' + ''.join('%02x' % round(int(a[i:i + 2], 16) * pa + int(b[i:i + 2], 16) * (1 - pa)) for i in (0, 2, 4))

PARELLS = [  # (text, fons, mínim, descripció)
    ('--text', '--fons', 7, 'text principal sobre el fons (AAA)'), ('--text', '--superficie', 7, 'text principal sobre targetes (AAA)'),
    ('--text-suau', '--fons', 4.5, 'text secundari sobre el fons'), ('--text-suau', '--superficie', 4.5, 'text secundari sobre targetes'), ('--text-suau', '--superficie-2', 4.5, 'text secundari sobre superfície 2'),
    ('--text-invers', '--marca-fosc', 4.5, 'text de botó principal'), ('--marca-molt-fosc', '--fons', 7, 'títols de marca'), ('--marca-molt-fosc', '--marca-suau', 4.5, 'text sobre fons de marca tintat'),
    ('--marca-fosc', '--superficie', 4.5, 'enllaços i icones de marca'), ('--accio-fosc', '--superficie', 4.5, 'text ambre'), ('--accio-fosc', '--accio-suau', 4.5, 'text ambre sobre ambre suau'),
    ('--exit', '--exit-suau', 4.5, 'èxit sobre fons suau'), ('--avis', '--avis-suau', 4.5, 'avís sobre fons suau'), ('--error', '--error-suau', 4.5, 'error sobre fons suau'), ('--error', '--superficie', 4.5, 'error sobre targeta'),
    ('--info', '--info-suau', 4.5, 'info sobre fons suau'), ('--text', '--info-suau', 7, 'text sobre avís informatiu'), ('--text', '--avis-suau', 7, 'text sobre avís'),
    ('--focus', '--fons', 3, 'anell de focus'), ('--vora-forta', '--superficie', 3, 'vora de controls (element gràfic)'),
    ('--dom-memoria', '--superficie', 4.5, 'domini memòria'), ('--dom-atencio', '--superficie', 4.5, 'domini atenció'), ('--dom-llenguatge', '--superficie', 4.5, 'domini llenguatge'),
    ('--dom-calcul', '--superficie', 4.5, 'domini càlcul'), ('--dom-logica', '--superficie', 4.5, 'domini lògica'),
    ('--text-invers', '--info', 4.5, 'text del botó «Jugar amb algú»'), ('--text-invers', '--j1', 4.5, 'casella marcada del jugador 1 (bingo)'), ('--text-invers', '--j2', 4.5, 'casella marcada del jugador 2 (bingo)'), ('--j1', '--superficie', 4.5, 'nom del jugador 1'), ('--j2', '--superficie', 4.5, 'nom del jugador 2'),
    ('--hero-text', '--hero-fons', 7, 'text de la targeta principal'), ('--hero-suau', '--hero-fons', 4.5, 'text suau de la targeta principal'),
]
def main():
    mal = 0; B = blocs()
    for nom, t in B.items():
        t.setdefault('--hero-fons', '#134a2c'); t.setdefault('--hero-text', '#ffffff'); t.setdefault('--hero-suau', '#cfe9da')
        if nom.startswith('fosc'): t['--hero-fons'], t['--hero-text'], t['--hero-suau'] = '#1b3a2a', '#f6f0e5', '#bcd8c7'
        print(f'\n== {nom} ==')
        for a, b, mn, d in PARELLS:
            if a not in t or b not in t: continue
            r = ratio(t[a], t[b]); estat = 'OK ' if r >= mn else 'FALLA'
            if r < mn: mal += 1
            print(f'  {estat} {r:5.2f}:1 (cal {mn}) {d}  [{a} {t[a]} / {b} {t[b]}]')
        # text de domini sobre el seu fons tintat (xips/targetes d'icona)
        for k in ('memoria', 'atencio', 'llenguatge', 'calcul', 'logica'):
            c = t.get('--dom-' + k); f = mescla(c, t['--superficie'], .13); r = ratio(c, f)
            if r < 3: mal += 1; print(f'  FALLA {r:5.2f}:1 (cal 3) icona de domini {k} sobre el seu fons tintat')
    print('\nRESULTAT:', 'tots els parells compleixen' if not mal else f'{mal} parells no compleixen')
    return 1 if mal else 0
if __name__ == '__main__':
    sys.exit(main())
