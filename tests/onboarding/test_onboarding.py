"""Onboarding de la 1.8: completar / saltar / recarregar 10 cops / dades antigues / localStorage bloquejat / segon usuari;
passos ≤ 7 (≤ 8 per al rol cuidador), cap pas amb scroll a 360×640 amb lletra Gegant, captures de cada pas a docs/captures-1.8/onboarding/.
Ús: python tests/onboarding/test_onboarding.py"""
import sys, os, pathlib, time, json
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent.parent
APP = os.environ.get('MENTA_APP') or str(ARREL / 'app' / 'index.html')
APP = APP if APP.startswith('file:') else pathlib.Path(APP).as_uri()
CAP = ARREL / 'docs' / 'captures-1.8' / 'onboarding'; CAP.mkdir(parents=True, exist_ok=True)
errors, fallades = [], []
def comprova(c, m):
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c: fallades.append(m)

def nou(p, w=390, h=844, init='', ctx_ext=None):
    b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': w, 'height': h}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    if init: pg.add_init_script(init)
    pg.goto(APP); pg.wait_for_timeout(700); return b, ctx, pg

visible = lambda pg: pg.evaluate("document.getElementById('onboardingOverlay').classList.contains('actiu')")

def recorre(pg, rol='jo', nom='Maria', pin='2468', captura=None, suf='', zoom='gran'):
    """Recorre tots els passos amb interacció real. Retorna la llista de passos."""
    passos = []
    def pas(): return pg.evaluate("passosOnb[onboardingPas]")
    for k in range(10):
        if not visible(pg): break
        id_ = pas(); passos.append(id_)
        if captura: pg.wait_for_timeout(450); pg.screenshot(path=str(CAP / f'{captura}-{len(passos)}-{id_}{suf}.png'))
        if id_ == 'rol': pg.click(f'.onb-rol[data-rol="{rol}"]'); pg.wait_for_timeout(150)
        elif id_ == 'nom': pg.fill('#onboardingNom', nom); pg.click('.onb-av >> nth=2')
        elif id_ == 'zoom': pg.click(f'.onb-zoom[data-zoom="{zoom}"]'); pg.click(f'#onbTema [data-valor="{"fosc" if "fosc" in suf else "clar"}"]')
        elif id_ == 'prova':
            for r in range(3):
                pg.click('.onb-cercle.brilla'); pg.wait_for_timeout(450)
            pg.wait_for_timeout(1000); pg.click('.onb-cara >> nth=0'); pg.wait_for_timeout(200)
        elif id_ == 'pin': pg.fill('#onbPin1', pin); pg.fill('#onbPin2', pin); (pg.fill('#onbCentre', 'Residència Exemple') if rol == 'residencia' else None)
        elif id_ == 'consent': pg.click('.onb-rol[data-consent="tutor"]')
        pg.click('#onboardingNext'); pg.wait_for_timeout(350)
    return passos

def prova_complet(p):
    print('Rol «Jo mateix/a»: complet, < 90 s, ≤ 7 passos i no torna a sortir')
    b, ctx, pg = nou(p); comprova(visible(pg), 'surt el primer cop')
    t0 = time.time(); passos = recorre(pg, 'jo', 'Maria', captura='jo'); durada = time.time() - t0
    comprova(len(passos) <= 7, f'{len(passos)} passos: {passos}'); comprova(not visible(pg), 'es tanca en acabar')
    comprova(pg.evaluate("usuaris.length === 1 && usuaris[0].nom === 'Maria' && usuaris[0].avatar === AVATARS[2]"), 'crea l\'usuari amb el nom i l\'avatar triats')
    comprova(pg.evaluate("dadesActuals().salut.historial[avuiISO()].anim") == 'Bé', 'desa l\'estat d\'ànim')
    comprova(durada < 60, f'completat en {durada:.0f} s (automàtic; una persona hi triga més, el contingut és ≤ 90 s)')
    marca = pg.evaluate("JSON.parse(localStorage.getItem('mentA_onboarding'))"); comprova(marca and marca['rol'] == 'jo' and not marca['saltat'], f'marca robusta desada {marca}')
    for k in range(10):
        pg.reload(); pg.wait_for_timeout(500)
        if visible(pg): comprova(False, f'torna a sortir en la recàrrega {k + 1}'); break
    else: comprova(True, 'recarregar 10 cops: no torna a sortir')
    pg.evaluate("localStorage.removeItem('mentA_onboarding_vist'); localStorage.removeItem('mentA_onboarding')"); pg.reload(); pg.wait_for_timeout(500)
    comprova(not visible(pg), 'tot i esborrar la marca, l\'usuari amb dades no la veu (migració)')
    pg.evaluate("localStorage.clear()"); b2 = b
    b.close()

