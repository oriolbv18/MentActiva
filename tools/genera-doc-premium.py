"""Genera docs/WEB-DISSENY-PREMIUM.md: la documentació de disseny de la v1.9.2 amb la taula «Decisió → skill → fitxer:línia».
Les línies es calculen cada vegada buscant el patró al fitxer real (si un patró ja no existeix, l'script falla: la doc no es pot desfasar en silenci).
Ús: python tools/genera-doc-premium.py"""
import json, pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
CSS, JS, HTML, MOL = 'web/web.css', 'web/web.js', 'index.html', 'web/mol.js'

# (decisió, skill de skills-main, fitxer, patró (text literal) que s'ha de trobar)
DECISIONS = [
    ('El fil del dia: cada secció declara `data-hora` i en pren fons, text i vores (alba → tarda → vespre)', 'frontend-design', CSS, '[data-hora="vespre"] {'),
    ('Tokens finals de color per hora, en clar i en fosc, amb la mateixa estructura de variables', 'design:design-system', CSS, ':root {'),
    ('Titulars enormes amb *tracking* que s\'estreny a mesura que creixen (`-.035em` al h1, `-.028em` al h2)', 'apple-design (§15 tipografia)', CSS, 'h1 { font-size: clamp(2.7rem'),
    ('Línies de lectura ≤ 62 caràcters (`max-width: 31rem` amb Atkinson Hyperlegible)', 'frontend-design', CSS, '.bloc p:not(.bloc-hora) { max-width: 31rem'),
    ('Capçalera «píndola» translúcida flotant (`backdrop-filter`, vora de llum superior)', 'apple-design (§12 materials)', CSS, '.l-cap .l-ample::before {'),
    ('La capçalera es compacta en fer scroll amb `transform` (no amb alçada), amb origen al centre', 'emil-design-eng (només transform)', CSS, '.l-cap.compacta .l-ample::before'),
    ('`prefers-reduced-transparency` i `prefers-contrast: more` → vidre sòlid', 'apple-design (§14)', CSS, '@media (prefers-reduced-transparency: reduce)'),
    ('Premuda en *pointer-down*: `:active { scale(.97) }`, mai `scale(0)`, mai `transition: all`', 'emil-design-eng', CSS, '.btn:active { transform: scale(.97); }'),
    ('Brillantor del botó que segueix el cursor, limitada per `requestAnimationFrame`', 'animate + animation-performance', JS, "bb.style.setProperty('--mx'"),
    ('Imant de ≤ 6 px als botons grans amb un moll, amb la propietat `translate` (compon amb l\'`:active`)', 'apple-design (§4 molls)', JS, 'const sx = Mol(v => { tx = v;'),
    ('Integrador de moll de 0,7 KB (rigidesa/amortiment, parteix del valor i la velocitat actuals: interrompible)', 'apple-design (§3, §4, §5)', MOL, 'function Mol(cb, o)'),
    ('Mòbil fet amb CSS: bisell, vora de metall, reflex diagonal i ombra tintada de verd (cap PNG de marc)', 'apple-design (materials i profunditat)', CSS, '.mobil { --mw: 15rem;'),
    ('L\'illa dinàmica ocupa una franja pròpia: la captura queda a sota i mai es tapa el títol de l\'app', 'design:design-critique', CSS, '.mobil.gran .mobil-pantalla::before'),
    ('Inclinació 3D del mòbil amb dos molls, només amb `(hover:hover) and (pointer:fine)` i sense moviment reduït', 'emil-design-eng (molls decoratius)', JS, "qa('[data-inclina]')"),
    ('Les pupil·les de l\'Elefant segueixen el cursor dins d\'un rang limitat; a tàctil miren el mòbil', 'animate (mouse-tracking decoratiu amb moll)', JS, 'pupilles = eh ?'),
    ('L\'Elefant saluda una sola vegada: *crossfade* entre la pose en repòs i la que aixeca la trompa', 'animation-vocabulary', CSS, 'html.js .l-elefant .el-saluda'),
    ('Entrada única del hero: paraules que baixen dins d\'una màscara, amb *stagger* de 45 ms', 'find-animation-opportunities', CSS, '@keyframes baixa'),
    ('El mòbil viu: `position: sticky` només amb JS i ≥ 56 em; sense JS cada bloc porta el seu mòbil', 'frontend-design + mobile-native', CSS, 'html.js .dia-fix { display: grid;'),
    ('Canvi de pantalla del mòbil: *crossfade* + escala .97 + *blur* de 2 px amb transicions (s\'interromp netament)', 'emil-design-eng (blur per amagar fusions)', CSS, 'html.js .dia-fix .capa {'),
    ('El bloc que és al centre decideix la pantalla (`IntersectionObserver`): el scroll és el del navegador', 'animate (cap scroll-jacking)', JS, 'const activa = i =>'),
    ('Fons contínu alba → tarda → vespre com a un sol degradat (cap animació de color)', 'frontend-design', CSS, '.dia { position: relative; background: linear-gradient'),
    ('Aparador: dues files de mòbils en sentits oposats, *marquee* lineal (moviment constant = `linear`)', 'animation-vocabulary', CSS, '@keyframes marquee'),
    ('El moviment es pot aturar (WCAG 2.2.2) i es pausa a `:hover`, `:focus-within` i fora de vista', 'animation-performance + design:accessibility-review', JS, "pausa.setAttribute('aria-pressed'"),
    ('Tàctil i moviment reduït: les files no es mouen soles, es llisquen amb `scroll-snap`', 'mobile-native', CSS, '@media (pointer: coarse) { .fila {'),
    ('Filtres per àrea: entrada escalonada amb WAAPI (`element.animate`), sense salts de maquetat', 'emil-design-eng (stagger 30–80 ms)', JS, 'li.animate('),
    ('Bento asimètric de 6 columnes (4+2, 2+2, 6, 6): mai tres targetes iguals', 'frontend-design', CSS, '.peca-semafor { grid-column: 1 / 5;'),
    ('Micro-visual del gràfic: una línia que es dibuixa (`stroke-dashoffset`), una sola vegada', 'animation-vocabulary (line drawing)', CSS, '.bento.viu .grafic .linia'),
    ('Les micro-visuals s\'encenen quan es veuen i es queden en l\'estat final (sense bucles infinits)', 'animation-performance', JS, "b.classList.add('viu')"),
    ('Fitxers PDF/CSV que arriben amb un moll curt escrit amb `linear()` (un petit rebot, sense llibreria)', 'apple-design (§4 només rebot amb impuls)', CSS, '--moll: linear('),
    ('Canvi clar/fosc amb View Transitions (revelació circular des del botó) i canvi instantani si no hi ha suport', 'apple-design (§14 evitar salts de brillantor)', JS, 'document.startViewTransition'),
    ('El que cau fora de pantalla no es maqueta ni es pinta (`content-visibility`, només amb JS)', 'animation-performance', CSS, 'html.js .l-demo, html.js .l-aparador'),
    ('Tot el que és decoració s\'inicialitza en repòs (`requestIdleCallback`); l\'aparador, quan s\'hi arriba', 'animation-performance', JS, 'const idle ='),
    ('El vídeo es carrega després de la càrrega i en repòs, es pausa fora de vista i no es baixa amb *Save-Data*', 'animation-performance + mobile-native', JS, 'const arrenca = () =>'),
    ('Moviment reduït = menys i més suau (es manté el *fade*; surten el desplaçament, la inclinació i el vídeo)', 'emil-design-eng + apple-design (§14)', CSS, '@media (prefers-reduced-motion: reduce)'),
    ('Objectius tàctils ≥ 44 px, `touch-action: manipulation`, camps ≥ 16 px, cap *tap highlight*', 'mobile-native', CSS, 'a, button, summary, [role="button"] { touch-action: manipulation; }'),
    ('Zones segures i teclat: `viewport-fit=cover`, `env(safe-area-inset-*)` i `interactive-widget`', 'mobile-native', CSS, '--cap-alt: calc(72px + env(safe-area-inset-top'),
    ('`theme-color` que segueix l\'hora del dia visible (alba, tarda, vespre) en clar i fosc', 'mobile-native', JS, "const colors = { clar:"),
    ('Titulars concrets i curts («Un botó gran. Tres jocs. Uns deu minuts.»; «Informació clara, sense alarmes.»)', 'design:ux-copy', HTML, 'Informació clara, sense alarmes.'),
    ('L\'avís de no-diagnòstic es veu sempre, amb to tranquil (bloc informatiu, no lletra petita)', 'design:ux-copy + design:accessibility-review', CSS, '.l-avis {'),
    ('Pluralització del filtre («1 joc», «6 jocs») i noms/correus molt llargs sense desbordar', 'break-ui', JS, "n === 1 ? 'joc' : 'jocs'"),
    ('La demo entra amb una transició i `@starting-style` (no amb *keyframes*): es pot interrompre', 'emil-design-eng (@starting-style)', CSS, '@starting-style { .l-demo-pantalla iframe'),
    ('Xifres tabulars als fets («17 jocs», «4 mides de lletra»)', 'apple-design (§15) + break-ui', CSS, 'font-variant-numeric: tabular-nums'),
    ('Retirada de la barra de progrés de lectura (era un accessori: el degradat i la capçalera ja orienten)', 'design:design-critique + frontend-design («treu un accessori»)', 'docs/WEB-DISSENY-PREMIUM.md', 'Retirada'),
    ('Sense color d\'èmfasi en una paraula dels titulars; sense etiquetes en majúscules; sense «→» als botons', 'frontend-design (defectes per defecte)', CSS, 'h3.gran { font-size'),
]


