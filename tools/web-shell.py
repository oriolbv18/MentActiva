"""Injecta la capçalera, el menú mòbil, la barra de CTA, el peu i les icones a TOTES les pàgines de la web (index, 404, legal/*)
des d'UNA sola plantilla, perquè mai es desincronitzin. Cada pàgina porta marcadors:
   <!--SHELL:sprite--> … <!--/SHELL:sprite-->      <!--SHELL:cap--> … <!--/SHELL:cap-->      <!--SHELL:peu--> … <!--/SHELL:peu-->
Ús: python tools/web-shell.py      (és idempotent; executa'l després de canviar la plantilla o app/js/config.js)"""
import json, pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
ICONES_APP = ['check', 'usuari', 'familia', 'casa', 'info', 'jocs', 'dos', 'escut', 'cadenat', 'document', 'volum']
ICONES_WEB = {
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'tanca': '<path d="M6 6l12 12M18 6L6 18"/>',
    'sol': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    'lluna': '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    'esq': '<path d="M15 5l-7 7 7 7"/>', 'dre': '<path d="M9 5l7 7-7 7"/>',
    'offline': '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><path d="M3 3l18 18"/>',
    'lletra': '<path d="M3 19l5-13 5 13M5 14h6M15 19l3.5-8 3.5 8M16.5 16.5h4"/>',
    'cor': '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    'upc': '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    'play': '<path d="M8 5l11 7-11 7z"/>',
    'pausa': '<path d="M8 5v14M16 5v14"/>',
}
NAV = [('com-funciona', 'Com funciona'), ('jocs', 'Jocs'), ('cuidador', 'Cuidadors'), ('residencies', 'Residències'), ('preguntes', 'Preguntes')]


def versio():
    t = (ARREL / 'app' / 'js' / 'config.js').read_text(encoding='utf-8')
    m = re.search(r"VERSIO_CURTA\s*=\s*'([^']+)'", t); return m.group(1) if m else ''


def sprite():
    app = (ARREL / 'app' / 'index.html').read_text(encoding='utf-8'); peces = []
    for i in ICONES_APP:
        m = re.search(r'<symbol id="i-' + i + r'"[^>]*>.*?</symbol>', app, re.S)
        if m: peces.append(m.group(0))
    for i, d in ICONES_WEB.items(): peces.append(f'<symbol id="i-{i}" viewBox="0 0 24 24">{d}</symbol>')
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + ''.join(peces) + '</defs></svg>'


def jocs_html():
    """Aparador de jocs en HTML estàtic: dues files (es mouen en sentits oposats amb JS; sense JS es llisquen). Font: web/jocs.js (generat de l'app)."""
    t = (ARREL / 'web' / 'jocs.js').read_text(encoding='utf-8'); jocs = json.loads(t[t.index('['):t.rindex(']') + 1])
    ordre = ['memoria', 'atencio', 'llenguatge', 'calcul', 'logica']; jocs.sort(key=lambda j: ordre.index(j['domini']) if j['domini'] in ordre else 99)     # una sola fila, ordenada per àrea
    esc = lambda x: x.replace('&', '&amp;').replace('<', '&lt;').replace('"', '&quot;')
    def carta(j):
        src = f'img/web/jocs/{j["id"]}'
        return (f'<li class="l-joc" tabindex="-1" data-id="{j["id"]}" data-domini="{j["domini"]}" data-dos="{1 if j["dos"] else 0}"><div class="mobil baix"><div class="mobil-pantalla"><img src="{src}-360.webp" srcset="{src}-360.webp 360w, {src}.webp 480w" sizes="204px" '
                f'alt="Captura del joc «{esc(j["nom"])}» en marxa" loading="lazy" width="480" height="862"></div></div><div class="l-joc-text"><strong>{esc(j["nom"])}</strong><small>{esc(j["desc"])}</small>'
                f'<span class="xips"><span class="xip neutre">{esc(j["dominiNom"])}</span>{"<span class=\"xip neutre\">2 jugadors</span>" if j["dos"] else ""}</span></div></li>')
    return '<div class="fila" id="filaJocs" tabindex="0" role="region" aria-label="Aparador dels 17 jocs: llisca en horitzontal, arrossega o fes servir les fletxes ← →"><ul class="l-pista" id="galeriaJocs">' + chr(10).join(carta(j) for j in jocs) + '</ul></div>'


def elefant_inline():
    """L'Elefant del hero va dins del HTML (no com a <img>) perquè JavaScript pugui moure'n les pupil·les: és el mateix dibuix de l'app."""
    s = (ARREL / 'img' / 'web' / 'elefant.svg').read_text(encoding='utf-8')
    s = s.replace(' role="img" aria-label="L' + "'" + 'Elefant de MentA"', ' aria-hidden="true"').replace('<svg class="el-svg"', '<svg class="el-svg el-hero"', 1)
    return s


def ico(n, cls=''): return f'<svg class="ico{" " + cls if cls else ""}" aria-hidden="true"><use href="#i-{n}"/></svg>'


