# MentA · Registre de canvis · v1.9.4 «Preparats per al pilot» (16-10-2026)

Base: la 1.9.3 publicada a `https://mentactiva.app`. **Cap funcionalitat nova**: només el que cal perquè persones reals la facin servir sense perdre dades. Pla complet a `../PLA_APP_MentA_v1.10.md`.

## Fet
- **Domini propi** `mentactiva.app` aplicat (`tools/aplica-domini.py`): canonical, sitemap, `CNAME`, JSON-LD i `DOMINI` a `config.js`. HTTPS i redirecció de `www` comprovats.
- **El bloqueig del PIN sobreviu a recarregar la pàgina** (abans, recarregar permetia provar PIN sense límit). Es desa a `mentA_pin_bloqueig`, que no viatja amb les còpies de seguretat. Test: `tests/pin/test_pin_bloqueig.py`.
- **El feedback de l'app ja es pot enviar a un servei extern.** `tools/aplica-contacte.py` ara adapta també la CSP de `app/index.html` a l'origen de `FEEDBACK_URL` (abans només ho feia per a la web i l'enviament hauria quedat bloquejat). Mai `connect-src *`.
- **Prova de càrrega d'una residència** (`tests/residencia/test_estres.py`): 15 persones × 1 any (5.474 partides) ocupen 1,70 M de caràcters, es desen en ≈ 7 ms, el semàfor triga ≈ 11 ms i la còpia de seguretat és de ≈ 2 M. Queden ≈ 3,5 M de marge al `localStorage` de Chromium (≈ 2 anys més a aquest ritme).

## Ja existia (no s'ha tocat)
- L'avís d'instal·lació a iPhone/iPad (`8-producte.js`, `renderBanerInstalar`) explica «Comparteix → Afegeix a la pantalla d'inici». No s'ha afegit res per evitar un text nou sense traducció al castellà.

## Pendent de l'Oriol
- Posar `CODI_PILOT` propi, `FEEDBACK_URL` (p. ex. Formspree) i, després, executar `python tools/aplica-contacte.py`.
- Marcar *Enforce HTTPS* a GitHub Pages; provar-ho a un mòbil i a un iPad reals.
- Revisió del consentiment per un professional de la UPC (`docs/PILOT.md` §6).
