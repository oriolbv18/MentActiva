"""Genera el full de contactes de l'Elefant (tots els estats, la roba, clar/fosc) i la silueta a 48 px → docs/captures-1.9/elefant/
Ús: python tools/contactes-elefant.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
DEMO = (ARREL / 'app' / 'elefant-demo.html').as_uri()
OUT = ARREL / 'docs' / 'captures-1.9' / 'elefant'; OUT.mkdir(parents=True, exist_ok=True)
ESTATS = ['repos', 'content', 'pensant', 'sorpres', 'trist', 'dorm', 'celebra', 'saluda', 'parla', 'anima', 'balla', 'respira']
ACC = ['bufanda', 'barret', 'ulleres', 'gorra', 'llaçada', 'barret-festa', 'paraigua']

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 760}, device_scale_factor=1)
        pg.goto(DEMO); pg.wait_for_timeout(500)
        pg.add_style_tag(content='.gran{padding-top:1rem !important;min-height:0 !important} #escenari .el-wrap{--el-ample:24rem !important}')
        pg.evaluate("e.estatic(true)")
        fets = []
        for tema in ('clar', 'fosc'):
            pg.evaluate("document.documentElement.dataset.tema = '%s'; e.tema('%s')" % (tema, 'fosc' if tema == 'fosc' else 'clar'))
            for est in ESTATS:
                pg.evaluate(f"e.desvesteix(); e.estat('{est}'); e.pas(1)"); pg.wait_for_timeout(120)
                f = OUT / f'estat-{est}-{tema}.png'; pg.locator('#escenari').screenshot(path=str(f)); fets.append((tema, est, f.name))
            for acc in ACC:
                pg.evaluate(f"e.desvesteix(); e.estat('content'); e.vesteix('{acc}'); e.pas(1)"); pg.wait_for_timeout(120)
                f = OUT / f'roba-{acc}-{tema}.png'; pg.locator('#escenari').screenshot(path=str(f)); fets.append((tema, 'roba ' + acc, f.name))
        pg.evaluate("e.desvesteix(); document.documentElement.dataset.tema = 'clar'; e.tema('clar'); e.estat('repos')")
        # silueta a 48 px (mida real i ampliada ×4 sense suavitzar per jutjar-la)
        pg.goto(DEMO); pg.wait_for_timeout(400)
        sil = OUT / 'silueta-48px.png'
        pg.set_content('<body style="margin:0;background:#fff;display:flex;gap:30px;align-items:flex-end;padding:20px"><div id="a" style="width:48px"></div><div id="b" style="width:48px;--x:1"></div></body>')
        pg.add_style_tag(path=str(ARREL / 'app' / 'css' / 'elefant.css')); pg.add_script_tag(path=str(ARREL / 'app' / 'js' / 'elefant' / 'elefant-dibuix.js')); pg.add_script_tag(path=str(ARREL / 'app' / 'js' / 'elefant' / 'elefant-motor.js'))
        pg.evaluate("""() => { const a = Elefant.crea(document.getElementById('a'), { mida: 'mini', animat: false }); a.el.style.setProperty('--el-ample', '48px');
            const b = Elefant.crea(document.getElementById('b'), { mida: 'mini', animat: false }); b.el.style.setProperty('--el-ample', '48px'); b.el.style.filter = 'brightness(0)'; }""")
        pg.wait_for_timeout(300); pg.screenshot(path=str(sil), clip={'x': 0, 'y': 0, 'width': 180, 'height': 90})
        # full de contactes (HTML → PNG)
        cel = ''.join(f'<figure><img src="{f}"><figcaption>{t} · {e}</figcaption></figure>' for t, e, f in fets)
        html = f'<!doctype html><meta charset="utf-8"><style>body{{margin:0;padding:14px;font:12px system-ui;background:#f2efe8}}h1{{font-size:16px}}main{{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}}figure{{margin:0;background:#fff;border-radius:6px;padding:4px;text-align:center}}img{{width:100%;display:block}}.s{{display:flex;gap:20px;align-items:center;margin:8px 0}}.s img{{width:auto;image-rendering:pixelated}}</style><h1>L\'Elefant · full de contactes (v1.9)</h1><div class="s"><span>Silueta a 48 px (real i en negre):</span><img src="silueta-48px.png" width="180"><img src="silueta-48px.png" width="720" style="image-rendering:pixelated"></div><main>{cel}</main>'
        (OUT / 'contactes.html').write_text(html, encoding='utf-8')
        pg.set_viewport_size({'width': 1500, 'height': 900}); pg.goto((OUT / 'contactes.html').as_uri()); pg.wait_for_timeout(800)
        pg.screenshot(path=str(OUT / 'full-de-contactes.png'), full_page=True); b.close()
    print('fet →', OUT)

if __name__ == '__main__': main()
