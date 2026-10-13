"""Recull de TOTS els textos que l'app mostra (en català) recorrent pantalles, modals, jocs jugats per bots, pistes, onboarding i cuidador.
Un MutationObserver apunta cada text i atribut visible (amb els números normalitzats a {n}). Serveix per construir i auditar el diccionari castellà.
Ús: python tests/i18n/recull.py [--sortida fitxer.json]   (llengua per defecte: ca)   ·   --llengua es  per a l'auditoria de traducció"""
import argparse, importlib.util, json, pathlib, random, re, sys
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ARREL / 'tests')); sys.path.insert(0, str(ARREL / 'tests' / 'jocs'))
from playwright.sync_api import sync_playwright
from comu import Partida
from bots import BOTS
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
spec = importlib.util.spec_from_file_location('aud', ARREL / 'tests' / 'layout' / 'auditoria-botons.py'); aud = importlib.util.module_from_spec(spec); spec.loader.exec_module(aud)

RECORDER = r"""
(() => {
  if (window.__textos) return; window.__textos = new Set();
  const A = ['aria-label', 'placeholder', 'title', 'alt', 'aria-valuetext'];
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const guarda = s => { s = norm(s); if (s.length > 1 && /[A-Za-zÀ-ÿ]{2}/.test(s)) window.__textos.add(s); };
  const recorre = n => {
    if (n.nodeType === 3) { const p = n.parentElement; if (p && !/^(SCRIPT|STYLE)$/.test(p.tagName) && !p.closest('svg')) setTimeout(() => guarda(n.data), 60); }
    else if (n.nodeType === 1) { if (/^(SCRIPT|STYLE|SVG)$/i.test(n.tagName)) return; A.forEach(a => { if (n.hasAttribute(a)) setTimeout(() => guarda(n.getAttribute(a) || ''), 60); }); n.childNodes.forEach(recorre); }
  };
  const iniciar = () => { recorre(document.body); new MutationObserver(ms => ms.forEach(m => { if (m.type === 'childList') m.addedNodes.forEach(recorre); else if (m.type === 'characterData') recorre(m.target); else if (m.type === 'attributes') setTimeout(() => guarda(m.target.getAttribute(m.attributeName) || ''), 60); })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: A }); };
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
"""

