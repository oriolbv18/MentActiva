"""Grava el vídeo del hero: un recorregut REAL de l'app (no una animació inventada) en bucle, sense àudio i sense dades personals.
Inici (Bon dia) → Els meus jocs → «Troba les parelles» → es troben les 4 parelles → resultat positiu → torna a l'inici.
Fa servir Playwright (record_video) i ffmpeg (imageio-ffmpeg). Surt: img/web/hero.webm (VP9), img/web/hero.mp4 (H.264) i img/web/hero-poster.webp
Ús: python tools/grava-video.py          (cal: pip install playwright imageio-ffmpeg)"""
import pathlib, re, shutil, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright
from PIL import Image
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = (ARREL / 'app' / 'index.html').as_uri()
OUT = ARREL / 'img' / 'web'
W, H = 540, 1170           # mateixa proporció que el marc de mòbil de la web (430 / 932); el vídeo es grava a 1× (Playwright no grava a 2×)
AMPLE_FINAL = 540          # píxels del vídeo exportat (el mòbil del hero fa uns 270 px CSS: 2×)

# Punt tàctil: un anell que s'expandeix on «es toca». Només existeix durant la gravació.
INJECTA = """() => {
  const st = document.createElement('style'); st.textContent = '.tap-gravacio{position:fixed;z-index:99999;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid rgba(29,107,64,.85);background:rgba(29,107,64,.18);pointer-events:none;animation:tapg 520ms cubic-bezier(.23,1,.32,1) forwards}@keyframes tapg{from{transform:scale(.4);opacity:1}to{transform:scale(1.5);opacity:0}}';
  document.head.appendChild(st);
  window.__tap = (x, y) => { const d = document.createElement('div'); d.className = 'tap-gravacio'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 600); };
  document.querySelectorAll('.toast, #toast, .avis-copia, #elefantFlotant').forEach(t => t.remove());
  new MutationObserver(() => document.querySelectorAll('.toast, .avis-copia, #elefantFlotant').forEach(t => t.remove())).observe(document.body, { childList: true, subtree: true });
}"""


def toca(pg, selector, espera=0.55):
    el = pg.locator(selector).first; el.wait_for(state='visible'); b = el.bounding_box()
    pg.evaluate('([x, y]) => window.__tap(x, y)', [b['x'] + b['width'] / 2, b['y'] + b['height'] / 2]); pg.wait_for_timeout(170)
    el.click(); pg.wait_for_timeout(int(espera * 1000))


def main():
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe(); tmp = pathlib.Path(tempfile.mkdtemp(prefix='menta_video_'))
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(bypass_csp=True, viewport={'width': W, 'height': H}, device_scale_factor=1, color_scheme='light', record_video_dir=str(tmp), record_video_size={'width': W, 'height': H})
        pg = ctx.new_page(); t_inici = time.time()
        pg.clock.set_fixed_time('2026-10-13T08:30:00')                # l'app diu «Bon dia» de debò: és la seva salutació segons l'hora
        pg.goto(APP); pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))))")
        pg.reload(); pg.wait_for_timeout(700)
        pg.evaluate("ajustes.rol = 'jo'; guardarAjustes(); mostrarPantalla('inici')"); pg.wait_for_timeout(500)
        pg.evaluate(INJECTA); pg.evaluate("document.getElementById('banerSistema') && (document.getElementById('banerSistema').innerHTML = '')"); pg.wait_for_timeout(600)
        t_ini_bo = time.time() - t_inici                              # a partir d'aquí comença el vídeo útil
        pg.wait_for_timeout(1000)                                     # l'inici, un moment quiet (aquest és el fotograma del «poster»)
        toca(pg, '.persona-targeta.dom-memoria', 0.9)                 # Els meus jocs
        pg.evaluate("assegurarJoc('memory')"); pg.wait_for_function("!!JOCS['memory']", timeout=8000, polling=50)
        toca(pg, '.joc-gran[data-joc="memory"]', 0.9)                 # Troba les parelles
        if pg.locator('#modalDificultat.actiu').count(): toca(pg, '#dificultatGrid button >> nth=0', 0.5)    # nivell fàcil: 4 parelles
        pg.wait_for_function("document.querySelectorAll('#memory-grid .carta.girada').length >= 8", timeout=6000, polling=50)    # vista prèvia: totes visibles
        noms = pg.evaluate("[...document.querySelectorAll('#memory-grid .carta')].map(c => (c.getAttribute('aria-label') || '').replace(/^Carta \\d+: /, '').replace(/, parella trobada$/, ''))")
        parelles = {}
        for i, n in enumerate(noms): parelles.setdefault(n, []).append(i)
        pg.wait_for_function("document.querySelectorAll('#memory-grid .carta.girada').length === 0", timeout=6000, polling=50); pg.wait_for_timeout(250)
        for n, (i, j) in parelles.items():
            toca(pg, f'#memory-grid .carta >> nth={i}', 0.3); toca(pg, f'#memory-grid .carta >> nth={j}', 0.5)
        pg.wait_for_timeout(1500)                                     # resultat positiu
        print('pantalla final:', pg.evaluate("[...document.querySelectorAll('.pantalla, section')].filter(e => e.offsetParent && e.id).map(e => e.id).slice(0, 3)"))
        for sel in ('#modalResultat .btn, #resultat-tornar, #btnTornarInici, [data-accio="inici"]',):
            if pg.locator(sel).count() and pg.locator(sel).first.is_visible(): toca(pg, sel, 0.8)
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); sessio = null; mostrarPantalla('inici')"); pg.wait_for_timeout(1700)
        durada = time.time() - t_inici
        ctx.close(); b.close()
    brut = next(tmp.glob('*.webm'))
    ini, fi = t_ini_bo + .15, durada - .1
    print(f'vídeo brut {brut.stat().st_size // 1024} KB · talla de {ini:.1f} s a {fi:.1f} s ({fi - ini:.1f} s)')
    alt = round(AMPLE_FINAL * H / W / 2) * 2
    filtre = f'fps=30,scale={AMPLE_FINAL}:{alt}:flags=lanczos,format=yuv420p'
    base = [ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{ini:.2f}', '-to', f'{fi:.2f}', '-i', str(brut), '-an', '-vf', filtre]
    subprocess.run(base + ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', str(OUT / 'hero.webm')], check=True)
    subprocess.run(base + ['-c:v', 'libx264', '-profile:v', 'main', '-crf', '30', '-preset', 'slow', '-movflags', '+faststart', str(OUT / 'hero.mp4')], check=True)
    png = tmp / 'p.png'; subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{ini + 0.9:.2f}', '-i', str(brut), '-frames:v', '1', '-vf', f'scale={AMPLE_FINAL}:{alt}:flags=lanczos', str(png)], check=True)
    Image.open(png).convert('RGB').save(OUT / 'hero-poster.webp', 'WEBP', quality=80, method=6)
    for n in ('hero.webm', 'hero.mp4', 'hero-poster.webp'): print(n, (OUT / n).stat().st_size // 1024, 'KB')
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__': main()
