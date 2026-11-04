"""Castellà a les pantalles noves de la 1.10: tutorials, medalles, editor, menús. Diu quins textos encara semblen catalans. Ús: python tests/v110/test_castella.py"""
import pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
CATALA = re.compile(r"[àèòç]|·\w|\b(amb|és|això|aquest|aquesta|aquests|aquestes|sense|també|quan|dins|teu|teva|vols|pots|tens|hi ha|més|següent|jugar-hi|lletra|paraula|peça|partides|dies|jocs|setmana|medalles?|mateix|fer|per a|els|les)\b", re.I)
RECULL = """() => { const t = new Set(); const w = document.createTreeWalker(document.querySelector('.screen.active') || document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const s = n.data.trim(); if (s && n.parentElement.closest('svg, script, style') === null && n.parentElement.offsetParent !== null) t.add(s); }
  document.querySelectorAll('.screen.active [aria-label], .screen.active input[placeholder]').forEach(e => { ['aria-label', 'placeholder'].forEach(a => { const v = e.getAttribute(a); if (v) t.add(v); }); }); return [...t]; }"""


def main():
    resta = {}
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844)
        pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_guia_vist','1');window.__medallaManual=true"); pg.reload(); pg.wait_for_timeout(800)
        pg.evaluate("I18N.assegura(() => { ajustes.idioma = 'es'; guardarAjustes(); I18N.canvia('es', true); })"); pg.wait_for_timeout(1200)
        pg.evaluate("afegirUsuari({ nom: 'Prova' }); dadesActuals().medallesPers = [{ id: 'mp_1', nom: 'Xxx', tipus: 'joc', joc: 'memory', objectiu: 3 }]; registrarPartida('memory', 5, 1); partidaAcabada = true; aturaTimers(); document.getElementById('medallaCapa').hidden = true; _cuaMedalles.length = 0")
        def mira(nom, codi=None, espera=400):
            if codi: pg.evaluate(codi)
            pg.wait_for_timeout(espera)
            pg.evaluate("document.querySelectorAll('.toast').forEach(t => t.remove())")
            for x in pg.evaluate(RECULL):
                if CATALA.search(x): resta.setdefault(x, nom)
        for s in ['inici', 'meusJocs', 'comVaig', 'medalles', 'medallesEdita', 'album', 'configuracio', 'cuidador', 'jugarAmbAlgu', 'menuJocs']:
            mira(s, f"cuidadorObert = true; {'renderMenuJocs(); ' if s == 'menuJocs' else ''}mostrarPantalla('{s}')")
        pg.evaluate("cuTria('jocs')"); mira('cuidador-jocs'); pg.evaluate("cuTria('pla')"); mira('cuidador-pla')
        # Tutorials, passos, fitxes, resums: directament pel motor de traducció
        r = pg.evaluate("""() => { const out = []; const v = (x, o) => { if (x && t(x) === x) out.push([x, o]); };
          Object.entries(TUTORIALS).forEach(([id, ps]) => ps.forEach(p => { v(p.text, id); v(p.ok, id); (p.fitxes || []).forEach(f => { if (typeof f === 'string') v(f, id); else { v(f.t, id); v(f.a, id); } }); }));
          MEDALLES.forEach(m => { v(m.nom, 'medalla'); v(m.desc, 'medalla'); }); Object.values(CAT_MEDALLES).forEach(x => v(x, 'cat')); Object.values(TIPUS_MEDALLA).forEach(x => v(x.nom, 'tipus'));
          CATALEG_JOCS.forEach(j => { v(j.nom, 'cataleg'); v(j.desc, 'cataleg'); v(j.tecnic, 'cataleg'); if (j.dos) v(j.dos.desc, 'cataleg'); });
          return out; }""")
        for x, o in r:
            if CATALA.search(x) or len(x) > 12: resta.setdefault(x, o)
        # Tutorials dels jocs: el text del resum
        for id in pg.evaluate("CATALEG_JOCS.map(j => j.id)"):
            pg.evaluate("i => assegurarJoc(i)", id); pg.wait_for_function("i => !!JOCS[i]", arg=id, timeout=8000)
            pg.evaluate("""i => { document.getElementById('tutorialCos').innerHTML = JOCS[i].tutorial.cos; document.getElementById('tutorialOverlay').classList.add('actiu'); setText('tutorialTitol', JOCS[i].tutorial.titol); }""", id); pg.wait_for_timeout(120)
            for x in pg.evaluate("[...document.querySelectorAll('.tutorial-card h2, #tutorialCos p, #tutorialCos li, #tutorialCos span')].map(e => e.textContent.trim()).filter(Boolean)"):
                if CATALA.search(x): resta.setdefault(x, 'resum ' + id)
            pg.evaluate("document.getElementById('tutorialOverlay').classList.remove('actiu')")
        b.close()
    for x in ('Cultura general', 'Català', 'Perfeccionista'): resta.pop(x, None)       # iguals en els dos idiomes, o el nom de l'idioma
    print(f'Restes de català: {len(resta)}')
    for x, o in sorted(resta.items(), key=lambda kv: kv[1]): print(f'  [{o}] {x[:170]}')
    return 1 if resta else 0


if __name__ == '__main__': sys.exit(main())
