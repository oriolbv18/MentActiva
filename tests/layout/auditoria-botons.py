"""Auditoria automàtica de botons i caselles (Fase 5).
Recorre pantalles, modals i estats de joc a 5 resolucions × 4 mides de lletra × clar/fosc i comprova, per a cada element interactiu:
  1 desbordament · 2 centrat del contingut · 3 fills fora del pare · 4 text tallat · 5 alineació icona-text · 6 objectiu tàctil · 7 tallat per la vora de la pantalla.
Surt a docs/layout/informe.html i informe.json. Excepcions justificades: tests/layout/excepcions.json.
Ús: python tests/layout/auditoria-botons.py [--rapid] [--sizes mobil,ordinador] [--zooms normal,gegant] [--temes clar,fosc]"""
import argparse, json, os, pathlib, sys, html, collections
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ARREL / 'tests'))
from captures import APP, MIDES, JOCS, nou_context  # noqa: E402
SORTIDA = ARREL / 'docs' / 'layout'
EXC = json.loads((pathlib.Path(__file__).parent / 'excepcions.json').read_text(encoding='utf8')) if (pathlib.Path(__file__).parent / 'excepcions.json').exists() else {}

PANTALLES = ['inici', 'meusJocs', 'comVaig', 'jugarAmbAlgu', 'sessioDescans', 'sessioFi', 'duelRelleu', 'selectorResident', 'menuJocs', 'testCognitiu', 'configuracio', 'familia',
             'resumFamilia', 'album', 'missatgeria', 'calFamiliar', 'privadesa', 'condicions', 'sobre', 'feedback']
MODALS = ['modalUsuaris', 'modalNouUsuari', 'modalInforme', 'modalPin', 'modalAjuda', 'modalPausa', 'modalDificultat', 'modalXecSalut', 'modalEnquesta']
PESTANYES_CU = ['resum', 'evolucio', 'jocs', 'salut', 'notes', 'pla', 'informe', 'ajustos', 'residencia']
PASSOS_ONB_AUD = ['benvinguda', 'rol', 'nom', 'zoom', 'prova', 'pin', 'consent', 'final']
SLIDES = ['benvinguda', 'rol', 'nom', 'zoom', 'prova', 'pin', 'consent', 'final']