def linia(fitxer, patro):
    if fitxer.startswith('docs/'): return '—'
    t = (ARREL / fitxer).read_text(encoding='utf-8').split('\n')
    for i, l in enumerate(t, 1):
        if patro in l: return str(i)
    raise SystemExit(f'Patró no trobat a {fitxer}: {patro!r}')


def taula():
    f = ['| # | Decisió | Skill de `skills-main` | Fitxer:línia |', '|---|---|---|---|']
    for n, (d, s, fit, p) in enumerate(DECISIONS, 1):
        l = linia(fit, p); f.append(f'| {n} | {d} | {s} | `{fit}{":" + l if l != "—" else ""}` |')
    return '\n'.join(f)


def llegeix(nom, defecte=''):
    p = ARREL / nom; return p.read_text(encoding='utf-8') if p.exists() else defecte


def main():
    plantilla = llegeix('docs/_premium-plantilla.md')
    if not plantilla: raise SystemExit('Falta docs/_premium-plantilla.md')
    sortida = plantilla.replace('{{TAULA_DECISIONS}}', taula()).replace('{{N_DECISIONS}}', str(len(DECISIONS))).replace('{{MESURES}}', llegeix('docs/web-premium/mesures-resum.md', '(pendent)'))
    (ARREL / 'docs' / 'WEB-DISSENY-PREMIUM.md').write_text(sortida, encoding='utf-8'); print(len(DECISIONS), 'decisions → docs/WEB-DISSENY-PREMIUM.md')


if __name__ == '__main__': main()
