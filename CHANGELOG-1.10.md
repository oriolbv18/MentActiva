# MentA · Registre de canvis · v1.10 «Les proves de l'Oriol» (2-11-2026)

Base: la 1.9.4. Canvis demanats després de provar l'app en un mòbil real.

## Els 21 punts
1. **Memory:** trobar totes les parelles dona almenys 2 estrelles; amb pocs intents, 3. Només en dona 1 amb molts intents (més de 3 per parella).
2. **Pausa:** el botó «Canviar el nivell» no existia a l'HTML; ara hi és. Si es tanca el selector sense triar, es torna a la pausa.
3. **Onboarding:** al mini-joc només té color el cercle encès, s'apaguen tots entre ronda i ronda i el text diu què cal fer.
4. **Mòbil:** els botons de lletra, so i ajuda ja no es tallen (provat a 320, 360 i 390 px amb les 4 mides de lletra).
5. **Tutorial interactiu** als 17 jocs (`app/js/tutorials.js`): una mini-partida guiada la primera vegada i en prémer «?».
6. **Recorda la lletra:** la fitxa es gira entre lletra i lletra.
7. **Digues paraules → Troba l'intrús:** «Quina paraula NO és un animal?». Tres nivells.
8. **Quants en recordes:** hi ha un buit i una animació entre número i número.
9. **Comptes de cada dia:** sense cèntims ni percentatges. Tres nivells molt més senzills.
10. **Quin número falta → Completa la sèrie:** el nivell baix comença comptant i puja a poc a poc. S'hi afegeixen dies, mesos, lletres, hores i euros.
11. **Què falta aquí:** compte enrere amb números i barra.
12. **Recorda la seqüència:** en il·luminar-se ja no apareix la rodona.
13. **Sopa de lletres:** de 32 a uns 250 paraules (català i castellà).
14. **Els meus jocs:** surten tots, o els que es triïn a Ajustos avançats i a Cuidador (Pla i Jocs). «Veure tots els jocs» ara també els respecta.
15. **Dames:** avís «Has de menjar!», peces en vermell, creu a la peça rival i casella de salt marcada.
16. **Bingo:** la bola surt gran al mig de la pantalla i vola al seu lloc.
17. **Endevina la paraula:** de 68 a 198 paraules.
18. **Bingo:** només a «Jugar amb algú». *Interpretació meva del punt: cal que l'Oriol ho confirmi.*
19. **Medalles:** celebració en guanyar-ne una.
20. **Medalles modificables:** crear-ne, canviar nom i objectiu, amagar i restablir. Pantalla nova «Les meves medalles» (abans la llista no es veia enlloc).
21. **Àlbum:** botó «Fer una foto» (càmera del mòbil; a l'ordinador, vista dins de l'app). Dues fotos del mateix dia ja no s'esborren entre elles.

## Errors trobats per l'agent de proves i corregits
- El joc es quedava penjat en tancar el selector de nivell sense triar.
- La medalla sortia a sobre d'una partida en marxa; el focus de teclat se n'escapava; no hi cabia en un mòbil apaïsat.
- Mentre es preguntava «Sortir del joc?», els temporitzadors seguien corrent. El botó enrere deixava modals oberts.
- Doble toc a «Saltar i jugar» obria un segon joc.
- El PIN de l'editor de medalles es podia saltar entrant per l'adreça.
- El tauler de Dames s'encongia en sortir l'avís amb lletra gran en mòbils petits; les marques no es veien en el tema fosc.
- Desplaçament lateral a l'editor de medalles i a «Els meus jocs» amb lletra gran.
- Molt text en català dins del mode castellà; pistes que revelaven la paraula; errors de contingut.

## Proves
Passen: `tests/v110/test_correccions.py` (nova), regles, recorregut complet, parella, bingo, onboarding, PWA, CSP, castellà, pilot, pistes, Elefant, usuaris, còpia i contrast.

## Pendent: vegeu la memòria del projecte i aquesta llista
- Provar els jocs al mòbil i la part de cuidador, medalles, còpies i «Jugar amb algú» amb agents: **no s'ha fet** (es van aturar sense informe).
- Regenerar les captures de la web: les de «Troba l'intrús», «Comptes de cada dia» i «Completa la sèrie» encara ensenyen els jocs antics.
- Punt 18: confirmar la interpretació. Lector de pantalla real i iPhone: sense provar.
