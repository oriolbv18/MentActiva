"""Auditoria de la web d'aterratge (v1.9.3): marges, ritme, àncores, graelles, objectius tàctils, imatges trencades, CLS, LCP, tasques llargues en fer scroll, pes de la pàgina i vídeo pausat fora de vista.
Carrega index.html per file:// (sense xarxa) a 9 amplades, en tema clar i fosc, a zoom 100 % i a zoom 200 % del navegador (només si queden ≥ 320 px CSS).
Ús: python tools/audit-web.py --sortida docs/web-despres [--pagina index.html] [--amplades 320,390,...] [--zooms normal,gegant]
Surt amb codi 1 si hi ha cap incidència. Escriu INFORME.md, mesures.json i captures a la carpeta de sortida."""
import argparse, json, pathlib, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
AMPLADES = [320, 360, 390, 768, 1024, 1280, 1440, 1920, 2560]
ALTS = {320: 640, 360: 740, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1440: 900, 1920: 1080, 2560: 1440}
CLS_INIT = "window.__long = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} window.__lcp = 0; try { new PerformanceObserver(l => { const x = l.getEntries(); window.__lcp = x[x.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {} window.__cls = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}"

MESURA = r"""(() => {
  const W = document.documentElement.clientWidth, vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const out = { W, problemes: [], dades: {} };
  const prob = (check, text) => out.problemes.push({ check, text });
  // 1. desbordament horitzontal
  const sw = document.documentElement.scrollWidth; if (sw > W + 1) prob('desbordament', `scrollWidth ${sw} > ${W}`);
  // 2. gutter i amplada màxima per secció
  const blocs = [...document.querySelectorAll('main > section, body > footer, main > article')];
  const gutters = {}, amplades = [];
  for (const b of blocs) {
    const nom = (b.id ? '#' + b.id : b.tagName.toLowerCase() + '.' + (b.className || '').toString().split(' ')[0]);
    const c = b.querySelector('.l-ample') || (b.classList.contains('l-ample') ? b : null);
    if (!c) { prob('gutter', `${nom} no té .l-ample`); continue; }
    const r = c.getBoundingClientRect(), cs = getComputedStyle(c), esq = r.left + parseFloat(cs.paddingLeft), dre = W - (r.right - parseFloat(cs.paddingRight));
    gutters[nom] = Math.round(Math.min(esq, dre) * 10) / 10; amplades.push(Math.round(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
  }
  out.dades.gutters = gutters; out.dades.ample_contingut = Math.max(0, ...amplades);
  const gv = Object.values(gutters); if (gv.length && Math.max(...gv) - Math.min(...gv) > 1.5) prob('gutter', 'gutters desiguals: ' + JSON.stringify(gutters));
  const minG = W <= 480 ? 16 : (W >= 1024 ? 32 : 16); if (gv.length && Math.min(...gv) < minG - .5) prob('gutter', `gutter ${Math.min(...gv)} px < ${minG} px`);
  if (out.dades.ample_contingut > 1200.5) prob('ample-maxim', `contingut de ${out.dades.ample_contingut} px (> 1200)`);
  // 3. padding vertical de les seccions
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--seccio-y)'; document.body.appendChild(probe);
  const ref = probe.getBoundingClientRect().height; probe.remove(); out.dades.seccio_y = Math.round(ref * 10) / 10;
  const pads = {};
  for (const b of document.querySelectorAll('main > section')) {
    const cs = getComputedStyle(b), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom), nom = b.id ? '#' + b.id : b.className.split(' ')[0];
    pads[nom] = [Math.round(pt), Math.round(pb)];
    if (ref > 0 && (b.classList.contains('l-seccio') || b.classList.contains('l-final')) && (Math.abs(pt - ref) > 1.5 || Math.abs(pb - ref) > 1.5)) prob('ritme', `${nom}: padding ${Math.round(pt)}/${Math.round(pb)} ≠ --seccio-y ${Math.round(ref)}`);
  }
  out.dades.paddings = pads;
  // 4. capçalera: píndola flotant dins de la finestra, amb marge als costats
  const cap = document.querySelector('body > header'); if (cap) { out.dades.cap_alt = Math.round(cap.getBoundingClientRect().height); const pi = cap.querySelector('.l-ample').getBoundingClientRect(); if (pi.left < 15.5 || W - pi.right < 15.5) prob('capcalera', `la píndola toca la vora (${Math.round(pi.left)} / ${Math.round(W - pi.right)})`); if (pi.height < 43.5) prob('capcalera', 'píndola més baixa de 44 px'); }
  const h1 = document.querySelector('h1'); if (h1) out.dades.h1_px = Math.round(parseFloat(getComputedStyle(h1).fontSize));
  out.dades.html_px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  // 5. graelles amb fila òrfena
  for (const g of document.querySelectorAll('main *')) {
    if (getComputedStyle(g).display !== 'grid') continue; if (g.hasAttribute('data-sense-audit')) continue;
    const fills = [...g.children].filter(vis); if (fills.length < 3) continue; if (new Set(fills.map(f => f.tagName + '.' + f.className)).size > 1) continue;     // només graelles de «targetes» iguals
    const files = {}; fills.forEach(f => { const t = Math.round(f.getBoundingClientRect().top / 4); (files[t] = files[t] || []).push(f); });
    const ordre = Object.keys(files).map(Number).sort((a, b) => a - b); if (ordre.length < 2) continue;
    if (files[ordre[ordre.length - 1]].length === 1 && files[ordre[0]].length > 1) prob('fila-orfena', `${g.className || g.tagName}: ${fills.length} elements, última fila d'1`);
  }
  // 6. objectius tàctils (≤768)
  if (W <= 768) for (const e of document.querySelectorAll('a, button, summary, input:not([type=hidden]):not([tabindex="-1"]), select, textarea')) {
    if (!vis(e)) continue; const s = getComputedStyle(e); if (s.display === 'inline' && e.closest('p, li, span')) continue; if (e.classList.contains('salta-contingut')) continue;
    if (e.type === 'checkbox') { const l = e.closest('label'); if (l && l.getBoundingClientRect().height >= 43.5) continue; }
    const r = e.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) prob('tactil', `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${(e.className || '').toString().split(' ')[0]} «${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}» ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // 7. imatges
  for (const i of document.images) {
    const nom = (i.getAttribute('src') || '').slice(-40);
    if (!i.complete || i.naturalWidth === 0) { prob('imatge', 'trencada: ' + nom); continue; }
    if (!i.getAttribute('width') || !i.getAttribute('height')) prob('imatge', 'sense width/height: ' + nom);
    const r = i.getBoundingClientRect(); if (r.width >= 150 && i.naturalWidth > r.width * 3.6 && i.naturalWidth > 400) prob('imatge-pes', `${nom}: natural ${i.naturalWidth} vs mostrada ${Math.round(r.width)}`);
  }
  out.dades.cls = Math.round((window.__cls || 0) * 1000) / 1000; if ((window.__cls || 0) > .05) prob('cls', 'CLS ' + out.dades.cls);
  return out;
})()"""

