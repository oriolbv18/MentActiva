"""Genera les captures REALS de l'app per a la web (img/web/*.webp) i el catàleg de jocs (web/jocs.js), amb el Mode demostració.
Cap imatge és inventada: són captures de l'app. Ús: python tools/captures-web.py"""
import io, json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ARREL = pathlib.Path(__file__).resolve().parent.parent
APP = (ARREL / 'app' / 'index.html').as_uri()
OUT = ARREL / 'img' / 'web'; (OUT / 'jocs').mkdir(parents=True, exist_ok=True); (ARREL / 'web').mkdir(exist_ok=True)

def desa(png, nom, ample=None):
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if ample and im.width > ample: im = im.resize((ample, round(im.height * ample / im.width)), Image.LANCZOS)
    im.save(OUT / nom, 'WEBP', quality=82, method=6); print('  ', nom, im.size)

def foto(pg):
    pg.evaluate("document.querySelectorAll('.toast, #toast, [role=status].actiu, .avis-copia, #elefantFlotant').forEach(t => t.remove())"); pg.wait_for_timeout(150); return pg.screenshot()      # fora avisos de còpia i l'Elefant flotant de l'app (la web té el seu)

HORES = {'alba': '2026-10-13T08:30:00', 'tarda': '2026-10-13T16:10:00', 'vespre': '2026-10-13T21:30:00'}

def hora(pg, quan):
    """Fixa el rellotge del navegador: l'app calcula ella mateixa la salutació (Bon dia / Bona tarda / Bona nit); no s'edita cap captura."""
    pg.clock.set_fixed_time(HORES[quan])

def nou(p, w, h, fosc=False):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}, device_scale_factor=3 if w < 600 else 1, color_scheme='dark' if fosc else 'light'); pg = ctx.new_page(); hora(pg, 'alba')
    pg.on('pageerror', lambda e: print('ERROR JS', e))
    pg.goto(APP); pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))))")
    pg.reload(); pg.wait_for_timeout(800); return b, pg

