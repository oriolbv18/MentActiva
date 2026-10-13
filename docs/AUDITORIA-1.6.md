# Auditoria de MentA v1.6

Feta abans de tocar res, llegint tot el codi (HTML, CSS, 25 fitxers JS) i obrint l'app amb Playwright
(captures de referència a `docs/captures/base-1.6/`). Serveix de guia per a la v1.7.

## 1. Mapa de pantalles i flux

| Tipus | Pantalles |
|---|---|
| Principals (barra inferior) | `inici`, `menuJocs` (Jugar), `estadistiques` (Progrés), `configuracio` |
| Menús | `menuJocs` (individual), `menu2vs2` (2 jugadors) |
| Jocs (16 pantalles) | `joc-tertulia`, `joc-refranys`, `joc-paraules`, `joc-memory`, `joc-sequencia`, `joc-domino`, `joc-dames`, `joc-bingo` (només 2J), `joc-sopa`, `joc-nback`, `joc-stroop`, `joc-span`, `joc-fluidesa`, `joc-calcul`, `joc-seqlog`, `joc-quefalta`, `joc-sudoku` → **17** `joc-*` (l'encàrrec en deia 18) |
| Salut | `testCognitiu`, modals de respiració, xec de salut, recordatoris, diari de records |
| Família | `album`, `missatgeria`, `calFamiliar` + modal `modalFamilia` (codi de sala, videotrucada) |
| Modals | idioma, zoom, usuaris, nou usuari, informe, comparativa, calendari, dificultat, estrelles, repàs, confirmació, tutorial |
| Altres | onboarding (6 diapositives), elefant (mascota amb panell), trofeu |

Flux: onboarding → inici → (Individual | 2 Jugadors | Família | Progrés) → menú → tutorial (1a vegada) → dificultat → joc → modal d'estrelles → tornar a jugar / menú.
La navegació no usa l'historial del navegador: el botó «enrere» del mòbil surt de l'app.

## 2. Idioma
* **Tota la interfície està escrita en català dins l'HTML i el JS.** El selector Català/Castellano/English
  *només* canvia `SpeechSynthesis.lang` (la veu). Resultat: l'app diu «Idioma: Castellano» però continua en català,
  i a sobre llegeix text català amb veu castellana. **És un selector que enganya** (fase 5).
* Textos amb inconsistències: «La Tertulia» (catàleg) vs «La Tertúlia» (títol), barreja de «tu» i infinitius, paraules sense accent al joc
  de paraules (`JARDI`, `FARMACIA`, `ESGLESIA`).

## 3. Errors, codi mort i inconsistències
* 183 colors hexadecimals escampats pel CSS (només ~20 són variables). El mode fosc es fa a base de `body.fosc …` repetit ~80 vegades.
* Icones SVG duplicades al sprite: `i-restart` = `i-reiniciar`, `i-lupa` = `i-cerca`, `i-nota` = `i-musica`.
* Classes CSS orfes: `encertada-j1/2` (en realitat s'usen dinàmicament, no són orfes), `n1-n3` (dinàmiques). Cap CSS realment mort greu; el problema és la duplicació de valors.
* `Dòmino` i `Dames` comparteixen la mateixa icona (la del domini «lògica»). Tots els jocs d'un domini tenen la mateixa icona.
* `calendari`: la setmana comença en diumenge (`Dg Dl…`), a Catalunya és dilluns; el «calendari mensual» i la tira de 7 dies no coincideixen en criteri.
* `jocRecomanat()` tria sempre el joc amb pitjor % d'encert: si l'usuari va malament a un joc difícil, l'app li recomana sempre el mateix.
* Puntuació dubtosa: Dames/Dòmino converteixen una victòria en `1 encert / 0 errors` (100 %) i una derrota en `0/1` (0 %);
  Memory, Fluïdesa, Span, Seqüència fabriquen «encerts/errors» inventats per aconseguir un percentatge. No hi ha puntuació real ni durada.
* El model de partides desa només `{data, joc, encerts, errors, domini, nivell}`: **no hi ha durada, puntuació ni mode**, així que no es poden fer estadístiques fiables de temps.
* L'historial es talla a 1000 entrades i `diesJugats` a 730: cap còpia de seguretat.
* `Fluïdesa verbal` accepta qualsevol text de ≥2 lletres com a «paraula» (no es valida res; pot fer trampes amb «aaaa»).
* Un únic `AudioContext` i `setTimeout` cru en `melodia()`; la resta de timers dels jocs passen pel conjunt `_timers` (correcte).
* `confeti()` sempre injecta 50 nodes; amb «animacions» activades i `prefers-reduced-motion` ja es respecta.
* `window._tutorialCallback` és una global penjada a `window`.
* Cap `console.log` oblidat; un `console.error` legítim a `reiniciarJocActual`.
* El CSS té 2 definicions de `.screen-joc` i regles `:has()` que no funcionen en navegadors vells (innòcues).
* Llibreria de PDF carregada des d'un CDN (`cdnjs`): **no funciona sense xarxa** i trenca el requisit «offline».
* Cap service worker, cap `manifest` amb icones maskable, `theme_color` fix.

## 4. Funcions que aparenten ser reals però no ho són
| Funció | Realitat | Decisió v1.7 |
|---|---|---|
| Selector d'idioma (ca/es/en) | Només canvia la veu | Retirat; es substitueix per «Idioma i velocitat de la veu» (honest) |
| «Mode Família: juga amb la família encara que estigueu en cases diferents» | No hi ha servidor; res surt del dispositiu | Reformulat: «Família» = àlbum, diari i calendari **locals** + «Compartir progrés» (Web Share) |
| Codi de sala | Número aleatori local; no connecta amb ningú | Eliminat de la UI |
| Videotrucada | Obre una sala pública de Jitsi (servei extern, necessita xarxa, sense control de privadesa) | Eliminada de la UI; a `ROADMAP.md` |
| Missatges «per als avis / per als fills» | S'emmagatzemen al mateix dispositiu; ningú els rep | Passa a «Notes de família» (diari local) i s'hi afegeix compartir |
| Peu de pàgina «Segueix-nos»: WhatsApp `34600000000`, Instagram `menta_app`, Facebook, YouTube, `info@menta.app`, `menta.app` | Enllaços inventats, no verificats | Eliminats; contacte configurable a `config.js` |
| «Informe mèdic» / «Per al professional sanitari» / «Pacient» | Fa sonar l'app com un dispositiu sanitari | Reanomenat «Informe de progrés per compartir» amb avís legal |
| «Avís suau: el teu rendiment ha baixat… comenta-ho amb el teu metge» | Inferència mèdica a partir de dades de joc (sorollosa) | Eliminat |
| Config: «prevenir el deteriorament cognitiu» | Afirmació mèdica | Reescrit |
| Test cognitiu «inspirat en MMSE/MoCA» | Pot semblar un cribratge clínic | Reformulat com a «joc de memòria orientatiu» + avís |

## 5. Accessibilitat
* Contrast: text secundari `#566a5e` sobre `#f0f5f0` 5,3:1 (AA, no AAA); a `body.fosc` `#9bb0a2` sobre `#0f1a14` OK; **text blanc sobre `#2e8b57` = 4,25:1 (falla AA per a text petit)**; text blanc sobre l'ambre `#f2a65a` = 2,0:1 (falla).
* Focus: `:focus-visible` correcte però de color ambre sobre fons clar (baix contrast).
* Cap `skip link`; els modals no atrapen el focus ni el retornen; falten `aria-labelledby` als diàlegs; la navegació no té `aria-current`.
* Els `div role="button"` d'usuaris són accessibles per teclat només parcialment (sense Enter/Espai).
* Jocs: `Dòmino`, `Dames`, `Sopa` i `Sudoku` depenen del tacte/ratolí; Dames i Dòmino fan servir `button` (bé) però `Sopa` usa arrossegament sense alternativa.
* Informació només per color: Stroop (és el joc), Dames (blanc/negre OK per forma), marcador 2J (color + text OK), Memory encertada (color + vora).
* Targets tàctils: molts botons petits ≥ 2,4 rem; en mida «gegant» alguns passen de 48 px, a «normal» alguns (`.sudoku-num`, `.span-tap`) són de 40–43 px.
* Mida de lletra base 15–21 px segons pantalla; cos 1 rem; interlineat 1,5. Tipografia: pila del sistema (Segoe UI) → diferent a cada dispositiu.

## 6. Rendiment i robustesa
* Càrrega ràpida (≈ 290 kB entre HTML, CSS i JS; sense frameworks) però bloquejada pel CDN de jsPDF.
* `Date.now()` per a cronòmetres (correcte), cap fuita de timers evident.
* `lsSet` avisa quan el `localStorage` és ple; no hi ha cap mecanisme de recuperació ni exportació.
* L'àlbum guarda fotos en base64 dins `localStorage` (≈ 640 px, JPEG 0,68): 40 fotos ≈ 2–3 MB; pot omplir els 5 MB amb diversos usuaris.

## 7. Prioritats que se'n deriven
1. Identitat visual i tokens (fase 1) — **tot el CSS depèn de valors cuinats**.
2. Model de sessions amb durada/puntuació (fase 4) — sense això les estadístiques no es poden fer bé.
3. Eliminar el que enganya (idioma, sala, videotrucada, xarxes socials, afirmacions mèdiques).
4. PWA/offline real: jsPDF i fonts en local, service worker.
5. Còpia de seguretat (exportar/importar JSON).
