# MentA · Full de ruta

## Estat actual (v1.8)
Aplicació 100 % local: HTML + CSS + JavaScript pur, sense servidor, funciona amb `file://` i com a PWA. Les dades viuen al `localStorage`
(prefix `mentA_`, esquema versionat a `mentA_schema`, ara a la versió 3). La 1.8 afegeix dues capes en una sola app: **Persona** (simple) i **Espai del cuidador** (amb PIN), més el **mode Residència**.

## Arquitectura preparada per a un backend
El codi ja separa **dades** i **interfície** a cada mòdul, de manera que es pugui connectar un servidor més endavant sense reescriure les pantalles:

| Capa | Funcions (avui, sobre `localStorage`) | Què canviaria amb un servidor |
|---|---|---|
| Magatzem | `lsGet`, `lsSet`, `guardarUsuaris`, `guardarDadesUsuari` (`1-nucli.js`) | Substituir per un *repository* amb `async` que sincronitzi (local primer, núvol després: *offline-first*) |
| Sessions | `registrarPartida` (un sol punt d'entrada; cada partida és un objecte `{joc, domini, data, ts, durada, pct, puntuacio, nivell, mode, encerts, errors}`) | `POST /sessions` en cua; el registre local és la font de veritat fins que es sincronitza |
| Estadístiques | `6-estadistiques.js` només **llegeix** `dadesActuals().historial` | Seguiria llegint el mateix model; el servidor podria precalcular agregats |
| Família | `obtenirAlbum / obtenirMissatges / obtenirCalFam` + `renderX` (`4-familia.js`) | Un `FamilyRepository` amb la mateixa interfície; compartició per enllaç o invitació |
| Resum de la família | `resumFamiliaDades()` (dades) i `textResumFamilia()` / `dibuixaTargetaCompartir()` (presentació) | Enviament automàtic (correu/WhatsApp Business) amb consentiment |
| Feedback | `enviaText()` (`8-producte.js`) amb `FEEDBACK_URL` a `config.js` | Endpoint propi |

### Format de còpia de seguretat (ja estable)
`{ app: 'MentA', versio, schema, exportat, claus: { mentA_…: "<json>" } }`. Una futura importació des del servidor pot reutilitzar-lo.

## Funcions que només tenen sentit amb xarxa (no s'han inclòs a la v1.7)
* **Partides a distància i videotrucada familiar** (a la v1.6 hi havia un «codi de sala» que no connectava ningú; s'ha tret).
* **Resum automàtic setmanal** per a la família sense que l'usuari premi cap botó.
* **Sincronització entre dispositius** i recuperació si es perden les dades del navegador.
* **Comptes** (només si cal; es voldria mantenir el mode sense registre).

## Idiomes
La interfície és en català. El selector ca/es/en de la v1.6 només canviava la veu i s'ha retirat. Per fer-ho de debò caldria:
`app/js/i18n.js` amb diccionari, atribut `data-i18n` a l'HTML, traducció dels bancs de contingut (refranys, paraules, Tertúlia)
i, probablement, contingut diferent per a castellà (els refranys no es tradueixen).

## Idees de joc (si hi ha temps)
* **Records de la vida / reminiscència**: fotos o sons d'una època amb preguntes obertes.
* **Reconeix la cara / el so**.
* **Mode «sense temps»** explícit a tots els jocs que ho permetin.

## Proves de camp (fase d'usuaris reals)
Veure `LLEGEIX-ME.md`: com publicar-la, com recollir el feedback (formulari integrat + registre d'ús anònim exportable + informe d'error).

## Què porta la 1.8 a l'arquitectura
| Capa | Funcions | Notes per a un backend |
|---|---|---|
| Registre de sessió ampliat | `registrarPartida`, `iniciPartida`, `registraTR`, `registraAjuda`, `registraAbandonament` (`1-nucli.js`) | Cada sessió té `id`, `usuari`, `joc`, `domini`, temps de reacció (mitjana, mediana, variabilitat), abandonada, ajudes i pauses. Ja és el model que enviaria un servidor. |
| Semàfor | `calculaSemafor(d)` (`10-cuidador.js`) i `SEMAFOR` (`config.js`) | Regles públiques i configurables; poden viure al servidor sense canviar la UI. |
| Accés del cuidador | `hashPin`, `registraAcces` | Amb servidor, el PIN seria un compte real amb autenticació forta. |
| Mode lectura | `importaPaquetLectura`, `modeLectura` | Substituiria el paquet JSON manual per una vista compartida amb permisos. |
| Residència | `11-residencia.js` | Un servidor de centre permetria diverses tauletes sobre el mateix grup de residents. |

## Prioritats de la 2a etapa (proposta)
1. **Prova amb usuaris reals** (`docs/PROVA-USUARIS.md`): és la millor inversió abans d'afegir res més.
2. **Avaluació d'impacte de protecció de dades (AIPD/DPIA) i RGPD**: les dades d'ànim, medicació i rendiment cognitiu poden ser **dades de categoria especial**. Cal decidir responsable del tractament, base jurídica (consentiment o de qui exerceix la tutela), conservació i dret d'esborrat, **abans** de qualsevol servidor o ús comercial amb residències.
3. **Backend mínim** amb comptes de cuidador/centre, xifratge en trànsit i en repòs, i sincronització «local primer».
4. **Família a distància de debò**: resum automàtic setmanal i vista de només lectura sempre actualitzada (avui és un paquet JSON manual o un missatge amb Web Share).
5. **Validació clínica** amb un professional (neuropsicòleg/geriatra) de les regles del semàfor i dels indicadors. Fins llavors, són orientatius i no mèdics.
6. **Dificultat adaptativa millor** (avui és una regla simple de pujar/baixar nivell amb silenci).
7. **Seguretat del PIN**: avui és un *hash* SHA-256 amb *sal* a `localStorage`, suficient per evitar accessos casuals però no per resistir un atacant amb accés al dispositiu.

## Límits coneguts de la 1.8
* Sense servidor: la família a distància veu una «foto» (paquet o resum), no dades en directe.
* El PIN no és seguretat forta (vegeu dalt i `docs/CUIDADOR.md`).
* Les regles del semàfor no estan validades clínicament.
* No s'ha provat amb lectors de pantalla reals ni amb persones grans reals; les proves automàtiques (bots, axe-core, captures) no ho substitueixen.
* El mode Residència comparteix un únic dispositiu: no hi ha usuaris simultanis ni auditoria legal.