ANCORES = r"""(ids) => {
  document.documentElement.style.scrollBehavior = 'auto'; const cap = document.querySelector('body > header'); const res = [];
  for (const id of ids) {
    const t = document.getElementById(id); if (!t) continue; location.hash = '#' + id; window.dispatchEvent(new Event('hashchange'));
    const h = t.querySelector('h2, h1') || t; const r = h.getBoundingClientRect(), b = cap ? cap.getBoundingClientRect().bottom : 0;
    res.push([id, Math.round(r.top - b)]);
  }
  return res;
}"""


def carrega(p, url, ample, tema, zoom):
    # «gegant» = zoom del navegador al 200 %: la finestra té la meitat d'amplada en píxels CSS (la web no té selector de mida de lletra; el zoom del navegador i
    # els breakpoints en em fan la feina). La lletra de sistema gran es prova a part a tests/web/test_accessibilitat.py.
    w, h, dsf = (ample // 2, ALTS[ample] // 2, 2) if zoom == 'gegant' else (ample, ALTS[ample], 1)
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme='dark' if tema == 'fosc' else 'light', device_scale_factor=dsf, bypass_csp=False)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.add_init_script(CLS_INIT)
    pg.on('console', lambda m: errs.append('consola: ' + m.text[:120]) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_timeout(2600)
    pes = pg.evaluate("performance.getEntriesByType('resource').map(e => e.name)"); pg.evaluate('window.__scrollLong0 = (window.__long || []).length')
    alt = pg.evaluate('document.documentElement.scrollHeight'); y = 0
    while y < alt:                           # fer scroll per carregar les imatges loading=lazy
        pg.evaluate(f'window.scrollTo(0, {y})'); pg.wait_for_timeout(120); y += max(h // 2, 200); alt = pg.evaluate('document.documentElement.scrollHeight')
    pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.l-pista'); if (c) c.scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(300)
    pg.evaluate("window.__scrollLong = (window.__long || []).slice(window.__scrollLong0)")
    pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; })"); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelectorAll('.l-pista').forEach(p => { p.scrollTo(0, 0); p.style.scrollSnapType = ''; })"); pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(500)
    pg.pes = pes
    return b, pg, errs


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sortida', default='docs/web-despres'); ap.add_argument('--pagina', default='index.html')
    ap.add_argument('--amplades', default=','.join(map(str, AMPLADES))); ap.add_argument('--zooms', default='normal,gegant'); ap.add_argument('--temes', default='clar,fosc'); ap.add_argument('--captures', default='1')
    a = ap.parse_args(); sortida = ARREL / a.sortida; sortida.mkdir(parents=True, exist_ok=True)
    url = (ARREL / a.pagina).as_uri(); total = []; mesures = {}
    with sync_playwright() as p:
        for ample in [int(x) for x in a.amplades.split(',')]:
            for tema in a.temes.split(','):
                for zoom in a.zooms.split(','):
                    if zoom == 'gegant' and ample // 2 < 320: continue          # zoom 200 % a menys de 320 px CSS: no té sentit
                    b, pg, errs = carrega(p, url, ample, tema, zoom)
                    r = pg.evaluate(MESURA)
                    extra = pg.evaluate("({ lcp: Math.round(window.__lcp || 0), llargues: (window.__scrollLong || []).filter(d => d > 50), video: (() => { const v = document.querySelector('.hero-video'); return v ? { src: !!v.currentSrc, pausat: v.paused } : null; })() })")
                    pes = 0
                    for n in pg.pes:
                        if n.startswith('file:///') and not n.endswith(('.mp4', '.webm')):
                            import urllib.parse; f = pathlib.Path(urllib.parse.unquote(n[8:]))
                            if f.is_file(): pes += f.stat().st_size
                    pes += (ARREL / a.pagina).stat().st_size; r['dades']['pes_kb'] = round(pes / 1024); r['dades']['lcp_ms'] = extra['lcp']; r['dades']['tasques_llargues'] = len(extra['llargues'])
                    if ample <= 480 and tema == 'clar' and zoom == 'normal' and pes > 700 * 1024: r['problemes'].append({'check': 'pes', 'text': f'pàgina inicial de {round(pes / 1024)} KB (> 700 KB, sense vídeo)'})
                    if extra['llargues']: r['problemes'].append({'check': 'tasques-llargues', 'text': f'{len(extra["llargues"])} tasques > 50 ms en fer scroll: {extra["llargues"][:4]}'})
                    ids = pg.evaluate("[...document.querySelectorAll('header a[href^=\"#\"], nav a[href^=\"#\"]')].map(x => x.getAttribute('href').slice(1)).filter(x => x)")
                    for id_, d in pg.evaluate(ANCORES, sorted(set(ids))):
                        if d < 16: r['problemes'].append({'check': 'ancora', 'text': f'#{id_}: títol a {d} px de la capçalera (< 16)'})
                    for e in errs[:3]: r['problemes'].append({'check': 'js', 'text': e})
                    clau = f'{ample}_{tema}_{zoom}'; mesures[clau] = r['dades']
                    for pr in r['problemes']: total.append((clau, pr['check'], pr['text']))
                    if a.captures == '1' and (zoom == 'normal' or ample == 390):
                        pg.screenshot(path=str(sortida / f'web_{ample}_{tema}{"_gegant" if zoom == "gegant" else ""}.jpg'), full_page=True, type='jpeg', quality=70)
                    print(f'{clau}: {len(r["problemes"])} incidències', flush=True); b.close()
    (sortida / 'mesures.json').write_text(json.dumps(mesures, ensure_ascii=False, indent=1), encoding='utf-8')
    per_check = {}
    for clau, check, text in total: per_check.setdefault(check, []).append((clau, text))
    md = [f'# Informe de la web ({a.pagina})', '', f'Combinacions: {len(mesures)} · incidències: {len(total)}', '', '## Incidències per tipus', '', '| Tipus | n | Exemples |', '|---|---|---|']
    for c, l in sorted(per_check.items()): md.append(f'| {c} | {len(l)} | ' + '<br>'.join(f'`{k}` {t[:110]}' for k, t in l[:3]).replace('|', '/') + ' |')
    md += ['', '## Mesures (tema clar, lletra normal)', '', '| Amplada | gutter (min–màx) | contingut | h1 px | capçalera px | --seccio-y | html px |', '|---|---|---|---|---|---|---|']
    for k, d in mesures.items():
        if k.endswith('_clar_normal'):
            g = list(d.get('gutters', {}).values()); md.append(f"| {k.split('_')[0]} | {min(g) if g else '-'}–{max(g) if g else '-'} | {d.get('ample_contingut')} | {d.get('h1_px')} | {d.get('cap_alt')} | {d.get('seccio_y')} | {d.get('html_px')} |")
    (sortida / 'INFORME.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(f'\nTOTAL incidències: {len(total)}'); return 1 if total else 0

if __name__ == '__main__': sys.exit(main())