def main():
    with sync_playwright() as p:
        b, pg = nou(p, 430, 932)                                     # 430×932 (mateixa proporció que 390×844): les etiquetes de l'app hi caben senceres
        cat = pg.evaluate("CATALEG_JOCS.map(j => ({ id: j.id, nom: j.nom, desc: j.desc || (j.dos && j.dos.desc) || '', domini: j.domini, dominiNom: NOMS_DOMINI[j.domini], min: j.min, dos: !!j.dos, individual: !j.nomesDos }))")
        (ARREL / 'web' / 'jocs.js').write_text("// Generat per tools/captures-web.py a partir del catàleg real de l'app. No l'editis a mà.\nconst JOCS_WEB = " + json.dumps(cat, ensure_ascii=False, indent=1) + ';\n', encoding='utf8')
        print('Catàleg:', len(cat), 'jocs')
        # Alba: l'inici d'un convidat, a les 8:30 («Bon dia»)
        pg.evaluate("ajustes.rol = 'jo'; guardarAjustes(); mostrarPantalla('inici')"); pg.wait_for_timeout(600)
        pg.evaluate("document.getElementById('banerSistema').innerHTML = ''"); desa(foto(pg), 'inici.webp', 720)
        # Tarda: jocs en marxa, amb dades d'exemple (residents fictícies)
        hora(pg, 'tarda')
        pg.evaluate("carregarDemo(); ajustes.rol = 'jo'; guardarAjustes(); canviarUsuari('u_demo_1'); mostrarPantalla('inici')"); pg.wait_for_timeout(600)
        pg.evaluate("document.getElementById('banerSistema').innerHTML = ''")
        pg.evaluate("obrirJugarAmbAlgu()"); pg.wait_for_timeout(500); desa(foto(pg), 'jugar-amb-algu.webp', 720)
        pg.evaluate("obrirMeusJocs()"); pg.wait_for_timeout(500); desa(foto(pg), 'els-meus-jocs.webp', 720)
        pg.evaluate("obrirComVaig()"); pg.wait_for_timeout(1500); pg.evaluate("document.getElementById('trophyOverlay') && document.getElementById('trophyOverlay').classList.remove('actiu'); document.querySelectorAll('.toast').forEach(t => t.remove())"); desa(foto(pg), 'com-vaig.webp', 720)
        pg.set_viewport_size({'width': 430, 'height': 772})        # els jocs es capturen més baixos (proporció 390:700): menys blanc buit, més joc
        for j in cat:
            pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); sessio = null; mostrarPantalla('inici')")
            pg.evaluate(f"assegurarJoc('{j['id']}')"); pg.wait_for_function(f"!!JOCS['{j['id']}']", timeout=8000, polling=50)
            pg.evaluate(f"obrirJoc('{j['id']}', false)"); pg.wait_for_timeout(500)
            if pg.locator('#modalDificultat.actiu').count(): pg.locator('#dificultatGrid button').nth(0).click(); pg.wait_for_timeout(600)
            if j['id'] == 'bingo':
                pg.evaluate("bingoOpcio.velocitat('rapida'); bingoOpcio.ajuda('ajuda'); document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(9000)
            for ini, espera in (('nback-iniciar', 2500), ('stroop-iniciar', 2500), ('span-iniciar', 1300), ('fluidesa-iniciar', 2500), ('qf-iniciar', 1200), ('seq-iniciar', 1900)):
                clau = {'qf': 'quefalta', 'seq': 'sequencia'}.get(ini.split('-')[0], ini.split('-')[0])
                if j['id'] == clau and pg.locator('#' + ini).count(): pg.evaluate(f"document.getElementById('{ini}').click()"); pg.wait_for_timeout(espera)
            if j['id'] == 'memory':              # una parella trobada i una altra carta girada: es veu què passa (es busca la parella de la carta 1 provant)
                nom = lambda k: pg.evaluate(f"(document.querySelectorAll('#memory-grid .carta')[{k}].getAttribute('aria-label') || '').replace(/^Carta \d+: /, '')")
                pg.wait_for_timeout(3500); n = pg.evaluate("document.querySelectorAll('#memory-grid .carta').length"); trobada = None
                for k in range(1, n):
                    pg.evaluate("document.querySelectorAll('#memory-grid .carta')[0].click()"); pg.wait_for_timeout(450)
                    pg.evaluate(f"document.querySelectorAll('#memory-grid .carta')[{k}].click()"); pg.wait_for_timeout(450)
                    if nom(0) == nom(k): trobada = k; break
                    pg.wait_for_timeout(1500)
                pg.wait_for_timeout(900)
                altra = next(k for k in range(1, n) if k != trobada); pg.evaluate(f"document.querySelectorAll('#memory-grid .carta')[{altra}].click()"); pg.wait_for_timeout(700)
            pg.evaluate("document.querySelectorAll('.toast').forEach(t => t.remove())")
            desa(foto(pg), f'jocs/{j["id"]}.webp', 480)
        pg.set_viewport_size({'width': 430, 'height': 932})
        # Vespre: l'espai del cuidador, a les 21:30 (dades fictícies)
        hora(pg, 'vespre')
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); mostrarPantalla('inici'); cuidadorObert = true; canviarUsuari('u_demo_2'); entraCuidador(); cuTria('resum')"); pg.wait_for_timeout(700)
        pg.evaluate("document.getElementById('banerSistema').innerHTML = ''"); desa(foto(pg), 'cuidador-mobil.webp', 720)
        pg.evaluate("cuTria('evolucio')"); pg.wait_for_timeout(500); desa(foto(pg), 'cuidador-evolucio-mobil.webp', 720)
        b.close()
        b, pg = nou(p, 1280, 860)
        pg.evaluate("carregarDemo(); cuidadorObert = true; canviarUsuari('u_demo_2'); entraCuidador(); cuTria('resum')"); pg.wait_for_timeout(800); desa(foto(pg), 'cuidador-escriptori.webp', 1280)
        pg.evaluate("cuTria('residencia')"); pg.wait_for_timeout(600); desa(foto(pg), 'residencia-escriptori.webp', 1280)
        pg.evaluate("cuTria('evolucio')"); pg.wait_for_timeout(600); desa(foto(pg), 'evolucio-escriptori.webp', 1280)
        b.close()
        b, pg = nou(p, 820, 1180)              # tauleta compartida d'una residència: el selector de residents
        pg.evaluate("carregarDemo(); mostrarPantalla('selectorResident')"); pg.wait_for_timeout(1200); pg.evaluate("document.getElementById('banerSistema') && (document.getElementById('banerSistema').innerHTML = '')"); desa(foto(pg), 'selector-residents.webp', 800)
        b.close()
        b, pg = nou(p, 430, 932)
        pg.evaluate("localStorage.removeItem('mentA_onboarding_vist')"); pg.reload(); pg.wait_for_timeout(900)
        for i, nom in enumerate(['benvinguda', 'rol', 'zoom']):
            desa(foto(pg), f'onboarding-{i + 1}-{nom}.webp', 600); pg.click('#onboardingNext'); pg.wait_for_timeout(250)
        b.close()
    # variants de 360 px per a les captures de mòbil (srcset)
    for nom in ('inici', 'jugar-amb-algu', 'els-meus-jocs', 'com-vaig', 'cuidador-mobil', 'cuidador-evolucio-mobil'):
        im = Image.open(OUT / f'{nom}.webp').convert('RGB'); im = im.resize((360, round(im.height * 360 / im.width)), Image.LANCZOS); im.save(OUT / f'{nom}-360.webp', 'WEBP', quality=66, method=6)
    for nom in ('cuidador-escriptori', 'residencia-escriptori', 'evolucio-escriptori'):     # variants de 640 px per a pantalles petites (srcset)
        im = Image.open(OUT / f'{nom}.webp').convert('RGB'); im = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS); im.save(OUT / f'{nom}-640.webp', 'WEBP', quality=80, method=6)
    im = Image.open(OUT / 'selector-residents.webp').convert('RGB'); im.resize((360, round(im.height * 360 / im.width)), Image.LANCZOS).save(OUT / 'selector-residents-360.webp', 'WEBP', quality=72, method=6)
    for f in sorted((OUT / 'jocs').glob('*.webp')):             # variants de 360 px dels jocs (srcset de l'aparador)
        if f.stem.endswith('-360'): continue
        im = Image.open(f).convert('RGB'); im.resize((360, round(im.height * 360 / im.width)), Image.LANCZOS).save(OUT / 'jocs' / (f.stem + '-360.webp'), 'WEBP', quality=70, method=6)
    Image.open(ARREL / 'app' / 'img' / 'logo.webp').convert('RGBA').resize((76, 76), Image.LANCZOS).save(OUT / 'logo-76.webp', 'WEBP', quality=88, method=6)      # logo petit per a la capçalera
    print('Fet.')

if __name__ == '__main__': main()
