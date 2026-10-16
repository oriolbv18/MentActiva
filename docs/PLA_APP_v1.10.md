# MentA · Pla dels següents passos de l'app (després de la 1.9.3)

*Revisió feta el 16-10-2026 sobre `Menta_Web.1.9.3/app` (codi, documents, proves i una mesura real de les dades).*

## 1. Diagnòstic en tres frases
1. **L'app està completa i ben provada a l'ordinador:** 17 jocs; capes Persona, Cuidador i Residència; català i castellà; funciona sense xarxa; còpia de seguretat i mode pilot; 23 fitxers de proves en verd; auditories amb 0 incidències.
2. **Encara no l'ha fet servir ningú de debò.** De la 1.7 a la 1.9.3 hi ha hagut sis versions sense cap persona gran ni cap mòbil real. Les tres últimes (1.9.1–1.9.3) només han tocat la web de presentació. L'app no està publicada, i per tant no es pot instal·lar ni fer el pilot (`docs/PILOT.md` ho exigeix).
3. **Ara el que falta no és codi, és contacte amb la realitat.** La recomanació és **congelar funcionalitats** (cap joc ni pantalla nova) fins tenir les dades del pilot, i dedicar la propera versió a **publicar, provar i corregir**.

## 2. Què he trobat (amb proves)

### Riscos que cal tractar abans del pilot
| # | Risc | Evidència | Gravetat |
|---|---|---|---|
| R1 | **El codi només existeix en aquest ordinador.** El `git` és local i no té cap remot. Hi ha deu carpetes de versió (≈ 700 MB) i els zips són al mateix disc. | `git remote -v` no retorna res | **Alta**: si el disc falla, es perd tot el projecte |
| R2 | **L'app no està publicada.** Sense HTTPS no s'instal·la com a PWA i el pilot no es pot fer. Canviar d'adreça després esborra les dades dels participants, perquè `localStorage` va lligat a l'adreça. | `docs/PILOT.md` §0, `DOMINI = ''` | **Alta** |
| R3 | **El feedback no arribaria encara que s'omplís `FEEDBACK_URL`.** La CSP de `app/index.html` diu `connect-src 'self' blob: file:`, i `tools/aplica-contacte.py` només adapta la de la web (`index.html` de l'arrel). L'enviament a Formspree quedaria bloquejat i l'app cauria en «compartir» sense avisar. | `app/index.html:5`, `app/js/8-producte.js:50`, `tools/aplica-contacte.py:29` | **Mitjana**: el pilot perdria el canal de feedback automàtic |
| R4 | **Valors per defecte que no poden sortir al carrer:** `CODI_PILOT = 'MENTA-PILOT'`, `FEEDBACK_URL` i `FEEDBACK_EMAIL` buits, el nom de la mascota pendent i el consentiment no revisat per cap professional. | `app/js/config.js:9,16,21-22`; `docs/PILOT.md` §6 | **Mitjana** |
| R5 | **Les dades poden desaparecer a l'iPhone/iPad si no s'instal·la.** Safari pot esborrar les dades d'una web visitada al navegador que no s'ha fet servir durant uns dies; una web afegida a la pantalla d'inici no té aquest límit. *Cal verificar-ho amb el dispositiu real.* | Comportament conegut de WebKit (ITP), no provat aquí | **Mitjana** (només iOS) |

