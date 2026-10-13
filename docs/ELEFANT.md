# L'Elefantet de MentA (v1.9 · segon disseny)

Un animalet **petit i discret** que t'ajuda en petes coses. Viu sempre al mateix lloc (a baix a la dreta), no xerra sol i, mentre jugues, ni tan sols hi és: **surt pel costat de la pantalla només quan et veu encallat** i et pregunta si vols una pista. **No és un metge ni un avaluador**: mai no fa afirmacions de salut ni de memòria.

> Historial: la primera versió de la 1.9 era un elefant gran i present a tot arreu. L'Oriol ho va descartar (ni el disseny ni la presència). Aquesta és la versió definitiva: dibuix nou, més rodó i senzill, i presència mínima.

## 1. Com es comporta
| On | Què fa |
|---|---|
| **Pantalles normals** (inici, menú, progrés, configuració…) | És una **icona petita (56 px) fixa a baix a la dreta**, quieta. **No parla mai sol.** En tocar-lo s'obre un globus petit amb 2–3 botons: *Jugar · Respirar una estona · Com em trobo*. Es tanca tocant fora o amb `Esc`. |
| **Dins dels jocs** | **No hi és.** Hi ha una **bombeta** a la barra de dalt per demanar una pista quan vulguis. Si veu que t'encalles (4 errors seguits, o 40 s sense moure res en nivell *Discret*), **surt per la vora dreta**, a baix, i pregunta «Vols una pista?» amb *Sí / Ara no*. Quan acabes, se'n torna a anar pel costat. |
| **Onboarding** | No hi surt (la benvinguda ha de ser neta). |
| **Espai del Cuidador** | No hi surt mai. |
| **Mode focus** | Amagat. |

Cap mena de felicitació, comentari de partida, salutació ni presentador: tot això es va treure. L'únic que diu són **les ofertes i les pistes**, i el recordatori de cantar LÍNIA/BINGO al Bingo si has activat l'ajuda.

### Presència (Configuració → L'Elefant · per defecte *Discret*)
| Nivell | Ofereix pista després de… | Gestos (animacions) |
|---|---|---|
| Molt present | 2 errors seguits o 18 s quiet | sí |
| Normal | 3 errors seguits o 28 s quiet | sí |
| **Discret** (per defecte) | 4 errors seguits o 40 s quiet | no (quiet) |
| Apagat | mai; les pistes segueixen a la bombeta, amb una targeta de text | — |

Si rebutges la pista dues vegades, **deixa d'oferir-la en aquella partida**. No parla durant els jocs cronometrats (N-back, Stroop, Span, Fluïdesa, Seqüència, Bingo) tret que li demanis una pista.

## 2. El sistema de pistes (la funció principal)
Cada joc declara `pista: { obtenir(nivell) → { text, objectiu?, aplica?, explica? } }` a `registrarJoc`.

1. **Una frase d'orientació** («Fixa't en els cantons»).
2. **L'Elefantet assenyala** amb la trompa l'element o la zona, amb un **anell pulsant** (la trompa s'estira fins on pot i assenyala la direcció; l'anell marca el lloc exacte).
3. **Desvela** una part de la solució i **explica el perquè** (p. ex. al Sudoku: «Aquí només hi cap el 4: a la fila ja hi ha 1, 2 i 5…»).

No és un càstig (no resta estrelles ni surt com a fracàs); es **registra** (`ajudesUsades` + `pistes: { n, nivell }`) per a l'Espai del Cuidador. Es pot arribar fins al nivell que es vulgui; tocar el tauler mentre l'ajuda és oberta la tanca; `Esc` també. Taula de pistes per joc:

