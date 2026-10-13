# Seguretat i protecció de dades — revisió de la v1.9

MentA és una app que s'executa **sencera al navegador**: no té servidor, ni comptes, ni analítica, ni tipografies o llibreries externes. La superfície d'atac és petita, però no inexistent. Això és el que s'ha revisat i el que queda obert.

## 1. Què s'ha revisat
| Àmbit | Què s'ha fet |
|---|---|
| **Escapament de dades de l'usuari** | Tot el que escriu o importa la persona (noms, notes del cuidador, missatges, nom del centre, nom de l'Elefant, títols) passa per `esc()` abans d'anar a `innerHTML`. Revisats **tots** els `innerHTML` nous (Elefant, Bingo, pistes, residència, còpia, pilot): el globus de l'Elefant fa servir `textContent`; els noms de roba vénen d'una llista fixa. Una cerca automàtica no ha trobat cap plantilla amb dades d'usuari sense escapar. |
| **Fotos i colors** | Un fitxer importat podia dur una «foto» o un color manipulats per trencar un atribut HTML. Ara només s'accepten fotos `data:image/(jpeg\|png\|webp\|gif);base64,…` (`fotoSegura`) i colors `#rrggbb` (`colorSegur`). |
| **Importació de JSON** | Es tracta com a **entrada hostil**: límit de 25 MB, màxim 300 apartats, claus només `mentA_…` (es rebutgen `__proto__`, `constructor`, `prototype`), cada valor llegit amb un revisor que refusa claus perilloses, estructura de persones validada, versió futura rebutjada, **res s'aplica fins que passa tot**, es fa una còpia automàtica abans (IndexedDB) i, si falla (espai ple), es **desfà sol**. Proves a `tests/copia/`. |
| **`eval` i similars** | Cap `eval`, `new Function` ni `document.write` al codi de l'app (comprovat; `jsPDF` tampoc en fa servir). |
| **Enllaços externs** | Tots amb `rel="noopener noreferrer"`. |
| **Tercers** | Cap: ni analítica, ni tipografies externes, ni CDN. L'«ús anònim» és opcional i només es desa localment fins que la persona exporta el fitxer. |
| **Política de seguretat de contingut (CSP)** | Etiqueta `<meta http-equiv="Content-Security-Policy">` a l'app, la web, la 404 i les pàgines legals. Vegeu §2. |
| **`security.txt`** | `tools/aplica-domini.py` genera `.well-known/security.txt` quan hi ha domini i un correu a `CONTACTE.email`. |
| **Codi mort** | Retirat el JS de l'Elefant antic (`web/elefant-web.js`, mascota de la benvinguda) i l'exportació/importació antigues (ara a `14-copia.js`). Queden a `estils.css` regles CSS orfes de l'Elefant antic (`.elefant-wrapper`, `.onb-mascota`): no s'apliquen a cap element, però no s'han esborrat per no arriscar la maquetació (pendent de neteja). Cap `console.log` oblidat. |

## 2. La CSP, i què queda obert i per què
```
default-src 'self' file:; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline' file:;
img-src 'self' data: blob: file:; media-src 'self' data: blob: file:; font-src 'self' data: file:;
connect-src 'self' blob: file:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'
```
- **`'unsafe-inline'` a `script-src`**: l'arquitectura fa servir `onclick="…"` en línia (regla del projecte: scripts clàssics, sense frameworks ni *bundlers*). Eliminar-ho exigiria reescriure centenars de gestors d'esdeveniments. **Risc residual:** si algú aconseguís injectar HTML, podria executar JS; per això l'escapament de l'apartat anterior és la defensa principal.
- **`'unsafe-inline'` a `style-src`**: els estils en línia dinàmics (colors d'avatar, gràfics).
- **`file:`**: perquè l'app funcioni obrint-la des del disc, que és un requisit del projecte.
- **`connect-src`**: només el mateix origen. **Si activeu un formulari de comentaris extern (`FEEDBACK_URL`, p. ex. Formspree), cal afegir-ne el domini a `connect-src`** a `app/index.html`.
- `frame-ancestors` no es pot posar en una etiqueta `<meta>`; per evitar que algú incrusti l'app en un `<iframe>`, caldria una capçalera HTTP (GitHub Pages no permet configurar-ne).

## 3. Limitacions conegudes (honestes)
- **El PIN del cuidador no és seguretat forta.** Es guarda amb hash (SHA-256 + sal) i bloqueja 30 s després de 5 errors, però les dades són al dispositiu: qui tingui accés al navegador i sàpiga què fa pot llegir-les. És una protecció contra tocs per error.
- **Les dades només són al dispositiu.** No hi ha còpia al núvol: si s'esborren les dades del navegador, es perden (per això hi ha el recordatori de còpia i `navigator.storage.persist()`).
- **Les còpies i els PDF són fitxers sense xifrar.** Un resum compartit ja no el controla l'app. Algunes dades poden ser **dades de salut** (RGPD, art. 9): cal un consentiment adequat i, si s'usa amb residències, una avaluació d'impacte de protecció de dades (vegeu `docs/PILOT.md`).
- **Un mode lectura no és un control d'accés:** només impedeix modificar dades des de l'app.
- **Service worker:** la memòria cau és versionada (`menta-1.9.3`); en publicar una versió nova, l'app avisa d'actualitzar.
- **No s'ha fet cap prova de penetració externa.** Recomanable abans d'ús comercial amb centres.

## 4. Mida del paquet i dependències
- Dependències de tercers: **només `jsPDF` (MIT)**, inclosa en local (`app/vendor/`), i les tipografies *Atkinson Hyperlegible Next* i *Lexend* (OFL), en local.
- JS de l'app sota demanda: els jocs es carreguen només quan s'obren. Vegeu `docs/RENDIMENT-1.9.md` per als pressupostos.
