# MentA · Disseny premium de la web (v1.9.2, actualitzat a la 1.9.3) «Un dia amb MentA»

> Document generat per `tools/genera-doc-premium.py` a partir de `docs/_premium-plantilla.md` (les línies de la taula es calculen cada vegada).
> Lliurable del pla 1.9.2: (a) pla de tokens i revisió contra els defectes per defecte, (b) taula **Decisió → skill → fitxer:línia**, (c) oportunitats d'animació acceptades i rebutjades.
> Tot és HTML + CSS + JS purs; el JS de la web pesa 21 KB sense comprimir (≈ 8 KB en gzip) i `mol.js` menys d'1 KB; el pressupost era 30 KB en gzip.

## 0. Idea i una sola cosa memorable

**La web és un dia a casa:** comença a trenc d'alba (un botó gran, l'Elefant que saluda), passa la tarda jugant i al vespre qui cuida mira com ha anat. El fons evoluciona d'Alba (matí càlid) a Paper (tarda) i a Bosc nocturn (vespre) a mesura que es baixa, i el mòbil diu *Bon dia*, *Bona tarda* i *Bona nit*: **són captures de l'app real fetes a aquelles hores** (el rellotge del navegador es fixa a les 8:30, les 16:10 i les 21:30; l'app calcula ella mateixa la salutació, no s'edita cap imatge).

**El moment «flipo» és el mòbil viu:** un mòbil gran, fet amb CSS, que es queda fix mentre es baixa i canvia de pantalla (*Inici → Troba les parelles → Jugar amb algú → Espai del cuidador*), amb una lleugera inclinació que segueix el cursor. Tot el que l'envolta és quiet i tipogràfic. L'altre gest memorable és petit: l'Elefant assegut sobre el mòbil, que et mira i et saluda una vegada.

## 1. Pla de tokens (pas 1 de `frontend-design`)

| Capa | Valors |
|---|---|
| **Color (clar)** | Alba `#fbefd9` · Paper `#faf7f2` · Bosc nocturn `#0e2e1d` · Verd MentA `#1d6b40` / `#2e8b57` (marca) · Sol `#f2a65a` (acció, el taronja de JUGAR) · Tinta `#1b1712` · Elefant `#8d9db0` |
| **Color (fosc)** | Alba `#241b11` · Paper `#15120e` · Bosc `#0b2417` · marca `#5fcf8d` · Sol `#f5b86c` · text `#f6f0e5` |
| **Al vespre** | text `#f4f1e8`, text suau `#c5d6ca`, marca menta `#7fe0a5`, vidre `rgba(255,255,255,.07)` amb vora de llum |
| **Tipografia** | **Lexend** als titulars (`h1` fins a 5,4 rem, `-.035em`, interlineat .98); **Atkinson Hyperlegible** al text (1,125–1,25 rem, interlineat 1,6, línies ≤ 62 caràcters). Les dues són locals. Fet verificat: Atkinson Hyperlegible la va crear el Braille Institute per a la baixa visió ([font](https://www.allaboutvision.com/low-vision/atkinson-hyperlegible-typeface/)). |
| **Forma** | dos radis amb significat (gran per a superfícies, petit per a controls), **ombres tintades de verd** (mai grises), vora d'1 px de llum (`inset`) al vidre |
| **Moviment** | corbes `cubic-bezier(.23,1,.32,1)` (sortida) i `(.77,0,.175,1)` (moviment a la pantalla); molls amb `web/mol.js` i `linear()` de CSS; durades 140 / 220 / 480 ms |

**Disposició.** Hero a dues columnes (text a l'esquerra, mòbil amb vídeo a la dreta, l'Elefant assegut al marc superior). Tira de quatre fets. *Un dia amb MentA*: blocs de ≥ 100 svh a l'esquerra i mòbil *sticky* a la dreta. Demo en mode demostració. Aparador de 17 jocs en **una sola fila que és un scroller natiu** (des de la 1.9.3; abans eren dues files en moviment automàtic), sobre el verd bosc, on els mòbils clars brillen. Bento asimètric del cuidador. «L'endemà» (enfocament, preguntes, contacte) sobre Paper i tancament en Bosc.

## 2. Revisió contra els defectes per defecte (pas 2)

| Pregunta | Resposta | Què he canviat i per què |
|---|---|---|
| Fons crema + serif + terracota? | **En part, i ho he corregit.** L'Alba és càlid, però només al hero; no hi ha cap serif i l'accent és el taronja de l'app (`#f2a65a`, el botó JUGAR), no la terracota (`#d97757`). | La pàgina acaba en verd bosc i el color neix del producte (alba → bosc). Sense serif: Lexend + Atkinson, pensades per llegir. |
| Fons negre amb un únic verd àcid? | No. | El vespre és **verd bosc** (`#0e2e1d`), no negre; dos accents amb funció (Sol = acció, menta = marca/enllaç), no un neó únic. |
| Targetes iguals amb ombra grisa? | No. | Bento de peces de **mides diferents** (4+2, 2+2, 6, 6), ombres tintades i dos radis; l'aparador i el mòbil viu no són targetes. |
| Una sola paraula acolorida als titulars? | **Cap.** | El gegant «17 jocs» va en el color del text (només canvia la mida); abans anava en Sol i ho he tret. |
| Etiquetes en MAJÚSCULES amb espaiat? | **Cap.** | Les hores del dia («Bon dia», «Bona tarda»…) són informació (diuen quan passa cada escena), van en minúscula i amb un punt de color. |
| Numeració decorativa «01/02/03»? | **Cap.** | Els blocs del mòbil viu es diferencien per l'hora del dia, no per números. (Els 3 passos numerats de la 1.9.1 s'han substituït pel recorregut del dia; la demo conserva la seva guia 1-2-3, que sí és una seqüència.) |
| «→» a tots els botons? | No. | Els botons diuen l'acció («Prova l'app», «Demana una demo»). |
| *Fade-up* a cada secció? | No. | Hi ha **una** seqüència d'entrada (hero) i moviment només on ajuda; res més s'anima en carregar. |

