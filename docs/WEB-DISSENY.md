# Disseny de la web (v1.9.1) · decisions i skills de `skills-main`

> L'Oriol va demanar que el disseny es fes amb el plugin `skills-main`. **Es van invocar de debò** (eina `Skill`), en aquest ordre, i la taula de decisions de més avall deixa constància del que va motivar cadascuna.

## 0. Skills disponibles i usades
Comprovades al llistat de skills de la sessió: `animate`, `animation-performance`, `animation-vocabulary`, `apple-design`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native` (totes de `skills-main`), més `frontend-design:frontend-design`, `design:design-system`, `design:ux-copy`, `design:accessibility-review` i `design:design-critique`. Cap no ha mancat. *Ignorades perquè no apliquen:* `ask-sonner` (React), `animate-expo` i `write-swift` (mòbil natiu).

| Fase | Skill invocada | Què se n'ha tret |
|---|---|---|
| 2 | `frontend-design` | Evitar el «look SaaS genèric»: una identitat pròpia i càlida (verd bosc + ambre, l'Elefant), una sola cosa memorable (el hero amb l'Elefant al costat del mòbil), cap targeta idèntica repetida, cap numeració decorativa (només al pas a pas, que és una seqüència de debò). |
| 2 | `design:design-system` | Tokens únics (color, tipografia, espaiat, radis, ombres, moviment) i components amb estats (botó, xip, filtre, targeta de joc, camp, acordió). |
| 2–4 | `apple-design` | Jerarquia i espai en blanc; tracking negatiu als títols grans i 0 al cos; feedback en prémer (no en deixar anar); acció primària única per pantalla; materials translúcids amb sentit (capçalera), sense apilar-ne. |
| 3–4 | `emil-design-eng` | Detalls d'artesania: `:active { scale(.97) }`, corbes fortes (`cubic-bezier(.23,1,.32,1)`), mai `ease-in` ni `transition: all`, mai `scale(0)`, hover només amb `(hover: hover) and (pointer: fine)`, durades < 300 ms. |
| 3–4 | `mobile-native` | `-webkit-tap-highlight-color`, `touch-action: manipulation`, `100dvh` no necessari, `viewport-fit=cover` + `env(safe-area-inset-bottom)` a la barra de CTA, `overscroll-behavior: contain` al menú i al carrusel, `theme-color` per esquema. |
| 3 | `design:ux-copy` | CTA amb verb («Prova l'app», «Demana una demo», «Envia»), errors que diuen què ha passat i com arreglar-ho, to humà, cap jerga, i honestedat («En fase de proves»). |
| 7 | `find-animation-opportunities` | Filtre de freqüència/propòsit: només 6 moments animats (entrada del hero, entrada de seccions, menú mòbil, acordió, fade de la demo, ombra de la capçalera). **Rebutjats:** hover del menú (desenes/dia), obertura del selector de tema, scroll del carrusel (el navegador ja ho fa millor), qualsevol animació en bucle. |
| 7 | `animation-vocabulary` | Noms exactes: *stagger* (60–80 ms), *origin-aware* (descartat: no hi ha popovers), *scroll reveal*, *sheet* del menú, *crossfade*. |
| 7 | `animate` | Seqüència de decisions: CSS pur (cap llibreria), només `transform` i `opacity`, transicions (no keyframes) per a coses que es poden repetir, sortida igual que l'entrada. |
| 7 | `improve-animations` | Auditoria del que hi havia: l'ombra de la capçalera animava `box-shadow` (paint) → ara anima l'`opacity` d'un pseudo-element; `.btn` transicionava `box-shadow` → eliminat; moviment reduït era «tot a 0» → ara és *menys i més suau* (es manté el fade, es treu el desplaçament). |
| 7 | `animation-performance` | Cap `will-change`, cap `blur` animat, cap variable CSS animada, cap `top/left/height` (l'acordió usa `block-size` amb `interpolate-size`, l'única excepció tolerada); galeria de jocs en **HTML estàtic** (no s'insereix amb JS) perquè la maquetació es faci d'un cop. |
| 9 | `design:accessibility-review` | `tests/web/test_accessibilitat.py` (axe-core WCAG 2.1 AA, zoom 200/300/400 %, teclat, alt contrast); `tools/contrast-web.py`; l'anell de focus blau sobre el verd final fallava (1,5:1) → anell groc (`--focus-final`); `#barraCta` fora de tot *landmark* → `<aside aria-label>`. |
| 10 | `design:design-critique` | Vegeu §4 (crítica final i el que se n'ha aplicat). |
| 11 | `break-ui` | Adaptat a una web (no a un component amb dades): amples extrems (320 i 2560), zoom 200/300/400 %, lletra de sistema al 200 %, formulari amb nom/correu/missatge molt llargs, JS desactivat, xarxa tallada, alt contrast i tema fosc. Va trobar: la franja de confiança desbordava amb lletra gran i el botó de la demo no podia partir el text (arreglats). |

## 1. Brief
- **Públic:** (1) persona gran que potser visita la web des d'un enllaç que li envia la família; (2) familiar de 50+ que decideix si la instal·la; (3) direcció d'una residència o centre de dia; (4) el professor d'Empresa.
- **Tres adjectius:** càlida, serena, honesta.
- **Què NO volem semblar:** una *startup* de SaaS (blau/violeta, degradats, targetes totes iguals), una web mèdica que prometi coses, un projecte abandonat (marges desiguals, formularis que no porten enlloc).
- **Una sola cosa memorable:** l'Elefant (la mateixa mascota de l'app, exportada com a SVG estàtic) al costat d'un mòbil gran amb l'app de debò. Tot el voltant és sobri.

