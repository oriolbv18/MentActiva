# MentA 1.8 — «Simple per a l'avi, potent per a qui el cuida»

Una sola app amb dues capes: **Persona** (molt simple) i **Espai del cuidador** (potent, amb PIN), més un **mode Residència**. Tot en HTML/CSS/JS pur, sense dependències, funciona amb `file://` i com a PWA. Les claus de `localStorage` de la 1.7 es mantenen; l'esquema passa a la versió 3 amb migració automàtica.

## Fase 1 — Cacera d'errors als jocs (vegeu `docs/ERRORS-1.8.md`)
- **Memory:** les parelles encertades ja no tornen a animar-se. Les cartes es creen una vegada, gir 3D real per transició CSS, només s'anima la carta que canvia, protecció contra tocs ràpids/dobles, `touch-action: manipulation`.
- **Mateix patró** corregit amb `morph()` (comparació incremental del DOM) a Dames, Dòmino, Bingo, Sopa, Sudoku, Paraules i Span.
- Sopa: tocar de nou la mateixa cel·la cancel·la la selecció; graella navegable amb teclat. Sudoku: missatge corregit.
- **Bots Playwright:** 17 jocs × 100 partides, 0 errors, animacions netes, proves d'estrès i temporitzadors orfes (`tests/jocs/`). **Proves de regles** amb implementació independent (dames, dòmino, sudoku de solució única, càlcul, bancs de contingut, N-back, Stroop, Span).

## Fase 2 — Interfície molt més intuïtiva (vegeu `docs/AUDITORIA-UX-1.8.md`)
- Inici de Persona: salutació + un botó gegant **JUGAR** + «Els meus jocs» + «Els meus records». Barra inferior eliminada.
- **Noms humans** dels jocs («Recorda la lletra», «Colors i paraules»…); el nom tècnic queda per al cuidador.
- JUGAR = **1 toc**; qualsevol joc destacat = **2 tocs**; la resta, 3.
- Guia de primer ús de 3 passos, estats buits amables, textos revisats (`docs/TEXTOS.md`), objectius tàctils ≥ 56 px, filtre de tremolor opcional.
- Guió de prova amb usuaris i SUS en català: `docs/PROVA-USUARIS.md`.

## Fase 3 — Dues capes
**Persona**
- Onboarding amb pregunta de rol (Jo mateix/a · Una persona gran · Residència o centre), mida de lletra, nom, PIN i consentiment segons el rol.
- **Sessió guiada** de 3 jocs amb punts de progrés i pantalles de descans; «Els meus jocs» (6 destacats + «Veure tots»); «Com vaig» només amb reforç positiu; «Els meus records»; **Avisar algú** (Web Share); dificultat adaptativa silenciosa.
- Només 3 botons de configuració visibles (lletra, so, ajuda).

**Espai del cuidador** (`docs/CUIDADOR.md`)
- PIN de 4 xifres (hash SHA-256 amb sal; honest que no és seguretat forta), bloqueig de 30 s després de 5 errors, «He oblidat el PIN» (explica que cal esborrar dades), tancament als 5 min, registre d'accessos.
- Pestanyes **Resum · Evolució · Jocs · Salut i ànim · Notes · Pla · Informe · Ajustos**.
- **Semàfor** transparent i conservador: icona + text, mínim 6 sessions, línia base = les últimes 4 setmanes de la mateixa persona, «Què és això?» per indicador, avís legal a cada pantalla i als PDF.
- Registre de sessió ampliat (temps de reacció mitjà/mediana/variabilitat, abandonada, ajudes, pauses…).
- Notes del cuidador a gràfics i informe. **Pla** (jocs amagats, nivell màxim, durada, recordatori, lletra/so/contrast, 2 jugadors/família).
- **Informe PDF** en dues variants (família / professional sanitari), CSV, còpia JSON, resum setmanal per Web Share i **paquet de lectura** per a un familiar (mode només lectura, sense PIN).
- Pantalla de **consentiment i transparència** (la persona, família/tutor o «ara no»), amb RGPD.

**Mode Residència**
- Selector de residents amb foto/nom grans, tornada automàtica als 3 min, mode quiosc, **panell de planta** (semàfor ordenable i filtrable, qui no ha jugat avui o en X dies, resum de planta, export CSV i PDF), PIN de professional.

## Fase 4 — Demo i mesura
- **Mode demostració:** 8 residents fictícis × 3 mesos amb trajectòries diferents (estable, millora, baixada lenta, intermitent, constància que cau, ànim baix, baixada recent, fa dies que no juga) i notes del cuidador. Es veu etiquetat i s'esborra amb un toc.
- **Mètriques d'ús opt-in** (ja existia l'exportació anònima): ara registra el temps i els tocs fins al primer joc; abandonaments inclosos.
- **Feedback:** tres preguntes opcionals per a cuidadors.

