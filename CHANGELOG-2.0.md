# MentA · Registre de canvis · v2.0 «Les entrevistes» (5-11-2026)

Base: la 1.10.1. Són els canvis que l'Oriol ha triat de la llista feta a partir del document del projecte (entrevistes P01–P07 i S01–S08, síntesi 6.4 i Lean Canvas).

## Jocs i contingut
- **Mots encreuats** (nou; P03, P04, P07). Graelles noves cada vegada, amb tres nivells. Al mòbil hi cap tot sense desplaçar la pantalla.
- **Què va amb què?** (nou; S02, P06). Uneix cullera amb forquilla. Tres nivells, en català i castellà.
- **Tema de la setmana a La Tertúlia** (S04, S07). Cada dilluns canvia el tema (cuina, música, cinema, llocs, festes, història) i 3 preguntes de cada partida en són. Hi ha 48 preguntes noves per idioma.
- **Més contingut:** refranys nous (7 en català i 4 en castellà) i 8 dibuixos nous a «Troba les parelles».
- **Quants en recordes?** és més fàcil (S08): comença amb 2 números, va més a poc a poc i dona una segona oportunitat a cada nivell.

## Ajuda
- **El «?» fa sortir l'Elefant** i et diu què has de fer en aquell joc (S03, S04, S06, S08). Ofereix «Entesos», «Una pista», «Com es juga» i «Sortir del joc». El temps s'atura mentre parla. Si l'Elefant està apagat, surt el mateix en una finestra.
- **El so surt de la barra del joc al mòbil** perquè els títols no es tallin; es canvia a la pausa.

## Família i cuidador
- **Botó «Família i cuidador»** a l'inici, més visible, i explicat a la guia de primer ús (S02).
- **Explicació la primera vegada:** què és aquest espai, com començar i a qui va destinada l'app (S01, S02, S03, P06).
- **Els dos informes a la primera pantalla** i la pestanya «Informe» en segon lloc (decisió 2 de 6.4).
- **Avís si fa 3 dies o més que no juga,** amb un missatge preparat (S02, S03).
- **«Què li agrada»:** els jocs que més juga i els que no ha jugat (S07).

## Informe en PDF, refet de dalt a baix (S01, S07)
Fitxer nou `app/js/19-informe.js`. Fa servir tot el que l'app ja recull:
- **Resum:** semàfor, dies actius, partides, minuts, nivell d'encert, temps de reacció o ratxa i partides deixades a mitges, comparats amb els 28 dies anteriors.
- **Evolució de 12 setmanes:** encert i dies jugats.
- **Per àrees:** les 5 àrees, ara i fa 4 setmanes.
- **Per joc:** nivell, partides, mitjana, millor resultat, tendència, reacció, durada, ajudes i abandons.
- **Quan juga:** calendari de 12 setmanes, moment del dia amb l'encert de cada franja i dies de la setmana.
- **Només per al professional:** temps de reacció i variabilitat, ajudes i nivell de les pistes, pauses, canvis de nivell, mini-test i com es calcula el semàfor.
- **Només per a la família:** llenguatge planer, on li va millor i idees per a la setmana.
- **Tots dos:** ànim, hàbits, participació (punt següent), medalles, notes del cuidador i l'avís que no és un document mèdic.

L'informe de «Com vaig» és ara el mateix, en la versió per a la família.

## Residència i pilot
- **Activitat de grup:** preguntes molt grans per comentar a la sala, anotant qui hi ha participat (P05, S06). Qui no ha donat el consentiment no surt marcat.
- **Participació a l'informe:** partides amb algú i activitats de grup (P05).
- **Guia de 2 minuts per a l'equip** al panell de residència (P05).
- **Més dades al mode pilot** (Lean Canvas, bloc 8): sessions iniciades i completades, setmanes actives i amb repetició, joc més jugat i més abandonat, activitat social i si ha començat sense ajuda.

## Web
19 jocs, amb les captures dels dos nous i la resta de captures regenerades. El vídeo de la portada no s'ha tornat a gravar.

## Triat de no fer
Reptes a distància, joc en directe, De la A a la Z, Més alta o més baixa, Mou-te, lletra gran per defecte, nivells a La Tertúlia i Refranys, Joc del dia a l'inici, botó «Per a la família» a cada resident, avís de nivell menys insistent, «Nivell d'encert» primer al resum, Premium, anuncis, QR i Google Play. El codi dels que es van programar es conserva al `git stash` «v2.0 entrevistes: tots els canvis, per triar-los».

## Cal que ho revisi una persona
Les preguntes, els refranys i les parelles noves no els ha llegit cap persona gran ni cap persona aliena al projecte.

## Per a la Tabla D del document (5.1)
| Versión | Fecha | Evidencia que provoca el cambio | Modificación realizada |
|---|---|---|---|
| PMV V4 (v2.0) | 5/11/2026 | Entrevistas S01–S08 y decisión ITERAR (6.4): dudas al orientarse, dificultad excesiva en algún juego, panel del cuidador poco visible, informes muy valorados y riesgo de desgaste | Dos juegos nuevos, tema semanal y más contenido, ayuda del Elefante dentro de la partida, juego de números más fácil, Espacio del cuidador explicado y más visible, informe PDF completo, actividad de grupo para residencias y nuevas métricas del piloto |

## Proves
Nova: `tests/v200/test_v200.py`. Adaptades: `tests/jocs/bots.py`, `tests/jocs/test_regles.py`, `tests/pistes/test_pistes.py`, `tests/captures.py`, `tests/test_viatge18.py`, `tests/web/test_web.py` i `tests/web/test_aparador_control.py`.
