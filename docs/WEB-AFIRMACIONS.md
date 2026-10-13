# Auditoria d'afirmacions de la web (v1.9.2, ampliada de la 1.9.1)

Regla: cada afirmació de la web ha d'existir de debò a l'app (o ser una decisió explícita del projecte). Si no es pot demostrar, s'elimina o es reformula. Les proves automàtiques són a `tests/`.

| # | Afirmació a la web | On es demostra | Estat |
|---|---|---|---|
| 1 | 17 jocs de memòria, atenció, llenguatge, càlcul i lògica | `web/jocs.js` (generat del catàleg real `CATALEG_JOCS` per `tools/captures-web.py`): 17 entrades; `tests/web/test_web.py` comprova 17 targetes | ✅ |
| 2 | «La persona gran comença amb un sol botó gran, JUGAR» | Pantalla d'inici (`img/web/inici.webp`): JUGAR és el botó gran; hi ha també «Jugar amb algú» i dos accessos més | ✅ (reformulat: abans deia «només veu un botó», que era inexacte) |
| 3 | Sense registre; es juga com a convidat | `usuariActualId = 'convidat'` a `app/js/1-nucli.js`; l'inici de la demo no demana res | ✅ |
| 4 | Les dades es queden al dispositiu; no hi ha servidor | Només `localStorage`/IndexedDB; l'únic `fetch` és el feedback opcional (`8-producte.js`) que s'envia només si la persona prem el botó; `docs/SEGURETAT.md`, `tests/seguretat/test_csp.py` (CSP `connect-src 'self'`) | ✅ |
| 5 | Funciona sense internet | `tests/test_pwa.py` («funciona sense xarxa»); service worker amb precàrrega | ✅ |
| 6 | Quatre mides de lletra, mode fosc i alt contrast | `data-zoom` normal/gran/extragran/gegant, `data-tema="fosc"`, `data-contrast="alt"` a `estils.css`; `tests/contrast.py` | ✅ |
| 7 | Gratuïta i sense publicitat; sense anuncis ni compres dins l'app | Decisió del projecte (FAQ des de la 1.8); el codi no té cap pasarel·la de pagament ni xarxa publicitària (`grep` de `ads`, `purchase`, `stripe` → 0) | ✅ (decisió + absència al codi) |
| 8 | Projecte d'Empresa de la UPC (Castelldefels) | Dada del projecte (avís legal, `docs/`); no s'afirma cap avalament de la UPC | ✅ |
| 9 | Sessió guiada de tres jocs amb descans entre jocs | `sessioGuiadaFi` («pantalla de descans») a `9-persona.js`; l'inici diu «3 jocs · uns 10 minuts» | ✅ |
| 10 | La dificultat s'adapta sola | `ajustes.dificultatMode: 'adaptatiu'` per defecte (`1-nucli.js:158`), «adaptat a tu» (`1-nucli.js:971`) | ✅ |
| 11 | La persona només veu coses positives | «Com vaig: només reforç positiu» (`9-persona.js:5`) | ✅ |
| 12 | Espai del cuidador amb PIN: resum, evolució, notes, informes | `10-cuidador.js` (PIN de 4 xifres, `hashPin` amb sal); `cuTria('resum'/'evolucio'/…)`; `tests/smoke_cuidador.py` | ✅ |
| 13 | Semàfor: compara cada persona amb ella mateixa (4 setmanes anteriors), només avisa si hi ha canvi sostingut i prou dades, regles visibles | `SEMAFOR` a `config.js` (`minSessions`, setmanes); «Com es calcula» al Resum | ✅ |
| 14 | Notes del cuidador que surten sobre els gràfics | `marques` (notes del cuidador) a `6-estadistiques.js:54` | ✅ |
| 15 | Informe de progrés en PDF i exportació CSV | `jsPDF` (`vendor/`), `10-cuidador-panells.js`, `11-residencia.js` (CSV) | ✅ (reformulat: ja no es diu «per al professional sanitari», perquè l'app ho va reanomenar a la 1.6 per no semblar un dispositiu sanitari) |
| 16 | Pla a mida: amagar jocs, limitar el nivell, hora del recordatori i mida de lletra | `10-cuidador-panells.js` (jocs amagats, nivell), `horaPreferida`, mida de lletra al pla | ✅ |
| 17 | Consentiment i registre de qui ha vist les dades | Pantalla de consentiment i registre d'accessos a `10-cuidador-panells.js` i `7-dades.js` | ✅ |
| 18 | Paquet en mode lectura per a un familiar a distància | «paquet de lectura» a `10-cuidador-panells.js:203` | ✅ |
| 19 | Mode Residència: una tauleta, diversos residents amb foto i nom; panell de planta; mode quiosc; CSV i PDF | `11-residencia.js` (selector «Toca la teva foto», panell, «Pantalla completa»/quiosc); `tests/test_parella.py`, `smoke_cuidador.py` | ✅ |
| 20 | Bingo: 90 boles, cartró 3×9, línia i bingo, taulell 1–90, 3 nivells d'ajuda, fins a 4 cartrons, rivals virtuals, velocitat lenta/normal/ràpida/manual, sense diners | `app/js/2-jocs/bingo.js`; `tests/bingo/test_bingo.py` | ✅ |
| 21 | Jugar amb algú: Un contra l'altre / Duel de puntuació, Junts, Joc just | `12-parella.js`; `tests/test_parella.py` | ✅ |
| 22 | Còpia de seguretat recuperable en un altre dispositiu | `14-copia.js`; `tests/copia/test_copia.py` | ✅ |
| 23 | S'instal·la a la pantalla d'inici | `manifest.webmanifest`, `sw.js`; `tests/test_pwa.py` | ✅ |
| 24 | Demostració: res del que facis es desa | `?demo=1` (localStorage en memòria, sense service worker); `tests/web/test_web.py` («el localStorage real continua intacte») | ✅ |
| 25 | «Sessions curtes: una opció de “Només 5 minuts”» | `iniciarSessioCurta()` (botó «Només 5 minuts», `app/index.html:329`) | ✅ (substitueix «Opció de jugar sense temporitzador», que no s'ha pogut demostrar i s'ha eliminat) |
| 26 | Jocs de 2 a 10 minuts | Camp `min` del catàleg (de 2 a 10) a `web/jocs.js` | ✅ |
| 27 | MentA no prevé, no cura ni diagnostica; no és un dispositiu sanitari | Condicions i avís de no-diagnòstic (`legal/condicions.html`); el semàfor és orientatiu | ✅ (negació; paraules vigilades només per negar) |
| 28 | Captures amb dades fictícies | `carregarDemo()` (residents d'exemple); la web ho diu sota les captures | ✅ |
| 29 | Estem buscant persones que la provin / En fase de proves | Estat real del projecte (CHANGELOG, `docs/PILOT.md`) | ✅ |
| 30 | «Revisats amb centenars de partides automàtiques» (a la 1.9) | Existeix `tests/jocs/test_jocs.py --tot --n 100`, però **no hi ha cap execució registrada** (`resultats.json` buit) | ❌ **Eliminat** (a més, tota la secció «Novetats» va sortir de la web) |
| 31 | «Opció de jugar sense temporitzador» (a la 1.9) | No hi ha cap ajust així a l'app | ❌ **Eliminat** |
| 32 | Pilot «de 4 setmanes amb 2–3 centres» | No confirmat per l'Oriol | ❌ **No es diu**: la web només diu «Si el vostre centre té interès a provar-la en un pilot, parlem-ne» (vegeu «Pendent de l'Oriol») |
| 33 | PIN 0000 de la demo | No existeix | ❌ **No es diu** |

**Paraules vigilades** («previndre», «curar», «detectar», «diagnòstic», «clínicament provat», «científicament demostrat»): a la web només apareixen per negar (`index.html`: «No prevé, no cura ni diagnostica», «Això no és un diagnòstic», la pregunta de les FAQ). Comprovat amb `grep -i`.

## Afirmacions noves o reformulades a la 1.9.2

| # | Afirmació a la web | On es demostra | Estat |
|---|---|---|---|
| 34 | «Un botó gran. Tres jocs. Uns deu minuts.» | L'inici de l'app diu «JUGAR · 3 jocs · uns 10 minuts» (captura `img/web/inici.webp`, `9-persona.js`) | ✅ |
| 35 | «Sense registre ni contrasenyes. La primera vegada, una benvinguda breu l'ajuda a triar la mida de la lletra» | `usuariActualId = 'convidat'`; `13-onboarding.js` (pantalla de mida de lletra, `onboarding-3-zoom.webp`) | ✅ (s'ha tret «sense menús on perdre's», que no es podia demostrar: l'inici té quatre accessos) |
| 36 | «17 jocs de 2 a 10 minuts… només veu reforç positiu… entre joc i joc, un descans» | #1, #9, #11 i #26 | ✅ |
| 37 | «0 comptes» i «0 anuncis» | #3 i #7 (no hi ha cap sistema de comptes ni cap xarxa publicitària al codi) | ✅ |
| 38 | «4 mides de lletra» | #6 (`normal/gran/extragran/gegant`) | ✅ |
| 39 | «L'espai del cuidador és amb PIN: la persona gran no hi entra per error» | #12 («El PIN impedeix un accés casual»); la web diu que no és seguretat forta | ✅ |
| 40 | Semàfor visual «4 setmanes anteriors / aquesta setmana» | #13; és una il·lustració i la web ho diu («Visualització amb dades fictícies») | ✅ |
| 41 | Gràfic d'evolució d'exemple | #14; etiquetat «Dades fictícies» a la peça | ✅ |
| 42 | Captures de residències i del cuidador | Dades d'exemple de `carregarDemo()`; la web diu «Captures amb dades fictícies de demostració: cap persona és real» i el selector mostra «(exemple)» | ✅ |
| 43 | «Atkinson Hyperlegible: una tipografia del Braille Institute pensada per a la baixa visió» | Fet extern verificat: <https://www.allaboutvision.com/low-vision/atkinson-hyperlegible-typeface/> | ✅ |
| 44 | «Bon dia / Bona tarda / Bona nit» als mòbils | Captures de l'app real amb el rellotge del navegador fixat a les 8:30 / 16:10 / 21:30; l'app calcula la salutació (`docs/ACTIUS.md`). Cap imatge editada | ✅ |
| 45 | Vídeo del hero | Gravació real de l'app en mode convidat (`tools/grava-video.py`); no hi ha cap dada personal | ✅ |
| 46 | Contacte: correu `menta.app.upc@gmail.com` i Instagram `@menta.upc` | Facilitats per l'Oriol; són a `CONTACTE` de `app/js/config.js` i la web només mostra el que hi ha | ✅ |
| 47 | «No prevé, no cura ni diagnostica» (titular de l'enfocament) | #27 (negació); no hi ha cap promesa clínica | ✅ |

Les paraules vigilades («previndre», «curar», «diagnòstic»…) continuen apareixent només per negar. Comprovat amb `grep -i` sobre `index.html`.

