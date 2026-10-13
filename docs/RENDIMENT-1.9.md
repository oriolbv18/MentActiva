# Rendiment i pressupost · v1.9

Mesurat amb Playwright/Chromium en aquest ordinador (`tests/rendiment/mesura.py`). Són **mesures d'aquest equip**, no d'un mòbil real: en un mòbil mitjà es veuran pitjor; per això es mesura també amb la CPU frenada ×4.

## Pes (sense comprimir)
| | KB | Pressupost |
|---|---|---|
| JS que es carrega a l'inici | 403 | < 450 |
| JS dels jocs (sota demanda, un per un) | 152 | — |
| **JS total** | 555 | < 700 |
| CSS | 149 | < 200 |
| L'Elefant (dibuix + motor + CSS) | 57 | < 60 |
| Castellà (diccionari, bancs i diàlegs; es carrega a l'inici) | 148 | — |

## Temps
| | CPU normal | CPU ×4 | Pressupost |
|---|---|---|---|
| DOMContentLoaded | 131 ms | 774 ms | — |
| Càrrega completa | 135 ms | 793 ms | < 2500 ms (×4) |
| Obrir un joc (mediana) | 42 ms | 126 ms | — |
| Resposta a un toc (mediana) | 33.2 ms | 33.1 ms | < 100 ms |
| Fotogrames/s a l'inici amb l'Elefant celebrant | 60 | 60 | ≥ 24 |
| Memòria JS | 9.5 MB | 9.5 MB | — |

L'animació de l'Elefant s'atura amb la pestanya oculta, passa a 30 fps si el dispositiu va lent i l'Elefant «mini» de la barra dels jocs va a 20 fps.

Resultat del pressupost: **tot dins del pressupost**.
