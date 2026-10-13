# MentA v1.9.3 · Llegeix-me

**Novetat de la 1.9.3 (només la web, «aparador lliure i moviment amb sentit»):** l'aparador de jocs ja no és un *marquee* que es mou sol: és **una fila que es controla** (roda, arrossegar amb el ratolí, fletxes, teclat, dit) i el hover només eleva la carta. A més, set moviments amb propòsit (fets escalonats, compte del «17 jocs», mòbil viu amb direcció, premuda i subratllat, transició entre pàgines, l'Elefant reacciona al toc), la salutació del hero segons l'hora i un «Torna a dalt». Vegeu `CHANGELOG-1.9.3.md`, `docs/web-premium/MOVIMENT-1.9.3.md`, `docs/web-premium/BASE-1.9.2.md` i `docs/MESURA-US.md`.

**Novetat de la 1.9.2 (només la web, «web premium»):** la web explica **«Un dia amb MentA»**: el fons va d'alba a tarda i a vespre mentre un **mòbil viu** (sticky) canvia de pantalla (Inici → joc → «Jugar amb algú» → Espai del cuidador); **vídeo real de l'app** al hero amb l'Elefant assegut al mòbil (els ulls segueixen el cursor i saluda una vegada); aparador de 17 jocs en dues files; **bento** del cuidador amb micro-visuals; capçalera «píndola» translúcida; molls (`web/mol.js`); canvi clar/fosc amb revelació circular; correu i Instagram reals (`menta.app.upc@gmail.com`, `@menta.upc`). L'app només canvia de versió i de contacte. Vegeu `CHANGELOG-1.9.2.md`, **`docs/WEB-DISSENY-PREMIUM.md`** (decisions lligades a les skills de `skills-main`), `docs/ACTIUS.md` i `docs/WEB-AFIRMACIONS.md`.