## Segona tanda de la 1.8 (instruccions completes)
Aquesta secció recull el que es va afegir després de rebre el segon document d'instruccions (que substitueix el primer).

### Jugar amb algú (Fase 4)
- Botó gran **«Jugar amb algú»** a l'inici de Persona i pantalla pròpia: dos jugadors (avatar i nom; el 2 pot ser un usuari o un convidat), mode **«Un contra l'altre»** o **«Junts»**, **Sorpresa**, **Repetir l'última partida** i marcador de la tarda. De l'inici al primer moviment: **3 tocs i menys de 8 s** (mesurat a `tests/test_parella.py`).
- **8 jocs de 2 jugadors natius** (Memory, Seqüència, Dòmino, Dames, Bingo, Tertúlia, Refranys, Paraules) i **Duel de puntuació** a 8 jocs d'1 jugador (Càlcul, Stroop, Span, Què falta?, Sopa, Seqüències lògiques, Sudoku, Fluïdesa): la mateixa partida (mateixa llavor) un darrere l'altre, amb pantalla de relleu «Passa el dispositiu». **Junts** (cooperatiu) a tots ells i a Memory, Seqüència i Tertúlia. **Joc just**: nivell diferent per jugador.
- **Aleatori amb llavor** (`rng`, `fixaLlavor`): dues partides amb la mateixa llavor són idèntiques. Els missatges i la decoració fan servir un altre generador perquè no desincronitzin el duel.
- Les partides amb algú **no entren a l'historial dels indicadors**; es desen a part com a «activitat social» i el cuidador les veu a part.

### Botons i caselles (Fase 5)
- Patró CSS únic i **auditoria automàtica** (`tests/layout/auditoria-botons.py`, vegeu `docs/DISSENY.md`). Va trobar i es van arreglar una vintena de defectes (logo, interruptors, desbordaments amb lletra Gegant, botons de mida < 44 px…).

### Bingo real (Fase 6)
- Bingo de **90 boles**, cartró **3×9** (15 números, 5 per fila, columnes per desenes i ordenades), **premis línia i bingo**, bola amb animació i **veu en català**, **LÍNIA!/BINGO!** que es validen, **taulell 1–90**, **Repeteix**, velocitat lenta/normal/ràpida/manual, **fins a 4 cartrons**, **3 nivells d'ajuda** i **rivals virtuals**. 2 jugadors amb un cartró cadascun. Cartró girat (9×3) en vertical i normal en horitzontal. **Cants tradicionals** opcionals i editables a `app/js/bingo-cants.js` (a validar amb persones grans). Sense diners. Proves: `tests/bingo/test_bingo.py` (10 000 cartrons vàlids, bombo sense repeticions, cantades falses i certes, rivals, 2 jugadors, cap temporitzador orfe) i bots de 100 partides.

