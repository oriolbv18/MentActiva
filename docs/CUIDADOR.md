# Espai del cuidador — indicadors i regles del semàfor (v1.8)

## Què és i què NO és

L'Espai del cuidador mostra **com juga** una persona: constància, resultats i velocitat de resposta, **comparats amb ella mateixa**. Serveix per començar una conversa («fa dies que no et veig jugar, com estàs?»), no per diagnosticar.

> **Avís legal (surt a totes les pantalles de dades del cuidador i als PDF):** «Aquests indicadors són orientatius i mesuren el rendiment en uns jocs, no la salut. MentA no és un dispositiu sanitari ni fa diagnòstics. Si observeu canvis que us preocupen, consulteu un professional de la salut.»

MentA **no afirma** que una baixada indiqui deteriorament cognitiu, ni que una pujada indiqui millora clínica. Un resultat pot canviar per cansament, medicació, un mal dia, l'hora, o perquè el joc és nou.

## Accés i seguretat

- **PIN de 4 xifres.** Es guarda només com a *hash* SHA-256 amb *sal* aleatòria (`mentA_cuidador`), mai en clar. Els hashes no s'inclouen a les còpies de seguretat ni als paquets de lectura.
- **Honestedat:** el PIN impedeix l'accés casual des de la mateixa app, **no és seguretat forta**. Qui tingui el dispositiu desbloquejat i coneixements tècnics pot llegir `localStorage`. Per a protecció real, cal xifrar el dispositiu.
- **Intents:** 5 errors seguits bloquegen l'entrada durant 30 segons.
- **«He oblidat el PIN»:** explica que la única manera de recuperar-lo és esborrar totes les dades d'aquest dispositiu (no hi ha servidor ni correu de recuperació).
- **Tancament automàtic:** als 5 minuts sense activitat l'espai es tanca.
- **Com s'hi entra:** candau discret a l'inici (o mantenir premut el logo 3 s).
- **Registre d'accessos** (`mentA_registre_accessos`): quan s'entra, s'exporta, s'edita… Visible per a la persona a la pantalla de transparència.

## Pestanyes

| Pestanya | Què mostra |
|---|---|
| **Resum** | Semàfor, 6 indicadors de les últimes 4 setmanes, aspectes a vigilar, botó per enviar el resum setmanal. |
| **Evolució** | Gràfics de precisió, dies actius i temps de reacció, amb les **notes del cuidador** marcades sobre el gràfic. |
| **Jocs** | Per joc: partides, millor resultat, nivell, tendència. |
| **Salut i ànim** | Registre de la persona (aigua, passeig, descans, medicació, ànim) i el mini-test de memòria (joc orientatiu). |
| **Notes** | Observacions amb data. Surten als gràfics i a l'informe. |
| **Pla** | Jocs amagats, nivell màxim, durada de sessió, hora del recordatori, mida de lletra, so, una mà, contrast, 2 jugadors i mode família. |
| **Informe** | PDF família, PDF per a professional sanitari, CSV de partides, paquet de lectura (JSON) i resum per compartir. |
| **Residència** | (només en mode Residència) panell de planta. |
| **Ajustos** | Rol, PIN, nom del cuidador, consentiment, privadesa, còpia de seguretat. |

## Registre de cada sessió

Cada partida desa: `id`, `usuari`, `joc`, `domini`, `data`, `horaInici`, `durada`, `nivell`, `mode`, `encerts`, `errors`, `precisio`, `tempsReaccioMitja`, `tempsReaccioMediana`, `variabilitatTR`, `abandonada`, `ajudesUsades` i `pausesFetes`. El temps de reacció només s'enregistra als jocs de resposta ràpida (N-back, Stroop, Span, Què falta, Càlcul, Seqüència lògica, Tertúlia, Refranys, Fluïdesa, Paraules).

## El semàfor

Quatre estats, **sempre amb icona i text** (mai només color):

| Estat | Icona | Text |
|---|---|---|
| Verd | ✓ | Tot en ordre |
| Groc | ⓘ | Convé fixar-s'hi |
| Vermell | ↓ | Convé parlar-ne amb calma |
| Gris | — | Encara no hi ha prou dades |

