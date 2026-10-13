# Inventari de moviment (v1.9.3) · F2, només lectura

Fet amb la skill `find-animation-opportunities` sobre `index.html`, `404.html`, `legal/*` i `web/web.css`. Cada candidat ha passat la porta *freqüència → propòsit → velocitat → funció*. Principi del pla: **l'usuari mana, el moviment només convida**, i res s'anima en carregar excepte el hero.

## Recon
- **Pila:** CSS (transicions i *keyframes* d'una sola vegada), WAAPI (filtres de l'aparador), `web/mol.js` (moll, ≈ 1 KB). Tokens existents: `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`, `--d-rapida: 140ms`, `--d-normal: 220ms`, `--d-entrada: 480ms`, `--moll: linear(…)`.
- **Personalitat:** càlida i tranquil·la, per a familiars i residències (no només gent jove): moviment curt, sense rebots.
- **Mapa de freqüències:** botons/menú/filtres (desenes/dia) · mòbil viu i aparador (ocasional) · hero, bento, tema, Elefant (rars).

## Què té moviment ara (1.9.2 → 1.9.3)
Hero (entrada única, 0,9 s) · mòbil que s'inclina i ulls de l'Elefant (decoratiu, només cursor fi) · salutació de l'Elefant (un cop) · mòbil viu (*crossfade* + escala + blur 2 px) · micro-visuals del bento (un cop) · canvi de tema (revelació circular) · menú mòbil · capçalera que es compacta · FAQ (`::details-content`) · aparador (**ara** scroller natiu amb moll en arrossegar; el *marquee* s'ha retirat a la F1).

## Taula d'oportunitats

| # | Lloc | Té moviment ara? | Proposta (valors exactes) | Propòsit | Cost | Decisió |
|---|---|---|---|---|---|---|
| 1 | Tira de quatre fets (`.l-fets`) | No: apareix tota d'una | S'uneix al sistema que ja usa el bento (`data-viu`, **un sol sistema**, no s'afegeix `data-revela`): `opacity 0→1` + `translateY(14px→0)`, 480 ms `--ease-out`, *stagger* 60 ms entre els 4 fets, **una vegada**, només amb `html.js` (sense JS es veu tot) | Evitar un canvi brusc (contingut que «salta» en arribar-hi) | ≈ 0: `transform`/`opacity`, un sol observador ja existent | ✅ |
| 2 | Gegant «17 jocs» | No | Compte 0→17 en entrar a la vista, 900 ms, corba `easeOutExpo` (`1 − 2^(−10t)`) amb `requestAnimationFrame` només durant l'animació; `font-variant-numeric: tabular-nums`; el **17 és al HTML** (SEO i sense JS); sense CLS (l'element és `display:block`) | Delit (moment rar) i atenció al número que ven el producte | Baix: ≈ 54 fotogrames, un sol text | ✅ |
| 3 | Mòbil viu (canvi de pantalla) | Sí: *crossfade* + `scale(.97)` + blur 2 px, 320 ms | Afegir direcció: la pantalla que entra ve de `translateY(10px)` quan es baixa (i de `-10px` quan es puja), la que surt marxa cap a l'altre costat; mateixa durada i corba; interrompible (transicions, no *keyframes*) | Continuïtat espacial (es nota *cap on* va el recorregut) | ≈ 0: `transform`/`opacity`/`filter` ja existents | ✅ |
| 4 | Botons, nav i enllaços | Parcial: `:active scale(.97)` a `.btn`, icones i filtres | `:active { transform: scale(.97) }` coherent també a enllaços de la capçalera, `summary` de les preguntes i xarxes; subratllat dels enllaços de text que **creix des de l'esquerra** (180 ms `--ease-out`, `background-size`, només a `(hover:hover) and (pointer:fine)`) | *Feedback* (el que es toca respon a l'instant) | Mínim (elements petits) | ✅ |
| 5 | Navegació entre pàgines (`index` ↔ `404` ↔ `legal/*`) | No (salt sec) | `@view-transition { navigation: auto; }` amb *crossfade* de 200 ms (`::view-transition-group(root){animation-duration:.2s}`). **No ha d'interferir amb el canvi de tema** (que és JS, mateix document): la regla `animation:none` de la revelació circular passa a viure només sota `html.tema-vt`, que el JS posa i treu | Evitar un canvi brusc entre pàgines (millora progressiva; sense suport no canvia res) | ≈ 0 (el navegador) | ✅ |
| 6 | Elefant del hero | Entrada + salutació (un cop) | Micro-reacció **al clic/toc**: la pose que saluda es repeteix amb un petit salt (`translateY(-6px)`, 220 ms ease-out, torna amb el moll de `mol.js`); un sol cicle per clic, mai en bucle; amb moviment reduït, només el *crossfade* d'opacitat | Delit (acció de l'usuari, rara) | Mínim | ✅ |
| 7 | Preguntes (`<details>`) | Sí: `::details-content` amb `interpolate-size` | Ja compleix el pla (alçada + opacitat, 220 ms, amb *fallback* instantani sense suport). **No es toca** | *State indication* | — | ✅ (ja existeix) |
| 8 | Capçalera «píndola» (opacitat/blur en compactar-se) | Sí: escala del vidre | **Rebutjat.** Afegir blur o canviar l'opacitat del vidre obliga a repintar una superfície amb `backdrop-filter` a cada scroll | — | Alt | ❌ |
| 9 | Titular del hero | Sí: paraules que baixen, 560 ms | **Rebutjat.** Ja és una seqüència orquestrada de < 900 ms; allargar-la només empitjora el LCP | — | — | ❌ (no s'allarga) |
| 10 | Un *fade-up* a cada títol de secció (`[data-revela]` general) | No | **Rebutjat.** És el patró genèric que la crítica de la 1.9.2 va retirar; cap propòsit més enllà de «queda bé» | — | Alt (molts observadors) | ❌ |

Aprovades: **7** (≤ 8). Rebutjades: 3, amb motiu.

## On NO animar
- **Text llarg i llistes** (FAQ un cop obert, enfocament, legals): es llegeix, no es mira. Cap entrada, cap parpelleig.
- **Formulari de contacte** (camps, errors, consentiment): la validació ha de ser immediata i clara; només el canvi de color de la vora de l'error.
- **Pàgines legals i 404:** la capçalera i el peu són els mateixos; només la transició de pàgina (#5), mai moviment dins del text.
- **Els mòbils (captures) mentre es llegeixen:** a l'aparador, l'usuari els mou; res es mou sol. Al mòbil viu només canvia la pantalla en canviar de bloc.
- **Teclat i àncores:** el desplaçament cap a una secció i el moviment de l'enfocament (fletxes de l'aparador) són accions de teclat; amb moviment reduït són instantanis i no s'hi afegeix cap efecte.
- **Navegació principal i botons d'acció freqüents:** només la premuda de 140 ms.
- **Dades fictícies del bento** un cop dibuixades: no tornen a animar-se.

## Veredicte
La web ja té prou moviment: el que li faltava era **control** (F1) i **continuïtat** en tres punts petits (fets, direcció del mòbil viu, pàgines). L'efecte de més palanca és el #3 (dóna sentit de direcció al recorregut) i el #2 (un moment memorable i barat). Res d'això afegeix tasques llargues; cada punt té una versió reduïda amb `prefers-reduced-motion` i funciona sense JS.