## 2. Tokens finals (`web/web.css`)
| Token | Valor | Notes |
|---|---|---|
| Colors | `--fons #faf7f2` · `--superficie #fff` · `--superficie-2 #f4efe7` · `--text #241f19` · `--text-suau #5a5146` · `--marca-fosc #1d6b40` · `--marca-molt-fosc #134a2c` · `--accio #f2a65a` (text `#2d1904`) · `--hero-fons #e8f2ec` · `--final-fons #134a2c` | Els mateixos que l'app. Mode fosc complet. Ràtios calculades a `docs/web-despres/CONTRAST.md` (clar, fosc i alt contrast: **0 parells sota AA**). |
| Tipografia | Títols **Lexend** (700, tracking −.02/−.025em), text **Atkinson Hyperlegible** 1,0625rem/1,6 | Locals (`app/fonts/`), `font-display: swap`, precàrrega només amb http(s). Línies ≤ 40rem. |
| Base | `html { font-size: clamp(16px, 15px + .25vw, 18px) }` | La web no hereta el `rem` fluid de l'app. |
| Espaiat | `--e-1…--e-9` = .25, .5, .75, 1, 1.5, 2, 3, 4, 6 rem | Entre germans: `gap`, mai `margin-top` per element. |
| Contenidor | `.l-ample { width: min(100% − 2·--web-gutter, 1200px) }`, `--web-gutter: clamp(1.25rem, 4vw, 3rem)` | Igual a totes les seccions. |
| Ritme | `--seccio-y: clamp(3.5rem, 2.5rem + 5vw, 6.5rem)` | El mateix padding vertical a totes les seccions (la franja de confiança és una «banda» de separació, amb `.l-banda`). |
| Capçalera | `--cap-alt: 64px` | Mateixa alçada a tots els amples; `scroll-padding-top: var(--cap-alt) + 1rem`. |
| Radis / ombres | `.5 / .875 / 1.25 / 1.75rem`, pastilla 999px · tres ombres càlides | Mòbil: marc de 2,1rem. |
| Moviment | `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`; 140 / 220 / 480 ms | Entrada del hero < 900 ms en total. |
| Breakpoints | en **em** (`47.5em`, `50em`, `67.5em`…) | Segueixen la mida de lletra del navegador, no només l'amplada. |

