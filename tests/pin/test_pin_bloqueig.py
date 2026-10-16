"""PIN del cuidador (v1.10): el bloqueig després de 5 errors sobreviu a recarregar la pàgina i no viatja a les còpies.
Ús: python tests/pin/test_pin_bloqueig.py"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass


def escriu(pg, pin):
    for c in pin:
        pg.evaluate("k => pinTecla(k)", c)
        pg.wait_for_timeout(30)
    pg.wait_for_timeout(250)


def main():
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844)
        pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1')")
        pg.reload(); pg.wait_for_timeout(1000)
        pg.evaluate("desaPin('1234')"); pg.wait_for_timeout(300)
        pg.evaluate("demanaPin('entrar', () => { window.__entrat = true; })")
        for i in range(5): escriu(pg, '0000')
        comprova(pg.evaluate("_pin.bloquejatFins > Date.now()"), 'a la cinquena errada es bloqueja')
        comprova(pg.evaluate("!!localStorage.getItem('mentA_pin_bloqueig')"), 'el bloqueig es desa')
        pg.reload(); pg.wait_for_timeout(1000)
        pg.evaluate("demanaPin('entrar', () => { window.__entrat = true; })")
        comprova(pg.evaluate("_pin.bloquejatFins > Date.now()"), 'després de recarregar encara està bloquejat')
        escriu(pg, '1234')
        comprova(not pg.evaluate("!!window.__entrat"), 'el PIN correcte tampoc entra durant el bloqueig')
        txt = pg.evaluate("document.getElementById('pinError').textContent")
        comprova('segons' in txt, f'el missatge diu quant cal esperar: «{txt}»')
        pg.evaluate("_pin.bloquejatFins = Date.now() - 1; desaBloqueigPin()")
        escriu(pg, '1234')
        comprova(pg.evaluate("!!window.__entrat"), 'passat el bloqueig, el PIN correcte entra')
        comprova(pg.evaluate("localStorage.getItem('mentA_pin_bloqueig')") is None, "en entrar, s'esborra el bloqueig desat")
        pg.evaluate("demanaPin('entrar', () => {})")
        for i in range(3): escriu(pg, '0000')
        pg.reload(); pg.wait_for_timeout(1000)
        comprova(pg.evaluate("_pin.intents") == 3, 'els intents fallats es recorden en recarregar')
        comprova(pg.evaluate("CLAUS_NO_EXPORTABLES.includes('mentA_pin_bloqueig')"), 'la clau del bloqueig no entra a les còpies de seguretat')
        paq = pg.evaluate("JSON.stringify(construeixPaquet())")
        comprova('pin_bloqueig' not in paq, 'el paquet exportat no la conté')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:3]); print('Fallades:', len(fallades))
    return 1 if errors or fallades else 0


if __name__ == '__main__': sys.exit(main())
