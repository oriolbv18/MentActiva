# Contacte de la web (v1.9.2)

**Estat actual:** `CONTACTE.email = menta.app.upc@gmail.com` i `CONTACTE.instagram = https://www.instagram.com/menta.upc/` (donats per l'Oriol). Per tant la web **mostra el formulari** (per `mailto:`), el correu i l'Instagram a «Parlem-ne» i al peu. Falta, si es vol, un formulari extern (vegeu més avall).

La web **no mostra mai** un formulari que no porti enlloc. Segons el que hi hagi a `CONTACTE` (a `app/js/config.js`):

| `email` | `formulari` | Què veu el visitant |
|---|---|---|
| buit | buit | (no és l'estat actual) Una targeta amable: «Estem preparant el contacte» + botó «Envia feedback des de l'app». Cap formulari. |
| omplert | buit | El formulari; en enviar-lo s'obre el programa de correu amb el missatge preparat (`mailto:`). |
| qualsevol | URL https | El formulari; s'envia per `fetch` (POST, JSON) al servei (Formspree, Getform, etc.). |

## Com activar un formulari extern (3 passos)
1. Crea el formulari al servei i copia la seva URL `https://…`.
2. Posa-la a `CONTACTE.formulari` de `app/js/config.js`.
3. Executa **`python tools/aplica-contacte.py`**. Afegeix **només l'origen** del servei (p. ex. `https://formspree.io`) a `connect-src` de la CSP de `index.html`. Sense això el navegador bloquejaria l'enviament. Mai no s'usa `connect-src *`. Si tornes a buidar `formulari`, torna a executar-lo i la CSP torna a la base.

`--simula` ensenya què canviaria sense tocar res.

## Correu i xarxes
- `CONTACTE.email` activa el formulari per `mailto:`, l'enllaç «També per correu» i, amb domini, `.well-known/security.txt`.
- Les xarxes (`whatsapp`, `instagram`, `facebook`, `youtube`, `tiktok`, `linkedin`) només es mostren si són URL vàlides del seu domini; si no, no apareix res.
- `CONTACTE.equip` (llista de noms) es mostra a «Qui som». No es mostren fotos inventades.

## Preselecció del motiu
`?motiu=residencia`, `?motiu=prova`, `?motiu=suggeriment` o `?motiu=altre` preselecciona el motiu del formulari (els botons «Demana una demo» ho fan sense recarregar la pàgina).
