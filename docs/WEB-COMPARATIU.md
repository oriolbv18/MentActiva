# Comparatiu abans / després de la web (v1.9 → v1.9.1)

Mesurat amb `tools/audit-web.py` (Playwright, `file://`, sense xarxa) a 9 amplades. *Abans* = web de la v1.9 (`docs/web-abans/`); *després* = v1.9.1 (`docs/web-despres/`). Tema clar, zoom 100 %.

## Mesures

| Amplada | gutter abans → després (px) | contingut abans → després (px) | capçalera abans → després (px) | `h1` abans → després (px) | `rem` abans → després (px) |
|---|---|---|---|---|---|
| 320 | 21.6 → 20 | 277 → 280 | 73 → 64 | 38 → 34 | 17.3 → 16 |
| 360 | 21.9 → 20 | 316 → 320 | 74 → 64 | 38 → 34 | 17.5 → 16 |
| 390 | 22.1 → 20 | 346 → 350 | 75 → 64 | 39 → 34 | 17.6 → 16 |
| 768 | 24.7 → 30.7 | 719 → 707 | 84 → 64 | 54 → 45 | 19.7 → 16.9 |
| 1024 | 26.4 → 41 | 971 → 942 | 90 → 64 | 64 → 53 | 21.1 → 17.6 |
| 1280 | 27.5 → 51.2 | 1225 → 1178 | 93 → 64 | 74 → 60 | 22 → 18 |
| 1440 | 27.5 → 120 | 1385 → 1200 | 93 → 64 | 79 → 63 | 22 → 18 |
| 1920 | 195.5 → 360 | 1529 → 1200 | 93 → 64 | 79 → 63 | 22 → 18 |
| 2560 | 515.5 → 680 | 1529 → 1200 | 93 → 64 | 79 → 63 | 22 → 18 |

**Gutter:** abans variava entre 21,6 i 27,5 px (massa estret a l'escriptori, perquè depenia del `rem` fluid de l'app); ara és `clamp(1.25rem, 4vw, 3rem)` (20 px al mòbil, uns 50 px a l'escriptori) i l'auditoria comprova que és **idèntic a totes les seccions** a cada amplada. A partir de 1440 px la columna mostra el marge fins al contenidor, que ja no creix: `(W − 1200)/2`.

## Errors de marges i espaiat (M1–M13)

| # | Reproduït abans? | Resolt després? | Com es comprova |
|---|---|---|---|
| M1 gutter desigual i estret | ✅ (21,6–27,5 px) | ✅ 20–48 px, igual a totes les seccions | `audit-web.py` → *gutter* |
| M2 el contenidor no limitava | ✅ (1529 px a 1920/2560; 1225 a 1280) | ✅ ≤ 1200 px | *ample-maxim* |
| M3 tot ~29 % massa gran | ✅ (`rem` 22 px, `h1` 79 px) | ✅ (`rem` 16–18 px, `h1` ≤ 63 px) | taula de dalt |
| M4 àncores sota la capçalera | ✅ (−13 px a 5 enllaços × 36 combinacions = 180 casos) | ✅ ≥ 16 px | *ancora* |
| M5 capçalera 73–93 px | ✅ | ✅ 64 px sempre | taula de dalt |
| M6 ritme vertical incoherent | ✅ (`--seccio-y` inexistent; paddings escrits a mà) | ✅ un sol `--seccio-y` | *ritme* |
| M7 xip i `h2` enganxats | ✅ (visual) | ✅ `.l-cap-seccio` + `gap` | revisió visual (`docs/web-despres/vista_*`) |
| M8 alineacions barrejades | ✅ (visual) | ✅ dues columnes sempre a l'esquerra; capçaleres centrades | revisió visual |
| M9 files òrfenes | ✅ (58 casos) | ✅ 0 | *fila-orfena* |
| M10 mòbils del hero desalineats | ✅ (visual) | ✅ un sol mòbil + Elefant | revisió visual |
| M11 botons del hero desiguals a mòbil | ✅ (visual) | ✅ graella d'1 columna, mateixa amplada | revisió visual |
| M12 xips que salten de línia | ✅ (visual) | ✅ `white-space: nowrap` a `.xips`, alçada uniforme | revisió visual |
| M13 peu sense estructura | ✅ (visual) | ✅ 4 columnes + línia de no-diagnòstic | revisió visual |

## Altres defectes (P1–P10)

| # | Defecte | Resolt? |
|---|---|---|
| P1 | Sense menú al mòbil | ✅ fulla amb focus atrapat, Escape i `inert` (`test_web.py`) |
| P2 | Contingut invisible sense JS | ✅ només s'amaga amb `html.js` (`test_web.py`: «sense JS»; abans la pàgina era buida) |
| P3 | Captures minúscules i en estats buits | ✅ captures recapturades amb el joc en marxa, més baixes, carrusel gran |
| P4 | Secció «Novetats» i versió «1.8» | ✅ eliminada; la versió surt de `config.js` |
| P5 | Formulari que no porta enlloc | ✅ no es mostra sense canal; `aplica-contacte.py` adapta la CSP |
| P6 | Hero sense cara | ✅ l'Elefant (SVG exportat de l'app) |
| P7 | Sense confiança visual | ✅ franja de 6 fets verificables + xip «En fase de proves» |
| P8 | JSON-LD amb `https://__DOMINI__/` | ✅ només es genera amb domini real |
| P9 | Legals i 404 desalineades | ✅ una sola plantilla (`web-shell.py`) |
| P10 | Mode fosc sense interruptor | ✅ botó de tema; captures amb marc i ombra |

## Incidències de l'auditoria

| | Abans (v1.9) | Després (v1.9.1) |
|---|---|---|
| Combinacions mesurades | 36 | 30 (el zoom 200 % només és possible a ≥ 640 px) |
| Incidències | **448** (àncores 180, imatges pesades 86, files òrfenes 58, gutter 78, CLS 20, ample 16, desbordament 8, tàctil 2) | **0** |

*Nota:* abans el «zoom gegant» s'emulava canviant la mida de lletra de `html`; per ser més realista, ara és el zoom del navegador al 200 % (finestra de la meitat d'amplada). La lletra de sistema gran es prova a part (`tests/web/test_accessibilitat.py`).