## 3. Taula Decisió → skill → fitxer:línia ({{N_DECISIONS}} decisions)

{{TAULA_DECISIONS}}

## 4. Skills de `skills-main`: com s'han fet servir

Totes les skills de la llista es van poder invocar (cap no ha faltat). S'han invocat amb l'eina `Skill` en aquest ordre i s'han aplicat de manera concreta (no només citades):

| Skill | Fase | Què ha canviat al codi |
|---|---|---|
| `frontend-design` | F1 (pla de tokens i revisió) i F10 (crítica) | Direcció «Un dia amb MentA», revisió contra els defectes per defecte (secció 2), una sola cosa memorable, retirada d'un accessori. |
| `apple-design` | F2, F3, F6, F7 | Molls (`mol.js`, `linear()`), materials translúcids amb jerarquia, `prefers-reduced-transparency`, *tracking* dependent de la mida, canvi de tema sense salts. |
| `emil-design-eng` | F2–F7 | `:active{scale(.97)}`, mai `scale(0)` ni `transition: all`, transicions (no *keyframes*) per a allò interrompible, `@starting-style`, blur de 2 px, hover només amb `(hover:hover) and (pointer:fine)`. |
| `design:design-system` | F1 | Tokens per hora (clar i fosc), components (`.btn`, `.mobil`, `.peca`, `.xip`) i escala d'espaiat `--e-*`. |
| `design:ux-copy` | F1, F4 | Titulars curts i concrets; cap promesa clínica; estat buit del contacte; errors del formulari. |
| `find-animation-opportunities` | F6 | Llista de la secció 5. |
| `animation-vocabulary` | F6 | Noms exactes de la secció 6, usats al CSS i a la doc. |
| `animate` | F2–F6 | Cada animació, amb porta de freqüència → propòsit → eina → propietats → corba → interrupció → moviment reduït. |
| `animation-performance` | F6, F9 | Només `transform`/`opacity`, cap variable CSS heretada animada, `blur` ≤ 2 px a les capes (el vidre del bento no porta `backdrop-filter`), vídeo i micro-visuals pausats fora de vista. |
| `improve-animations` | F6 (final) | Secció 7. |
| `mobile-native` | F2, F3, F4, F9 | `viewport-fit=cover`, `interactive-widget`, `svh`, zones segures, `touch-action`, camps ≥ 16 px, `scroll-snap`, `theme-color`. |
| `break-ui` | F10 | Secció 9. |
| `design:accessibility-review` | F9 | Secció 10. |
| `design:design-critique` | F10 | Secció 11. |

