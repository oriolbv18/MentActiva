"""Mesura de rendiment i pressupost (v1.9): pes del JS/CSS, temps de càrrega, latència d'interacció i fotogrames amb l'Elefant actiu,
amb la CPU normal i frenada ×4. Escriu docs/RENDIMENT-1.9.md (si es passa --escriu) i falla si se supera el pressupost.
Pressupost: JS inicial < 450 KB sense comprimir · JS total < 700 KB · CSS < 200 KB · interacció < 100 ms (CPU normal) · càrrega < 2,5 s amb CPU ×4 · ≥ 24 fps amb l'Elefant."""
import argparse, json, pathlib, re, sys, statistics
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
APP = (ARREL / 'app' / 'index.html').as_uri()
PRESSUPOST = {'js_inicial_kb': 450, 'js_total_kb': 700, 'css_kb': 200, 'interaccio_ms': 100, 'carrega_x4_ms': 2500, 'fps_min': 24}

def pesos():
    html = (ARREL / 'app' / 'index.html').read_text(encoding='utf-8')
    scripts = re.findall(r'<script src="([^"]+)"', html); inicial = sum((ARREL / 'app' / s).stat().st_size for s in scripts if (ARREL / 'app' / s).exists())
    jocs = sum(f.stat().st_size for f in (ARREL / 'app' / 'js' / '2-jocs').glob('*.js'))
    css = sum(f.stat().st_size for f in (ARREL / 'app' / 'css').glob('*.css'))
    elefant = sum(f.stat().st_size for f in list((ARREL / 'app' / 'js' / 'elefant').glob('elefant-*.js')) + [ARREL / 'app' / 'css' / 'elefant.css'])
    es = sum(f.stat().st_size for f in (ARREL / 'app' / 'js' / 'i18n').glob('*.js')) + (ARREL / 'app' / 'js' / 'i18n.js').stat().st_size + (ARREL / 'app' / 'js' / 'elefant' / 'dialegs.es.js').stat().st_size
    return {'js_inicial_kb': round(inicial / 1024), 'jocs_kb': round(jocs / 1024), 'js_total_kb': round((inicial + jocs) / 1024), 'css_kb': round(css / 1024), 'elefant_kb': round(elefant / 1024), 'castella_kb': round(es / 1024)}

