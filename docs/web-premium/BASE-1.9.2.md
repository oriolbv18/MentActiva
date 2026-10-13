# Línia de base: la web 1.9.2 (abans de la 1.9.3)

Mesures fetes sobre `Menta_Web.1.9.2` abans de tocar res (els números de qualitat són els de l'entrega de la 1.9.2; el del problema 1 s'ha mesurat de nou amb Playwright).

| Mesura | 1.9.2 |
|---|---|
| Lighthouse mòbil: Accessibilitat · Bones pràctiques · SEO | 100 · 100 · 100 |
| Lighthouse mòbil: rendiment (5 tandes) | 74 · 76 · 81 · 85 · 95 → **mediana 81** |
| CLS | 0 (Lighthouse); màxim 0,014 a l'auditoria |
| Pes de la pàgina (sense vídeo, comprimit) | 213 KB |
| `tools/audit-web.py` (30 combinacions) | 0 incidències, 0 tasques llargues |
| `tests/web/*` | verds; axe-core 0 violacions |
| Contrast | 0 parells sota AA |

## Problema 1 reproduït: l'aparador de jocs (`#jocs`, 1440 px)
- Moviment automàtic de la fila 1: **25,8 px/s** (animació `marquee` de 90 s sobre una pista de 4.617 px, que inclou les còpies).
- Per recórrer la pista cal **≈ 90 s**; amb 9 cartes a la primera fila (≈ 228 px cadascuna), la novena carta ja triga uns 80 s a arribar al centre i la fila 2 va en sentit contrari. Veure els 17 jocs «sense fer res» costa **més d'un minut**.
- No es pot moure: no hi ha fletxes, ni arrossegament, ni teclat; el *hover* només pausa.
- El nou test `tests/web/test_aparador_control.py` **falla** sobre la 1.9.2 (no hi ha `#jocSeg`/`#jocPos` ni una sola fila) i ha de passar a la 1.9.3: `MENTA_ARREL=<ruta de la 1.9.2> python tests/web/test_aparador_control.py`.