Ignorades perquè no apliquen: `ask-sonner`, `animate-expo`, `write-swift` (cap component de tipus *toast*, ni React Native, ni Swift).

## 5. Oportunitats d'animació (`find-animation-opportunities`)

Cada candidat ha passat la porta *freqüència → propòsit → velocitat → funció*.

| # | On | Propòsit | Freqüència | Moviment (valors exactes) | Decisió |
|---|---|---|---|---|---|
| 1 | Entrada del hero | Explicació / delit | Rara (un cop per visita) | Paraules `translateY(-48%) → 0` dins una màscara, 560 ms `--ease-out`, *stagger* 45 ms; mòbil `scale(.96)` + opacitat 640 ms; Elefant puja 600 ms | ✅ **Una sola seqüència**, < 900 ms |
| 2 | Canvi de pantalla del mòbil viu | Continuïtat espacial | Ocasional | Transicions de 320 ms `--ease-out`: opacitat, `scale(.97)`, `blur(2px)`; interrompible | ✅ Cor de la web |
| 3 | Premuda dels botons | *Feedback* | Desenes/dia | `:active{scale(.97)}` 140 ms | ✅ |
| 4 | Micro-visuals del bento | Explicació | Rara | Una sola vegada en entrar a la vista: llums 520 ms (*stagger* 380 ms), línia que es dibuixa 1,4 s, punts del PIN, fitxers amb moll | ✅ Només 4–5 peces, sense bucles |
| 5 | Aparador de jocs | Explicació (mostrar 17 jocs) | Ocasional | **1.9.3:** scroller natiu amb `scroll-snap`, arrossegar amb moll, fletxes i teclat; cap moviment automàtic. Una sola invitació (`translate` −110 px i torna) | ✅ (redissenyat a la 1.9.3: vegeu `docs/web-premium/MOVIMENT-1.9.3.md`) |
| 6 | Canvi de tema | Evitar un canvi brusc | Rara | Revelació circular amb View Transitions, 520 ms `--ease-out`; instantani si no hi ha suport | ✅ |
| 7 | Ulls i inclinació (cursor) | Delit decoratiu | Constant mentre es mou | Molls (rigidesa 120–260, amortiment crític o gairebé); només amb cursor fi; rang limitat | ✅ Només al hero i al mòbil viu |
| 8 | Salutació de l'Elefant | Delit | Rara (un cop) | *Crossfade* 2,2 s entre dues poses, sense bucle | ✅ |
| — | Obertura del menú mòbil | Estat | Desenes/dia | Ja és una transició de 220 ms; es manté | ✅ (existent) |
| ✗ | Cada títol de secció amb *fade-up* | «Queda bé» | Cada secció | — | ❌ **Rebutjat**: no té propòsit; és el patró genèric |
| ✗ | Navegació amb el teclat i enllaços d'àncora | — | 100+/dia | — | ❌ **Rebutjat**: acció de teclat o de navegació freqüent: sense animació (només `scroll-behavior` suau, que s'anul·la amb moviment reduït) |
| ✗ | Gràfic del cuidador a l'app real | Dades que es llegeixen | — | — | ❌ **Rebutjat** a l'app; a la web només hi ha un gràfic d'exemple, marcat «Dades fictícies» |
| ✗ | Barra de progrés de lectura | «Queda bé» | Contínua | `scaleX` amb `animation-timeline: scroll()` | ❌ **Retirada** (secció 11): era un accessori |
| ✗ | Parpelleig, rebots als botons, ones a cada targeta | — | — | — | ❌ Rebutjats: soroll |

