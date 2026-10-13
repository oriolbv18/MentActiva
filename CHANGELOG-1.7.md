# MentA 1.7 · Canvis, decisions i pendents

Base: v1.6 (commit «base v1.6»). Les carpetes 1.3–1.6 no s'han tocat. Cada fase té el seu commit a `git log`.

## Resum en una frase
La 1.7 deixa de semblar un prototip: té **identitat pròpia** (càlida, tipografia pròpia, mode fosc de debò), una **pantalla d'inici que respon «què faig ara?»**, un **progrés que s'entén i es pot exportar**, **jocs amb final comú i dificultat adaptativa**, **zero funcions falses** i tot el necessari per **publicar-la i provar-la** (PWA, privadesa, avís legal i feedback integrat).

---
## Fase 0 · Auditoria
* `docs/AUDITORIA-1.6.md`: mapa de pantalles, funcions que enganyaven, problemes d'accessibilitat i de rendiment, amb xifres reals de contrast.

## Fase 1 · Identitat visual i sistema de disseny
**Què canvia i per què**
* Nou fons neutre càlid (crema) i superfícies blanques; el verd només per a marca/acció; ambre per a la crida a l'acció (*Jugar ara*) i les celebracions. S'acaba el «tot verd».
* **Tokens** (`:root`): marca, accions, semàntics, superfícies, text, vores, dominis, espaiat 4/8, radis, ombres, escala tipogràfica. Els 183 colors «cuinats» del CSS s'han substituït per tokens.
* **Mode fosc** gris càlid (no verd) + **Automàtic** (segueix el dispositiu) + **alt contrast** (opcional i automàtic amb `prefers-contrast`).
* **Tipografia local** (sense CDN): *Atkinson Hyperlegible Next* (cos) + *Lexend* (títols), `woff2` variable amb `font-display: swap`; base mínima 17 px; la mida de lletra Normal/Gran/Extra gran/Gegant continua funcionant.
* **Components unificats** (botons, targetes, modals, toasts, interruptors, selector segmentat, pestanyes, xips, barres de progrés, estats buits, esquelets) → `docs/DISSENY.md`.
* **Logo transparent** a tota la marca, versió per a fons fosc que es canvia sola, icones PWA noves (normal + *maskable*), `favicon.svg`, `apple-touch-icon` i imatge social 1200×630.
* **Contrast verificat per script** (`tests/contrast.py`): tots els parells compleixen AA i el text principal AAA, en clar, fosc, alt contrast i fosc+alt contrast.
* Una icona SVG **pròpia per a cada joc** (el Dòmino i les Dames ja no la comparteixen).