def recull_estats(p, llengua):
    nav, ctx = aud.nou_context(p, 'mobil', 'clar', 'normal'); pg = ctx.new_page(); pg.add_init_script(RECORDER); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    if llengua != 'ca': pg.add_init_script("try { const a = JSON.parse(localStorage.getItem('mentA_ajustes') || '{}'); a.idioma = '" + llengua + "'; localStorage.setItem('mentA_ajustes', JSON.stringify(a)); } catch (e) {}")
    pg.goto(aud.APP); pg.wait_for_timeout(600)
    if llengua != 'ca': pg.wait_for_function("document.documentElement.lang === '" + llengua + "'", timeout=8000); pg.wait_for_timeout(300); pg.evaluate('window.__textos.clear()')
    pg.evaluate("carregarDemo()"); pg.wait_for_timeout(300); pg.evaluate("ajustes.rol = 'residencia'; guardarAjustes()")
    for _ in aud.estats(pg): pass
    # pistes de cada joc (3 nivells), final de partida, sessió guiada, Com vaig, benestar, xec, cuidador amb dades, parella
    for j in aud.JOCS:
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); mostrarPantalla('inici')")
        pg.evaluate(f"assegurarJoc('{j}')"); pg.wait_for_function(f"!!JOCS['{j}']", timeout=8000, polling=50)
        pg.evaluate(f"obrirJoc('{j}', false)"); pg.wait_for_timeout(500)
        if pg.locator('#modalDificultat.actiu').count(): pg.locator('#dificultatGrid button').nth(0).click(); pg.wait_for_timeout(500)
        if j == 'bingo': pg.evaluate("document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(7000)
        pg.evaluate("for (const id of ['seq-iniciar','nback-iniciar','span-iniciar','stroop-iniciar','fluidesa-iniciar','qf-iniciar']) { const b = document.getElementById(id); if (b && b.offsetParent) b.click(); }"); pg.wait_for_timeout(6500)
        try:
            pg.evaluate(f"document.querySelector('#joc-{j} .el-slot-joc').click()"); pg.wait_for_timeout(500)
            for n in range(3):
                pg.evaluate("(() => { const b = [...document.querySelectorAll('.el-globus.visible .el-boto.principal, #pistaTargeta .el-boto.principal')].find(x => /assenyala|mostra|señal|muestra/i.test(x.textContent)); if (b) b.click(); })()"); pg.wait_for_timeout(700)
            pg.evaluate("Pistes.tanca()")
        except Exception: pass
    # tutorials de cada joc, parella (duel i junts), repàs d'errors, enquesta, sessió guiada
    for j in aud.JOCS:
        try: pg.evaluate(f"assegurarJoc('{j}')"); pg.wait_for_function(f"!!JOCS['{j}']", timeout=8000, polling=50); pg.evaluate(f"jocActualId = '{j}'; mostrarTutorial('{j}', null, true)"); pg.wait_for_timeout(250); pg.evaluate("tancarTutorial()"); pg.wait_for_timeout(150)
        except Exception: pass
    for js in ["carregaParella(); obrirJugarAmbAlgu()", "parellaMode('contra'); parellaTriaJoc('calcul')", "duel = { joc: 'calcul', mode: 'duel', seed: 1, torn: 1, res: [null, null] }; duelRelleu(1)", "duel = { joc: 'calcul', mode: 'junts', seed: 1, torn: 2, res: [{ pct: 80, durada: 30 }, { pct: 60, durada: 40 }] }; duelResultat()",
               "duel = { joc: 'calcul', mode: 'duel', seed: 1, torn: 2, res: [{ pct: 80, durada: 30 }, { pct: 60, durada: 40 }] }; duelResultat()", "duel = null; comprovarEnquesta && (localStorage.removeItem('mentA_enquesta')); obrirModal('modalEnquesta')", "mostrarPantalla('feedback')", "mostrarPantalla('sobre')", "mostrarPantalla('privadesa')", "mostrarPantalla('condicions')"]:
        try: pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id))"); pg.evaluate(js); pg.wait_for_timeout(500)
        except Exception: pass
    for js in ["mostrarPantalla('inici'); obrirXecSalut()", "tancarModal('modalXecSalut'); iniciarRespiracio()", "tancarModal('modalRespiracio'); obrirComVaig()", "iniciarSessioCurta && iniciarSessioCurta()",
               "mostrarPantalla('inici'); mostrarFinalDemo && 0", "finalitzarPartida('memory', 6, 2, '', {})", "mostrarPantalla('album')", "mostrarPantalla('missatgeria')", "mostrarPantalla('calFamiliar')", "mostrarPantalla('testCognitiu')",
               "pilotObreSUS && usuaris.length && pilotObreSUS(usuaris[0].id)", "importaText(JSON.stringify(construeixPaquet()))", "elefantClick && 0"]:
        try: pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id))"); pg.evaluate(js); pg.wait_for_timeout(700)
        except Exception: pass
    pg.wait_for_timeout(200); textos = pg.evaluate("[...window.__textos]"); nav.close(); return textos, errs

def recull_jocs(p, llengua, n=2):
    textos = set()
    for j, (fn, admet2, nivells) in BOTS.items():
        rng = random.Random(7)
        for k in range(n):
            par = Partida(p, 'mobil'); par.pg.evaluate(RECORDER)
            if llengua != 'ca': par.pg.evaluate(f"ajustes.idioma = '{llengua}'; I18N.canvia('{llengua}', true)"); par.pg.wait_for_timeout(700); par.pg.evaluate('window.__textos.clear()')
            dos = admet2 and k == 1
            try:
                par.obre_joc(j, dos, (k % 3) if (nivells and not dos) else None); fn(par, rng, dos, (k % 3) if (nivells and not dos) else None)
                par.avanca(1500)
            except Exception as e: print('  (bot', j, k, type(e).__name__, str(e)[:80], ')')
            textos.update(par.pg.evaluate("[...window.__textos]")); par.tanca()
    return list(textos)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--llengua', default='ca'); ap.add_argument('--sortida', default=None); a = ap.parse_args()
    with sync_playwright() as p:
        t1, errs = recull_estats(p, a.llengua); print('estats:', len(t1), 'errors JS:', errs[:3])
        t2 = recull_jocs(p, a.llengua); print('jocs:', len(t2))
    tot = sorted(set(t1) | set(t2))
    sortida = pathlib.Path(a.sortida) if a.sortida else ARREL / 'tests' / 'i18n' / f'textos-{a.llengua}.json'
    sortida.write_text(json.dumps(tot, ensure_ascii=False, indent=0), encoding='utf-8'); print(len(tot), 'textos →', sortida)
