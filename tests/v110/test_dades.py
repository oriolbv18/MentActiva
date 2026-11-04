"""Medalles, jocs visibles, còpies i Bingo a dos amb tocs reals (v1.10.1): entrades hostils i casos límit. Ús: python tests/v110/test_dades.py"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
PREP = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_guia_vist','1');"
SENSE_TUTS = "localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))));"
XSS = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'


def main():
    with sync_playwright() as p:
        b, pg = nou(p, 360, 740)
        pg.evaluate(PREP); pg.reload(); pg.wait_for_timeout(900); pg.evaluate(SENSE_TUTS)
        pg.evaluate("window.__medallaManual = true; afegirUsuari({ nom: 'Prova' })")

        print('Editor de medalles')
        pg.evaluate("obrirMedalles()"); pg.wait_for_timeout(200); pg.click('text=Canviar les medalles'); pg.wait_for_timeout(250)
        pg.fill('#mdNom', XSS); pg.fill('#mdObjectiu', '3'); pg.click('text=Afegir la medalla'); pg.wait_for_timeout(200)
        comprova(not pg.evaluate("!!window.__xss") and pg.evaluate("!document.querySelector('#medallesEditaCos img')"), 'un nom amb HTML no s\'executa ni es pinta com a HTML')
        pg.fill('#mdNom', 'Zero'); pg.fill('#mdObjectiu', '0'); pg.click('text=Afegir la medalla'); pg.wait_for_timeout(120)
        comprova(pg.evaluate("dadesActuals().medallesPers.length") == 1, 'objectiu 0: no es crea')
        pg.fill('#mdNom', 'Negatiu'); pg.fill('#mdObjectiu', '-5'); pg.click('text=Afegir la medalla'); pg.wait_for_timeout(120)
        comprova(pg.evaluate("dadesActuals().medallesPers.length") == 1, 'objectiu negatiu: no es crea')
        pg.fill('#mdNom', ''); pg.fill('#mdObjectiu', '5'); pg.click('text=Afegir la medalla'); pg.wait_for_timeout(120)
        comprova(pg.evaluate("dadesActuals().medallesPers.length") == 1, 'sense nom: no es crea')
        pg.fill('#mdNom', 'Enorme'); pg.fill('#mdObjectiu', '99999999'); pg.click('text=Afegir la medalla'); pg.wait_for_timeout(150)
        comprova(pg.evaluate("Math.max(...dadesActuals().medallesPers.map(x => x.objectiu))") <= 9999, 'objectiu enorme: queda limitat')
        pg.fill('#mdNom', 'Focus'); pg.fill('#mdObjectiu', '2')
        focus = pg.evaluate("(() => { const b = [...document.querySelectorAll('#medallesEditaCos button')].find(x => x.textContent.includes('Afegir')); b.focus(); b.click(); return new Promise(r => setTimeout(() => r(document.activeElement && document.activeElement.textContent), 120)); })()")
        comprova('Afegir' in (focus or ''), f'en afegir, el focus es queda al botó, no es perd ({focus!r})')
        pg.evaluate("window.__xss = 0; obrirMedalles()"); pg.wait_for_timeout(200)
        comprova(not pg.evaluate("!!window.__xss") and pg.evaluate("!document.querySelector('#medallesCos img')"), 'tampoc a la pantalla de medalles')
        amp = pg.evaluate("document.documentElement.scrollWidth"); comprova(amp <= 361, f'sense desbordament lateral ({amp})')
        comprova(pg.evaluate("[...document.querySelectorAll('#medallesCos h2, #medallesCos h3')].every(h => h.tagName === 'H2')"), 'jerarquia d\'encapçalaments correcta (h1 → h2)')

        print('Medalles i partida')
        pg.evaluate("d = dadesActuals(); d.medallesPers = [{ id: 'mp_x', nom: 'Primera', tipus: 'partides', objectiu: 1 }]; d.medalles = []; guardarDadesUsuari()")
        pg.evaluate("assegurarJoc('calcul').then(() => obrirJoc('calcul'))"); pg.wait_for_timeout(700)
        pg.evaluate("registrarPartida('calcul', 5, 5)"); pg.wait_for_timeout(500)
        comprova(pg.evaluate("document.getElementById('medallaCapa').hidden"), 'amb la partida en marxa no surt la celebració')
        pg.evaluate("partidaAcabada = true"); pg.wait_for_timeout(1800)
        comprova(not pg.evaluate("document.getElementById('medallaCapa').hidden"), 'quan s\'acaba, surt')
        pg.keyboard.press('Tab'); pg.wait_for_timeout(50)
        comprova(pg.evaluate("document.getElementById('medallaCapa').contains(document.activeElement)"), 'el focus no en surt')
        for _ in range(30):
            if pg.evaluate("document.getElementById('medallaCapa').hidden && !_cuaMedalles.length"): break
            pg.evaluate("tancaMedalla()"); pg.wait_for_timeout(300)
        comprova(not pg.evaluate("document.getElementById('app').hasAttribute('inert')") or pg.evaluate("!!document.querySelector('.modal-fons.actiu')"), 'en tancar, l\'app torna a respondre')
        pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id)); aturaTimers(); partidaAcabada = true; mostrarPantalla('inici')")

        print('Els meus jocs: només un')
        ids = pg.evaluate("jocsIndividuals().map(j => j.id)")
        pg.evaluate("entraCuidador(); mostrarPantalla('configuracio')"); pg.wait_for_timeout(200)
        for i in ids[1:]: pg.evaluate("i => cuToggleJoc(i)", i)
        n = pg.evaluate("jocsIndividuals().length - dadesActuals().plaCuidador.jocsOcults.length"); comprova(n == 1, f'només en queda un ({n})')
        pg.evaluate("i => cuToggleJoc(i)", ids[0])
        comprova(pg.evaluate("jocsIndividuals().length - dadesActuals().plaCuidador.jocsOcults.length") == 1, 'no es pot treure l\'últim')
        comprova(pg.evaluate("document.querySelector('#configMeusJocs input:checked') !== null"), 'la casella de l\'últim segueix marcada')
        r = pg.evaluate("({ ses: triaJocsSessio(false), dia: jocDelDia().id, fav: jocsFavorits().map(j => j.id) })")
        comprova(set(r['ses']) == {ids[0]} and r['dia'] == ids[0] and r['fav'] == [ids[0]], f'sessions, joc del dia i «Els meus jocs» ho respecten {r}')
        comprova(len(r['ses']) >= 1, 'la sessió guiada té almenys un joc')
        pg.evaluate("dadesActuals().plaCuidador.jocsOcults = []; guardarDadesUsuari(); tancaEspaiCuidador(true)")

        print('Còpia de seguretat')
        pg.evaluate("d = dadesActuals(); d.medallesPers = [{ id: 'mp_c', nom: 'Copia', tipus: 'dies', objectiu: 4 }]; d.medallesEdit = { partides_50: { nom: 'Cinquanta' } }; d.plaCuidador.jocsOcults = ['sudoku']; guardarDadesUsuari()")
        paq = pg.evaluate("construeixPaquet()")
        vell = json.loads(json.dumps(paq)); us = json.loads(vell['claus']['mentA_usuaris'])
        for u in us: u['dades'].pop('medallesPers', None); u['dades'].pop('medallesEdit', None)
        vell['claus']['mentA_usuaris'] = json.dumps(us)
        pg.evaluate("p => localStorage.setItem('mentA_usuaris', p.claus.mentA_usuaris)", vell); pg.reload(); pg.wait_for_timeout(900)
        comprova(pg.evaluate("Array.isArray(dadesActuals().medallesPers) && typeof dadesActuals().medallesEdit === 'object'"), 'una còpia d\'abans de la 1.10 funciona (camps nous buits)')
        pg.evaluate("obrirMedalles()"); pg.wait_for_timeout(200); comprova(pg.evaluate("document.querySelectorAll('#medallesCos .medalla').length") >= 20, 'i les medalles es pinten')
        pg.evaluate("p => localStorage.setItem('mentA_usuaris', p.claus.mentA_usuaris)", paq); pg.reload(); pg.wait_for_timeout(900)
        r = pg.evaluate("({ m: dadesActuals().medallesPers, e: dadesActuals().medallesEdit, o: dadesActuals().plaCuidador.jocsOcults })")
        comprova(r['m'][0]['id'] == 'mp_c' and r['e']['partides_50']['nom'] == 'Cinquanta' and r['o'] == ['sudoku'], 'una còpia conserva medalles i jocs triats')
        host = json.loads(json.dumps(paq)); us = json.loads(host['claus']['mentA_usuaris'])
        us[0]['dades']['medallesPers'] = [{ 'id': "x');window.__xss=1;//", 'nom': XSS, 'tipus': 'inventat', 'objectiu': 'abc', 'joc': XSS }, 'no-es-un-objecte', None]
        us[0]['dades']['medallesEdit'] = { 'partides_50': { 'nom': XSS, 'objectiu': 'molts' } }
        host['claus']['mentA_usuaris'] = json.dumps(us)
        pg.evaluate("p => localStorage.setItem('mentA_usuaris', p.claus.mentA_usuaris)", host); pg.reload(); pg.wait_for_timeout(900)
        pg.evaluate("window.__xss = 0; obrirMedalles()"); pg.wait_for_timeout(250)
        comprova(not pg.evaluate("!!window.__xss"), 'una còpia hostil no executa res a la pantalla de medalles')
        pg.evaluate("window.__xss = 0; mostrarPantalla('medallesEdita')"); pg.wait_for_timeout(250)
        for sel in ["#medallesEditaCos button[aria-label^='Esborrar']"]:
            if pg.query_selector(sel): pg.evaluate("s => document.querySelector(s).click()", sel); pg.wait_for_timeout(120); pg.evaluate("document.querySelectorAll('.modal-fons.actiu').forEach(m => tancarModal(m.id))")
        comprova(not pg.evaluate("!!window.__xss"), 'ni a l\'editor, ni en prémer «Esborrar» amb un id maliciós')
        pg.evaluate("comprovarMedalles()"); pg.wait_for_timeout(300)
        pg.evaluate("localStorage.removeItem('mentA_usuaris')"); pg.reload(); pg.wait_for_timeout(900); pg.evaluate(SENSE_TUTS)

        print('Bingo a dos amb tocs reals')
        pg.evaluate("window.__medallaManual = false; obrirJugarAmbAlgu()"); pg.wait_for_timeout(250)
        pg.evaluate("parellaTriaJoc('bingo')"); pg.wait_for_timeout(700)
        pg.evaluate("bingoOpcio.velocitat('manual'); bingoOpcio.ajuda('auto')"); pg.click('#bingo-comencar'); pg.wait_for_timeout(300)
        pantalla = 0
        for _ in range(95):
            pg.click('#bingo-seguent', timeout=4000); pg.wait_for_timeout(1700 if _ < 2 else 60)
            r = pg.evaluate("(() => { const js = [...document.querySelectorAll('#bingo-cartrons .bingo-cartro')].map(c => [...c.querySelectorAll('.bingo-grid')].map(g => { const f = {}; g.querySelectorAll('.bingo-casella').forEach(b => { const k = b.style.getPropertyValue('--f'); (f[k] = f[k] || []).push(b.classList.contains('marcada')); }); return Object.values(f).filter(x => x.length === 5 && x.every(Boolean)).length; })[0]); return { js, premi: document.getElementById('bingo-premi').textContent }; })()")
            if r['premi'].endswith('LÍNIA') and max(r['js']) > 0:
                p_ = r['js'].index(max(r['js'])); pg.click(f'[data-canto="{p_}"]', timeout=3000); pg.wait_for_timeout(120); pantalla = 1; break
        comprova(pantalla == 1 and 'BINGO' in pg.evaluate("document.getElementById('bingo-premi').textContent"), 'es pot cantar línia tocant CANTO!')
        for _ in range(95):
            if pg.evaluate("document.getElementById('bingo-seguent').offsetHeight === 0 || document.getElementById('bingo-premi').textContent.startsWith('Fi')"): break
            pg.click('#bingo-seguent', timeout=4000); pg.wait_for_timeout(40)
            t = pg.evaluate("[...document.querySelectorAll('#bingo-cartrons .bingo-grid')].map(g => [...g.querySelectorAll('.bingo-casella')].every(b => b.classList.contains('marcada')))")
            if any(t): pg.click(f'[data-canto="{t.index(True)}"]', timeout=3000); pg.wait_for_timeout(200); break
        comprova(pg.evaluate("document.getElementById('bingo-premi').textContent").startswith('Fi'), 'es pot cantar bingo i s\'acaba la partida')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades)); [print('  ·', f[:200]) for f in fallades]
    return 1 if errors or fallades else 0


if __name__ == '__main__': sys.exit(main())