def mesura(p, x4):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
    pg.add_init_script("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({memory:true,calcul:true}))")
    cdp = ctx.new_cdp_session(pg)
    if x4: cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.goto(APP, wait_until='load'); pg.wait_for_timeout(1500)
    nav = pg.evaluate("(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }; })()")
    lat = []
    for joc in ['calcul', 'memory', 'calcul', 'memory']:
        pg.evaluate("mostrarPantalla('inici')"); pg.wait_for_timeout(300)
        t = pg.evaluate(f"(async () => {{ const t0 = performance.now(); obrirJoc('{joc}'); await new Promise(r => {{ const i = setInterval(() => {{ if (document.querySelector('.screen.active').id === 'joc-{joc}' || document.querySelector('#modalDificultat.actiu')) {{ clearInterval(i); r(); }} }}, 4); }}); return performance.now() - t0; }})()")
        lat.append(t); pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id))"); pg.wait_for_timeout(200)
    clic = pg.evaluate("(async () => { const r = []; for (let i = 0; i < 10; i++) { const t0 = performance.now(); document.getElementById('usuariBadge').click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); r.push(performance.now() - t0); document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); } return r; })()")
    pg.evaluate("mostrarPantalla('inici'); ELEF.inst && ELEF.inst.estat('celebra')"); pg.wait_for_timeout(500)
    fr = pg.evaluate("new Promise(r => { let k = 0, t0 = performance.now(); const f = () => { k++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(k / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); })")
    mem = pg.evaluate("(performance.memory || {}).usedJSHeapSize || null")
    b.close()
    return {'dcl_ms': round(nav['dcl']), 'load_ms': round(nav['load']), 'obrir_joc_ms': round(statistics.median(lat)), 'clic_ms': round(statistics.median(clic), 1), 'fps_inici_celebra': round(fr), 'memoria_mb': round(mem / 1048576, 1) if mem else None}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--escriu', action='store_true'); a = ap.parse_args()
    w = pesos(); print('pesos', w)
    with sync_playwright() as p: n = mesura(p, False); x = mesura(p, True)
    print('CPU normal', n); print('CPU ×4', x)
    fall = []
    if w['js_inicial_kb'] > PRESSUPOST['js_inicial_kb']: fall.append('JS inicial')
    if w['js_total_kb'] > PRESSUPOST['js_total_kb']: fall.append('JS total')
    if w['css_kb'] > PRESSUPOST['css_kb']: fall.append('CSS')
    if n['clic_ms'] > PRESSUPOST['interaccio_ms']: fall.append('interacció')
    if x['load_ms'] > PRESSUPOST['carrega_x4_ms']: fall.append('càrrega ×4')
    if x['fps_inici_celebra'] < PRESSUPOST['fps_min']: fall.append('fps')
    if a.escriu:
        md = f"""# Rendiment i pressupost · v1.9

Mesurat amb Playwright/Chromium en aquest ordinador (`tests/rendiment/mesura.py`). Són **mesures d'aquest equip**, no d'un mòbil real: en un mòbil mitjà es veuran pitjor; per això es mesura també amb la CPU frenada ×4.

## Pes (sense comprimir)
| | KB | Pressupost |
|---|---|---|
| JS que es carrega a l'inici | {w['js_inicial_kb']} | < {PRESSUPOST['js_inicial_kb']} |
| JS dels jocs (sota demanda, un per un) | {w['jocs_kb']} | — |
| **JS total** | {w['js_total_kb']} | < {PRESSUPOST['js_total_kb']} |
| CSS | {w['css_kb']} | < {PRESSUPOST['css_kb']} |
| L'Elefant (dibuix + motor + CSS) | {w['elefant_kb']} | < 60 |
| Castellà (diccionari, bancs i diàlegs; es carrega a l'inici) | {w['castella_kb']} | — |

## Temps
| | CPU normal | CPU ×4 | Pressupost |
|---|---|---|---|
| DOMContentLoaded | {n['dcl_ms']} ms | {x['dcl_ms']} ms | — |
| Càrrega completa | {n['load_ms']} ms | {x['load_ms']} ms | < {PRESSUPOST['carrega_x4_ms']} ms (×4) |
| Obrir un joc (mediana) | {n['obrir_joc_ms']} ms | {x['obrir_joc_ms']} ms | — |
| Resposta a un toc (mediana) | {n['clic_ms']} ms | {x['clic_ms']} ms | < {PRESSUPOST['interaccio_ms']} ms |
| Fotogrames/s a l'inici amb l'Elefant celebrant | {n['fps_inici_celebra']} | {x['fps_inici_celebra']} | ≥ {PRESSUPOST['fps_min']} |
| Memòria JS | {n['memoria_mb']} MB | {x['memoria_mb']} MB | — |

L'animació de l'Elefant s'atura amb la pestanya oculta, passa a 30 fps si el dispositiu va lent i l'Elefant «mini» de la barra dels jocs va a 20 fps.

Resultat del pressupost: **{'tot dins del pressupost' if not fall else 'FORA DE PRESSUPOST: ' + ', '.join(fall)}**.
"""
        (ARREL / 'docs' / 'RENDIMENT-1.9.md').write_text(md, encoding='utf-8'); print('escrit docs/RENDIMENT-1.9.md')
    print('FORA DE PRESSUPOST: ' + ', '.join(fall) if fall else 'Dins del pressupost.'); return 1 if fall else 0

if __name__ == '__main__': sys.exit(main())