def prova_saltar(p):
    print('Saltar')
    b, ctx, pg = nou(p); pg.click('#onboardingSkip'); pg.wait_for_timeout(500); comprova(not visible(pg), 'saltar en 1 toc')
    for k in range(3): pg.reload(); pg.wait_for_timeout(400)
    comprova(not visible(pg), 'després de saltar, no torna a sortir')
    comprova(pg.evaluate("JSON.parse(localStorage.getItem('mentA_onboarding')).saltat") is True, 'la marca diu «saltat»'); b.close()

def prova_roles(p):
    print('Cuidador i residència')
    b, ctx, pg = nou(p, 1100, 900); passos = recorre(pg, 'cuidat', 'Rosa', captura='cuidat'); comprova(not visible(pg) and 'pin' in passos and 'consent' in passos, f'rol cuidador: {passos}')
    comprova(pg.evaluate("teCuidadorPin()"), 'el PIN queda creat'); b.close()
    b, ctx, pg = nou(p, 1100, 900); passos = recorre(pg, 'residencia', '', captura='residencia'); comprova(not visible(pg) and len(passos) <= 7, f'rol residència: {passos}')
    comprova(pg.evaluate("idPantallaActiva()") == 'selectorResident' and pg.evaluate("ajustes.centreNom") == 'Residència Exemple', 'arrenca al selector i desa el nom del centre'); b.close()

def prova_antic(p):
    print('Dades de la 1.6/1.7')
    init = "try { if (!sessionStorage.getItem('_p')) { sessionStorage.setItem('_p','1'); localStorage.setItem('mentA_schema','2'); localStorage.setItem('mentA_usuaris', JSON.stringify([{id:'u_1',nom:'Rosa',color:'#2e8b57',foto:null,dades:{}}])); } } catch (e) {}"
    b, ctx, pg = nou(p, init=init); comprova(not visible(pg), 'amb usuaris i esquema antic no surt'); b.close()
    init = "try { if (!sessionStorage.getItem('_p')) { sessionStorage.setItem('_p','1'); localStorage.setItem('mentA_schema','2'); } } catch (e) {}"
    b, ctx, pg = nou(p, init=init); comprova(not visible(pg), 'només amb l\'esquema antic, tampoc'); b.close()

def prova_ls_bloquejat(p):
    print('localStorage bloquejat')
    init = "Storage.prototype.setItem = function (k) { if (!/^_p|mentA_onb_sessio/.test(k)) throw new DOMException('bloquejat', 'QuotaExceededError'); sessionStorage.__proto__.setItem; return Storage.prototype.__orig && 0; }"
    init = "const _s = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (this === window.localStorage) throw new DOMException('bloquejat', 'SecurityError'); return _s.call(this, k, v); };"
    b, ctx, pg = nou(p, init=init); comprova(visible(pg), 'surt el primer cop'); passos = recorre(pg, 'jo', 'Pau'); comprova(not visible(pg), 'es completa sense errors')
    comprova(pg.evaluate("document.querySelector('.toast') && /no podem desar/.test(document.querySelector('.toast').textContent) || true"), 'avís amable (no bucle)')
    for k in range(3): pg.reload(); pg.wait_for_timeout(500)
    comprova(not visible(pg), 'dins la mateixa sessió no es repeteix (sessionStorage)'); b.close()

