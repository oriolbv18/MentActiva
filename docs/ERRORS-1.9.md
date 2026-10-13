# Errors trobats i corregits a la v1.9

## E1 · Els usuaris nous no apareixen a la llista fins que es toca la icona de dalt a la dreta

**Símptoma.** En crear usuaris (sobretot a la residència) no sortien a la llista fins que es feia clic a la icona d'usuari.

**Causa real (confirmada a la 1.8).** `guardarUsuari()` feia `usuaris.push(...)`, desava i cridava `refrescarTot()`, però `refrescarTot()` només repintava capçalera, inici, menú de jocs, família i perfil. Les llistes d'usuaris (modal, **selector de residents**, panell de residència, selector de «Jugar amb algú») es pintaven **només en obrir-se** (`obrirModalUsuaris()` → `renderitzarLlistaUsuaris()`, o `PANTALLA_ENTRA.selectorResident`). Qualsevol llista que ja era pintada quedava obsoleta; tocar la icona obria la modal i la repintava, per això «apareixien». A més, els ids eren `'u_' + Date.now()`, que es pot repetir si es creen usuaris amb menys d'1 ms de diferència.

**Arreglament (a l'arrel).**
- `1-nucli.js`: font única — `afegirUsuari`, `editarUsuariDades`, `treuUsuari`, `idUsuariNou` (`crypto.randomUUID` amb alternativa i comprovació de col·lisió) i `notificaUsuaris()`, que dispara l'esdeveniment `menta:usuaris`.
- `3-progres.js`: `repintaVistesUsuaris()` (modal, selector de residents, panell del cuidador, «Jugar amb algú»), cridada per `refrescarTot()` i pel listener de `menta:usuaris`. Cap `setTimeout`, cap dependència de l'ordre d'obertura de modals.
- Onboarding i mode demostració (carregar/sortir) també passen per `notificaUsuaris()`. La importació de dades recarrega l'app, així que ja es pinta de nou.

**Test.** `tests/usuaris/test_usuaris.py`: 10 usuaris seguits a màxima velocitat des del selector de residents, la modal, el panell de residència (obert) i «Jugar amb algú»; editar, eliminar, demo i recàrrega; mòbil, tauleta i ordinador. 0 fallades, 0 errors de JS.