### Onboarding nou (Fase 7)
- Interactiu i amb mascota (l'Elefant): benvinguda · rol · nom amb avatar i vista prèvia en directe · mida de lletra amb vista prèvia real, tema i contrast · «Prova-ho!» (exercici de 3 cercles + «Com et trobes avui?», amb celebració) · PIN i consentiment (cuidador) o PIN i nom del centre (residència) · tot a punt amb recordatori opcional. **6 passos** (Jo mateix/a i Residència) i **8** per al rol cuidador (PIN i consentiment són dues pantalles per no fer scroll).
- **Es veu una sola vegada**: marca a `localStorage` + `sessionStorage` + memòria; qui ve de la 1.6/1.7 no el veu; crear un usuari nou no el torna a obrir; si `localStorage` falla hi ha avís i no hi ha bucle. Es pot repetir a Configuració («Repetir la guia») com a visita de 3 passos que no toca dades. Proves a `tests/onboarding/test_onboarding.py`.

### Web nova (Fase 9)
- `index.html` i `legal/` redissenyats amb els mateixos tokens que l'app, **captures reals** (`tools/captures-web.py`), recompte de jocs generat del catàleg real, formulari de contacte amb honeypot i consentiment, JSON-LD sense valoracions, sitemap i robots. **Contacte i xarxes**: tots els camps de `CONTACTE` (config.js) són **buits**; l'app i la web només mostren els que existeixen. Els enllaços antics de la 1.6 (WhatsApp, Instagram, correu, domini) **no es publiquen** perquè no es poden verificar.

### Fase 10 i polit
- **Memory amb fotos de la família** (de l'àlbum), **«Només 5 minuts»**, **«Joc del dia»**, targeta de **«Novetats»** descartable per als usuaris que venen d'una versió anterior, **activitat social** al Resum del cuidador, demo amb activitat social, mètriques d'ús opt-in i preguntes per a cuidadors, `docs/POLISH-1.8.md`.

## Qualitat
- `tests/test_menta.py` (5 resolucions × 4 mides de lletra × clar/fosc, 0 errors JS, cap joc fa scroll, migració, axe-core), `tests/test_viatge18.py` (recorregut complet), `tests/smoke_cuidador.py`, bots i regles. La regressió va trobar **desbordament horitzontal amb lletra «gegant»** a «Com vaig» i al cuidador: corregit.
- Codi mort del «Progrés» de la 1.7 eliminat.

## Decisions preses (ambigües)
1. **Qui és «Jo mateix/a»:** sense PIN per defecte (opcional); el candau del cuidador entra directament si no n'hi ha.
2. **Consentiment «Ara no»:** amaga les dades i bloqueja els informes d'aquella persona; no s'inclou a les exportacions de planta.
3. **Els 6 jocs destacats** els tria el sistema segons el que juga la persona; la resta, «Veure tots els jocs».
4. **Semàfor:** els llindars són a `config.js` i són conservadors (preferim no avisar a avisar per error). No estan validats clínicament.
5. **Família a distància sense servidor:** resum per Web Share i paquet JSON de només lectura; no és en directe.
6. **Tractament:** «tu» a Persona, «vosaltres» als avisos al cuidador.
7. **Dades de demo** separades de les reals: es poden esborrar sense tocar res més.

## Decisions de la segona tanda
8. **«2 vs 2»** s'interpreta com a **2 jugadors al mateix dispositiu** (no parelles contra parelles); a la UI es diu «Jugar amb algú».
9. **El bingo individual** té 1 rival virtual i **1 cartró** per defecte perquè en vertical el cartró girat ocupa gairebé tota la pantalla; es poden triar fins a 4 cartrons i 3 rivals.
10. **Opcions del bingo plegades** («Canviar les opcions»): un sol toc a «Començar» amb les opcions de l'última vegada.
11. **Cants del bingo**: només 3 (13, 22, 90) i desactivats per defecte; no n'inventem més sense validar.
12. **L'onboarding té 8 passos per al cuidador** (> 7 demanats) per no fer scroll a mòbils petits amb lletra gran.
13. **Cap enllaç de xarxes ni correu públic**: `CONTACTE` queda buit fins que l'Oriol tingui comptes reals.

## Què no s'ha pogut fer / limitacions
- **Mode cara a cara** a la tauleta (girar 180° la zona del jugador de davant): no fet. Queda al ROADMAP.
- **Caselles ≥ 44 px a tot arreu**: al bingo, la sopa i el sudoku, amb 360 px d'alçada i lletra gran, les caselles baixen (fins a ~18 px en 2 jugadors apaïsat) per no fer scroll. Excepció documentada.
- **Onboarding sense scroll**: en mòbils petits o apaïsats amb lletra Extra gran o Gegant, alguns passos fan scroll *dins* la pantalla (el botó sempre és visible). Límit documentat.
- **No s'ha provat amb persones grans reals ni amb lectors de pantalla reals** (VoiceOver/TalkBack). Cal fer-ho (`docs/PROVA-USUARIS.md`).
- El PIN no és seguretat forta; les dades viuen al `localStorage` sense xifrar.
- Les regles del semàfor i els indicadors són orientatius i **no validats per un professional**.
- RGPD: les dades d'ànim, medicació i rendiment poden ser de categoria especial. Sense servidor no en surten, però un PDF o resum compartit ja no es controla. Cal una AIPD abans d'un ús en residències reals (vegeu `docs/ROADMAP.md`).
- No hi ha sincronització en directe ni multi-dispositiu.
- Web Share i la instal·lació PWA depenen del navegador i requereixen `https://`; a `file://` es descarrega un fitxer.

## Resultats finals de les proves (últimes execucions)
- `tests/test_menta.py` (5 resolucions × 4 mides de lletra × clar/fosc, 0 errors JS, cap joc amb scroll, migració, axe-core): **TOT CORRECTE**.
- Bots: **18 jocs × 100 partides** (inclòs el Bingo), totes acabades, 0 errors; proves d'estrès netes. L'única vegada que la prova d'animacions va fallar (Memory, nivell fàcil) va ser sota càrrega de CPU i va passar dues vegades seguides en solitari.
- `tests/jocs/test_regles.py`, `test_viatge18.py`, `test_parella.py`, `tests/bingo/test_bingo.py`, `tests/onboarding/test_onboarding.py`, `smoke_cuidador.py`, `test_pwa.py` i `contrast.py`: **correctes**.
- Auditoria de botons: 2 840 estats, de 382 incidències inicials a 0 (3 d'amplada d'un botó de filtre arreglades a l'última passada); web: 0 incidències.
- No executat: **Lighthouse** (no instal·lat; no s'ha descarregat cap paquet).
