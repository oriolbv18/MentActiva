# Prova pilot de MentA — guia per a l'Oriol

Objectiu: ensenyar l'app a persones grans, a familiars i a una residència, i **aprendre'n** (no demostrar res). Aquest document és el pla complet; el codi ja porta el **mode pilot** (Configuració → «Mode pilot», codi a `CODI_PILOT` de `app/js/config.js`).

> **Abans de començar:** el domini ha d'estar aplicat (`docs/DOMINI.md`). Si no, els participants perdran les dades en canviar d'adreça.

## 1. Protocol de prova (≤ 20 minuts per participant)

**Material:** una tauleta o un mòbil amb MentA instal·lada i el mode pilot activat, el full de consentiment signat, el full d'observació (§3) i un rellotge.

| Minut | Què es fa | Què anota l'observador |
|---|---|---|
| 0–2 | Benvinguda i consentiment. Es recorda que **no es prova la persona, es prova l'app**. | Consentiment signat (sí/no), qui el signa. |
| 2–5 | **Tasca 1:** «Obre l'app i comença a jugar a alguna cosa». Sense ajuda. | Temps fins al primer joc (l'app el mesura també), tocs, dubtes, errors. |
| 5–10 | **Tasca 2:** jugar 5 minuts a un joc que triï la persona (Memory, Bingo…). | Si entén els controls; si fa servir **«?»** o **l'Elefant**; si demana ajuda; frustració. |
| 10–13 | **Tasca 3 (opcional):** demanar una pista a l'Elefant; provar «Jugar amb algú» amb l'observador. | Si troba el botó de pista; si entén l'explicació. |
| 13–15 | **Tasca 4 (cuidador/familiar):** obrir l'Espai del Cuidador amb PIN i trobar «com ha anat la setmana». | Temps, camí, dubtes. |
| 15–20 | **Qüestionari SUS** (§4) i **preguntes obertes** (§5). | Respostes literals, sense interpretar. |

**Regles de l'observador:** no ajudar fins que la persona ho demani o passin 30 s encallada; no dir «és fàcil»; anotar el que *fa*, no el que *diu* que fa; si es cansa, parar.

## 2. Mode pilot (què fa a l'app)
Activa'l a Configuració → *Mode pilot* escrivint el codi. Quan és actiu:
- Qui es crea rep un **codi anònim** (P01, P02…), mai un nom; **no hi ha fotos** (ni de perfil, ni àlbum, ni Memory amb fotos); la **demostració** queda desactivada.
- Es veu la **versió i la data** a la barra superior i a «Sobre MentA».
- L'app mesura sola, per participant, el **temps i els tocs fins al primer joc**, les partides, les pistes (i el nivell màxim), els abandons i si ha completat l'onboarding.
- Cada participant té un botó **«Escala SUS»** per introduir les 10 respostes; l'app calcula la puntuació.
- **Exportar els resultats** en un clic: un `.json` (amb resum) i un `.csv` per a l'anàlisi. Només hi ha codis, mai noms.

## 3. Full d'observació (una fila per participant)
`Codi · Edat aproximada · Primera vegada amb tauleta/mòbil (sí/no) · Temps fins al primer joc · Tocs · Errors · Dubtes · Ha fet servir «?» · Ha fet servir pistes (nivell) · Frustració (0-3) · Cita literal`

## 4. Escala SUS (System Usability Scale)
Resposta de 1 (gens d'acord) a 5 (molt d'acord). Puntuació: ítems senars (resposta − 1), ítems parells (5 − resposta), sumar i multiplicar per 2,5 (0–100). **Mitjana de referència habitual: 68.**

