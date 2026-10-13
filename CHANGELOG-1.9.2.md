# MentA · Registre de canvis · v1.9.2 «Un dia amb MentA» (web premium)

Base: la v1.9.1 (`Menta_Web.1.9.1`, que no s'ha tocat). **Només canvia la web** (`index.html`, `web/`, `legal/`, `404.html`, `img/web/`) i les seves eines i proves. Canvis a l'app: `VERSIO = '1.9.2'` i el `CONTACTE` real a `app/js/config.js`; la imatge social `app/img/social-1200x630.png`. La 1.9.2 **no repara res: eleva** (el 1.9.1 era correcte però pla).

## Què veurà de nou
- **Un dia amb MentA.** La pàgina és un dia: el fons passa d'**Alba** (matí càlid) a **Paper** (tarda) i a **Bosc nocturn** (vespre). Els mòbils diuen *Bon dia / Bona tarda / Bona nit* de debò (captures de l'app fetes a aquelles hores, sense editar-ne cap).
- **Mòbil viu.** Un mòbil gran fet amb CSS (bisell, illa dinàmica, reflex) que es queda fix mentre es baixa i canvia de pantalla amb el bloc que es llegeix: *Inici → Troba les parelles → Jugar amb algú → Espai del cuidador*. Sense *scroll-jacking*; a mòbil cada bloc porta el seu mòbil en línia (272 px).
- **Hero amb vida.** Vídeo real de l'app dins el mòbil; l'**Elefant assegut a sobre del marc** (ja no tapa la pantalla): els ulls segueixen el cursor i saluda una sola vegada. Titular enorme (uns 90 px a l'escriptori), entrada orquestrada de menys d'un segon.
- **Capçalera «píndola»** translúcida i flotant que es compacta en fer scroll; botó «Prova l'app» sempre a la vista.
- **Aparador de 17 jocs:** el número gegant i dues files de mòbils en sentits oposats (aturables), filtres per àrea, i dues peces destacades de format diferent (Bingo, «Jugar amb algú»).
- **Bento del cuidador** (vespre): semàfor, evolució, PIN, informes i consentiment, amb micro-visuals que s'encenen una vegada («Dades fictícies» ben visible), i la peça ampla de residències.
- **Moviment amb molls** (`web/mol.js`, 1 KB): inclinació del mòbil, ulls, imant dels botons; canvi clar/fosc amb **revelació circular**; res més s'anima en carregar.
- **Contacte real:** `menta.app.upc@gmail.com` i Instagram `@menta.upc` (formulari per `mailto:`, a «Parlem-ne» i al peu).
- **Captures noves a 3×**, recapturades amb estats representatius (una parella trobada al *memory*, bingo en marxa…).

## Corregit (de la 1.9.1)
D5: el botó «Prova-la aquí» ja no es parteix en tres línies (és `nowrap`, centrat a baix del mòbil). D4: l'Elefant ja no tapa els xips del mòbil. D3: la mateixa captura ja no es repeteix tres vegades (el hero té vídeo i el mòbil viu quatre pantalles diferents; només la portada de la demo reutilitza la d'inici). D6: els mòbils de «Com funciona» són grans (272 px). D9: l'auditoria ara falla si una imatge surt trencada.

## Proves i mesures
- **Auditoria de marges i maquetat** (`tools/audit-web.py`, 9 amplades de 320 a 2560 px × clar/fosc × zoom 100 % i 200 %, 30 combinacions): **0 incidències** (cap desbordament, gutters iguals —20 px al mòbil, 120 px a 1440—, contingut ≤ 1200 px, àncores ≥ 16 px sota la capçalera, cap fila òrfena, objectius ≥ 44 px, **cap imatge trencada**, CLS màxim 0,014, **0 tasques llargues** (> 50 ms) en fer scroll). A la 1.9.1 el mateix control en donava 0; abans de la 1.9.1, 448.
- **Proves de la web** (`tests/web/`): `test_web` (menú, aparador, formulari, tema, demo, moviment reduït, sense JS, CSP), `test_premium` (mòbil viu, vídeo, ulls, bento, rendiment, vídeo que no carrega, *Save-Data*), `test_accessibilitat` (axe-core WCAG 2.1 AA: **0 violacions** a la landing, la 404 i les legals, en clar i fosc, mòbil i escriptori; 320 px, 2560 px, zoom 200/300/400 %, lletra al 200 %, formulari amb valors llargs, alt contrast, xarxa tallada, teclat) i `test_domini_web`: **totes verdes**.
- **Contrast** (`tools/contrast-web.py`, per hora del dia, clar, fosc i alt contrast, amb el vidre compost sobre el fons real): **0 parells sota AA** (`docs/web-premium/CONTRAST.md`).
- **Regressió de l'app** (16 conjunts: viatge18, parella, bingo, onboarding, regles, cuidador, PWA, contrast, usuaris, Elefant, pistes, còpia, pilot, CSP, i18n i `test_menta`): **tots verds**, 0 errors de JS.
- **Lighthouse mòbil** (Chromium local, servidor amb gzip, 5 tandes): Accessibilitat **100**, Bones pràctiques **100**, SEO **100**, CLS **0**, pes **213 KB** comprimit sense el vídeo. **Rendiment: 74, 76, 81, 85 i 95 (mediana 81).** No arriba de manera estable al 90 del pla.
- **Rastres reals** (Playwright, sense Lighthouse): primera pintura a ≈ 150 ms; amb la CPU ×4 hi ha una sola tasca llarga (el primer maquetat, ≈ 250–340 ms) i res més per sobre dels 50 ms.
- **JS:** 21 KB (8 KB en gzip) + moll 1 KB; **vídeo del hero:** 454 KB (WebM) / 367 KB (MP4); poster 28 KB.


