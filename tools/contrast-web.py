"""Calcula els contrastos WCAG (AA = 4,5:1 text, 3:1 text gran i components) dels parells de color reals de la web (web/web.css) per a cada HORA DEL DIA
(alba, tarda, vespre), en clar, fosc i alt contrast. Les superfícies translúcides (vidre) es compon sobre el fons real abans de calcular la ràtio.
Surt amb codi 1 si algun parell no arriba al mínim. Escriu docs/web-premium/CONTRAST.md.  Ús: python tools/contrast-web.py"""
import pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
css = (ARREL / 'web' / 'web.css').read_text(encoding='utf-8')
COL = r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))'

def tokens(bloc_re):
    m = re.search(bloc_re, css, re.S); return dict(re.findall(r'(--[a-z0-9-]+):\s*' + COL, m.group(1))) if m else {}

def parse(c):
    c = c.strip()
    if c.startswith('#'):
        h = c.lstrip('#'); h = ''.join(x * 2 for x in h) if len(h) == 3 else h
        return [int(h[i:i + 2], 16) for i in (0, 2, 4)] + [int(h[6:8], 16) / 255 if len(h) == 8 else 1.0]
    n = [float(x) for x in re.findall(r'[\d.]+', c)]; return n[:3] + [n[3] if len(n) > 3 else 1.0]

def sobre(fg, bg):                 # composició alfa de fg sobre bg (bg opac)
    f, b = parse(fg), parse(bg); a = f[3]; return '#%02x%02x%02x' % tuple(round(f[i] * a + b[i] * (1 - a)) for i in range(3))

def lum(h):
    r, g, b = [x / 255 for x in parse(h)[:3]]; f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

def ratio(a, b): la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)

arrel_clar = tokens(r':root \{(.*?)\n\}'); arrel_fosc = {**arrel_clar, **tokens(r'html\[data-tema="fosc"\] \{(.*?)\n\}')}
alt_clar = {**arrel_clar, **tokens(r'html\[data-contrast="alt"\] \{(.*?)\}')}; alt_fosc = {**arrel_fosc, **tokens(r'html\[data-tema="fosc"\]\[data-contrast="alt"\] \{(.*?)\}')}
hores = {h: tokens(r'\n\[data-hora="' + h + r'"\] \{(.*?)\}\n') for h in ('alba', 'tarda', 'vespre')}
hores_fosc = {h: tokens(r'html\[data-tema="fosc"\] \[data-hora="' + h + r'"\] \{(.*?)\}') for h in ('alba', 'tarda', 'vespre')}

def escenari(base, hora, fosc):
    t = {**base, **hores[hora], **(hores_fosc[hora] if fosc else {})}
    # el fons de cada hora és un token --<hora>-fons del tema; el vespre sempre és fosc
    fons = t.get(f'--{hora}-fons', t.get('--fons')); t['--fons'] = fons
    if '--superficie' in t: t['--superficie'] = sobre(t['--superficie'], fons) if t['--superficie'].startswith('rgba') else t['--superficie']
    if '--superficie-2' in t and t['--superficie-2'].startswith('rgba'): t['--superficie-2'] = sobre(t['--superficie-2'], fons)
    return t

# (nom, text, fons, mínim, hores on s'aplica)
PARELLS = [
    ('Text principal', '--text', '--fons', 4.5, 'atv'), ('Text suau', '--text-suau', '--fons', 4.5, 'atv'),
    ('Text principal sobre vidre (peces del bento)', '--text', '--superficie', 4.5, 'v'), ('Text suau sobre vidre', '--text-suau', '--superficie', 4.5, 'v'),
    ('Text suau sobre la superfície alterna', '--text-suau', '--superficie-2', 4.5, 'v'),
    ('Enllaç / marca', '--marca-fosc', '--fons', 4.5, 'atv'), ('Marca molt fosca (logo, botó secundari)', '--marca-molt-fosc', '--fons', 4.5, 'atv'),
    ('Botó d\'acció: text sobre ambre', '--accio-text', '--accio', 4.5, 'atv'), ('Botó primari: text sobre verd', '--text-invers', '--marca-fosc', 4.5, 'atv'),
    ('Botó d\'acció sobre el fons (component)', '--accio', '--fons', 3.0, 'v'),
    ('Estat: text sobre ambre suau', '--accio-fosc', '--accio-suau', 4.5, 'atv'), ('Avís: text sobre blau suau', '--text', '--info-suau', 4.5, 'atv'),
    ('Vora de camp de formulari (component)', '--vora-forta', '--fons', 3.0, 'atv'), ('Anell de focus (component)', '--focus', '--fons', 3.0, 'atv'),
]
NOMS_H = {'a': 'alba', 't': 'tarda', 'v': 'vespre'}
md = ['# Contrast de la web (WCAG 2.1 AA) per hora del dia', '', 'Calculat per `tools/contrast-web.py` a partir dels tokens reals de `web/web.css`. Mínim: 4,5:1 text · 3:1 text gran i components. El vidre (superfícies translúcides) es compon sobre el fons real.', '']
mal = 0
for nom_tema, base, fosc in (('Clar', arrel_clar, False), ('Fosc', arrel_fosc, True), ('Clar · alt contrast', alt_clar, False), ('Fosc · alt contrast', alt_fosc, True)):
    for k, h in NOMS_H.items():
        t = escenari(base, h, fosc)
        md += [f'## {nom_tema} · {h}', '', '| Parell | Text | Fons | Ràtio | Mínim | |', '|---|---|---|---|---|---|']
        for nom, a, b, mn, on in PARELLS:
            if k not in on: continue
            if a not in t or b not in t: continue
            ca, cb = (sobre(t[a], t[b]) if t[a].startswith('rgba') else t[a]), t[b]
            if cb.startswith('rgba'): cb = sobre(cb, t['--fons'])
            r = ratio(ca, cb); ok = r >= mn; mal += (not ok)
            md.append(f'| {nom} | `{ca}` | `{cb}` | **{r:.1f}:1** | {mn:g}:1 | {"✅" if ok else "❌"} |')
        md.append('')
# tancament (CTA final) i peu: sempre sobre vespre
md.append(f'**Parells que no arriben al mínim: {mal}**')
out = ARREL / 'docs' / 'web-premium'; out.mkdir(parents=True, exist_ok=True); (out / 'CONTRAST.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
print(f'{mal} parells sota el mínim (detall a docs/web-premium/CONTRAST.md)'); sys.exit(1 if mal else 0)
