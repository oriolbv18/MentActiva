# MentA · Sistema de disseny (v1.7)

Tot el CSS és a `app/css/estils.css`, ordenat per seccions numerades. Aquest document explica les peces comunes
perquè qualsevol pantalla nova s'hi construeixi sense inventar valors.

## 1. Idea de marca
**Càlida, respectuosa i seriosa.** El verd MentA (`#2e8b57`) continua sent el color de marca i d'acció principal, però només
apareix on cal (botons, estat actiu, icones, targeta principal). El fons és neutre càlid (crema), les superfícies són blanques i
l'ambre és el color de la crida a l'acció (*Jugar ara*), de les ratxes i de les celebracions.
Mai infantilitzem: textos clars, directes, de tu i sense diminutius.

## 2. Tokens (a `:root`)
| Grup | Tokens | Ús |
|---|---|---|
| Marca | `--marca`, `--marca-fosc`, `--marca-molt-fosc`, `--marca-suau` | `--marca-fosc` = botons i enllaços (text blanc a sobre: 6,6:1); `--marca-molt-fosc` = títols; `--marca-suau` = fons tintats |
| Acció | `--accio`, `--accio-fosc`, `--accio-suau` | CTA ambre; `--accio-fosc` per a text ambre sobre clar |
| Semàntics | `--exit`, `--avis`, `--error`, `--info` (+ `-suau`) | feedback, avisos, xips |
| Superfícies | `--fons`, `--superficie`, `--superficie-2` | pàgina, targetes, zones cavades |
| Text | `--text`, `--text-suau`, `--text-invers` | principal (AAA), secundari (AA+), sobre botons |
| Vores | `--vora` (decorativa), `--vora-forta` (controls, ≥3:1) | |
| Dominis | `--dom-memoria/atencio/llenguatge/calcul/logica` | s'apliquen amb la classe `.dom-*` que defineix `--t` |
| Espaiat | `--e1`…`--e12` (escala 4/8) | |
| Radis | `--radi-s` .5 · `--radi-m` .875 · `--radi-l` 1.25 · `--radi-xl` 1.75 · `--radi-pill` | botons/inputs = `m`, targetes = `l`, modals = `xl` |
| Ombres | `--ombra-1/2/3` | targeta, elevada, modal/flotant |
| Tipografia | `--font-text` (Atkinson Hyperlegible Next), `--font-titols` (Lexend), `--t-xs`…`--t-4xl` | fonts a `app/fonts/` (woff2 variable, `font-display: swap`) |
| Tàctil | `--tactil` 3rem (≥48 px), `--tactil-gran` 3.5rem (≥56 px) | |

### Temes
* **Clar** (per defecte), **Fosc** (`html[data-tema="fosc"]`, gris càlid, no verd) i **Automàtic** (el JS resol segons `prefers-color-scheme`).
* **Alt contrast** (`html[data-contrast="alt"]`): s'activa a Configuració i automàticament amb `prefers-contrast: more`.
* Un script a `<head>` aplica el tema abans del primer pintat (sense parpelleig).
* `tests/contrast.py` calcula el contrast de tots els parells text/fons dels 4 temes (clar, fosc, alt contrast, fosc + alt contrast).

### Mida de lletra
Tot està en `rem`. `html` escala amb la pantalla (`clamp(17px, …, 22px)`, mínim 17 px) i amb l'ajust **Normal / Gran / Extra gran / Gegant**
(`--escala` 1 / 1.12 / 1.25 / 1.4). Els jocs es calculen amb container queries i no fan scroll a cap combinació (ho comprova `tests/test_menta.py`).

