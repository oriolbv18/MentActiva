# Passada de polit de l'aspecte (Fase 8) — 1.8

Mètode: capturar pantalles i estats (clar/fosc, mòbil/tauleta/ordinador, lletra Normal i Gegant) amb `tests/captures18.py` i `tools/captures-web.py`, mirar-les una per una, escriure els defectes i corregir-los; tornar a capturar. A més, l'auditoria automàtica de botons (`tests/layout/auditoria-botons.py`) va trobar els defectes que a ull no es veuen (vegeu `docs/DISSENY.md`, «Botons i caselles»).

Les captures finals són a `docs/captures-1.8/` (persona, cuidador, residencia, onboarding).

## Defectes trobats i arreglats

| # | Pantalla | Abans (defecte) | Després |
|---|---|---|---|
| 1 | Inici Persona, mode fosc | El botó **Jugar amb algú** tenia text blanc sobre un blau clar: contrast insuficient. | Blau clar amb text fosc (`#0b2540`) i ombra pròpia al tema fosc. |
| 2 | Inici Persona, 390×844 | La pàgina feia 164 px de scroll: JUGAR massa alt i els ajustos ràpids en dues files. | JUGAR més compacte en pantalles baixes, un sol botó «Jugar amb algú» de 5,2 rem i els ajustos ràpids en una fila: tot cap en 844 px. |
| 3 | Inici Persona | Tres botons de mides diferents amb pesos visuals inconsistents. | Jerarquia clara: JUGAR (taronja, gran) > Jugar amb algú (blau) > dues targetes. |
| 4 | Onboarding «Com veus millor?» | El quart botó de mida de lletra i l'anell del cercle quedaven tallats a la dreta (el grid creixia pel contingut). | `minmax(0, 1fr)` i `min-width: 0` als passos; padding intern. |
| 5 | Onboarding final | La fila del recordatori (text, hora i interruptor) es desfeia en tres alçades. | Graella: text a dalt, hora i interruptor a sota. |
| 6 | Onboarding, lletra Gegant | Els passos feien scroll i el botó «Següent» sortia de la pantalla. | Mode compacte automàtic (amaga decoració i textos secundaris només si no hi caben) i botons que passen a una segona línia. |
| 7 | Bingo | El missatge «Atent! Ara surt la primera bola» no desapareixia. | S'esborra en sortir la primera bola. |
| 8 | Bingo | Pestanyes de cartró de 54 px i botó BINGO amb ombra massa gruixuda que robava alçada a la graella. | 44 px mínim i sense ombra gruixuda en pantalles baixes: caselles més grans. |
| 9 | Bingo | El número es tallava dins la casella amb lletra Extra gran/Gegant. | El número s'escala amb la mida de la casella (`container-type: size`). |
| 10 | Bingo, 2 jugadors apaïsat | Dos cartrons apilats amb caselles de 7 px d'alçada. | Un al costat de l'altre i cap barra lateral: caselles ≥ 18 px (límit documentat). |
| 11 | Jugar amb algú | Les dues targetes de jugador tenien alçades diferents i el jugador 2 mostrava dos camps idèntics («Convidat» i «Convidat»). | Targetes de la mateixa alçada; el camp de nom només surt per a convidats i diu «Nom del convidat». |
| 12 | Jugar amb algú | «Nivell» era críptic. | «Nivell del joc» dins un desplegable. |
| 13 | Espai del cuidador → Informe | Botons amb l'etiqueta llarga: es partien en dues línies amb la icona enganxada a l'esquerra. | Etiquetes curtes («Compartir el resum», «Còpia de seguretat (JSON)»). |
| 14 | Configuració del Pla | Interruptors de 35 px d'alçada. | 44 px (4,4 × 2,75 rem). |
| 15 | Capçalera | El logo «MentA» desbordava 4 px amb lletra Gran en un mòbil petit. | El logo pot encongir-se (`min-width: 0`). |
| 16 | Dòmino | Fitxes de 43 px d'alçada. | 44 px. |
| 17 | Targetes d'avís (cuidador) | Els botons de l'avís desbordaven amb lletra Gegant. | L'avís fa *wrap* i els botons passen a sota. |
| 18 | Web | Les captures reals tenien toasts de l'app («Ara juga Josep») tapant la pantalla. | Es treuen abans de fer cada captura. |
| 19 | Web | Els jocs com N-back, Stroop o Span es veien a la pantalla d'inici, sense joc. | Es prem «Començar» abans de capturar. |

## Llista de comprovació aplicada

- **Espaiat** amb escala 4/8 i marges laterals iguals a totes les pantalles de Persona.
- **Tipografia:** màxim 5 mides; `text-wrap: balance` als titulars.
- **Icones:** un sol joc SVG (`#i-…`). A la web cap emoji fa d'icona. A l'app els emojis només queden com a contingut dels jocs (les cartes del Memory) i en algun missatge puntual (p. ex. «⏱ Temps esgotat»); pendent de revisar.
- **Estats** `hover`, `focus-visible`, premut, desactivat, seleccionat a tots els components nous (bingo, onboarding, jugar amb algú).
- **Fosc:** paritat revisada a totes les captures i amb `tests/contrast.py` (tots els parells compleixen).
- **Moviment:** només `transform` i `opacity`; `prefers-reduced-motion` i l'ajust «Sense animacions» desactiven l'animació de la bola, el segell del bingo i l'onboarding.

## Pendent

- No s'ha provat el rendiment a 60 fps amb CPU frenada.
- La passada és d'una sola persona (l'equip d'IA): una persona amb ull de dissenyador hi trobarà més coses.