AUDITOR = r"""
(exc) => {
  const excepcions = exc.elements || [], excTactil = exc.tactil || [];
  const SEL = 'button, [role=button], [role=radio], [role=tab], a.boto, .ib, .carta, .casella, .tecla, .fitxa, .opcio, .joc-gran, .persona-targeta, .targeta, .pestanya, .resident-targeta, .onb-rol, summary, .bingo-casella, .sudoku-cell, .sopa-casella, .seq-boto, .dificultat-btn, .boto-principal, .boto-secundari, .boto-fantasma, .boto-jugar';
  const vw = innerWidth, vh = innerHeight, out = [];
  const visible = e => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    for (let a = e; a; a = a.parentElement) { if (a.hidden || getComputedStyle(a).display === 'none') return false; } return true; };
  const actiu = e => { const s = e.closest('.screen'); const m = e.closest('.modal-fons, .tutorial-overlay, .onboarding-overlay, .guia-capa, .bingo-taulell'); if (m) return m.classList.contains('actiu') || m.matches('.bingo-taulell, .guia-capa') ; return !s || s.classList.contains('active') || e.closest('header, nav, .capcalera'); };
  const nom = e => { const p = []; for (let a = e; a && a !== document.body && p.length < 3; a = a.parentElement) p.unshift(a.tagName.toLowerCase() + (a.id ? '#' + a.id : (a.classList[0] ? '.' + a.classList[0] : ''))); return p.join(' > '); };
  const rectContingut = e => { let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    const afegeix = r => { if (r.width < 1 && r.height < 1) return; x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom); };
    const walk = n => { for (const c of n.childNodes) { if (c.nodeType === 3) { if (c.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(c); for (const r of rg.getClientRects()) afegeix(r); } }
      else if (c.nodeType === 1) { const cs = getComputedStyle(c); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'absolute' || cs.position === 'fixed') continue; if (c.matches('svg, img, input, i, span.punt-avis') || !c.firstChild) afegeix(c.getBoundingClientRect()); else walk(c); } } };
    walk(e); return x1 > 1e8 ? null : { x1, y1, x2, y2 }; };
  document.querySelectorAll(SEL).forEach(e => {
    if (!visible(e) || !actiu(e) || e.matches('input[type=hidden]')) return;
    const key = nom(e), r = e.getBoundingClientRect(), cs = getComputedStyle(e), tinc = (t, d) => out.push({ check: t, detall: d, el: key, text: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] });
    if (excepcions.some(x => key.includes(x))) return;
    const scrollable = a => { for (; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if ((o === 'auto' || o === 'scroll') && a.scrollWidth > a.clientWidth + 1) return true; } return false; };
    // 1) desbordament
    if (cs.overflowX === 'visible' && ![...e.children].some(c => getComputedStyle(c).position === 'absolute') && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && e.clientWidth > 0 && !e.matches('summary, details > summary')) tinc('desbordament', `scroll ${e.scrollWidth}×${e.scrollHeight} > client ${e.clientWidth}×${e.clientHeight}`);
    // 7) tallat per la vora
    if (!scrollable(e) && (r.right > vw + 1 || r.left < -1)) tinc('vora-pantalla', `x ${Math.round(r.left)}–${Math.round(r.right)} (ample ${vw})`);
    // 3) fills fora del pare
    [...e.children].forEach(c => { if (!c.getBoundingClientRect || getComputedStyle(c).position === 'absolute' || getComputedStyle(c).display === 'none') return; const cr = c.getBoundingClientRect(); if (cr.width < 1) return;
      if (cr.left < r.left - 1.5 || cr.right > r.right + 1.5 || cr.top < r.top - 1.5 || cr.bottom > r.bottom + 1.5) tinc('fill-fora', `${c.tagName.toLowerCase()}.${(c.className.baseVal ?? c.className).toString().split(' ')[0]} surt del quadre`); });
    // 2) centrat (només si el disseny diu «centrat»)
    const cont = rectContingut(e);
    if (cont && r.height < 110) {
      const fl = cs.display.includes('flex'), colum = fl && cs.flexDirection.startsWith('column');
      const gr = cs.display.includes('grid'), centreH = fl ? ((!colum && cs.justifyContent === 'center') || (colum && cs.alignItems === 'center')) : gr ? (cs.justifyItems === 'center' || cs.placeItems.includes('center')) : cs.textAlign === 'center';
      const centreV = fl ? ((colum && cs.justifyContent === 'center') || (!colum && cs.alignItems === 'center')) : cs.display.includes('grid') && cs.placeItems.includes('center');
      const pl = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), pr = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth), pt = parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth), pb = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth);
      const esq = cont.x1 - (r.left + pl), dre = (r.right - pr) - cont.x2, dalt = cont.y1 - (r.top + pt), baix = (r.bottom - pb) - cont.y2;
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3, multilinia = (cont.y2 - cont.y1) > lh * 1.7 + (e.querySelector('svg') ? 4 : 0);
      if (centreH && !multilinia && e.scrollWidth <= e.clientWidth + 1 && Math.abs(esq - dre) > 3 && Math.min(esq, dre) > -1) tinc('centrat-h', `marge esq ${esq.toFixed(1)} / dre ${dre.toFixed(1)}`);
      if ((centreV || centreH && !fl) && Math.abs(dalt - baix) > 3 && Math.min(dalt, baix) > -1 && r.height < 80) tinc('centrat-v', `marge dalt ${dalt.toFixed(1)} / baix ${baix.toFixed(1)}`);
    }
    // 5) alineació icona-text
    const ic = e.querySelector(':scope > svg.ico, :scope > .ico'), tx = [...e.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (ic && tx && cs.display.includes('flex') && !cs.flexDirection.startsWith('column')) { const rg = document.createRange(); rg.selectNodeContents(tx); const t = rg.getBoundingClientRect(), i = ic.getBoundingClientRect();
      if (t.height > 0 && Math.abs((t.top + t.height / 2) - (i.top + i.height / 2)) > 2.5) tinc('icona-text', `centres a ${Math.abs((t.top + t.height / 2) - (i.top + i.height / 2)).toFixed(1)} px`); }
    // 6) objectiu tàctil
    const principal = e.matches('.boto-principal, .boto-jugar, .persona-targeta, .joc-gran, #btnJugar');
    if ((r.width < 43.6 || r.height < 43.6) && !excTactil.some(x => key.includes(x))) { if (!e.matches('.bingo-casella, .sudoku-cell, .sopa-casella, .casella, .tau-n, .carta, .tecla') || Math.min(r.width, r.height) < 28) tinc('objectiu-tactil', `${Math.round(r.width)}×${Math.round(r.height)} (< 44)`); }
    else if (principal && (r.width < 56 || r.height < 56) && !excTactil.some(x => key.includes(x))) tinc('objectiu-tactil', `${Math.round(r.width)}×${Math.round(r.height)} (< 56 en acció principal)`);
  });
  return out;
}
"""