### Principis

1. **Mai es compara amb població general ni amb "normes d'edat".** Només amb **el que ella mateixa feia** les 4 setmanes anteriors (línia base).
2. **Mínim de dades:** calen almenys **6 sessions en les últimes 8 setmanes**. Si no, estat gris i missatge explicatiu; no s'inventa res.
3. **Cal persistència:** una baixada puntual no activa res. Cal que es repeteixi 2 setmanes seguides (groc) o 3 (vermell).
4. **Conservador:** és preferible no avisar a avisar per error.
5. **Transparent:** cada avís diu per què ha sortit, amb números, i **«Com interpretar-ho»**. A la pantalla Resum hi ha «Com es calcula el semàfor?».
6. **Configurable:** els llindars són a `app/js/config.js` (`SEMAFOR`).

### Regles (valors per defecte)

| Indicador | Condició | Estat |
|---|---|---|
| Precisió | Menys del **85 %** de la seva mitjana de les 4 setmanes anteriors, **2 setmanes seguides** (mínim 2 sessions per setmana) | Groc |
| Precisió sostinguda | Més d'un **25 %** per sota, **3 setmanes seguides** | Vermell |
| Constància | Dies actius per setmana ≤ **50 %** de la línia base (≥ 3 dies abans), **2 setmanes seguides** | Groc |
| Inactivitat | **5** dies sense jugar (si abans hi havia ritme) | Groc |
| Inactivitat llarga | **10** dies sense jugar | Vermell |
| Abandonaments | Més del **40 %** de les partides deixades a mitges en 14 dies (mínim 5 intents) | Groc |
| Temps de reacció | Més d'un **25 %** per sobre del seu habitual, **2 setmanes seguides** | Groc |
| Ànim | **4** o més dies de 7 amb ànim «Baix» o «Cansat» (mínim 5 dies anotats) | Groc (observació) |

L'estat global és el pitjor dels avisos: vermell si n'hi ha algun de vermell, groc si n'hi ha de grocs, verd si no. Quan hi ha una nota del cuidador al període, es mostra al costat de l'avís («Nota: ha canviat de medicació»).

### Què no fa el semàfor

- No diu mai «deteriorament», «demència», «Alzheimer» ni cap altre diagnòstic.
- No compara persones entre elles (el panell de residència ordena per «qui necessita atenció», no per «qui va millor»).
- No s'avisa a la persona, només al cuidador.

## Consentiment i transparència

- Pantalla amb la persona: **què es desa, qui ho veu i què pot fer** (descarregar, esborrar). Consentiment **«Sí, estic d'acord» / «Ho gestiona la família o el tutor legal» / «Ara no»** (amb data i qui el va donar).
- Si el consentiment és «Ara no», les pestanyes Resum, Evolució, Jocs i Salut diuen «Sense consentiment per mostrar les dades», els informes queden bloquejats i **la persona no s'inclou a les exportacions de planta** (Residència).
- **RGPD / dades de salut:** les dades d'ànim, medicació i rendiment cognitiu poden ser **dades de categoria especial**. A la 1.8 **no surten del dispositiu** tret que l'usuari les exporti o comparteixi. Un cop es comparteixi un PDF o un resum per WhatsApp/correu, ja no hi ha control. Vegeu `docs/ROADMAP.md` (avaluació d'impacte, responsable del tractament, xifratge).

## Família a distància (sense servidor)

- **Resum setmanal** per Web Share (WhatsApp, correu…) amb un recordatori per fer-ho cada setmana.
- **Paquet de lectura** (JSON): un familiar l'obre a la seva app en **mode només lectura**; veu l'espai del cuidador sense poder modificar res. No inclou el PIN.
- Limitació honesta: no és sincronització en directe; el familiar veu una **foto** del moment en què es va exportar.

## Mode Residència

- Selector de residents amb foto i nom grans. Torna sol al selector als 3 min d'inactivitat.
- **Panell de planta** (PIN del professional): semàfor per resident, ordenable i filtrable, qui no ha jugat avui o en X dies, resum de planta, exportació **CSV** i **PDF** en bloc, mode **quiosc**.