## Fase 2 · Experiència d'usuari i navegació
* **Inici nou:** una targeta principal amb un sol botó gran (*Jugar ara* → joc recomanat), la ratxa i el pla d'avui. Fora la salutació, el suggeriment i la ratxa repetits.
* **Botó enrere del navegador/mòbil** funciona (hash `#/pantalla`, compatible amb `file://`); sortir d'un joc a mig fer demana confirmació.
* **Benvinguda** de 6 a 4 passos, es pot saltar, es repeteix des de Configuració i inclou una **mini-demo del Memory** («ho he fet bé» en menys d'un minut).
* **Estats buits amables** a totes les pantalles, errors de `localStorage` explicats en llenguatge humà.
* **Usuaris:** avatar (icona o foto) i color; confirmació amb explicació abans d'eliminar.
* **Modals accessibles:** focus atrapat i retornat, `aria-modal`, `Escape`, fons inert; `aria-current` a la navegació; *skip link*.
* L'elefant viu a la targeta de l'inici (ja no tapa el contingut) i no apareix dins dels jocs.
* **Tractament «tu»** i guia de textos a `docs/TEXTOS.md`.

## Fase 4 · Estadístiques i progrés
* **Model de sessions** (`historial`): `{joc, domini, data, ts, durada, pct, puntuacio, encerts, errors, nivell, mode}`. Migració automàtica de les partides de la v1.6 (sense durada) i `mentA_schema = 2`.
* **Progrés en 5 pestanyes:** Resum (frase en llenguatge humà, setmana vs. anterior, ratxa actual i màxima, 2 gràfics), Dominis (radar + evolució a 4/12 setmanes + àrea forta/a reforçar amb jocs recomanats), Jocs (millor puntuació, mitjana, tendència ↑↓=, temps total, nivell), Calendari (mapa de calor de 6 mesos + calendari mensual que **comença en dilluns**), Salut (xec, ànim, correlació **sense causalitat**, mini-test).
* **Gràfics SVG propis i accessibles** (títol, descripció, taula alternativa, valors al toc).
* **Medalles** repensades: 5 categories, progrés cap a la següent, animació en guanyar-ne una. **Ratxa trencada:** missatge amable i opció de *recuperar un dia* (1 cada 14 dies).
* **Informe en PDF** amb logo, gràfics, resum per àrees i avís legal; `jsPDF` local (carregat sota demanda); alternativa d'impressió si falla.
* **Exportar/importar còpia de seguretat (JSON)** amb validació i confirmació, i **exportació CSV** de partides.
* **Mini-test de memòria** amb textos prudents (no és un diagnòstic) abans i després del resultat, comparació amb l'últim intent.

## Fase 3 · Jocs
* **Pantalla final comuna:** resultat, estrelles, durada, millora respecte a l'última vegada, rècord personal, *Tornar a jugar*, *Següent joc recomanat*, *Veure progrés*, repàs d'errors.
* **Capçalera comuna:** sortir, ajuda («?» amb el tutorial a qualsevol moment), **pausa real** (atura temporitzadors i cronòmetres), so. Pausa automàtica si canvies de pestanya.
* **Dificultat adaptativa (recomanada):** puja/baixa de nivell segons resultats i temps, ho explica amb una frase i guarda l'historial per joc. Manual, si es prefereix.
* **Puntuació honesta:** cada joc calcula un resultat real (Dames/Dòmino: victòria 100 %, taules 50 %…; Span: dígits assolits; Fluïdesa: objectiu de 10 paraules).
* **Contingut ampliat:** Tertúlia 54 → 150 preguntes (dues respostes dubtoses corregides), Refranys 26 → 73 (només refranys verificats), Paraules 20 → 68 amb accents correctes, Seqüències 7 → 14 patrons amb la regla explicada, Fluïdesa 5 → 15 categories i validació bàsica, Què falta 16 → 32 objectes. **Sense repeticions seguides** (`mentA_vistos_*`).
* **Regles documentades al tutorial** (Dames, Dòmino). L'ordinador difícil de Dòmino ara recorda els números que no has pogut posar.
* **Accessibilitat de joc:** Sopa de lletres amb teclat, la Seqüència té símbol a cada color (no només color), `aria-live` al feedback.

## Fase 5 · Configuració
Reorganitzada en seccions: **Perfil · Aspecte · So i veu · Joc · Recordatoris · Idioma · Dades i privadesa · Ajuda i comentaris · Mode demostració**. Vista prèvia de la mida de lletra en viu; velocitat i veu seleccionable; durada de sessió i hora preferida; recordatori per jugar (+ notificacions **només si l'usuari ho demana**, amb la limitació explicada).
**Mode demostració:** carrega 5 mesos d'activitat d'exemple en un perfil separat, clarament etiquetat; se'n surt amb un toc i no toca les dades reals.

## Fase 6 · Família, sense enganyar
* **Eliminats:** codi de sala, videotrucada (obria una sala pública de Jitsi), enllaços de xarxes socials inventats, afirmació «juga amb la família encara que estigueu lluny».
* **Reanomenats honestament:** *Àlbum de records*, *Diari familiar* (abans «missatges»), *Aniversaris i quedades*.
* **Nou: Compartir el progrés** (Web Share amb targeta-imatge i text; si no n'hi ha, es copia o es descarrega) i *Resum per a la família*.
* Capes de dades separades de la UI i full de ruta per a un backend a `docs/ROADMAP.md`.

## Fase 7 · Accessibilitat
Teclat a tota l'app, focus visible, skip link, gestió de focus, `aria-*`, targets ≥ 48 px, cap informació només per color, `prefers-reduced-motion`/`prefers-contrast`, lectura en veu alta configurable. `axe-core`: **cap violació serious/critical** a les pantalles principals.

## Fase 8 · Producte llest per publicar
* **PWA real:** `sw.js` (precache + cache-first versionada `menta-1.7.0`, neteja de caches antigues), pàgina offline, bàner d'instal·lació (amb instruccions per a iOS), avís i botó d'**actualització**; només es registra amb `http(s)` (amb `file://` funciona igual). Manifest amb `maskable`, `theme_color`, `shortcuts` («Jugar», «Estadístiques»).
* **Meta/SEO/social**, `theme-color` clar i fosc, `color-scheme`.
* **Pàgina d'aterratge nova** (`index.html` de l'arrel) amb la mateixa identitat: proposta de valor, mockups reals, 3 passos, característiques, per a qui, preguntes freqüents, privadesa.
* **Legal i salut:** pantalles *Privadesa* i *Condicions i avís important*; avís de no-diagnòstic al mini-test (abans i després), a l'informe PDF i al peu del Progrés; revisats els textos («estimula», «exercita», «ajuda a mantenir-se actiu»).
* **Feedback integrat:** formulari amb cares, mini-enquesta (NPS/SUS) després de la 3a sessió, registre d'ús anònim **opt-in** exportable, `FEEDBACK_URL`/`FEEDBACK_EMAIL` a `app/js/config.js`, registre local dels últims 50 errors + *Copiar informe d'error*.
* jsPDF i tipografies **en local** (cap CDN). `LLEGEIX-ME.md` amb els passos per publicar-la.

---
## Decisions preses (per si no hi estàs d'acord)
1. **Tractament «tu»** a tota l'app (vosaltres només als avisos adreçats a la família).
2. **Idioma:** s'ha **retirat el selector ca/es/en** (només canviava la veu i enganyava). La interfície és en català; la traducció real queda per al `ROADMAP.md`.
3. **Videotrucada i codi de sala:** eliminats (calia servidor). No s'han substituït per res fals.
4. **Contactes:** no hi ha cap correu ni xarxa social real a l'app; cal que posis els teus a `config.js` si vols.
5. **Setmana en dilluns** a tot el calendari i els gràfics.
6. **Elefant:** es queda a l'inici; dins dels jocs la capçalera comuna ocupa el seu lloc.
7. **Alerta «el teu rendiment ha baixat… metge»:** eliminada (inferència mèdica a partir de dades de joc sorolloses).
8. **«Informe mèdic»** passa a *Informe de progrés per compartir*, amb avís.
9. **Mini-test:** s'ha mantingut però reformulat com a joc orientatiu; no s'esmenta MMSE/MoCA.
10. Les claus `mentA_*` existents no s'han canviat; `mentA_codiSala` ja no s'usa. Claus noves: `mentA_schema`, `mentA_errors`, `mentA_vistos_*`, `mentA_us`, `mentA_feedback`, `mentA_enquesta*`, `mentA_demo_prev`, `mentA_instal_amagat`, `mentA_avis_dia`.

## Què NO s'ha pogut fer / queda per després
* **Joc nou de reminiscència / «reconeix la cara o el so»** (opcional): no s'ha fet; hi ha l'idea al `ROADMAP.md`.
* **Traducció a castellà/anglès** de debò.
* **Lighthouse (mòbil, amb un servidor que comprimeix com Netlify/GitHub Pages):** Rendiment 95–97, Accessibilitat 100, Bones pràctiques 100, SEO 100. Amb un servidor sense compressió el rendiment baixa a ~75–85 (el CSS pesa 97 kB sense comprimir i 20 kB comprimit). Lighthouse 12 ja no té categoria «PWA»: es comprova amb `tests/test_pwa.py` (service worker, precache de 45 recursos, funciona sense xarxa, manifest i icones).
* **Prova en dispositius reals:** tot s'ha provat amb Chromium (Playwright). Falta Safari/iOS i un Android real (veure la llista del resum final).
* **Contingut mèdic/clínic:** no se n'ha afegit; el mini-test no s'ha validat clínicament i així es diu.
* Els bancs de contingut (refranys, preguntes) els hauria de revisar una persona catalanoparlant abans de la presentació final.

## Proves automàtiques (`tests/`)
* `test_menta.py`: cap error de JS a cap pantalla (5 resolucions × clar/fosc × mida Normal i Gegant), cap scroll horitzontal, **cap joc fa scroll** (individual i 2 jugadors, 4 mides de lletra, 5 resolucions), recorregut complet (benvinguda → joc → final → progrés → configuració → exportar/importar → esborrar), **migració de dades de la v1.6** i `axe-core` (cap violació *serious/critical* a les pantalles, modals i jocs provats).
* `contrast.py`: contrast WCAG dels 4 temes. `test_pwa.py`: PWA i mode sense xarxa. `captures*.py`: captures a `docs/captures/`.