## 3. Components
| Component | Classes | Notes |
|---|---|---|
| Botó primari | `.boto-principal` | verd; estats `:hover`, `:active`, `:focus-visible`, `:disabled` |
| Botó d'acció | `.boto-accio` | ambre, una sola vegada per pantalla (la crida principal) |
| Botó secundari | `.boto-secundari` | vora forta |
| Botó fantasma | `.boto-fantasma` (`.boto-text`) | accions de baixa prioritat |
| Botó de perill | `.boto-perill` | només per a accions destructives, sempre amb confirmació |
| Mides | `.boto-gran` (≥56 px), `.boto-petit`, `.boto-ample` | |
| Botó d'icona | `.ib` | capçalera de joc: sortir, ajuda, pausa, so |
| Targeta / panell | `.panell`, `.stat-targeta`, `.targeta`, `.fila-accio` | |
| Targeta heroi | `.hero` | la pregunta «què faig ara?» a l'inici |
| Modal | `.modal-fons` + `.modal` | `role="dialog"`, `aria-modal`, `aria-labelledby`; el JS atrapa el focus i el retorna |
| Toast | `toast(text, ms, 'exit'\|'error')` | `role="status"`, `aria-live` |
| Interruptor | `.toggle` (`role="switch"`) | estat guardat a `mentA_ajustes` |
| Selector segmentat | `.segmentat` (`role="radiogroup"`, `data-tria`) | fletxes de teclat |
| Pestanyes | `.pestanyes` / `.pestanya` (`role="tablist"`) | fletxes, Home, End |
| Xips | `.xip` (+ `.marca .accio .exit .avis .error .info .dom`) | |
| Barra de progrés | `.barra-progres` + `.farcit` | amb `role="progressbar"` |
| Capçalera de pantalla | `.joc-titol`, `.joc-subtitol`, `.btn-enrere` | |
| Estat buit | `.estat-buit` | sempre diu què fer a continuació |
| Esquelet de càrrega | `.esquelet` | |
| Avís | `.avis-caixa` (`.legal`) | |

## 4. Moviment
Entrada de pantalles (`entra`), aparició de modals (`apareix`), estrelles de final de partida, confeti curt. Res parpelleja.
Es desactiva amb l'ajust **Animacions** i amb `prefers-reduced-motion`.

## 5. Icones
Sprite SVG inline a `index.html` (`<symbol id="i-…">`, traç de 2 px). Cada joc té la seva icona (`i-j-<id>`); el color el dona el domini.

## 6. Logotip i icones PWA
`img/logo.webp` (fons transparent) i `img/logo-fosc.webp` (per a fons fosc, es canvia sol). Icones: `icona-192/512.png`,
`icona-maskable-192/512.png` (zona segura 78 %), `apple-touch-icon.png`, `favicon.svg`, `social-1200x630.png`.

## 7. Gràfics
SVG propis (`6-estadistiques.js`): barres, línia, radar i mapa de calor. Tots porten `<title>`/`<desc>`, valors visibles o al toc,
i una **taula alternativa** (`<details class="taula-alt">`). Els colors surten dels tokens i no són l'única informació.

## 8. Botons i caselles (Fase 5, v1.8)

**Regla única:** tot control és un contenidor flex o grid que centra el contingut (`display: inline-flex; align-items: center; justify-content: center`), amb **`min-height`** (mai `height` fix) i `box-sizing: border-box`. Així el control creix amb la lletra i el contingut mai en surt.

- Icones: caixa fixa (`.ico`, `flex: none`), mai `margin` «de pegat» per alinear amb el text.
- Caselles de joc (sudoku, sopa, bingo, tecles): `display: grid; place-items: center; line-height: 1`. Els números del bingo s'escalen amb la mida de la casella (`container-type: size`).
- Els fills de flex/grid porten `min-width: 0` perquè el contingut no empenyi el quadre. Cap amplada fixa en píxels en botons amb text.
- Objectiu tàctil mínim: **44 px**; accions principals (JUGAR, Començar, targetes) ≥ 56 px quan l'espai ho permet.
- Text llarg: s'acurten les etiquetes («Compartir el resum» i no «Compartir el resum setmanal») abans de deixar que es parteixin al costat d'una icona.

### Auditoria automàtica

`python tests/layout/auditoria-botons.py` (opcions: `--rapid`, `--sizes`, `--zooms`, `--temes`).

Recorre **~63 estats** (20 pantalles, 9 pestanyes del cuidador, 9 modals, 8 passos de l'onboarding i els 17 jocs, també en mode 2 jugadors) a **5 resolucions × 4 mides de lletra × clar/fosc** i comprova a cada element interactiu: desbordament, centrat del contingut, fills fora del pare, text tallat, alineació icona-text, objectiu tàctil i tall per la vora. Surt `docs/layout/informe.html` i `informe.json` (amb captures de cada incidència).

Excepcions justificades (`tests/layout/excepcions.json`): les caselles i tecles dels taulers (bingo, sopa, sudoku) i el botó CANTO! del bingo a 2 jugadors poden baixar de 44 px **només** quan la pantalla fa 360 px d'alçada, perquè un joc no pot fer scroll; i els cercles de l'exercici de l'onboarding (l'anell que brilla surt del quadre a propòsit).