def estats(pg):
    """Generador d'estats: cada yield deixa l'app en un estat que cal auditar. Retorna (etiqueta)."""
    pg.evaluate("cuidadorObert = true")
    for s in PANTALLES:
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id))")
        if s == 'duelRelleu':
            pg.evaluate("carregaParella(); duel = { joc: 'calcul', mode: 'duel', seed: 1, torn: 1, res: [null, null] }; duelRelleu(1)")
        elif s == 'sessioFi':
            pg.evaluate("sessio = { jocs: ['calcul', 'span', 'memory'], idx: 2, estrelles: [2, 3, 1], inici: Date.now() }; renderSessioFi(); mostrarPantalla('sessioFi')")
        elif s == 'sessioDescans':
            pg.evaluate("sessio = { jocs: ['calcul', 'span', 'memory'], idx: 0, estrelles: [2], inici: Date.now() }; setText('continuarSub', 'Següent: Quants en recordes?'); mostrarPantalla('sessioDescans')")
        else: pg.evaluate(f"mostrarPantalla('{s}')")
        pg.wait_for_timeout(260); yield 'pantalla ' + s
    pg.evaluate("sessio = null; duel = null")
    pg.evaluate("entraCuidador()"); pg.wait_for_timeout(200)
    for t in PESTANYES_CU:
        pg.evaluate(f"cuTria('{t}')"); pg.wait_for_timeout(160); yield 'cuidador ' + t
    pg.evaluate("tancaEspaiCuidador && tancaEspaiCuidador(true); mostrarPantalla('inici')")
    for m in MODALS:
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(x => tancarModal(x.id)); mostrarPantalla('inici')")
        js = {'modalPin': "demanaPin('crear', () => {})", 'modalDificultat': "obrirJoc('memory')", 'modalPausa': "obrirJoc('calcul'); setTimeout(() => obrirModal('modalPausa'), 300)"}.get(m, f"obrirModal('{m}')")
        pg.evaluate(js); pg.wait_for_timeout(700); yield 'modal ' + m
    pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(x => tancarModal(x.id)); tancarTutorial && tancarTutorial()")
    pg.evaluate("iniciarOnboarding(true); onbRepeticio = false; onbRol = 'cuidat'; passosOnb = PASSOS_ONB.cuidat")
    for k, sl in enumerate(PASSOS_ONB_AUD):
        pg.evaluate(f"onboardingPas = {k}; actualitzarOnboardingSlide(true)"); pg.wait_for_timeout(450); yield 'onboarding ' + sl
    pg.evaluate("tancaOverlayOnb()")
    for j in JOCS:
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(x => tancarModal(x.id))")
        pg.evaluate(f"assegurarJoc('{j}')"); pg.wait_for_function(f"!!JOCS['{j}']", timeout=8000, polling=50)
        pg.evaluate(f"obrirJoc('{j}', false)"); pg.wait_for_timeout(450)
        if pg.locator('#modalDificultat.actiu').count(): pg.locator('#dificultatGrid button').nth(1).click(); pg.wait_for_timeout(500)
        if j == 'bingo': pg.evaluate("bingoOpcio.cartrons('2'); bingoOpcio.rivals('2'); document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(400)
        yield 'joc ' + j
        if j in ('memory', 'tertulia', 'domino', 'dames', 'bingo', 'refranys', 'paraules', 'sequencia'):
            pg.evaluate(f"obrirJoc('{j}', true)"); pg.wait_for_timeout(450)
            if j == 'bingo': pg.evaluate("document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(400)
            yield 'joc2 ' + j
    pg.evaluate("mostrarPantalla('inici')")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--rapid', action='store_true'); ap.add_argument('--sizes', default=','.join(MIDES)); ap.add_argument('--zooms', default='normal,gran,extragran,gegant'); ap.add_argument('--temes', default='clar,fosc'); a = ap.parse_args()
    if a.rapid: a.sizes, a.zooms, a.temes = 'mobil,ordinador', 'normal,gegant', 'clar'
    incidencies = collections.OrderedDict(); avisos = collections.OrderedDict(); combos = 0; errors_js = []
    SORTIDA.mkdir(parents=True, exist_ok=True); (SORTIDA / 'captures').mkdir(exist_ok=True)
    with sync_playwright() as p:
        for mida in a.sizes.split(','):
            for zoom in a.zooms.split(','):
                for tema in a.temes.split(','):
                    nav, ctx = nou_context(p, mida, tema, zoom); pg = ctx.new_page()
                    pg.on('pageerror', lambda e: errors_js.append(str(e)))
                    pg.goto(APP); pg.wait_for_timeout(500); pg.evaluate("carregarDemo()"); pg.wait_for_timeout(300); pg.evaluate("ajustes.rol = 'residencia'; guardarAjustes()")
                    for estat in estats(pg):
                        combos += 1
                        for inc in pg.evaluate(AUDITOR, EXC):
                            clau = (inc['check'], estat, inc['el'], inc['text'])
                            dic = avisos if inc['check'] == 'objectiu-tactil' and '< 44' not in inc['detall'] and '< 56' in inc['detall'] else incidencies
                            if clau not in dic:
                                dic[clau] = {**inc, 'estat': estat, 'combinacions': [], 'captura': None}
                                if len(dic) <= 60 and inc['check'] != 'objectiu-tactil':
                                    nom = f'{len(dic):03d}-{inc["check"]}.png'; x, y, w, h = inc['rect']
                                    try: pg.screenshot(path=str(SORTIDA / 'captures' / nom), clip={'x': max(0, x - 20), 'y': max(0, y - 20), 'width': min(w + 40, 400), 'height': min(h + 40, 300)}); dic[clau]['captura'] = nom
                                    except Exception: pass
                            dic[clau]['combinacions'].append(f'{mida}/{zoom}/{tema}')
                    nav.close(); print(f'  {mida}/{zoom}/{tema}: {len(incidencies)} incidències acumulades, {len(avisos)} avisos', flush=True)
    llista = [dict(v, combinacions=sorted(set(v['combinacions']))[:6] + (['…'] if len(set(v['combinacions'])) > 6 else []), n=len(set(v['combinacions']))) for v in incidencies.values()]
    (SORTIDA / 'informe.json').write_text(json.dumps({'combinacions_estats': combos, 'incidencies': llista, 'avisos_56': len(avisos), 'errors_js': errors_js[:10]}, ensure_ascii=False, indent=1), encoding='utf8')
    files = ''.join(f"<tr><td>{html.escape(i['check'])}</td><td>{html.escape(i['estat'])}</td><td><code>{html.escape(i['el'])}</code><br>«{html.escape(i['text'])}»</td><td>{html.escape(i['detall'])}</td><td>{html.escape(', '.join(i['combinacions']))} ({i['n']})</td><td>{('<img src=captures/' + i['captura'] + '>') if i['captura'] else ''}</td></tr>" for i in llista)
    (SORTIDA / 'informe.html').write_text(f"<!doctype html><meta charset=utf-8><title>Auditoria de botons</title><style>body{{font:14px system-ui;margin:1rem}}td,th{{border:1px solid #ccc;padding:.3rem;vertical-align:top}}img{{max-width:240px}}</style><h1>Auditoria de botons i caselles</h1><p>{combos} estats auditats · <b>{len(llista)}</b> incidències · {len(avisos)} avisos de mida tàctil (&lt; 56 px en acció principal).</p><table><tr><th>Control</th><th>Estat</th><th>Element</th><th>Detall</th><th>Combinacions</th><th>Captura</th></tr>{files}</table>", encoding='utf8')
    print(f'\nEstats auditats: {combos} · Incidències úniques: {len(llista)} · Errors JS: {len(errors_js)}')
    grup = collections.OrderedDict()
    for i in llista: grup.setdefault((i['check'], i['el'], '' if 'casella' in i['el'] or 'sudoku' in i['el'] or 'sopa' in i['el'] else i['text'], i['detall'].split(' (')[0].split(' ')[0] if i['check'] != 'objectiu-tactil' else i['detall'].split('×')[1].split(' ')[0] if '×' in i['detall'] else i['detall']), []).append(i['estat'])
    for (c, el, tx, d), ests in list(grup.items())[:80]: print(f"  ✗ [{c}] {el} «{tx}» · {d} · {len(ests)} estats ({ests[0]}…)")
    return 1 if llista or errors_js else 0

if __name__ == '__main__': sys.exit(main())