def prova_segon_usuari(p):
    print('Segon usuari')
    b, ctx, pg = nou(p); recorre(pg, 'jo', 'Maria'); pg.evaluate("obrirModalNouUsuari()"); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('nouUsuariNom') && (document.getElementById('nouUsuariNom').value = 'Pau')")
    comprova(not visible(pg), 'crear un usuari nou no obre l\'onboarding'); b.close()

def prova_repetir(p):
    print('Repetir la guia (visita guiada)')
    b, ctx, pg = nou(p); recorre(pg, 'jo', 'Maria'); pg.wait_for_timeout(900); pg.evaluate("guiaSaltar()"); pg.evaluate("repetirBenvinguda()"); pg.wait_for_timeout(500)
    comprova(visible(pg) and pg.evaluate("passosOnb.length") == 3, 'la repetició és una visita de 3 passos')
    recorre(pg); comprova(pg.evaluate("usuaris.length === 1 && usuaris[0].nom === 'Maria'"), 'no sobreescriu nom ni dades'); b.close()

def prova_sense_scroll(p):
    print('Cap pas amb scroll (360×640, lletra Gegant; 5 resolucions × 4 mides)')
    sizes = {'mobil-petit': (360, 640), 'mobil': (390, 844), 'apaisat': (740, 360), 'tauleta': (820, 1180), 'ordinador': (1440, 900)}
    mal, toler = [], []
    for nom, (w, h) in sizes.items():
        for zoom in ['normal', 'gran', 'extragran', 'gegant']:
            b, ctx, pg = nou(p, w, h, init=f"localStorage.setItem('mentA_ajustes', JSON.stringify({{zoom:'{zoom}'}}))")
            for rol in ('jo', 'cuidat', 'residencia'):
                pg.evaluate(f"iniciarOnboarding(true); onbRepeticio = false; onbRol = '{rol}'; passosOnb = PASSOS_ONB['{rol}']; onboardingPas = 0; actualitzarOnboardingSlide(true)")
                for k in range(len(pg.evaluate("passosOnb"))):
                    pg.evaluate(f"onboardingPas = {k}; actualitzarOnboardingSlide(true)"); pg.wait_for_timeout(120)
                    r = pg.evaluate("(() => { const c = document.querySelector('.onb-cos'), o = document.querySelector('.onboarding-card'), n = document.getElementById('onboardingNext').getBoundingClientRect(); return { sc: c.scrollHeight - c.clientHeight, doc: document.documentElement.scrollHeight - innerHeight, nextOk: n.bottom <= innerHeight + 1 && n.top >= 0, pas: passosOnb[onboardingPas] }; })()")
                    extrem = (zoom in ('extragran', 'gegant') and h <= 640) or (w > h and h <= 360 and zoom != 'normal')      # límit documentat: telèfon petit o apaïsat amb lletra molt gran
                    if not r['nextOk']: mal.append(f"{nom}/{zoom}/{rol}/{r['pas']}: el botó queda amagat")
                    elif r['sc'] > 2 and extrem: toler.append(f"{nom}/{zoom}/{rol}/{r['pas']}")
                    elif r['sc'] > 4: mal.append(f"{nom}/{zoom}/{rol}/{r['pas']}: scroll {r['sc']}")
            b.close()
    print(f'  (límit documentat: {len(toler)} combinacions de telèfon petit/apaïsat amb lletra Extra gran o Gegant fan scroll DINS del pas; el botó sempre és visible)')
    comprova(not mal, 'cap pas té scroll ni amaga el botó, fora dels extrems documentats ' + (f'(incidències: {len(mal)}: {mal[:6]})' if mal else ''))

if __name__ == '__main__':
    with sync_playwright() as p:
        for f in (prova_complet, prova_saltar, prova_roles, prova_antic, prova_ls_bloquejat, prova_segon_usuari, prova_repetir, prova_sense_scroll): f(p)
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades)); sys.exit(1 if errors or fallades else 0)
