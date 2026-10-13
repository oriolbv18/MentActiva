# MentA · Registre de canvis · v1.9.1 «Una web que et fa confiança en 5 segons»

Base: la v1.9 (`Menta_Web.1.9`, que no s'ha tocat). Aquesta versió **només canvia la web d'aterratge** (`index.html`, `web/`, `legal/`, `404.html`, `img/web/`) i el seu material de proves/eines. L'app només té **un canvi petit i aïllat**: el mode demostració `?demo=1` (i `VERSIO = '1.9.1'`).

> Nota honesta sobre el control de versions: les fases 1–6 es van desar en **un sol *commit*** (`F1-F6 …`) en comptes d'un per fase, perquè la web es va reescriure d'una tirada i les fases comparteixen els mateixos fitxers. Les fases 7–12 sí que tenen un *commit* cadascuna.

## Què ha canviat (visualment)
- **Marges i ritme:** un sol sistema d'espaiat (tokens), un sol contenidor (≤ 1200 px, gutter igual a tota la web) i un sol padding vertical entre seccions. Cap marge escrit a mà.
- **Hero nou:** una promesa, un subtítol de 2 línies, una CTA primària i una de secundària, un mòbil gran amb la captura real i **l'Elefant** (el mateix de l'app, exportat com a SVG). L'estat «En fase de proves» és visible al hero.
- **Franja de confiança** amb sis fets verificables (veure `docs/WEB-AFIRMACIONS.md`).
- **Navegació mòbil de debò:** menú en fulla amb focus atrapat, Escape i `inert`; barra de CTA fixa que s'amaga al contacte; interruptor de tema clar/fosc; enllaç actiu segons la secció.
- **Demo interactiva:** «Prova-la aquí» carrega l'app de debò en un marc de mòbil (només en prémer), en mode demostració: **no es desa res** i el `localStorage` real no es toca.
- **Galeria de jocs** nova: captures recapturades amb el joc en marxa (més baixes, menys blanc), filtres per àrea i carrusel amb `scroll-snap`.
- **Secció de residències** pròpia (B2B) amb tres captures i un CTA que preselecciona el motiu del formulari.
- **Contacte honest:** si no hi ha correu ni formulari configurat, **no es mostra cap formulari** (targeta amable + feedback des de l'app); `tools/aplica-contacte.py` afegeix a la CSP l'origen del servei de formulari (mai `connect-src *`).
- **Treta la secció «Novetats de la versió»** (era un registre de canvis a la web pública) i afirmacions que no es podien demostrar.
- **Peu estructurat** en 4 columnes i **una sola plantilla** de capçalera/peu per a totes les pàgines (`tools/web-shell.py`): la landing, la 404 i les 4 pàgines legals ja comparteixen capçalera, peu, marges i ritme.
- **Imatge social 1200×630 nova** i **JSON-LD només amb domini real** (abans tenia `https://__DOMINI__/`, una URL no vàlida).

## Errors de marges i espaiat corregits (abans → després)
Mesurats amb `tools/audit-web.py` (9 amplades × clar/fosc × lletra normal/gegant). Detall a `docs/WEB-COMPARATIU.md`.

| # | Error | Abans | Després |
|---|---|---|---|
| M1 | Gutter lateral desigual i estret a l'escriptori | 21,6 px (320) → 27,5 px (1280–1440) | 20 px (mòbil) → uns 50 px (escriptori), **idèntic a totes les seccions** |
| M2 | El contenidor no limitava | 1529 px de contingut a 1920/2560 | **1200 px màxim** |
| M3 | Tot ~29 % massa gran | `h1` de 79 px; `rem` de 22 px | `h1` de 63 px màx.; `rem` de 16–18 px |
| M4 | Els àncores quedaven sota la capçalera | títol a −13 px (tapat) | **≥ 16 px sota la capçalera** a tots els enllaços i amples |
| M5 | Capçalera de 73–93 px | 73 → 93 px segons l'amplada | **64 px sempre** |
| M6 | Ritme vertical incoherent | valors escrits a mà | un sol `--seccio-y` |
| M7–M8 | Xip i `h2` enganxats; alineacions barrejades | sense `gap` | patró `.l-cap-seccio` + `gap` als blocs de dues columnes |
| M9 | Files òrfenes (3+1, 5+5+5+2) | 58 casos | **0** (l'auditoria falla si n'hi ha) |
| M10–M13 | Mòbils desalineats, botons desiguals, xips que salten, peu sense estructura | — | hero i botons amb graella, xips en una fila, peu en 4 columnes |

## Altres defectes (P1–P10)
Menú mòbil (P1) ✔ · contingut visible sense JS (P2) ✔ · captures grans i amb joc en marxa (P3) ✔ · «Novetats» fora (P4) ✔ · formulari sense canal ja no es mostra i la CSP s'adapta (P5) ✔ · Elefant al hero (P6) ✔ · franja de confiança honesta (P7) ✔ · JSON-LD vàlid (P8) ✔ · pàgines legals i 404 unificades (P9) ✔ · interruptor de tema i captures amb vora/ombra en fosc (P10) ✔.

## Resultats de les proves
Vegeu `docs/web-despres/INFORME.md` (auditoria), `docs/web-despres/CONTRAST.md` i `docs/web-despres/lighthouse-mobil.json`.
- **Auditoria de marges** (`tools/audit-web.py`, 9 amplades × clar/fosc × zoom 100 % i 200 %, 30 combinacions): **0 incidències** (abans, 448). Comparatiu a `docs/WEB-COMPARATIU.md`.
- **Proves** (`tests/web/test_web.py`, `tests/web/test_accessibilitat.py`): menú mòbil, filtres/carrusel, formulari, tema, barra de CTA, demo sense efectes sobre `localStorage`, moviment reduït, sense JS, CSP, axe-core (WCAG 2.1 AA) i *break-ui*.
- **Lighthouse mòbil** (Chromium, servidor local amb gzip): Rendiment 95–96 en les tandes bones (83–92 quan la màquina va carregada: la variació és del temps de bloqueig, no del disseny), **Accessibilitat 100, Bones pràctiques 100, SEO 100**, CLS 0.
- **Contrast:** 0 parells sota AA en clar, fosc i alt contrast.

## Decisions preses (ambigües o cares de desfer)
1. **La web no carrega `app/css/estils.css`** (és de l'app, amb `rem` fluid per a lletra gran): té el seu `web/web.css`, amb els mateixos colors i tipografies. Estalvia pes i evita heretar errors de marges.
2. **Sense selector de mida de lletra a la web:** el zoom del navegador i la mida de lletra del sistema ja fan la feina; els *breakpoints* són en `em` perquè hi reaccionin.
3. **La demo viu a `app/index.html?demo=1`** (únic canvi a `app/`): `localStorage` en memòria, sense benvinguda i sense service worker. En pantalles tàctils l'iframe pot capturar el desplaçament: hi ha el botó «Surt de la demostració».
4. **Galeria en HTML estàtic** generat per `tools/web-shell.py` a partir de `web/jocs.js` (que genera `tools/captures-web.py` del catàleg real): es veu sense JS i es maqueta d'un cop.
5. **«Prova social» només honesta:** cap testimoni, xifra, logotip o premi; es diu «En fase de proves».
6. **Frase del pilot:** no s'afirma que busquem «2–3 centres per a un pilot gratuït de 4 setmanes» (no confirmat); la web diu «Si el vostre centre té interès a provar-la en un pilot, parlem-ne».
7. **No s'ha fet un vídeo al hero** (pes i dependència de xarxa).

## Pes del .zip
`Menta_Web.1.9.1.zip` ja no porta `.git`, `node_modules` ni les captures històriques de versions anteriors (`docs/captures`, `docs/captures-1.8`: ≈ 78 MB, ja són als .zip de la 1.8/1.9). Les captures de l'auditoria de la web es desen ara en JPEG (de 92 MB a 39 MB).

## Pendent de l'Oriol
- [ ] **Correu públic del projecte** (o un formulari Formspree/Google Forms) per a `CONTACTE.email` / `CONTACTE.formulari`; si és un formulari extern, executa `python tools/aplica-contacte.py`. Sense això, la web no mostra cap formulari i el CTA «Demana una demo» porta a la targeta de «Estem preparant el contacte».
- [ ] **Comptes de xarxes socials reals** (si en vols): només es mostren les que omplis.
- [ ] **Noms de l'equip** per a `CONTACTE.equip` i, si vols, una foto real de cada membre.
- [ ] **Domini** (quan aprovin el GitHub Student Developer Pack): `python tools/aplica-domini.py elmeudomini.cat` (genera el JSON-LD, el `canonical`, el sitemap…) i revisa la imatge social.
- [ ] **Confirmar la frase del pilot** («2–3 centres, 4 setmanes, gratuït») abans de posar-la a la web.
- [ ] **Provar la web en un mòbil real** i, si pots, amb una persona gran: el menú, la demo (l'iframe i el desplaçament) i la lectura del text.