| Joc | Nivell 2 | Nivell 3 |
|---|---|---|
| Memory | una carta que ja has vist | la posició de la seva parella |
| Recorda la seqüència | l'últim color fet bé | el següent (i l'il·lumina) |
| Dòmino | la millor fitxa | explica per què és la millor |
| Dames | la peça i la casella destí (càlcul de 3 jugades) | explica el motiu |
| Bingo | el número cantat al cartró (o el botó LÍNIA/BINGO) | el marca |
| Sopa de lletres | la casella on comença la paraula | ressalta la paraula sencera |
| N-back | la lletra actual | si és igual o diferent (i dona més temps) |
| Span de dígits | quants en falten | el següent dígit |
| Stroop | la paraula (mira la tinta) | el color correcte |
| Càlcul mental | estratègia concreta | descarta dues opcions i diu com comença la resposta |
| Seqüències lògiques | estratègia | descarta dues opcions i explica la regla |
| Què falta aquí? | el forat | l'objecte que faltava |
| Sudoku | la casella amb menys candidats | el número i la regla que ho justifica |
| Tertúlia, Refranys | descarta una opció errònia | assenyala la correcta |
| Endevina la paraula | la lletra per on comença | destapa una lletra |
| Digues paraules | un truc (repassar l'abecedari) | exemples de la categoria |

## 3. El dibuix i el motor
| Fitxer | Què conté |
|---|---|
| `app/js/elefant/elefant-dibuix.js` | L'elefantet en SVG propi (cap imatge): de cara, rodó, orelles grans rosades, ulls grans, galtes, trompa curta. Grups amb nom i pivots: `cua`, `potes ×4`, `cos`, `cap` (`orella-esq/dre`, `ulls ×2` amb parpella i cella, `boca`, `galtes`, `trompa`) i accessoris. Paleta suau blau-grisa (clar i fosc). |
| `app/js/elefant/elefant-motor.js` | Bucle d'animació únic (s'atura amb la pestanya oculta; 30 fps si va lent; la icona petita va a 20 fps), trompa articulada de 8 punts amb **FABRIK** i límits d'angle per assenyalar, estats, mirada, parpelleig. |
| `app/js/elefant/dialegs.ca.js` / `dialegs.es.js` | Els textos (ofertes, pistes, menú). Editables. |
| `app/js/elefant/elefant-comportament.js` | Presència, regles, el contenidor fix, el menú, el vestuari. |
| `app/js/pistes.js` | Les pistes de 3 nivells. |
| `app/css/elefant.css` | Colors, globus, anell, el contenidor. |
| `app/elefant-demo.html` | Galeria per revisar-lo (estats, trompa assenyalant, roba, silueta a 48 px). |

API: `Elefant.crea(contenidor, { mida, rol })` → `estat(...)`, `mira(x,y)`, `assenyala(element|[x,y])`, `diu(text, {accions})`, `vesteix(...)`, `respiraFase(...)`, `pausa()`, `estatic()`… (vegeu el codi).

**Moviment reduït:** amb `prefers-reduced-motion` o l'ajust *Animacions* apagat, l'Elefant canvia de postura però no s'anima i no hi ha bucle.

**Accessibilitat:** el dibuix és decoratiu (`aria-hidden`); la icona és un botó amb nom i teclat (Enter/Espai, `Esc` per tancar); el globus és `aria-live="polite"` i no roba el focus; totes les accions tenen botons normals de ≥ 48 px; la bombeta fa ≥ 44 px.

## 4. Nom i vestuari
Per defecte «**L'Elefant**» (`ELEFANT_NOM` a `config.js`); es pot canviar a Configuració. Cinc propostes de nom per triar el definitiu: **Tonet · Quimet · Bernat · Manel · Elies** (cal comprovar que no coincideixi amb cap marca registrada).

Roba que es desbloqueja jugant (mai castiga; es tria a Configuració): llaçada (des del principi), bufanda verda (3 dies seguits), gorra (7), barret (50 partides), ulleres de lectura (20 dies actius), gorro de festa (100 partides), paraigua (30 dies seguits).

## 5. Tó (exemples)
| ✅ Bé | ❌ Malament |
|---|---|
| «Vols una pista? Només si ho vols.» | «Evidentment, la resposta és…» |
| «Et puc ajudar en alguna cosa?» | «Oh no! Has fallat!» |
| «No passa res. Tornem-hi.» | «Això demostra que la teva memòria empitjora.» |

Mai cap frase mèdica ni diagnòstica.

## 6. Mètriques
Vegeu `docs/RENDIMENT-1.9.md`.