**Català** (és la que porta l'app)
1. Crec que faria servir MentA sovint.
2. He trobat MentA complicada sense necessitat.
3. He trobat MentA fàcil d'utilitzar.
4. Crec que necessitaria l'ajuda d'una persona per poder fer-la servir.
5. Les diferents funcions de MentA estan ben integrades.
6. He trobat massa incoherències a MentA.
7. Crec que la majoria de la gent aprendria a fer servir MentA molt de pressa.
8. He trobat MentA molt feixuga d'utilitzar.
9. M'he sentit molt segur/a fent servir MentA.
10. He hagut d'aprendre moltes coses abans de poder fer servir MentA.

**Castellano**
1. Creo que usaría MentA con frecuencia.
2. He encontrado MentA innecesariamente complicada.
3. He encontrado MentA fácil de usar.
4. Creo que necesitaría la ayuda de una persona para poder usarla.
5. Las distintas funciones de MentA están bien integradas.
6. He encontrado demasiadas incoherencias en MentA.
7. Creo que la mayoría de la gente aprendería a usar MentA muy rápido.
8. He encontrado MentA muy engorrosa de usar.
9. Me he sentido muy seguro/a usando MentA.
10. He necesitado aprender muchas cosas antes de poder usar MentA.

*Nota:* amb persones molt grans, llegeix les preguntes en veu alta i anota la resposta; l'escala 1–5 es pot ensenyar amb cinc cares. Els resultats amb pocs participants són **orientatius**, no estadístics.

## 5. Preguntes obertes
1. Què t'ha agradat més?
2. Què t'ha costat o t'ha molestat?
3. Hi ha alguna cosa que no has entès?
4. T'ha ajudat l'Elefant, o t'ha distret?
5. Hi jugaries a casa o a la residència? Amb qui?
6. (Cuidador) Què més necessitaries saber de com ha anat la persona?

## 6. Full de consentiment informat (model)
> **⚠ Cal que un professional (jurista o delegat de protecció de dades de la UPC) el revisi abans de fer-lo servir.**
> Les dades sobre estat d'ànim, medicació o rendiment en jocs cognitius poden ser **dades de salut**, que el RGPD considera una **categoria especial** amb protecció reforçada. A una **residència**, el consentiment l'ha de donar **el resident o, si no pot decidir, el seu tutor legal o representant**; mai el centre per ell.

**Model en llenguatge senzill:**

*Estudi sobre l'app MentA (projecte d'Empresa, UPC).*
- **Què farem:** provar una aplicació de jocs durant uns 20 minuts. Una persona prendrà notes de com us va.
- **Què es guarda:** només un **codi** (P01, P02…) i el que fas a l'app (quant temps trigues, què toques, quants jocs fas). **No** es guarden el teu nom, ni fotos, ni veu.
- **On es guarda:** al dispositiu de la prova. Els resultats s'exporten **sense cap nom**.
- **Per a què:** per millorar l'app. No es fa cap diagnòstic ni es jutja la teva memòria.
- **Voluntari:** pots deixar-ho quan vulguis, sense donar explicacions i sense cap conseqüència. Pots demanar que s'esborrin les teves dades.
- **Contacte:** *(correu del projecte, quan existeixi)*.

Nom i signatura de la persona: ______  Data: ____  
Si la persona no pot decidir: nom, parentiu/càrrec i signatura del tutor o representant: ______  
Nom de l'observador: ______

## 7. Instal·lar-la a les tauletes d'una residència

**Instal·lació com a app (PWA):** obre l'adreça del projecte (la del domini) al navegador, **Android/Chrome:** menú ⋮ → *Instal·la l'aplicació* / *Afegeix a la pantalla d'inici*. **iPad/Safari:** botó *Comparteix* → *Afegeix a la pantalla d'inici*. Obre-la una vegada amb connexió perquè es descarregui sencera; després funciona sense internet.

**Mode quiosc (que no se'n surtin):**
- **Android:** *Configuració → Seguretat → Fixació d'aplicació / Fixar pantalla* (el nom canvia segons el fabricant); obre MentA i fixa-la. Es desfixa amb el gest o botons indicats pel sistema. També hi ha el botó *Quiosc* dins l'app (pantalla completa).
- **iPad:** *Configuració → Accessibilitat → Accés guiat*; activa'l, obre MentA i prem tres cops el botó lateral/inici. Posa un codi.

**Recomanacions de la tauleta:** pantalla sempre activa mentre es carrega (*Configuració → Pantalla → Temps d'espera* / iPad *Bloqueig automàtic: mai*), volum al 60–70 %, **mida de lletra «Gran» o «Extra gran»** des de l'onboarding, mode **Residència** (selector de resident amb cara i nom) i un PIN del professional.

## 8. Mètriques d'èxit (per a l'assignatura d'Empresa)
| Mètrica | Objectiu recomanat | D'on surt |
|---|---|---|
| Temps fins al primer joc | **< 10 s** | mesurat per l'app (mode pilot) |
| SUS | **≥ 68** | escala SUS |
| % que completen l'onboarding | alt (≥ 80 %) | mesurat per l'app |
| Partides per setmana i participant | creixent | exportació |
| % que fa servir pistes | informatiu (no és un fracàs) | exportació |

Els objectius són **referències de treball**, no resultats: no n'hi ha cap de mesurat encara.

## 9. Llista de comprovació abans d'enviar-ho a ningú
- [ ] Domini aplicat (`python tools/aplica-domini.py …`) i HTTPS actiu.
- [ ] Dades de demostració esborrades; mode pilot activat amb un `CODI_PILOT` propi.
- [ ] Avís de **no-diagnòstic** visible (Sobre MentA, informes i onboarding).
- [ ] **Còpia de seguretat** provada (exportar → importar → desfer).
- [ ] Provada en un **mòbil i una tauleta reals** (no només a l'ordinador).
- [ ] Consentiment **revisat per un professional** i signat per cada participant.
- [ ] Adreça de contacte real a `CONTACTE` (o cap).
- [ ] Bateria i volum comprovats; mode quiosc configurat.
