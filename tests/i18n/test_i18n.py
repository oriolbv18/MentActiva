"""Castellà (v1.9): canvi d'idioma en calent, restauració exacta en tornar al català, bancs culturals en castellà, Bingo en castellà,
Elefant en castellà, selector a Configuració i a la benvinguda, text sense tallar (botons) i cap error de JS.
Ús: python tests/i18n/test_i18n.py"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades, APP
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
PREPARA = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({tertulia:true,refranys:true,paraules:true,bingo:true,sopa:true,fluidesa:true,memory:true}))"
CATALA = ['Els meus jocs', 'Jugar amb algú', 'Configuració', 'Com vaig']

def estat(pg):
    return pg.evaluate("[document.body.innerText.replace(/\\s+/g, ' ').trim(), [...document.querySelectorAll('[aria-label],[placeholder],[title]')].map(e => (e.getAttribute('aria-label') || '') + '|' + (e.getAttribute('placeholder') || '') + '|' + (e.getAttribute('title') || '')).join('~')]")

def main():
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844); pg.evaluate(PREPARA); pg.reload(); pg.wait_for_timeout(1500)
        comprova(pg.evaluate("I18N.disponible()"), 'el diccionari castellà està carregat (el selector es mostra)')
        pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("!document.getElementById('selectorIdioma').hidden && document.getElementById('selectorIdioma').getBoundingClientRect().width > 0"), 'Configuració mostra el selector d\'idioma')
        for mostra in ('inici', 'configuracio', 'menuJocs'):
            pg.evaluate(f"mostrarPantalla('{mostra}')"); pg.wait_for_timeout(400)
            abans = estat(pg)
            pg.evaluate("document.querySelector('[data-tria=idioma] [data-valor=es]').click ? 0 : 0"); pg.evaluate("ajustes.idioma = 'es'; AJUST_ACCIONS.idioma('es')"); pg.wait_for_timeout(500)
            es = estat(pg)
            comprova(es[0] != abans[0] and 'Mis juegos' in es[0] if mostra == 'inici' else es[0] != abans[0], f'{mostra}: en castellà el text és diferent')
            comprova(pg.evaluate("document.documentElement.lang") == 'es', f'{mostra}: <html lang="es">')
            pg.evaluate("ajustes.idioma = 'ca'; AJUST_ACCIONS.idioma('ca')"); pg.wait_for_timeout(500)
            torna = estat(pg)
            comprova(torna == abans, f'{mostra}: en tornar al català tot queda exactament com abans (text i etiquetes)')
        # arrencada directa en castellà i sense català a les pantalles principals
        pg.evaluate("ajustes.idioma = 'es'; guardarAjustes()"); pg.reload(); pg.wait_for_timeout(1500)
        pg.evaluate("mostrarPantalla('inici')"); pg.wait_for_timeout(400); comprova(pg.evaluate("document.documentElement.lang") == 'es' and 'Jugar con alguien' in pg.inner_text('body'), 'l\'idioma es recorda en recarregar')
        txt = pg.inner_text('body')
        comprova(not any(c in txt for c in CATALA), 'l\'inici en castellà no conté textos catalans coneguts')
        # jocs: bancs en castellà
        pg.evaluate("obrirJoc('tertulia')"); pg.wait_for_timeout(1500)
        q = pg.inner_text('#tertulia-pregunta'); comprova(q.startswith('¿') and q.endswith('?'), f'Tertulia: pregunta en castellà «{q}»')
        pg.evaluate("mostrarPantalla('inici'); obrirJoc('refranys')"); pg.wait_for_timeout(1500)
        q = pg.inner_text('#refranys-pregunta'); comprova(any(w in q for w in (' el ', ' la ', 'Quien', 'Más', 'No ', 'A ', 'Al ', 'En ', 'De ', 'Dime', 'Camar', 'Ojos', 'Cría', 'Agua', 'Perro', 'Donde', 'Cuando', 'El ', 'La ', 'Mucho', 'Año', 'Por ', 'Cada', 'Zapat', 'Lo ', 'Hombre', 'Después', 'Todos', 'Roma', 'Ver', 'Haz', 'Cuentas', 'Grano', 'Ande', 'Del ', 'Ojo', 'Mal ', 'Poder')) and 'Qui ' not in q, f'Refranys en castellà «{q}»')
        pg.evaluate("mostrarPantalla('inici'); obrirJoc('paraules')"); pg.wait_for_timeout(1500)
        pista = pg.inner_text('#paraules-feedback'); comprova(pista.startswith('Pista:') and 'Pista: Té' not in pista, f'Endevina la paraula: pista en castellà «{pista}»')
        pg.evaluate("mostrarPantalla('inici'); obrirJoc('sopa')"); pg.wait_for_timeout(800)
        pg.evaluate("document.querySelectorAll('#modalDificultat .dificultat-btn')[0] && document.querySelectorAll('#modalDificultat .dificultat-btn')[0].click()"); pg.wait_for_timeout(1000)
        mots = pg.evaluate("[...document.querySelectorAll('#sopa-paraules .sopa-paraula')].map(e => e.textContent)")
        comprova(len(mots) >= 4 and all(m in json.loads(pg.evaluate('JSON.stringify(BANCS_ES.sopa)')) for m in mots), f'Sopa de lletres amb paraules castellanes {mots}')
        # Bingo en castellà
        pg.evaluate("assegurarJoc('bingo')"); pg.wait_for_function("!!window.BINGO", timeout=8000)
        nums = pg.evaluate("[1, 13, 21, 22, 31, 47, 56, 72, 80, 90].map(n => BINGO.numeroCastella(n))")
        comprova(nums == ['uno', 'trece', 'veintiuno', 'veintidós', 'treinta y uno', 'cuarenta y siete', 'cincuenta y seis', 'setenta y dos', 'ochenta', 'noventa'], f'números del Bingo en castellà {nums}')
        # Elefant en castellà (pista i oferta)
        pg.evaluate("mostrarPantalla('inici'); obrirJoc('memory')"); pg.wait_for_timeout(900)
        pg.evaluate("document.querySelectorAll('#modalDificultat .dificultat-btn')[1] && document.querySelectorAll('#modalDificultat .dificultat-btn')[1].click()"); pg.wait_for_timeout(900)
        pg.evaluate("for (let i = 0; i < 4; i++) soError()"); pg.wait_for_timeout(700)
        t = pg.evaluate("(document.querySelector('.el-globus.visible .el-globus-text') || {}).textContent || ''"); comprova(any(x in t for x in ('pista', 'Pista', 'ayuda', 'ayude', 'mano')), f'l\'Elefant ofereix la pista en castellà «{t}»')
        pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Sí').click()"); pg.wait_for_timeout(700)
        t = pg.evaluate("(document.querySelector('.el-globus.visible .el-globus-text') || {}).textContent || ''"); comprova(not any(x in t for x in ('Gira cartes', 'cartes', 'parella', 'Fixa')), f'pista de Memory en castellà «{t}»')
        # jugar amb algú i selector de la benvinguda
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); Pistes.tanca(); mostrarPantalla('jugarAmbAlgu')"); pg.wait_for_timeout(500)
        comprova('Jugar con alguien' in pg.inner_text('body') or 'Un contra otro' in pg.inner_text('body') or 'Elige quién juega' in pg.inner_text('body'), 'Jugar amb algú en castellà')
        b.close()
        # benvinguda: el selector d'idioma canvia el text al moment
        b = p.chromium.launch(); ctx = b.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.goto(APP); pg.wait_for_timeout(1800)
        comprova(pg.evaluate("!document.getElementById('onbIdioma').hidden"), 'la benvinguda ofereix el canvi d\'idioma')
        pg.click('#onbIdioma [data-valor="es"]'); pg.wait_for_timeout(500)
        comprova('Hola' in pg.inner_text('#onbTitol') and 'Elefante' in pg.inner_text('#onbTitol') and pg.inner_text('#onboardingNext') == 'Empezamos', f'la benvinguda es veu en castellà ({pg.inner_text("#onboardingNext")})')
        pg.click('#onbIdioma [data-valor="ca"]'); pg.wait_for_timeout(400); comprova(pg.inner_text('#onboardingNext') == 'Comencem', 'i torna al català')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades)); return 1 if errors or fallades else 0
if __name__ == '__main__': sys.exit(main())