## 6. Vocabulari (`animation-vocabulary`)

| Efecte de la web | Terme exacte |
|---|---|
| Les paraules del titular baixen dins d'una màscara | **Reveal** amb **stagger** (part d'una **orchestration** única) |
| El mòbil sticky canvia de pantalla | **Crossfade** amb **blur** i **scale in** (continuïtat espacial) |
| El mòbil s'inclina amb el cursor | **3D tilt** amb **spring**, sota una **perspective** de 900 px |
| L'aparador (1.9.3) | **Drag** amb **momentum** i **rubber-banding** sobre un scroller natiu amb *scroll-snap*; **interruptible animation** |
| Filtrar jocs | **Stagger** de **scale in** amb **fade** |
| La línia del gràfic | **Line drawing** |
| Els punts i els llums del bento | **Pop in** amb **stagger** |
| PDF i CSV que arriben | **Slide in** amb **spring** i un petit **bounce** |
| Canvi clar/fosc | **View transition** (revelació circular amb `clip-path`) |
| L'Elefant que saluda | **Crossfade** entre dues poses (una **idle animation** d'un sol cop) |
| El botó que brilla | **Hover effect** amb *spotlight* que segueix el cursor |
| Capçalera que es compacta | **Layout animation** feta amb **transform** (no amb alçada) |

## 7. Auditoria de moviment (`improve-animations`) i rendiment (`animation-performance`)

Recon: pila = CSS + WAAPI + un moll de 0,7 KB; fonts del moviment = `web/web.css` (tokens `--ease-*`, `--d-*`, `--moll`) i `web/web.js`. Mapa de freqüències: botons i menú (desenes/dia), mòbil viu (ocasional), hero i bento (rars).

