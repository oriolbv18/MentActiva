"""Grava un recorregut de scroll de 20–30 s per la web a 1440×900 (docs/web-premium-scroll.webm), perquè es vegi el moviment sense obrir res.
Playwright grava el vídeo i ffmpeg (imageio-ffmpeg) el torna a comprimir en VP9. Ús: python tools/grava-scroll.py"""
import pathlib, shutil, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
W, H = 1440, 900

# (selector on aturar-se, JS per calcular el desplaçament objectiu, pausa en ms)
PUNTS = [
    ('hero', "0", 3200),
    ('dia 1', "document.querySelectorAll('.bloc')[0].getBoundingClientRect().top + scrollY - (innerHeight - document.querySelectorAll('.bloc')[0].offsetHeight) / 2", 1500),
    ('dia 2', "document.querySelectorAll('.bloc')[1].getBoundingClientRect().top + scrollY - (innerHeight - document.querySelectorAll('.bloc')[1].offsetHeight) / 2", 1500),
    ('dia 3', "document.querySelectorAll('.bloc')[2].getBoundingClientRect().top + scrollY - (innerHeight - document.querySelectorAll('.bloc')[2].offsetHeight) / 2", 1500),
    ('dia 4', "document.querySelectorAll('.bloc')[3].getBoundingClientRect().top + scrollY - (innerHeight - document.querySelectorAll('.bloc')[3].offsetHeight) / 2", 1800),
    ('demo', "document.getElementById('demo').getBoundingClientRect().top + scrollY - 40", 1500),
    ('aparador', "document.getElementById('jocs').getBoundingClientRect().top + scrollY", 3200),
    ('bento', "document.querySelector('.bento').getBoundingClientRect().top + scrollY - 90", 3000),
    ('residències', "document.getElementById('residencies').getBoundingClientRect().top + scrollY - 120", 1800),
    ('final', "document.querySelector('.l-final').getBoundingClientRect().top + scrollY - 20", 2600),
]
ANIMA = """([y, ms]) => new Promise(res => { const y0 = scrollY, t0 = performance.now(), e = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const pas = n => { const t = Math.min(1, (n - t0) / ms); window.scrollTo(0, y0 + (y - y0) * e(t)); t < 1 ? requestAnimationFrame(pas) : res(); }; requestAnimationFrame(pas); })"""


def main():
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe(); tmp = pathlib.Path(tempfile.mkdtemp(prefix='menta_scroll_'))
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1, record_video_dir=str(tmp), record_video_size={'width': W, 'height': H}); pg = ctx.new_page()
        t0 = time.time(); pg.goto((ARREL / 'index.html').as_uri()); pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'"); pg.mouse.move(900, 500); ini = time.time() - t0
        for i, (nom, js, pausa) in enumerate(PUNTS):
            if i: pg.evaluate(ANIMA, [pg.evaluate(js), 1700])
            if nom == 'hero':
                for x, y in ((700, 300), (1100, 420), (1300, 200), (1000, 520)): pg.mouse.move(x, y, steps=18); pg.wait_for_timeout(500)
            pg.mouse.move(980 + (i % 3) * 60, 420 + (i % 2) * 80, steps=12); pg.wait_for_timeout(pausa)
            print('  ', nom)
        durada = time.time() - t0; ctx.close(); b.close()
    brut = next(tmp.glob('*.webm')); sortida = ARREL / 'docs' / 'web-premium-scroll.webm'
    subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{max(ini - 0.2, 0):.2f}', '-i', str(brut), '-an', '-vf', 'fps=30', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', str(sortida)], check=True)
    print(f'{durada - ini:.0f} s · {sortida.stat().st_size / 1e6:.1f} MB →', sortida); shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__': main()