## 3. Decisions → skill → fitxer
| # | Decisió | Skill que la motiva | On s'ha aplicat |
|---|---|---|---|
| 1 | Una identitat pròpia (verd bosc + ambre + Elefant), no «SaaS blau» | `frontend-design` | `web/web.css` §2 (tokens) |
| 2 | Hero amb l'Elefant junt a un sol mòbil gran, sense dos mòbils petits | `frontend-design`, `apple-design` | `index.html` (hero), `web.css` §7, `img/web/elefant.svg` |
| 3 | Sistema de tokens únic (espaiat, contenidor, ritme, capçalera) | `design:design-system` | `web.css` §2 i §4 |
| 4 | Tracking negatiu als títols grans, 0 al cos; `text-wrap: balance` | `apple-design` | `web.css` §3 (`h1`, `h2`) |
| 5 | Una sola acció primària per bloc (ambre) i una de secundària (contorn) | `apple-design` | `.btn-accio`, `.btn-sec` |
| 6 | Feedback en prémer: `scale(.97)` en 140 ms | `emil-design-eng` | `.btn`, `.btn-icona`, `.l-filtres button` |
| 7 | Corba `cubic-bezier(.23,1,.32,1)`; res d'`ease-in`, de `transition: all` ni d'`scale(0)` | `emil-design-eng`, `animate` | `web.css` §2 i §14 |
| 8 | Hover només amb ratolí (`(hover: hover) and (pointer: fine)`) | `emil-design-eng`, `mobile-native` | `.btn`, `.l-nav`, `.l-peu` |
| 9 | Menú mòbil com a fulla (translateY + opacity, 220 ms), focus atrapat, `inert`, Escape | `mobile-native`, `emil-design-eng` | `web.css` §6, `web/web.js` (menú) |
| 10 | Barra de CTA fixa amb `env(safe-area-inset-bottom)` que s'amaga al contacte | `mobile-native` | `.l-barra-cta`, `web.js` |
| 11 | `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `overscroll-behavior` al menú | `mobile-native` | `html`, `.btn`, `.l-menu`, `.l-pista` |
| 12 | Carrusel natiu amb `scroll-snap` (la física del navegador) en lloc d'un de JS | `mobile-native`, `animation-performance` | `.l-pista`, `web.js` |
| 13 | Només 6 moments animats; hover i selector de tema, sense animació | `find-animation-opportunities` | `web.css` §14 |
| 14 | Entrada seqüenciada del hero (stagger 70 ms) i de les seccions (només `opacity`/`transform`) | `animation-vocabulary`, `animate` | `web.css` §14 |
| 15 | L'Elefant entra **un sol cop** (balanceig suau), mai en bucle | `find-animation-opportunities` (delight només en moments rars) | `@keyframes elefant-entra` |
| 16 | Ombra de la capçalera amb `opacity` d'un pseudo-element, no `box-shadow` animat | `improve-animations`, `animation-performance` | `.l-cap::after` |
| 17 | Acordió de les FAQ amb `::details-content` (única animació de mida tolerada) | `animate`, `animation-performance` | `.l-faq` |
| 18 | Galeria en HTML estàtic generat (`tools/web-shell.py`), no inserida amb JS | `animation-performance` | `index.html`, `tools/web-shell.py` |
| 19 | Moviment reduït = menys i més suau, no zero (es manté el fade) | `improve-animations`, `emil-design-eng` | `web.css` §15, `tests/web/test_web.py` |
| 20 | Contingut visible per defecte; només s'amaga amb `html.js` | `animate`, `design:accessibility-review` | `web.css` §14, `index.html` (`<head>`) |
| 21 | Anell de focus groc sobre el verd del CTA final | `design:accessibility-review` | `--focus-final`, `tools/contrast-web.py` |
| 22 | Contrast calculat per parells (clar/fosc/alt contrast), 0 sota AA | `design:accessibility-review` | `tools/contrast-web.py`, `docs/web-despres/CONTRAST.md` |
| 23 | Breakpoints en `em` perquè segueixin la mida de lletra del navegador | `break-ui`, `apple-design` (respectar la mida de text de l'usuari) | `web.css` |
| 24 | CTA i errors amb verb i solució («Escriu un correu vàlid, per exemple nom@exemple.cat») | `design:ux-copy` | `web.js`, `index.html` |
| 25 | Cap targeta repetida idèntica: línia superior a les característiques, fotos 16:10 a «Per a qui», passos numerats només perquè són una seqüència | `frontend-design` | `.l-trets`, `.l-tres`, `.l-passos` |
| 26 | Prova adversària: valors llargs al formulari, zoom 400 %, lletra al 200 %, JS off | `break-ui` | `tests/web/test_accessibilitat.py` |
| 27 | Aviso de «captures amb dades fictícies» i alt text descriptiu a totes les imatges | `design:ux-copy`, `design:accessibility-review` | `index.html` |

## 4. Crítica final (`design:design-critique`)
- **Primera impressió:** el hero respon en 2 segons a «què és» (jocs), «per a qui» (avi + qui el cuida) i «què faig» (Prova l'app). L'Elefant dona cara sense competir amb el títol.
- **Hierarquia:** el títol es llegeix primer; l'ambre dirigeix l'ull al CTA. *Millora aplicada:* l'avís «En fase de proves» es va fer visible al hero (xip) en lloc de quedar amagat al final.
- **Consistència:** abans cada secció tenia el seu padding; ara tots surten de `--seccio-y`. *Millora aplicada:* una sola capçalera de secció (`.l-cap-seccio`).
- **Risc que queda:** la galeria té 17 captures; és llarga però es pot filtrar i no pesa (lazy + 420 px). *No aplicat:* un vídeo de 10 s al hero (pesaria i no es pot garantir sense xarxa).
- **Pendent de revisar amb persones reals:** el to del text de la secció de residències i si «Demana una demo» és el verb que millor entenen.