## Decisions preses (ambigües o cares de desfer)
1. **Demo.** En lloc de convertir el mateix mòbil sticky en un `iframe`, la demo és una secció pròpia just després de la seqüència (mateix marc, mateixa posició). Així l'`iframe` només existeix un cop a la pàgina i el que ja funcionava a la 1.9.1 (carrega en prémer, `?demo=1`, sense `localStorage` real) no es va trencar.
2. **Aparador en vespre.** Després de «Bona nit» la pàgina es queda en verd bosc fins al bento; així els mòbils clars de l'aparador brillen. El contacte i les preguntes tornen a Paper («l'endemà»).
3. **Ordre de les seccions.** Hero → fets → mòbil viu → demo → aparador → bento → enfocament → preguntes → contacte → tancament. «Residències» passa a ser una peça ampla del bento (no una secció a part); «Per a qui» i «Qui som» s'han integrat al mòbil viu i a «Parlem-ne».
4. **Elefant.** El mateix dibuix de l'app, sense redissenyar-lo. Per rendiment és un `<img>` i les pupil·les són dos punts HTML (el SVG en línia feia caure el Lighthouse); la salutació és un *crossfade* entre les poses de repòs i de trompa aixecada.
5. **Vídeo.** Playwright només grava a 1×: s'ha gravat a 540×1170 (el mòbil del hero mostra uns 270 px CSS) en lloc de fer-ho a 2×.
6. **Sense JS.** El mòbil sticky, el vídeo, el `content-visibility` i les animacions només existeixen amb JS; sense JS es veuen els blocs amb la seva captura en línia i tot el text.

## Notes honestes (el que no s'ajusta del tot al pla)
- **Lighthouse mòbil de rendiment:** 5 tandes locals: **74, 76, 81, 85 i 95** (mediana **81**), amb Accessibilitat, Bones pràctiques i SEO a 100 i CLS 0. L'objectiu era ≥ 90 i **no s'assoleix de manera estable**. He treballat el que era meu (contingut fora de pantalla no maquetat, inicialització en repòs, cap filtre/ombra costós al hero, cap lectura que forci maquetat abans de pintar, vídeo diferit) i el pes és de 213 KB, però la mateixa pàgina dona de 74 a 95 segons la tanda: Lighthouse simula una CPU ×4 sobre aquesta màquina i el primer maquetat (≈ 50 ms reals) cau en una sola tasca llarga. Als rastres reals no hi ha cap tasca llarga en fer scroll. Convindria mesurar-ho en un mòbil real o amb PageSpeed Insights un cop publicada.
- **Control de versions:** F1–F7 (sistema visual, hero, mòbil viu, bento, aparador, moviment i tancament) es van construir d'una tirada sobre els mateixos fitxers i queden en **un sol commit**; la resta de fases tenen el seu. Les captures i el vídeo (F8) van abans del codi perquè la web en depèn.
- **FLIP dels filtres:** substituït per una entrada escalonada amb WAAPI; amb files que es mouen soles no té sentit mesurar rectangles. Cap salt de maquetat.
- **`animation-timeline: view()`:** no s'ha fet servir. El canvi de pantalla del mòbil viu es fa amb `IntersectionObserver` + transicions, que és més simple, interrompible i va a tots els navegadors. La barra de progrés de lectura (`scroll()`) es va afegir i es va **retirar** a la crítica final («treu un accessori»).
- **Mini-joc de mostra a la pàgina i Elefant dormint al peu:** no s'han fet (eren opcionals; cap dels dos millorava el resultat).
- **Vídeo de 14 s** (el pla deia 8–10 s): el joc de parelles necessita unes quantes tocades; es pot retallar editant `tools/grava-video.py`.
- **Mòbil real:** no s'ha pogut provar en un mòbil físic (menú, mòbil viu amb el dit, demo, sensació dels molls).

## Pendent de l'Oriol
- [ ] **Provar la web en un mòbil real** (i amb algú gran): menú, mòbil viu, vídeo, demo. I fer el «test de la mare» (`docs/PROVA-WEB-5-SEGONS.md`).
- [ ] **Formulari extern** (Formspree/Google Forms) si vols que els missatges arribin sols; després `python tools/aplica-contacte.py`.
- [ ] **Altres xarxes** (si en vols) i **noms de l'equip** (`CONTACTE.equip`) per a «Parlem-ne».
- [ ] **Domini** quan arribi el Student Pack: `python tools/aplica-domini.py elmeudomini.cat` (genera el JSON-LD i el canonical).
- [ ] **Confirmar la frase del pilot** («Sense preus ni compromís: volem aprendre de com es fa servir de debò»).
- [ ] **Fotos o un clip curt reals** d'una persona gran amb l'app, **amb consentiment per escrit** (res no és tan premium com una prova real; cap foto de banc ni persones inventades).
- [ ] **Triar el nom d'exemple** (la web usa el que ja hi ha a l'app, «Josep», només dins de les captures).

## Pes del .zip
Sense `.git`, `node_modules` ni les captures històriques de versions anteriors. El vídeo del hero pesa 454 KB (WebM) i 367 KB (MP4).