def capcalera(p, arrel_idx):
    home = arrel_idx if p else '#'
    enllacos = ''.join(f'<a href="{arrel_idx}#{i}">{t}</a>' for i, t in NAV)
    menu = ''.join(f'<a href="{arrel_idx}#{i}">{t}</a>' for i, t in NAV + [('contacte', 'Contacte')])
    return f'''<header class="l-cap" id="capcalera"><div class="l-ample">
<a class="l-marca" href="{home}"><img src="{p}img/web/logo-76.webp" alt="" width="38" height="38"><span>MentA</span></a>
<nav class="l-nav" aria-label="Principal">{enllacos}<a class="btn btn-accio" href="{p}app/index.html">Prova l'app</a></nav>
<div class="l-acc"><button type="button" class="btn-icona btn-tema" id="btnTema" aria-label="Canvia entre tema clar i fosc">{ico('lluna', 'ico-lluna')}{ico('sol', 'ico-sol')}</button>
<button type="button" class="btn-icona btn-menu" id="btnMenu" aria-expanded="false" aria-controls="menuMobil" aria-label="Obre el menú">{ico('menu')}</button></div>
</div></header>
<div class="l-menu" id="menuMobil" role="dialog" aria-modal="true" aria-label="Menú de la web">
<div class="l-menu-cap"><a class="l-marca" href="{home}"><img src="{p}img/web/logo-76.webp" alt="" width="38" height="38"><span>MentA</span></a><button type="button" class="btn-icona" id="btnTancaMenu" aria-label="Tanca el menú">{ico('tanca')}</button></div>
<nav aria-label="Menú">{menu}</nav>
<div class="l-menu-peu"><a class="btn btn-accio" href="{p}app/index.html">Prova l'app</a><a class="btn btn-sec" href="{arrel_idx}?motiu=residencia#contacte">Demana una demo per a residències</a></div>
</div>
<aside class="l-barra-cta" id="barraCta" aria-label="Accés ràpid a l'app"><a class="btn btn-accio" href="{p}app/index.html">Prova l'app</a></aside>'''


def peu(p, arrel_idx):
    return f'''<footer class="l-peu"><div class="l-ample">
<div class="l-peu-graella">
<div class="l-peu-marca"><a class="l-marca" href="{arrel_idx if p else '#'}"><img src="{p}img/web/logo-76.webp" alt="" width="38" height="38"><span>MentA</span></a>
<p>Jocs per mantenir la ment activa i un espai a part per a qui cuida. Un projecte d'Empresa de la UPC (Castelldefels).</p><ul class="l-xarxes" id="xarxesPeu" aria-label="Xarxes socials" hidden></ul></div>
<nav aria-label="Producte"><h2>Producte</h2><ul><li><a href="{arrel_idx}#com-funciona">Com funciona</a></li><li><a href="{arrel_idx}#jocs">Jocs</a></li><li><a href="{arrel_idx}#cuidador">Espai del cuidador</a></li><li><a href="{p}app/index.html">Obrir l'app</a></li></ul></nav>
<nav aria-label="Projecte"><h2>Projecte</h2><ul><li><a href="{arrel_idx}#residencies">Per a residències</a></li><li><a href="{arrel_idx}#equip">Qui som</a></li><li><a href="{arrel_idx}#preguntes">Preguntes freqüents</a></li><li><a href="{arrel_idx}#contacte">Contacte</a></li></ul></nav>
<nav aria-label="Legal"><h2>Legal</h2><ul><li><a href="{p}legal/privadesa.html">Privadesa</a></li><li><a href="{p}legal/avis-legal.html">Avís legal</a></li><li><a href="{p}legal/condicions.html">Condicions i no-diagnòstic</a></li><li><a href="{p}legal/cookies.html">Cookies</a></li></ul></nav>
</div>
<div class="l-peu-fi"><p>MentA és una eina d'entreteniment i benestar cognitiu. No és un dispositiu sanitari, no fa diagnòstics i no substitueix un professional de la salut.</p>
<p>MentA (MentActiva), versió <span data-versio>{versio()}</span>, <span data-any></span>.</p></div>
</div></footer>'''


def aplica(fitxer):
    t = fitxer.read_text(encoding='utf-8'); sub = fitxer.parent != ARREL; p = '../' if sub else ''; idx = '../index.html' if sub else ''
    def canvia(clau, cos, t):
        pat = re.compile(r'(<!--SHELL:' + clau + r'-->).*?(<!--/SHELL:' + clau + r'-->)', re.S)
        if not pat.search(t): raise SystemExit(f'{fitxer}: falta el marcador SHELL:{clau}')
        return pat.sub(lambda m: m.group(1) + '\n' + cos + '\n' + m.group(2), t, 1)
    t = canvia('sprite', sprite(), t); t = canvia('cap', capcalera(p, idx), t); t = canvia('peu', peu(p, idx), t)
    if '<!--SHELL:jocs-->' in t: t = canvia('jocs', jocs_html(), t)
    fitxer.write_text(t, encoding='utf-8'); print('  ', fitxer.relative_to(ARREL))


def main():
    for f in [ARREL / 'index.html', ARREL / '404.html'] + sorted((ARREL / 'legal').glob('*.html')): aplica(f)
    print('Fet.')

if __name__ == '__main__': main()