| # | Sev. | Categoria | On | Troballa | Arreglat |
|---|---|---|---|---|---|
| 1 | MITJANA | Interrompibilitat | iframe de la demo | Entrava amb `@keyframes` (reinicia des de zero) | ✅ `transition` + `@starting-style` |
| 2 | MITJANA | Rendiment | peces del bento | `backdrop-filter: blur(14px)` a 6 superfícies grans sobre un fons pla: cost de ràster sense benefici visual | ✅ Tret; el vidre es manté amb degradat, vora de llum i fons translúcid |
| 3 | MITJANA | Rendiment | hero | `filter: blur` i `filter: drop-shadow` sobre elements grans (l'Elefant i la llum del fons) | ✅ Tretes; l'Elefant passa a `<img>` i les pupil·les són dos punts HTML moguts amb `transform` |
| 4 | MITJANA | Rendiment | `web.js` | `window.scrollY` s'llegia abans de la primera pintura (forçava un maquetat de 145 ms) | ✅ Es llegeix en el primer `scroll` |
| 5 | BAIXA | Cohesió | números dels fets | Xifres proporcionals | ✅ `tabular-nums` |
| 6 | BAIXA | Mòbil | botons i filtres | Faltava `touch-action: manipulation` global i *callout* | ✅ |
| 7 | BAIXA | Rendiment | seccions inferiors | Es maquetaven totes en carregar | ✅ `content-visibility: auto` (només amb JS) |
| 8 | BAIXA | Rendiment | aparador | Es clonaven 17 targetes i es creaven filtres en carregar | ✅ Només quan l'aparador és a prop |
| 9 | BAIXA | Rendiment | vídeo | Començava 250 ms després de la càrrega | ✅ En repòs (`requestIdleCallback`), pausat fora de vista, sense *Save-Data* |

**Allò que ja era correcte:** cap `transition: all`, cap `scale(0)`, cap `ease-in`, cap `transform-origin` equivocat (el menú creix des de dalt; la capçalera des del centre), cap animació de `width/height/top/left` (l'acordió de les preguntes és l'única excepció tolerada: `block-size` amb `interpolate-size`), cap variable CSS animada ni heretada per un arbre gran, hover sempre amb `(hover:hover) and (pointer:fine)`, moviment reduït = menys, no zero.

**Verificat des del codi i des de rastres** (Playwright amb CPU ×4): una sola tasca llarga al principi (el primer maquetat); cap tasca de més de 50 ms en fer scroll (`tests/web/test_premium.py`). **Cal confirmar amb un mòbil real:** la sensació dels molls i de l'inclinat amb el dit, la fluïdesa del `marquee` amb una GPU modesta i el vídeo en un mòbil antic.

## 8. Mòbil (`mobile-native`)

| Símptoma | Estat |
|---|---|
| *Hover* enganxat | Tot el `:hover` és dins `(hover:hover) and (pointer:fine)` |
| Flaix gris en tocar | `-webkit-tap-highlight-color: transparent` |
| Alçada | `svh` al mòbil viu i al hero; `viewport-fit=cover` + `env(safe-area-inset-*)` a la capçalera, al menú i a la barra de CTA |
| Zoom en un camp | Camps de 16 px o més (comprovat a `test_premium.py`); mai `user-scalable=no` |
| Tocs lents | `touch-action: manipulation` + feedback en `:active` |
| Carrusel | `scroll-snap` + `touch-action: pan-x pan-y` a tàctil |
| Barra d'estat | `theme-color` per esquema i per hora del dia |
| *Pull-to-refresh* | Es deixa (és un document) |
| «Funciona a Chrome, no al mòbil» | **Pendent de provar en un mòbil real** (menú, mòbil viu, demo) |

## 9. «Trencar la interfície» (`break-ui`)

Mapa de valors que la web mostra: nom/correu/missatge del formulari (límits `maxlength` 80/120/1000), correu i comptes de `CONTACTE`, noms de l'equip (`CONTACTE.equip`, sense límit), recompte de jocs, imatges i vídeo.

| # | Severitat | Camp | Pitjor cas | Què passava | Arreglat |
|---|---|---|---|---|---|
| 1 | Trencat | graelles de text | 200 % de lletra i 320 px | Les pistes de graella creixien amb el contingut i la pàgina desbordava | ✅ `minmax(0,1fr)` a tots els contenidors; `overflow-wrap: anywhere` als titulars i enllaços |
| 2 | Lleig | botó «Obre-la a pantalla completa» | 320 px | Estava en `nowrap` i sortia de la pantalla | ✅ Els botons es poden partir; només `nowrap` al CTA de la capçalera i al «Prova-la aquí» |
| 3 | Lleig | filtre de jocs | 1 joc | Deia «1 jocs» | ✅ «1 joc» |
| 4 | Fràgil | `CONTACTE.equip` | un nom de 60 caràcters sense espais | Podia sortir de la càpsula | ✅ `overflow-wrap: anywhere` |
| 5 | Fràgil | vídeo | xarxa tallada només per al vídeo | — (ja aguantava) | Prova automàtica: el poster es queda i no hi ha errors |

**Aguanta:** 320 px i 2560 px (contingut limitat a 1200 px), zoom del navegador fins al 400 %, lletra de sistema al 200 %, formulari amb un correu de 70 caràcters i un missatge de 700 caràcters amb paraules llargues, JS desactivat (els blocs del mòbil viu es veuen en línia), xarxa tallada, `prefers-reduced-motion`, `prefers-contrast: more`, `prefers-reduced-data` i *Save-Data*. Tot és a `tests/web/`.

**Decisions per a l'Oriol:** si l'equip té més de 8 noms, mostrar-los en una llista en lloc de càpsules (recomanat); si algun dia hi ha molts jocs (> 30), paginar l'aparador (recomanat) en lloc de repetir files.

## 10. Accessibilitat (`design:accessibility-review`, WCAG 2.1 AA)

**Resum:** 0 violacions d'axe-core a la landing, la 404 i les pàgines legals, en clar i fosc, mòbil i escriptori; 0 parells de color per sota d'AA (`docs/web-premium/CONTRAST.md`, per hora del dia, amb el vidre compost sobre el fons real).

| Criteri | Estat |
|---|---|
| 1.4.3 / 1.4.11 contrast | ✅ Calculat per hora, clar, fosc i alt contrast |
| 2.1.1 teclat | ✅ Cap element atrapa el teclat; el menú mòbil atrapa el focus només mentre és obert (i Escape el tanca) |
| 2.2.2 pausar moviment | ✅ Des de la 1.9.3 l'aparador no té cap moviment automàtic sostingut (no cal botó de pausa); el vídeo és mut, decoratiu i `aria-hidden` |
| 2.3.3 / moviment | ✅ `prefers-reduced-motion` desactiva entrada, inclinació, ulls, vídeo i files |
| 2.4.7 focus visible | ✅ Anell de 3 px (groc sobre el fons bosc) |
| 2.5.5 objectius | ✅ ≥ 44 px (comprovat per `tools/audit-web.py` a ≤ 768 px) |
| 1.1.1 imatges | ✅ Cada captura té text alternatiu; el mòbil sticky és decoratiu (`aria-hidden`) i cada bloc porta la seva captura descrita |
| 1.3.1 estructura | ✅ Un `h1`, `h2` per secció, `h3` als blocs; el `h2` «Un dia amb MentA» és per a lectors de pantalla |
| 4.1.2 | ✅ Filtres amb `aria-pressed`, menú amb `aria-expanded`, estat dels filtres amb `role="status"` |

**Orde de tabulació provat:** salta-contingut → marca → enllaços → «Prova l'app» → tema → menú. **Pendent amb una persona:** prova amb VoiceOver/NVDA (no es pot automatitzar).

## 11. Crítica de disseny final (`frontend-design` + `design:design-critique`)

**Primera impressió:** el titular i el mòbil amb l'Elefant es llegeixen en dos segons; el mòbil és el focus correcte; l'Alba dóna calidesa sense semblar una plantilla.

| Troballa | Severitat | Recomanació | Fet |
|---|---|---|---|
| La barra de progrés ataronjada del límit superior semblava un defecte de la capçalera | 🟡 | **Treure «un accessori»** | ✅ Retirada del CSS, de l'HTML i del test |
| El gegant «17 jocs» en Sol era una «paraula acolorida» dins d'un titular | 🟡 | Mateix color que el text; només canvia la mida | ✅ |
| La peça «L'evolució» del bento tenia molt buit | 🟢 | Gràfic més gran, centrat verticalment | ✅ |
| Punts «·» als metadades del peu («A · B · C») | 🟢 | Frases normals | ✅ |
| L'Elefant del tancament ocupava molt | 🟢 | Reduït a 7–10 rem | ✅ |

**Què funciona bé:** una sola idea (el dia), contrast clar/vespre, el mòbil real (cap captura inventada), l'aparador sobre verd bosc (els mòbils clars brillen), l'honestedat («En fase de proves», «Dades fictícies», cap xifra inventada).

**Captures abans/després:** `docs/web-abans-1.9.2/` (la 1.9.1) i `docs/web-premium/` (la 1.9.2, 390 i 1440 px, clar i fosc).

## 12. 1.9.3 «Aparador lliure i moviment amb sentit» (addenda)
El diagnòstic de l'Oriol era correcte: el *marquee* anava a ≈ 26 px/s (veure els 17 jocs costava > 1 minut), el hover aturava la fila sense deixar-la moure i dues files en sentits oposats es disputaven l'atenció. Principi nou: **l'usuari mana, el moviment només convida.** Les decisions de la 1.9.3 són a la taula de la secció 3 (files marcades `[1.9.3]`), l'inventari amb la porta *freqüència → propòsit → velocitat → funció* a `docs/web-premium/MOVIMENT-1.9.3.md` i les mesures a `CHANGELOG-1.9.3.md`.

## 13. Mesures

{{MESURES}}
