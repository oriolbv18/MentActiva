# Actius de la web (v1.9.2): com es regenera cada un

Tot el que mostra el producte és **real**: captures i vídeo surten de l'app, no s'ha dibuixat res a mà. Per regenerar-ho cal Python amb `playwright` (i `playwright install chromium`), `Pillow` i `imageio-ffmpeg` (`pip install playwright pillow imageio-ffmpeg`).

| Actiu | Fitxer(s) | Pes | Com es regenera |
|---|---|---|---|
| **Vídeo del hero** | `img/web/hero.webm` (VP9) · `img/web/hero.mp4` (H.264) | 454 KB · 367 KB (objectiu ≤ 1,5 MB) | `python tools/grava-video.py`. Playwright grava un recorregut **real** de l'app (540×1170, mode convidat, rellotge fixat a les 8:30 → «Bon dia»): inici → Els meus jocs → «Troba les parelles» → es troben les 4 parelles → resultat positiu → torna a l'inici (≈ 14 s, en bucle). Sense dades personals. ffmpeg ve d'`imageio-ffmpeg` (inclou VP9 i H.264; el que porta Playwright només fa VP8). Un anell verd marca on «es toca» (només existeix durant la gravació). |
| **Poster del hero (LCP)** | `img/web/hero-poster.webp` | 28 KB | El mateix script: és un fotograma del vídeo. És la imatge que es veu sense JS, amb `prefers-reduced-motion`, amb *Save-Data* o si el vídeo no carrega. |
| **Captures de l'app a 3×** | `img/web/inici*.webp`, `jugar-amb-algu*`, `els-meus-jocs*`, `com-vaig*`, `cuidador-mobil*`, `cuidador-evolucio-mobil*`, `jocs/*.webp` (17 jocs, variants `-360`), escriptori i `selector-residents*` | ≈ 1,6 MB en total; res de tot això es baixa a la càrrega inicial (només el poster) | `python tools/captures-web.py` (també regenera `web/jocs.js`, el catàleg real). Captura a 430×932 (mòbil) i 430×772 (jocs) amb `deviceScaleFactor: 3`, exporta a 720/480 px i variants de 360 px. **Hores:** el rellotge del navegador es fixa a les **8:30 (Bon dia)**, **16:10 (Bona tarda)** i **21:30 (Bona nit)**; l'app calcula ella la salutació, cap captura s'edita. |
| **Elefant** | `img/web/elefant.svg` (repòs) · `elefant-saluda.svg` (trompa aixecada) · `elefant-hero.svg` (sense pupil·les) | 11 KB cadascun | `python tools/elefant-svg.py` exporta l'Elefant **de l'app** (el mateix dibuix, cap redisseny). `elefant-hero.svg` és el mateix sense les pupil·les: JavaScript les mou com a dos punts HTML (així no cal un SVG en línia, car de pintar). |
| **Imatge social 1200×630** | `app/img/social-1200x630.png` | 277 KB | `python tools/social-image.py`. Alba + panell Bosc, l'Elefant assegut sobre el mòbil i el titular; el `og:image:alt` és a `index.html`. |
| **Mòbil** | CSS (`.mobil`) | 0 KB | Bisell, vora de metall, illa dinàmica i reflex fets amb CSS. Cap PNG de marc. |
| **Recorregut de scroll** | `docs/web-premium-scroll.webm` | 3,7 MB (43 s) | `python tools/grava-scroll.py` (1440×900, ≈ 43 s). Només per revisar; no forma part de la web publicada. |

## Pressupost de pes
- Pàgina inicial **sense** el vídeo: 213 KB comprimits (mesurat amb Lighthouse: HTML, CSS, JS, dues tipografies, poster i logo). Objectiu ≤ 700 KB ✅.
- El vídeo (≤ 1,5 MB) **no es baixa** amb *Save-Data*, `prefers-reduced-data` ni `prefers-reduced-motion`, i no s'inicia fins que la pàgina és carregada i el navegador és en repòs.
- JS: `web/web.js` 21 KB (8 KB en gzip) + `web/mol.js` 1 KB (0,6 KB en gzip) = molt per sota dels 30 KB en gzip.

## Si canvies l'app
Torna a executar `captures-web.py` (captures i catàleg), `grava-video.py` (vídeo i poster), `elefant-svg.py` (si canvia la mascota), `social-image.py` i, per últim, `web-shell.py` (que posa la galeria de jocs a l'HTML) i `genera-doc-premium.py` (que actualitza les línies de la documentació).