### Riscos per a després del pilot (sobretot per a residències)
| # | Risc | Evidència |
|---|---|---|
| R6 | **Totes les persones van en una sola clau** (`mentA_usuaris`), que es reescriu sencera a cada partida. **Mesurat:** 8 residents amb 5 mesos de demo ocupen 368.000 caràcters, ≈ 350 per sessió, i desar costa 1,6 ms. Els límits (5.000 sessions per persona i un *storage* d'uns 5 MB) arriben abans a una residència: 15 residents a 1 partida al dia són ≈ 2 M caràcters l'any, més les fotos. A casa, amb una persona, no és problema en anys. | `1-nucli.js:556`, `:1028`; la mesura (script a la sessió) |
| R7 | **El PIN del cuidador és protecció contra tocs, no seguretat.** Té 4 dígits amb SHA-256 i es pot provar per força bruta en mil·lisegons si es té el dispositiu. El bloqueig de 30 s viu en memòria i es perd en recarregar la pàgina. Ja està documentat i és acceptable per al pilot, però no per a dades de salut a un centre. | `10-cuidador.js:31,47,78`; `docs/SEGURETAT.md` §3 |
| R8 | **Abast gran per a un equip d'estudiants:** 40 pantalles, 55 modals, 694 KB de JS propi i 147 `onclick` en línia (per això la CSP necessita `unsafe-inline`). Cada funcionalitat nova multiplica el que cal mantenir i provar. | recompte a `app/index.html` i `app/js` |
| R9 | **La veu en català depèn del dispositiu.** Si no hi ha veu `ca`, llegeix el text català amb veu castellana. | `1-nucli.js:197-208` |
| R10 | **Deute menor:** regles CSS òrfenes de l'Elefant antic a `estils.css` (`docs/SEGURETAT.md` §1) i `graphify-out/` sense ignorar al `git` de la 1.9.3. | `git status` |

### Què està bé i no s'ha de tocar
- **Un sol punt d'entrada de les dades** (`registrarPartida`), un esquema versionat i migracions suaus: la base per a un servidor futur ja hi és (`docs/ROADMAP.md`).
- **El semàfor és conservador i explicable** (`SEMAFOR` a `config.js`, línia base de la mateixa persona).
- **Els jocs es carreguen a demanda**, i el *service worker* és versionat sense `skipWaiting` forçat, de manera que l'usuari tria quan actualitzar.
- **La importació es tracta com a entrada hostil, hi ha una CSP estricta, cap dependència externa i les tipografies són locals.**

## 3. Proposta: v1.10 «Sortir al carrer» (unes 4–6 setmanes)
Principi: **cap funcionalitat nova.** Només el que fa falta perquè persones reals la facin servir sense perdre dades, i corregir el que surti.

### F0 · Salvar el projecte (1 dia) — **l'Oriol**, amb Claude si vol
- Crear un repositori a GitHub i pujar-hi la 1.9.3 amb el seu historial. Etiquetar les versions (`v1.9.3`…) en lloc de fer còpies senceres de carpeta.
- *Nota:* GitHub Pages gratuït necessita un repositori **públic**. Si es vol privat, cal Netlify, o publicar des d'un segon repositori públic que només tingui el que es publica.
- Afegir `graphify-out/` al `.gitignore`.

### F1 · Publicar (1–2 dies) — **l'Oriol** decideix, **Claude** aplica
- **Decidir l'adreça definitiva abans de donar l'app a ningú:** un domini propi, o `usuari.github.io/menta` per sempre. Canviar-la després esborra les dades dels participants (R2).
- `python tools/aplica-domini.py …` si hi ha domini, HTTPS actiu, `CACHE` nou a `app/sw.js`.
- **Comprovar la instal·lació** en un Android i en un iPad o iPhone, i que funciona en mode avió.

### F2 · Preparar el pilot (≈ 1 setmana) — **Claude** (codi) i **l'Oriol** (decisions)
1. **Arreglar R3:** fer que `aplica-contacte.py` (o un pas nou) afegeixi l'origen de `FEEDBACK_URL` a la CSP de `app/index.html`, amb un test que enviï el feedback a un servidor local.
2. **Formspree** (o un formulari equivalent) per a `FEEDBACK_URL`, `CODI_PILOT` propi, nom de la mascota. *Ho decideix l'Oriol.*
3. **Avís a iOS** (R5): si l'app s'obre a Safari i no està instal·lada, un missatge amable que expliqui com afegir-la a la pantalla d'inici perquè no es perdin les dades. Es mostra només una vegada.
4. **Bloqueig del PIN que sobrevisqui a recarregar** (R7, desar `bloquejatFins`): és un canvi petit i barat.
5. **Prova d'estrès de dades** (R6): un test que generi una residència de 15 persones × 1 any i comprovi que desar, el semàfor i l'informe PDF segueixen funcionant. També que l'avís d'espai ple surt abans de perdre res.
6. Passar la llista de comprovació de `docs/PILOT.md` §9.

### F3 · Pilot (2–3 setmanes) — **l'Oriol** i l'equip
- **5–8 persones grans** i **2–3 familiars o cuidadors**, i si es pot una residència. Seguir el guió de `docs/PILOT.md`.
- **Consentiment revisat per la UPC** (delegat de protecció de dades) **abans** de la primera sessió.
- Recollir el temps fins al primer joc, el SUS, les cites literals i quins jocs repeteixen.
- **No canviar res durant el pilot.** Només apuntar.

### F4 · Corregir amb les dades (1–2 setmanes) — **Claude**
- Classificar el que surti en *bloqueja / molesta / idea*. Corregir les dues primeres. Les idees van al *roadmap*.
- **Retallar** els jocs o les pantalles que ningú faci servir. Amagar-los, no esborrar-los, i mai sense dades.
- Publicar la v1.10.1 amb `CACHE` nou.

## 4. Després de la v1.10 (decidir amb les dades del pilot)
Per ordre, i **només si el pilot ho justifica**:
1. **Si hi ha interès d'una residència:** passar les dades a **IndexedDB amb una entrada per persona** (R6), i fer una avaluació d'impacte de protecció de dades (RGPD art. 9) abans de cap servidor.
2. **Família a distància de debò** (resum setmanal automàtic). Necessita un backend mínim, comptes i xifratge, i és el salt més gran. Encaixa amb el pla d'empresa, però **no** abans de saber si la família ho vol.
3. **Validació clínica** del semàfor amb un neuropsicòleg o un geriatre.
4. **Deute tècnic:** treure els `onclick` en línia per poder treure `unsafe-inline`, i netejar el CSS orfe. Val la pena només si l'app continua més enllà de l'assignatura.

## 5. Decisions que ha de prendre l'Oriol (per desbloquejar F0–F2)
- [ ] Repositori públic a GitHub (Pages gratis) o privat + Netlify?
- [ ] Adreça definitiva: domini propi (quin?) o `github.io`?
- [ ] Servei de feedback (Formspree?) i `CODI_PILOT`.
- [ ] Nom de la mascota (o deixar «L'Elefant»).
- [ ] Qui revisa el consentiment a la UPC, i quines persones i quina residència participaran al pilot.

## 6. Què **no** recomano ara
- **Més jocs, més pantalles o més polit de la web:** la web ja té la mediana de Lighthouse en 95 i 0 incidències.
- **Un backend o comptes** abans del pilot.
- **Analítica:** `docs/MESURA-US.md` ja diu que no, i el mode pilot ja mesura el que cal.
