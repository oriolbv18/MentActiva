"""Mode pilot (v1.9): codi d'activació, participants P01.., sense fotos ni demostració, SUS, mètriques i exportació.
Ús: python tests/pilot/test_pilot.py"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

def main():
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844)
        pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({memory:true}))"); pg.reload(); pg.wait_for_timeout(1200)
        pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(500)
        pg.fill('#pilotCodi', 'MALAMENT'); pg.evaluate("pilotActiva()"); comprova(not pg.evaluate("pilotActiu()"), 'un codi incorrecte no activa el mode pilot')
        pg.fill('#pilotCodi', 'menta-pilot'); pg.evaluate("pilotActiva()"); comprova(pg.evaluate("pilotActiu()") and pg.evaluate("!document.getElementById('banerPilot').hidden"), 'el codi correcte l\'activa i surt el bàner amb versió i data')
        comprova('1.9' in pg.evaluate("document.getElementById('banerPilot').innerText") and '2026' in pg.evaluate("document.getElementById('banerPilot').innerText"), 'el bàner mostra la versió i la data')
        for nom in ['Maria', 'Joan', 'Pep']: pg.evaluate("n => { obrirFormulariUsuari(null); document.getElementById('inputNomUsuari').value = n; guardarUsuari(); }", nom)
        noms = pg.evaluate("usuaris.map(u => u.nom)"); comprova(noms == ['P01', 'P02', 'P03'], f'els participants reben codi, no el nom que s\'escriu: {noms}')
        comprova(pg.evaluate("usuaris.every(u => !u.foto)"), 'cap participant té foto')
        pg.evaluate("obrirFormulariUsuari(null)"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("getComputedStyle(document.querySelector('.foto-perfil-wrapper')).display") == 'none' and pg.evaluate("document.getElementById('inputNomUsuari').readOnly"), 'el formulari no deixa pujar foto ni escriure un nom')
        pg.evaluate("tancarModal('modalNouUsuari')")
        pg.evaluate("carregarDemo()"); comprova(pg.evaluate("!usuaris.some(u => u.demo)"), 'la demostració queda desactivada')
        # SUS: tot 5 a senars i 1 a parells = 100; tot 3 = 50
        s = pg.evaluate("[puntuacioSUS([5,1,5,1,5,1,5,1,5,1]), puntuacioSUS([3,3,3,3,3,3,3,3,3,3]), puntuacioSUS([1,5,1,5,1,5,1,5,1,5]), puntuacioSUS([1,2])]")
        comprova(s == [100, 50, 0, None], f'càlcul de la puntuació SUS {s}')
        pg.evaluate("pilotObreSUS(usuaris[0].id)"); pg.wait_for_timeout(300)
        pg.evaluate("[...document.querySelectorAll('#susPreguntes fieldset')].forEach((f, i) => f.querySelectorAll('button')[i % 2 === 0 ? 4 : 0].click())"); pg.evaluate("pilotDesaSUS()"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("usuaris[0].dades.pilot.sus") == 100, 'es desa la puntuació SUS del participant')
        # primer joc: temps i tocs
        pg.evaluate("canviarUsuari(usuaris[1].id)"); pg.wait_for_timeout(300); pg.evaluate("obrirJoc('memory')"); pg.wait_for_timeout(1500)
        pr = pg.evaluate("usuaris[1].dades.pilot")
        comprova(pr and pr.get('primerJocS') is not None and pr.get('primerJocTocs') is not None, f'es registra el temps i els tocs fins al primer joc {pr}')
        res = pg.evaluate("pilotResultats()"); comprova(len(res) == 3 and res[0]['codi'] == 'P01' and res[0]['sus'] == 100 and 'nom' not in res[0], 'resultats anònims (només codis)')
        with pg.expect_download() as d: pg.evaluate("pilotExporta()")
        txt = pathlib.Path(d.value.path()).read_text(encoding='utf-8'); j = json.loads(txt)
        comprova(j['resum']['participants'] == 3 and j['resum']['sus_mitjana'] == 100 and 'Maria' not in txt, f'l\'exportació JSON té resum i cap nom personal {j["resum"]}')
        pg.evaluate("ajustes.pilot = false; guardarAjustes(); aplicaPilot()"); comprova(pg.evaluate("!document.body.classList.contains('mode-pilot')"), 'es pot desactivar')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:3]); print('Fallades:', len(fallades)); return 1 if errors or fallades else 0
if __name__ == '__main__': sys.exit(main())
