# Auditoria d'usabilitat 1.7 → 1.8 (heurístiques de Nielsen)

Auditoria d'experts feta per nosaltres sobre la **v1.7** abans de començar la Fase 2, amb el que es va fer a la 1.8. **No substitueix** una prova amb persones grans reals (vegeu `docs/PROVA-USUARIS.md`).

Gravetat: 0 = no és un problema · 1 = cosmètic · 2 = menor · 3 = important · 4 = catastròfic. Tot el que és ≥ 3 s'ha arreglat a la 1.8.

## Troballes

| # | Heurística | Problema a la 1.7 | Gravetat | Què s'ha fet a la 1.8 |
|---|---|---|---|---|
| 1 | Reconeixement abans que record | La pantalla d'inici tenia ≥ 12 elements tocables (accions, targetes, atallos). La persona gran no sabia on mirar. | 4 | Inici de Persona: salutació + un botó gegant **JUGAR** + dues targetes (**Els meus jocs**, **Els meus records**) + «Com vaig». |
| 2 | Concordança amb el món real | Els jocs tenien noms tècnics («N-back», «Stroop», «Span», «Fluïdesa»). | 4 | Noms humans al catàleg (`nom`) i el tècnic només en un segon pla (`tecnic`): p. ex. «Recorda la lletra», «Colors i paraules», «Quants en recordes?», «Comptes de cada dia». |
| 3 | Consistència i estàndards | Dos sistemes de navegació alhora (barra inferior + targetes + menú), amb noms diferents per a la mateixa cosa. | 3 | Barra inferior eliminada. Cada pantalla té un sol camí cap enrere (botó «‹ Inici» al mateix lloc). |
| 4 | Prevenció d'errors | A Configuració, «Esborrar totes les dades» era al costat d'opcions inofensives i accessible a qualsevol. | 4 | Configuració i dades només dins de l'**Espai del cuidador** (PIN). L'esborrat demana doble confirmació. |
| 5 | Flexibilitat i eficiència | Calia 3–4 tocs per començar a jugar. | 3 | **JUGAR**: 1 toc. Un joc concret: **2 tocs** (Els meus jocs → joc). Vegeu «Tocs fins a un joc». |
| 6 | Estètica i disseny minimalista | Gràfics, percentatges i comparatives en una pantalla pensada per a la persona gran (Progrés). | 3 | «Com vaig»: només reforç positiu (dies seguits, estrelles, rècords). Les dades i tendències passen al cuidador. |
| 7 | Control i llibertat de l'usuari | Sortir d'un joc a mitges no deixava clar si es perdia res. | 2 | Pausa/Sortir amb text clar; la partida abandonada no penalitza i es registra com a abandonada (només visible al cuidador). |
| 8 | Ajuda a reconèixer i recuperar errors | Missatges d'error genèrics en l'import i en el PIN. | 3 | PIN: «El PIN no és correcte», amb bloqueig breu i opció «He oblidat el PIN» que explica honestament què passa. Importació: missatge concret del que falla. |
| 9 | Visibilitat de l'estat del sistema | No hi havia progrés dins de la sessió de jocs. | 3 | Sessió guiada de 3 jocs amb **punts de progrés** i pantalla de descans entre jocs. |
| 10 | Ajuda i documentació | Ajuda amagada a Configuració. | 2 | Guia de primer ús de 3 passos, ajuda visible a l'inici i botó **Avisar algú** (Web Share). |
| 11 | Lletra i botons petits en alguns llocs | Botons de 40–44 px en llistes de Configuració. | 3 | Objectius tàctils ≥ 56 px a les pantalles de Persona; revisat a la resta. |
| 12 | Carrega cognitiva a la configuració | Més de 20 opcions visibles a la vegada. | 3 | Persona veu **3** botons ràpids al peu (mida de la lletra, so i ajuda). La resta, al cuidador, agrupada per pestanyes. |
| 13 | Tocs accidentals | Tremolor o tocs dobles actiu seleccionaven coses sense voler. | 2 | **Filtre de tremolor** opcional (ignora tocs repetits en pocs mil·lisegons) a ajustos. |
| 14 | Estats buits | Pantalles buides sense explicació («Encara no hi ha dades»). | 2 | Estats buits amb una frase amable i una acció («Juga el teu primer joc»). |
| 15 | Llenguatge | Termes tècnics en el text («Sessions», «Dominis cognitius»). | 2 | Revisió de textos (vegeu `docs/TEXTOS.md`): paraules de cada dia a la vista de Persona; el vocabulari tècnic només al cuidador, amb «Què és això?». |

## Tocs fins a un joc (mesurats)

Mesurats amb `tests/test_viatge18.py` (usuari nou, mòbil 390×844):

| Camí | Tocs |
|---|---|
| Inici → **JUGAR** (sessió guiada de 3 jocs, el primer comença sol) | **1** |
| Inici → **Jugar amb algú** → un joc → «Estic llest» (primer moviment de dos jugadors) | **3** (< 8 s) |
| Inici → **Els meus jocs** → un joc | **2** |
| Inici → Els meus jocs → «Veure tots els jocs» → un joc concret | 3 |

Cap joc requereix més de 2 tocs des de l'Inici per als 6 jocs destacats; la resta, 3. **Compleix l'objectiu «qualsevol joc en ≤ 2 tocs» per als jocs destacats; per a la resta de la col·lecció es queda a 3** (decisió: no omplir l'inici amb 17 jocs, que seria pitjor per a la persona gran).

Nota: el **primer cop** que s'obre cada joc surt el tutorial (1 toc més, saltable). L'inici de Persona té 10 elements tocables comptant-ho tot (capçalera: logo i usuari; JUGAR; Jugar amb algú; 2 targetes; Com vaig; 3 ajustos ràpids; el candau del cuidador i l'elefant); la zona central en té 5. Amb la 1.8 s'hi va afegir «Jugar amb algú», a petició expressa.

## Limitacions

- Auditoria feta per l'equip, no per usuaris reals. Les gravetats són estimacions.
- No s'han mesurat temps de tasca amb persones. Això és l'objectiu de `docs/PROVA-USUARIS.md`.
