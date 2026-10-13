# Pla de prova amb usuaris — MentA 1.8

Objectiu: comprovar que **una persona gran sense ajuda** arriba a jugar en pocs segons, i que **qui la cuida** troba el que necessita sense llegir manuals. Aquesta prova **encara no s'ha fet**: aquest document és el guió per fer-la.

## Participants

| Grup | Quantes | Criteri | Notes |
|---|---|---|---|
| Persones grans | 5 | 65+ anys, que no hagin vist MentA | Barrejar nivells d'experiència amb mòbil/tauleta (almenys 2 amb poca). |
| Cuidadors | 3 | Familiars o professionals d'una residència o centre de dia | Almenys 1 professional. |

Amb 5 persones se solen detectar ~80 % dels problemes grans d'usabilitat; no serveix per a conclusions estadístiques.

## Abans de començar

1. **Consentiment informat** per escrit (o verbal gravat si la persona ho prefereix): s'observa l'app, no la persona; pot parar quan vulgui. Cap dada identificativa als resultats (P1, P2…).
2. Dispositiu real: un mòbil i una tauleta, amb l'app instal·lada i **dades buides** (esborrar abans de cada participant).
3. Qui dirigeix la prova **no ajuda**: només repeteix la consigna. Si hi ha bloqueig > 60 s, es marca «necessita ajuda» i es continua.
4. Un cronòmetre i el full d'observació (taula de baix).

## Guió de 5 tasques — persones grans

Llegiu la consigna tal qual, sense dir els noms dels botons.

| # | Consigna | Èxit | Temps objectiu |
|---|---|---|---|
| 1 | «Imagina't que acabes d'obrir l'aplicació. Vols jugar una estona.» | Comença a jugar sense ajuda | < 10 s, ≤ 2 tocs |
| 2 | «Ara busca un joc que t'agradi i juga una partida.» | Tria un joc concret i el juga | < 30 s fins a començar |
| 3 | «Fes que la lletra es vegi més gran.» | Canvia la mida de la lletra | < 20 s |
| 4 | «Vols saber com t'ha anat. Ensenya'm on ho miraries.» | Troba «Com vaig» | < 15 s |
| 5 | «Imagina que vols que et truqui una filla. Què faries?» | Troba «Avisar algú» o l'ajuda | < 20 s |

Per a cada tasca anoteu: **èxit** (sí / amb ajuda / no), **temps**, **tocs**, **errors** (tocs equivocats), **frases textuals** (el que diu en veu alta), **expressió** (dubte, frustració, somriure).

## Guió de 5 tasques — cuidadors

| # | Consigna | Èxit |
|---|---|---|
| 1 | «Entra a l'espai on es veu com juga la persona.» | Troba el candau i entra (amb PIN) |
| 2 | «Digues si veus alguna cosa a vigilar aquesta setmana.» | Interpreta el semàfor i el text, sense dir «diagnòstic» |
| 3 | «Anota una observació: ha tingut un mal dia.» | Crea una nota a la pestanya Notes |
| 4 | «Amaga un joc que la frustra i limita'n el nivell.» | Ho fa al Pla |
| 5 | «Prepara un informe per a la família.» | Genera el PDF de família |

Pregunta de comprensió després de la tasca 2: **«Aquest semàfor, què vol dir que està en groc?»** — esperem «convé fixar-s'hi», no «està malalt».

## Full d'observació (una fila per participant i tasca)

| Participant | Tasca | Èxit | Temps (s) | Tocs | Errors | Cita textual | Observació |
|---|---|---|---|---|---|---|---|
| P1 | 1 | | | | | | |

## Qüestionari SUS (escala d'usabilitat del sistema)

Es passa en acabar. Cada frase es puntua d'**1 (gens d'acord)** a **5 (totalment d'acord)**. Per a les persones grans, el llegeix l'investigador en veu alta.

1. Crec que m'agradaria fer servir aquesta aplicació sovint.
2. He trobat l'aplicació innecessàriament complicada.
3. He trobat que l'aplicació era fàcil d'utilitzar.
4. Crec que necessitaria l'ajuda d'una persona amb coneixements tècnics per poder utilitzar aquesta aplicació.
5. He trobat que les diferents funcions de l'aplicació estaven ben integrades.
6. He trobat que hi havia massa inconsistències en aquesta aplicació.
7. Imagino que la majoria de la gent aprendria a utilitzar aquesta aplicació molt ràpidament.
8. He trobat l'aplicació molt feixuga d'utilitzar.
9. M'he sentit molt segur/a utilitzant l'aplicació.
10. He necessitat aprendre moltes coses abans de poder començar a utilitzar l'aplicació.

**Càlcul.** Per a les frases imparells (1, 3, 5, 7, 9): puntuació − 1. Per a les parells (2, 4, 6, 8, 10): 5 − puntuació. Se sumen les 10 i es multipliquen per 2,5 → de 0 a 100. Referència orientativa: ≥ 68 és «acceptable»; ≥ 80 és «bo».

### Preguntes obertes (5 min)

- Què t'ha agradat més? Què t'ha molestat?
- Hi ha alguna paraula que no has entès?
- (Cuidadors) Ho faries servir? Què hi trobes a faltar? Et sembla bé que mostri un semàfor?
- (Persones grans) T'ha semblat que et feia sentir avaluat/da?

## Mètriques que cal resumir

- % d'èxit per tasca, sense ajuda.
- Temps mitjà i mediana per tasca.
- Tocs fins al primer joc (objectiu ≤ 2).
- SUS mitjà per grup (no barrejar persones grans i cuidadors).
- Llista priorizada de problemes (gravetat 0–4, com a `AUDITORIA-UX-1.8.md`).

## Què farem amb els resultats

1. Qualsevol problema que bloquegi una tasca a ≥ 2 persones es considera gravetat ≥ 3 i s'arregla abans de la següent versió.
2. Els resultats (anònims) s'afegeixen a `docs/PROVA-USUARIS-RESULTATS.md`.
3. Si el SUS de persones grans és < 68, es revisa l'inici abans de tocar res més.

## Ètica i privadesa

- No es graven cares ni veus sense permís explícit.
- No es recullen dades de salut. L'app s'usa amb dades d'exemple o amb un perfil de prova que s'esborra.
- Si una persona mostra fatiga o disgust, s'atura la prova i s'agraeix la col·laboració.
