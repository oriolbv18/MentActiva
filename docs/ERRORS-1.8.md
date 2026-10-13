# Errors trobats i corregits a la 1.8 (Fase 1)

Document de la cacera d'errors als jocs. Cada fila diu **què passava**, **per què** i **com es va arreglar**, i quina prova ho vigila ara.

## 1. L'error de Memory: les parelles encertades tornaven a animar-se

**Què veia l'usuari.** En girar una carta nova, les parelles ja encertades "tornaven a girar" o feien el parpelleig d'entrada. A la 1.7 es veia sobretot en tauletes i mòbils lents.

**Causa arrel.** La funció `pinta()` de Memory reconstruïa **tot** el tauler amb `innerHTML` a cada toc. En destruir i recrear els elements del DOM, el navegador tractava totes les cartes com a noves i reiniciava les animacions CSS (`animation` d'entrada i de gir). No era un problema de CSS sinó d'arquitectura: l'animació depenia de la vida de l'element, i l'element es recreava.

**Experiment de control.** A la 1.7, girar una sola carta feia reiniciar l'animació de 2 cartes encertades (mesurat amb `document.getAnimations()`). A la 1.8, el mateix gest no reinicia cap animació de cartes encertades.

**Arranjament.**
- Les cartes es **creen una sola vegada** per partida; després només s'actualitzen les classes (`actualitzaCarta`).
- El gir és una **transició CSS 3D real** (`transform: rotateY`) i només s'anima la carta que canvia d'estat.
- Les cartes encertades no tornen a animar mai (l'estat "encertada" és una classe estable, sense animació d'entrada).
- Protecció contra tocs ràpids o dobles: ignora tocs durant la comprovació d'una parella, sobre cartes ja girades o encertades.
- `touch-action: manipulation` a les cartes (sense retard de 300 ms ni zoom per doble toc).
- Es conserva tot el que ja hi havia: nivells, vista prèvia inicial, 2 jugadors i puntuació.

**Prova que ho vigila:** `tests/jocs/test_jocs.py` (comprova amb `getAnimations()` que cap carta encertada té animacions actives després de cada gir) i el bot de Memory (100 partides × 3 nivells + 2 jugadors).

## 2. El mateix patró a la resta de jocs

Vam buscar tots els jocs que repinten amb `innerHTML`. Es va resoldre de manera genèrica amb `morph(pare, html)` (nucli): una comparació incremental del DOM que **conserva els elements que no canvien** (així no es reinicien animacions i no es perd el focus del teclat).

| Joc | Problema | Solució |
|---|---|---|
| Memory | Repintat total (veure dalt) | Cartes persistents |
| Dames | Cada moviment recreava les 64 caselles i peces: parpelleig i focus perdut | `morph` |
| Dòmino | Mà i tauler es recreaven a cada jugada | `morph` (3 zones) |
| Bingo | Els cartrons es repintaven a cada número | `morph` |
| Sopa de lletres | Cada toc repintava la graella (la selecció parpellejava) | `morph` |
| Sudoku | Cada número repintava la graella i perdia el focus | `morph` |
| Paraules | Les lletres de la paraula es recreaven a cada encert | `morph` |
| Span | Els dígits introduïts es recreaven a cada toc | `morph` |

## 3. Altres errors trobats pels bots

| # | Joc | Error | Correcció |
|---|---|---|---|
| 1 | Sopa de lletres | Si es tocava una cel·la i després se'n tocava una altra de lluny, la selecció a mitges bloquejava la partida (el bot no podia acabar-la). | Tocar de nou la mateixa cel·la **cancel·la** la selecció; la graella també es pot recórrer amb teclat. |
| 2 | Sudoku | El missatge d'ajuda parlava d'un botó «Reiniciar» que ja no existeix. | Text corregit. |
| 3 | Tots | El nivell guardat podia sortir de rang si el catàleg canviava. | `nivellGuardat` ara el fixa a un nivell vàlid. |
| 4 | Tots | `finalitzarPartida` no distingia partides abandonades de les completades. | Nou registre d'abandonaments (`d.abandonaments`) i camp `abandonada`. |

## 4. Protocol de bots (Playwright)

`python tests/jocs/test_jocs.py --tot --n 100`

Per a cada joc (17, més els modes de 2 jugadors on n'hi ha):
- **100 partides automàtiques** i completes, en els 3 nivells (i en 2 jugadors).
- **0 errors de consola** i 0 excepcions.
- **Animacions netes** (`getAnimations()`): cap element que no ha canviat reinicia una animació.
- **Proves d'estrès:** girar la pantalla, canviar la mida del text, pausar i reprendre, botó Enrere, sortir i tornar a entrar, tocs ràpids i dobles.
- **Temporitzadors orfes:** en sortir d'un joc no queda cap `setTimeout`/`setInterval` viu.
- **Regles i contingut** (`python tests/jocs/test_regles.py`): vegeu l'apartat següent.

**Resultat final de la Fase 1:** 17 jocs × 100 partides, totes acabades, 0 errors. Detall a `tests/jocs/resultats.json`.

## 5. Correcció de regles i de contingut (implementació independent)

`python tests/jocs/test_regles.py` — comprova que el joc fa el que diu, comparant-lo amb una implementació independent escrita a la prova:

- **Dames:** els moviments permesos (captura obligatòria, captures múltiples, coronació, dames) coincideixen amb el motor de la prova; les jugades de l'ordinador sempre són legals.
- **Dòmino:** les 28 fitxes sempre sumen 28 entre mà, ordinador, pou i tauler; només s'activen les fitxes que encaixen.
- **Sudoku:** cada tauler generat té **solució única** i les pistes no es contradiuen.
- **Càlcul:** cada resposta que el joc dona per correcta es recalcula (preus, canvi, descomptes, sumes).
- **Bancs de contingut:** sense preguntes repetides, sense opcions duplicades, resposta correcta dins del rang, paraules només amb lletres vàlides i amb pista, sèries lògiques sempre amb 4 opcions diferents.
- **N-back, Stroop i Span:** l'encert o l'error que mostra el joc coincideix amb el que recalcula la prova a partir del que es veu a pantalla.

Resultat: **TOT CORRECTE**. (Les primeres execucions donaven errors del propi test: una comparació de classes que confonia `correcte` amb `incorrecte` i un seguiment de lletres que perdia repeticions consecutives; es van corregir a la prova, no al joc.)

## 6. Pendent / límits

- Els bots comproven el funcionament i les regles, **no la dificultat percebuda** ni la diversió; això només ho pot validar una persona gran real (vegeu `docs/PROVA-USUARIS.md`).
- No s'ha provat amb lectors de pantalla reals (VoiceOver/TalkBack): només amb axe-core i revisió manual de l'ordre de focus.

## 7. Segona tanda (Bingo, Jugar amb algú, onboarding)

| # | Zona | Error trobat per les proves | Correcció |
|---|---|---|---|
| 1 | Auditoria de botons | El logo de la capçalera desbordava 4 px amb lletra Gran; els interruptors feien 35 px; fitxes de dòmino de 43 px; botons d'avís que desbordaven amb lletra Gegant. | CSS (vegeu `docs/POLISH-1.8.md`). |
| 2 | Bingo | El número es tallava dins la casella amb lletra molt gran; el missatge inicial no desapareixia; tres botons en una fila s'amagaven amb lletra Gegant. | Número escalat amb `container-type: size`; missatge buidat a la 1a bola; etiquetes ocultes en pantalles estretes (amb `aria-label`). |
| 3 | Onboarding | `hidden` + `display:block` inline: les cares de l'ànim no sortien; el grid creixia pel contingut i tallava el 4t botó de mida de lletra. | `hidden` real i `minmax(0, 1fr)`. |
| 4 | Onboarding | Error JS en acabar (`salut.historial` inexistent en un usuari nou). | L'ànim es desa un cop creat l'usuari, amb `xecAvui()`. |
| 5 | Axe | Contrast insuficient al botó «Jugar amb algú» (mode fosc) i `aria-label` sobre un `span` sense rol. | Tokens `--text-invers`/`--info`; `role="group"`. |
| 6 | Proves | El test d'N-back comparava classes amb `'correcte' in 'incorrecte'`; en n=1 perdia lletres repetides. | Corregit el test (el joc era correcte). |

**Resultats finals:** vegeu `CHANGELOG-1.8.md` (secció Qualitat) per als resultats de les últimes execucions.
