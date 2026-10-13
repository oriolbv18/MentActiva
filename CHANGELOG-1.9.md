# MentA · Registre de canvis · v1.9 «L'Elefant ja és el protagonista»

Base: la v1.8 (carpeta `Menta_Web.1.8`, que no s'ha tocat). Un *commit* per fase al repositori `git` d'aquesta carpeta.

## Resum per fases
| Fase | Què s'ha fet |
|---|---|
| **1 · Error d'usuaris** | Causa trobada i corregida a l'arrel: una font única d'usuaris amb l'esdeveniment `menta:usuaris`; totes les llistes (modal, selector de residents, panell de residència, «Jugar amb algú») s'hi subscriuen. Ids robustos (`crypto.randomUUID`). Test de 10 usuaris seguits des de cada punt d'entrada. Detall a `docs/ERRORS-1.9.md`. |
| **2 · L'Elefant** | **Segon disseny, a petició de l'Oriol:** un elefantet petit, rodó i discret (SVG propi, trompa articulada) que viu **sempre a baix a la dreta** com una icona quieta de 56 px; no parla mai sol i dins dels jocs ni hi és: **surt pel costat dret només quan et veu encallat** i pregunta «Vols una pista?». **Sistema de pistes de 3 nivells als 17 jocs** (orientació → assenyala amb la trompa i un anell → desvela i explica), mai com a càstig. Presència configurable (Molt present · Normal · **Discret** per defecte · Apagat). Fora de l'Espai del Cuidador i de la benvinguda. Vegeu `docs/ELEFANT.md`. |
| **3 · Domini propi** | `tools/aplica-domini.py` (idempotent, `--simula`, `--treu`), `404.html`, `.nojekyll`, `sitemap.xml`, `robots.txt`, canonical/OG/JSON-LD, `CNAME`, `security.txt`, `DOMINI` + `urlBase()` a `config.js`. Guia per a principiants a `docs/DOMINI.md` (IP de GitHub Pages verificades). |
| **4 · Estabilització de la 1.8** | Suites de la 1.8 re-executades sobre el codi nou (resultats al final). |
| **5 · Castellà** | Idioma complet (secció «Castellà» més avall). El diccionari es descarrega només quan algú tria el castellà (l'arrencada en català no el paga). |
| **6 · Còpia de seguretat** | Recordatori amable (més visible per a Cuidador/Residència), «Espai utilitzat», importació segura (esquema, mida, resum, combinar o substituir, còpia automàtica prèvia, desfer, rollback si no hi ha espai), `navigator.storage.persist()`. |
| **7 · Pilot** | `docs/PILOT.md` (protocol, SUS ca/es, consentiment model, tauletes, mètriques, llista de comprovació) i **mode pilot** a l'app (codis P01…, sense fotos ni demo, versió i data visibles, mesura del temps fins al primer joc, escala SUS, exportació JSON+CSV). |
| **8 · Seguretat** | Revisió d'`innerHTML`, fotos i colors d'entrada hostil (`fotoSegura`, `colorSegur`), importació com a entrada hostil, `rel="noopener noreferrer"`, CSP, neteja de codi mort. Vegeu `docs/SEGURETAT.md`. |

## Decisions preses (ambigües o costoses de desfer)
1. **Elefant redissenyat (v1.9, segona versió):** la primera versió era gran i present a tot arreu; l'Oriol la va descartar. La definitiva és petita, fixa a baix a la dreta i discreta (vegeu Fase 2).
2. **Una sola instància de l'Elefant** (un únic bucle d'animació, 20–30 fps, aturat amb la pestanya oculta) que surt i entra pel costat dret als jocs.
3. **Pistes a «Jugar amb algú»:** permeses en mode **Junts**; desactivades en el **Duel** (serien trampa) i en les partides natives de 2 jugadors. Es pot revisar.
4. **Fotos a localStorage, comprimides** (en lloc d'IndexedDB): les fotos ja es redueixen a l'alta; l'«Espai utilitzat» avisa quan s'acaba. La migració a IndexedDB queda al *roadmap*.
5. **`unsafe-inline` a la CSP**, perquè l'arquitectura fa servir `onclick` en línia (regla del projecte). Documentat a `docs/SEGURETAT.md`.
6. **Nom de la mascota:** «L'Elefant» per defecte; 5 propostes a `docs/ELEFANT.md`. L'Oriol decidirà.
7. **Codi de pilot** per defecte `MENTA-PILOT` (a `config.js`): cal canviar-lo abans de repartir l'app.
8. **Els dies sense dades de pistes (`pistes`)** s'afegeixen a la partida com a camp nou; no canvia res a les dades antigues (no cal pujar `SCHEMA`).

## Castellà
- Selector a la **benvinguda** i a **Configuració → Idioma**; tota l'app (menús, jocs, tutorials, Cuidador, Residència, PDF, veu i diàlegs de l'Elefant) i els **bancs de contingut propis** (Tertúlia, Refranys, Endevina la paraula, Sopa, Digues paraules, Memory): **no són traduccions literals** sinó contingut castellà (p. ex. refranys castellans).
- Bingo en castellà: números cantats («veintiuno», «cuarenta y siete»…) i cants propis.
- Motor `app/js/i18n.js` (diccionari + patrons + regles); en tornar al català tot queda **exactament** com abans (provat).
- Comprovat: el recull de textos en mode castellà no deixa cap text català (`tests/i18n/catala_restant.py`: 0 de ~2.400).
- **Limitacions:** la **web pública i les pàgines legals** (`index.html` de l'arrel, `legal/`) segueixen **només en català**; el contingut cultural (cants, refranys, preguntes) i els textos s'han de **validar amb un parlant natiu / persones grans**; els PDF generats usen els textos de l'app (no hi ha plantilla legal en castellà).

## Resultats de les proves (final de la 1.9)
Suites en verd: viatge 1.8, parella, Bingo, onboarding, regles dels jocs, smoke del Cuidador, PWA, contrast WCAG, usuaris, Elefant, pistes, còpia de seguretat, pilot, domini, CSP (0 violacions), castellà i la prova general `test_menta.py`.
- **Auditoria de botons** (5 resolucions × 4 mides de lletra × clar/fosc, en català i en castellà): 0 incidències, un cop corregits els 5 problemes que va trobar (barra del joc i ajustos ràpids a 360 px amb lletra gegant, botons del Bingo, paraules llargues en castellà, Elefant en transició).
- **Rendiment** (`docs/RENDIMENT-1.9.md`): JS inicial 403 KB (< 450), CSS 149 KB, càrrega 135 ms (CPU normal) / ≈ 790 ms (CPU ×4), interacció 33 ms, 60 fps. Dins del pressupost.
- **No fet:** Lighthouse (no instal·lat en aquest entorn; cal passar-lo des de Chrome); proves amb mòbil/tauleta reals i persones grans (les ha de fer l'Oriol).
- **Pendent menor:** regles CSS orfes de l'Elefant antic a `estils.css` (inofensives; vegeu `docs/SEGURETAT.md`).

## Què ha de fer l'Oriol
1. **Triar el nom definitiu de la mascota** (`ELEFANT_NOM` a `config.js`) i mirar la galeria `app/elefant-demo.html` (estats, trompa assenyalant, vestuari, silueta a 48 px).
2. **Comprar el domini i posar els DNS** (A/AAAA/CNAME a GitHub Pages) i executar `python tools/aplica-domini.py elmeudomini.cat` → tot a `docs/DOMINI.md`. Fer-ho **abans** de la prova pilot.
3. Crear el **correu del projecte** (`hola@…`, reenviament gratuït) i omplir `CONTACTE.email` a `config.js`.
4. Canviar `CODI_PILOT` a `config.js`.
5. **Revisar el consentiment informat amb un professional** (jurista / delegat de protecció de dades de la UPC) abans d'usar-lo amb dades de salut (`docs/PILOT.md` §6).
6. **Provar en un mòbil i una tauleta reals** i amb persones grans (guió a `docs/PILOT.md`).
7. Revisar els cants del Bingo (català i castellà) i el contingut castellà amb persones grans.