**Novetat de la 1.9.1 (només la web d'aterratge):** web nova i ordenada (marges, ritme i tokens únics), hero amb l'Elefant, menú mòbil, **demo interactiva** (`app/index.html?demo=1`), galeria de jocs amb filtres, secció de residències, contacte honest i pàgines legals/404 amb la mateixa plantilla. Vegeu `CHANGELOG-1.9.1.md`, `docs/WEB-DISSENY.md` i `docs/WEB-AFIRMACIONS.md`.

**Novetat de la 1.9:** l'**Elefant** (un animalet petit, a baix a la dreta, que et dona **pistes** als 17 jocs), **castellà** complet, **còpia de seguretat** segura, **mode pilot**, correcció de l'error dels usuaris, guia de **domini propi** (`docs/DOMINI.md`) i seguretat revisada. Vegeu `CHANGELOG-1.9.md`.

**Base de la 1.8:** una sola app amb dues capes. **Persona** (un botó gran, **JUGAR**), **Espai del cuidador** (candau, amb PIN: resum, evolució, notes, pla, informes) i **mode Residència** (una tauleta per a diversos residents). Per provar-ho amb dades: Configuració → *Mode demostració* (8 residents fictícis). Vegeu `CHANGELOG-1.8.md` i `docs/CUIDADOR.md`.

## Com obrir l'app
* **Al teu ordinador:** fes doble clic a `app/index.html` (funciona sense internet). La pàgina web de presentació és `index.html` (a l'arrel).
* **Instal·lar-la com a app (PWA):** només funciona quan l'app està publicada amb un enllaç `https://…` (veure més avall).
  * *Android / Chrome:* obre l'enllaç → botó **Instal·lar** (o menú ⋮ → «Instal·la l'app»).
  * *iPhone / iPad (Safari):* botó **Comparteix** → **Afegeix a la pantalla d'inici**.
  * *Ordinador (Chrome / Edge):* icona d'instal·lació a la barra d'adreces.

## Com publicar-la gratis perquè els provadors hi entrin amb un enllaç
**Opció A · Netlify Drop (la més fàcil, 2 minuts)**
1. Obre <https://app.netlify.com/drop> i crea un compte gratuït.
2. Arrossega la carpeta **`Menta_Web.1.9.1`** (la sencera, amb `index.html` i `app/` a dins) sobre la pàgina.
3. Netlify et dona un enllaç tipus `https://nom-aleatori.netlify.app`. Pots canviar-ne el nom a *Site settings → Change site name*.
4. L'enllaç de l'app és `…/app/` i la pàgina de presentació és l'arrel `…/`.

**Opció B · GitHub Pages**
1. Crea un repositori nou a github.com (p. ex. `menta`) i puja-hi el contingut de `Menta_Web.1.9.1` (amb *Add file → Upload files*).
2. *Settings → Pages → Branch: main / (root) → Save*.
3. Al cap d'1–2 minuts: `https://EL-TEU-USUARI.github.io/menta/`.

> Quan publiquis una versió nova, canvia `CACHE = 'menta-1.9.1'` a `app/sw.js` perquè els mòbils rebin l'actualització (veuran el bàner «Hi ha una versió nova»).

## Com recollir el feedback
* **Dins l'app:** Configuració → *Envia feedback* (cares + dues preguntes + contacte opcional). Per defecte, el provador comparteix el text (WhatsApp, correu…) o se li copia.
* **Perquè t'arribi sol:** crea un formulari a Formspree (<https://formspree.io>) o un Google Forms amb un *webhook* i posa la seva URL a `app/js/config.js` → `FEEDBACK_URL`. Si no, posa el teu correu a `FEEDBACK_EMAIL`.
* **Mini-enquesta** (3 preguntes tipus NPS/SUS): surt sola, un cop, després de la 3a partida. És omissible.
* **Ús anònim (opcional):** el provador pot activar-lo a Configuració → Dades i privadesa, i exportar un fitxer `.json` amb jocs jugats, durades i errors (sense dades personals) per enviar-te'l.
* **Errors:** Configuració → *Copiar informe d'error* (últims errors de JavaScript, navegador i pantalla).

## Per presentar amb dades plenes
Configuració → **Mode demostració**: carrega 5 mesos d'activitat d'exemple (clarament marcats). Es desactiva amb el mateix interruptor i no toca les teves dades reals.

## Proves automàtiques
Fora de l'app (no formen part del que es publica): carpeta `tests/`.
```
pip install playwright pillow && python -m playwright install chromium
cd tests && npm install        # només per a axe-core
python tests/test_menta.py          # totes les proves (≈ 10–15 min)
python tests/test_menta.py --rapid  # només mòbil
python tests/contrast.py            # contrast WCAG dels temes
python tests/test_pwa.py            # service worker i mode sense xarxa
python tests/serveix.py 8765        # servidor local amb gzip (per mesurar amb Lighthouse)
python tests/captures.py --demo     # captures a docs/captures/
python tests/captures19.py          # captures 1.8 (Persona, Cuidador, Residència) a docs/captures-1.9/
python tests/test_viatge18.py       # recorregut complet: 3 rols, sessió guiada, PIN, PDF, exportacions, residència
python tests/smoke_cuidador.py      # totes les pestanyes del cuidador amb 8 residents de demo
python tests/jocs/test_jocs.py --tot --n 100   # 100 partides automàtiques per joc (≈ 30–60 min)
python tests/jocs/test_regles.py    # regles (dames, dòmino, sudoku…) i contingut
```

## Estructura
```
Menta_Web.1.9.2/
  index.html              pàgina de presentació
  app/                    l'app (index.html, sw.js, manifest, css/, js/, fonts/, img/, vendor/)
  docs/                   ERRORS-1.8, AUDITORIA-UX-1.8, PROVA-USUARIS, CUIDADOR, ROADMAP, TEXTOS, DISSENY, captures-1.8/
  tests/                  proves (Playwright, axe-core, contrast)
  CHANGELOG-1.9.md · CHANGELOG-1.8.md · LLEGEIX-ME.md
```


## Què ha de fer l'Oriol (no ho pot fer Claude)
1. **Comptes i contacte reals.** Ja hi són el correu (`menta.app.upc@gmail.com`) i l'Instagram (`@menta.upc`). Queden, si es volen, les altres xarxes, els noms de l'equip i un formulari extern. Es omplen a `CONTACTE` a `app/js/config.js` (`email`, `instagram`, `facebook`, `youtube`, `tiktok`, `linkedin`, `whatsapp`, `web`, `formulari`, `titular`, `equip`). La web i «Sobre MentA» només mostren els camps omplerts i vàlids. Els valors antics de la 1.6 (`wa.me/34600000000`, `@menta_app`, `info@menta.app`, `menta.app`) **no eren verificables** i s'han tret.
2. **Domini (opcional).** Si en vol, editar `sitemap.xml` (substituir `EL-TEU-DOMINI`) i posar-lo a `CONTACTE.web` (activa el `canonical`).
3. **Formulari de contacte.** Si vol que arribi sol: crear un formulari a Formspree i posar la URL a `CONTACTE.formulari`.
4. **Provar en dispositius reals** (mòbil, tauleta) i **amb persones grans** (guió a `docs/PROVA-USUARIS.md`).
5. **Revisar els cants del bingo** (`app/js/bingo-cants.js`) amb persones grans.
6. **Revisió legal** de `legal/*.html` abans de fer-ho servir amb residències (RGPD, dades de salut).
7. **Publicar** (Netlify Drop o GitHub Pages) i canviar `CACHE` a `app/sw.js` en cada versió.
8. Si es canvien les captures o el catàleg: `python tools/captures-web.py` i `python tools/genera-web.py`.

## Proves noves de la 1.8
```
python tests/test_parella.py                    # Jugar amb algú: tocs, llavor, duels, junts
python tests/bingo/test_bingo.py                # bingo: cartrons, bombo, cantades, rivals, 2 jugadors
python tests/onboarding/test_onboarding.py      # onboarding: una sola vegada, passos, scroll
python tests/layout/auditoria-botons.py         # auditoria de botons i caselles (~40 min; --rapid per a una versió curta)
```

## Proves noves de la 1.9
```
python tests/usuaris/test_usuaris.py     # error de les llistes d'usuaris
python tests/elefant/test_elefant.py     # Elefant: lloc, presència, ofertes
python tests/pistes/test_pistes.py       # pistes als 17 jocs
python tests/copia/test_copia.py         # còpia de seguretat i importació hostil
python tests/pilot/test_pilot.py         # mode pilot
python tests/domini/test_domini.py       # script de domini
python tests/seguretat/test_csp.py       # CSP sense violacions
python tests/i18n/test_i18n.py           # castellà
python tests/rendiment/mesura.py --escriu  # pressupost de rendiment
python tests/layout/auditoria-botons.py  # 0 incidències (MENTA_IDIOMA=es per al castellà)
```

## La web d'aterratge (1.9.2): com treballar-hi
```
python tools/audit-web.py --sortida docs/web-premium/audit   # a més: LCP, tasques llargues en fer scroll, pes de la pàgina, imatges trencades
python tests/web/test_aparador_control.py              # aparador: 17 jocs en < 10 s, hover sense efecte, teclat, tàctil, CLS (MENTA_ARREL=<ruta> per provar una altra versió)
python tests/web/test_moviment_reduit.py               # prefers-reduced-motion: cap animació que es mogui
python tests/web/test_sense_js.py                      # sense JavaScript: pàgina completa i legible
python tests/web/test_premium.py                       # mòbil viu, vídeo, ulls de l'Elefant, bento, rendiment, break-ui (vídeo que no carrega, Save-Data)
python tools/grava-video.py                            # vídeo real del hero (+ poster) amb Playwright i ffmpeg (docs/ACTIUS.md)
python tools/grava-scroll.py                           # recorregut de scroll de 20-30 s: docs/web-premium-scroll.webm
python tools/vista-web.py --sortida docs/web-premium/x # captures de cada secció per revisar a ull
python tools/genera-doc-premium.py                     # regenera docs/WEB-DISSENY-PREMIUM.md (línies reals)
python tools/audit-web.py --sortida docs/web-despres   # marges, ritme, àncores, graelles, tàctil, imatges, CLS (9 amplades × clar/fosc × zoom 100 % i 200 %)
python tests/web/test_web.py                           # menú, galeria, formulari, tema, demo sense efectes, moviment reduït, sense JS, CSP
python tests/web/test_accessibilitat.py                # axe-core WCAG 2.1 AA, zoom, teclat, formulari amb valors llargs
python tools/contrast-web.py                           # contrast dels tokens (clar, fosc, alt contrast)
python tools/captures-web.py                           # regenera TOTES les captures de la web i web/jocs.js (cal després: python tools/web-shell.py)
python tools/elefant-svg.py                            # exporta l'Elefant de l'app com a SVG per a la web (repòs, saluda i sense pupil·les)
python tools/social-image.py                           # imatge social 1200×630
python tools/web-shell.py                              # injecta capçalera, menú, peu, icones i galeria a totes les pàgines (UNA plantilla)
python tools/genera-web.py                             # regenera legal/*.html i 404.html (després web-shell.py)
python tools/aplica-contacte.py                        # adapta la CSP al formulari extern de CONTACTE.formulari (vegeu docs/CONTACTE.md)
python tools/aplica-domini.py elmeudomini.cat          # domini propi: canonical, sitemap, JSON-LD, CNAME… (vegeu docs/DOMINI.md)
```
La web es veu en local obrint `index.html` (funciona amb `file://`). Per mesurar amb Lighthouse: `python tests/serveix.py 8766 .` i `npx lighthouse http://127.0.0.1:8766/index.html --form-factor=mobile`.
