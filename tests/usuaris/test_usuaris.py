"""Fase 1 (v1.9): els usuaris nous/editats/eliminats apareixen a TOTES les llistes sense cap clic extra.
Crea 10 usuaris seguits (a màxima velocitat) des de cada punt d'entrada i comprova cada llista visible/oculta.
Ús: python tests/usuaris/test_usuaris.py"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

CREA = "(nom) => { obrirFormulariUsuari(null); document.getElementById('inputNomUsuari').value = nom; guardarUsuari(); }"
EDITA = "([id, nom]) => { obrirFormulariUsuari(id); document.getElementById('inputNomUsuari').value = nom; guardarUsuari(); }"
NOMS = lambda pref: [f'{pref}{i:02d}' for i in range(10)]

def llistes(pg):
    """Text de cada llista d'usuaris del DOM, estigui visible o no."""
    return pg.evaluate("""() => ({
      modal: (document.getElementById('usuarisLlista') || {}).textContent || '',
      selector: (document.getElementById('residentsGraella') || {}).textContent || '',
      cuidador: (document.getElementById('cuPersona') || {}).textContent || '',
      parella: (document.getElementById('parSel2') || {}).textContent || '',
      capcalera: (document.getElementById('usuariNom') || {}).textContent || ''
    })""")

def prepara(pg, rol='residencia'):
    pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1'); localStorage.setItem('mentA_zoom_vist','1')"); pg.reload(); pg.wait_for_timeout(700)
    pg.evaluate(f"ajustes.rol = '{rol}'; guardarAjustes(); refrescarTot()")

def prova(p, w, h, etiqueta):
    b, pg = nou(p, w, h); prepara(pg)
    ids = len(set(pg.evaluate("[...Array(300)].map(() => idUsuariNou())")))
    comprova(ids == 300, f'{etiqueta}: 300 ids nous tots diferents')
    # 1) des de la pantalla del selector de residents (oberta mentre es crea)
    pg.evaluate("mostrarPantalla('selectorResident')")
    for nom in NOMS('Sel'): pg.evaluate(CREA, nom)
    L = llistes(pg); comprova(all(n in L['selector'] for n in NOMS('Sel')), f'{etiqueta}: selector de residents mostra els 10 nous (sense obrir res)')
    comprova(all(n in L['modal'] for n in NOMS('Sel')), f'{etiqueta}: la modal (tancada) també')
    # 2) des del modal d'usuaris obert
    pg.evaluate("mostrarPantalla('inici'); obrirModalUsuaris(true)")
    for nom in NOMS('Mod'): pg.evaluate(CREA, nom); pg.evaluate("obrirModalUsuaris(true)")
    L = llistes(pg); comprova(all(n in L['modal'] for n in NOMS('Mod')), f'{etiqueta}: modal d\'usuaris mostra els 10 nous')
    comprova(all(n in L['selector'] for n in NOMS('Mod')), f'{etiqueta}: el selector de residents (no visible) també s\'ha actualitzat')
    pg.evaluate("tancarModal('modalUsuaris')")
    # 3) panell de residència del cuidador obert mentre es crea des d'un altre lloc
    pg.evaluate("cuidadorObert = true; mostrarPantalla('cuidador'); cuTria('residencia')"); pg.wait_for_timeout(200)
    for nom in NOMS('Pla'): pg.evaluate(CREA, nom)
    taula = pg.evaluate("document.getElementById('cuPanell').textContent")
    comprova(all(n in taula for n in NOMS('Pla')), f'{etiqueta}: panell de residència (obert) mostra els 10 nous')
    comprova(all(n in llistes(pg)['cuidador'] for n in NOMS('Pla')), f'{etiqueta}: selector de persona del cuidador també')
    # 4) selector de «Jugar amb algú» obert
    pg.evaluate("cuidadorObert = false; mostrarPantalla('jugarAmbAlgu')"); pg.wait_for_timeout(200)
    for nom in NOMS('Par'): pg.evaluate(CREA, nom)
    comprova(all(n in llistes(pg)['parella'] for n in NOMS('Par')), f'{etiqueta}: «Jugar amb algú» mostra els 10 nous')
    # 5) editar i eliminar
    id0 = pg.evaluate("usuaris.find(u => u.nom === 'Sel00').id")
    pg.evaluate(EDITA, [id0, 'Canviat']); L = llistes(pg)
    comprova('Canviat' in L['modal'] and 'Canviat' in L['selector'] and 'Sel00' not in L['modal'], f'{etiqueta}: editar el nom es veu a totes les llistes')
    pg.evaluate("treuUsuari(arguments[0])" if False else f"treuUsuari('{id0}')"); L = llistes(pg)
    comprova('Canviat' not in L['modal'] and 'Canviat' not in L['selector'] and 'Canviat' not in L['cuidador'], f'{etiqueta}: eliminar el treu de totes les llistes')
    # 6) canvi d'usuari actual i demo
    pg.evaluate("mostrarPantalla('selectorResident'); carregarDemo()"); pg.wait_for_timeout(200)
    comprova('Maria' in llistes(pg)['selector'] or pg.evaluate("usuaris.filter(u => u.demo).length") == 8, f'{etiqueta}: la demo carrega 8 residents')
    comprova(pg.evaluate("usuaris.filter(u => u.demo).every(u => (document.getElementById('residentsGraella').textContent).includes(u.nom))"), f'{etiqueta}: els residents d\'exemple són al selector sense tocar res')
    pg.evaluate("alternarDemo()"); pg.wait_for_timeout(300)
    pg.evaluate("confirmarAccio()"); pg.wait_for_timeout(300)
    comprova(pg.evaluate("usuaris.every(u => !u.demo) && !document.getElementById('residentsGraella').textContent.includes('(exemple)')"), f'{etiqueta}: sortir de la demo esborra els exemples de la llista')
    # persistència i ids únics després de recarregar
    pg.reload(); pg.wait_for_timeout(700)
    tots = pg.evaluate("usuaris.map(u => u.id)"); comprova(len(tots) == len(set(tots)) and len(tots) >= 38, f'{etiqueta}: {len(tots)} usuaris desats, tots amb id únic')
    b.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        for w, h, e in [(390, 844, 'mòbil'), (820, 1180, 'tauleta'), (1440, 900, 'ordinador')]: prova(p, w, h, e)
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades))
    sys.exit(1 if errors or fallades else 0)
