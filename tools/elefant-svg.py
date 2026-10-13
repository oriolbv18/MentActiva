"""Exporta l'Elefant de l'app (el mateix dibuix, no un de nou) com a SVG estàtic autònom per a la web: img/web/elefant.svg
i una versió amb la trompa aixecada (elefant-saluda.svg). Ús: python tools/elefant-svg.py"""
import pathlib, re, sys
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = (ARREL / 'app' / 'index.html').as_uri()

JS = r"""([estat, css]) => {
  window.__elefantEstatic = true;
  const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:300px'; document.body.appendChild(d);
  const e = Elefant.crea(d, { mida: 'gran', rol: 'web' }); if (e.estat) e.estat(estat);
  const wrap = d.querySelector('.el-wrap'), svg = d.querySelector('svg'), cs = getComputedStyle(wrap);
  const vars = ['--el-cos','--el-cap','--el-fons','--el-ombra','--el-llum','--el-orella','--el-orella-int','--el-trompa','--el-ullal','--el-ungla','--el-pupilla','--el-blanc','--el-galta','--el-verd','--el-verd-fosc','--el-boca','--el-linia'];
  const style = vars.map(v => v + ':' + cs.getPropertyValue(v).trim()).join(';');
  let regles = '';
  const fulla = new CSSStyleSheet(); fulla.replaceSync(css);
  for (const r of fulla.cssRules) if (r.selectorText && /\.el-/.test(r.selectorText) && !/wrap|globus|flotant|slot|anell|boto|pista/.test(r.selectorText)) regles += r.cssText + '\n';
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('style', style); svg.removeAttribute('aria-hidden'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', "L'Elefant de MentA");
  return svg.outerHTML.replace('>', '><style>[hidden]{display:none}\n' + regles + '</style>');
}"""

def main():
    css = (ARREL / 'app' / 'css' / 'elefant.css').read_text(encoding='utf-8')
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.goto(APP); pg.wait_for_timeout(800)
        for estat, nom in (('repos', 'elefant.svg'), ('saluda', 'elefant-saluda.svg')):
            svg = pg.evaluate(JS, [estat, css]); pg.evaluate("document.querySelectorAll('body > div').forEach(d => { if (d.style.position === 'fixed' && d.style.left === '0px') d.remove(); })")
            (ARREL / 'img' / 'web' / nom).write_text(svg, encoding='utf-8'); print(nom, len(svg), 'bytes')
            if nom == 'elefant.svg':     # versió del hero: sense pupil·les (JavaScript les mou com a punts HTML; evita un SVG en línia al HTML, car de pintar)
                import re as _re; (ARREL / 'img' / 'web' / 'elefant-hero.svg').write_text(_re.sub(r'<g class="el-pupilla"[^>]*>.*?</g>', '', svg, flags=_re.S), encoding='utf-8')
        b.close()

if __name__ == '__main__': main()
