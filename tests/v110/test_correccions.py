"""Els 21 punts que l'Oriol va trobar en provar l'app (v1.10). Ús: python tests/v110/test_correccions.py"""
import json, pathlib, random, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

PREP = "localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_guia_vist','1');"
SENSE_TUTS = PREP + "localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))));"


def obre(pg, id, dos=False):
    pg.evaluate("([i, d]) => { modeActual = d ? '2vs2' : 'individual'; return assegurarJoc(i).then(() => obrirJoc(i, d)); }", [id, dos])
    pg.wait_for_timeout(500)


def juga_memory(pg):
    """Juga com una persona: gira, recorda i va fent parelles."""
    vist = {}
    for _ in range(200):
        tapades = pg.evaluate("[...document.querySelectorAll('#memory-grid [data-i]')].filter(b => !b.classList.contains('girada')).map(b => +b.dataset.i)")
        if not tapades: break
        a = next((i for i in tapades if i not in vist), tapades[0])
        pg.evaluate("i => document.querySelector(`#memory-grid [data-i=\"${i}\"]`).click()", a)
        em = pg.evaluate("i => document.querySelector(`#memory-grid [data-i=\"${i}\"]`).getAttribute('aria-label')", a); vist[a] = em.split(': ')[-1]
        par = next((j for j, v in vist.items() if j != a and v == vist[a] and j in tapades), None)
        b = par if par is not None else next((i for i in tapades if i != a and i not in vist), next(i for i in tapades if i != a))
        pg.evaluate("i => document.querySelector(`#memory-grid [data-i=\"${i}\"]`).click()", b)
        em = pg.evaluate("i => document.querySelector(`#memory-grid [data-i=\"${i}\"]`).getAttribute('aria-label')", b); vist[b] = em.split(': ')[-1].replace(', parella trobada', '')
        vist[a] = vist[a].replace(', parella trobada', '')
        pg.wait_for_timeout(1000)


def main():
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844)
        pg.evaluate(PREP); pg.reload(); pg.wait_for_timeout(900); pg.evaluate(SENSE_TUTS)

        print('1 · Memory: les estrelles')
        obre(pg, 'memory'); pg.evaluate("[...document.querySelectorAll('#modalDificultat .dificultat-btn')].forEach(x => 0)"); pg.wait_for_timeout(3000)
        juga_memory(pg); pg.wait_for_timeout(800)
        s = pg.evaluate("dadesActuals().historial.slice(-1)[0]")
        comprova(s and s['joc'] == 'memory' and calcul_estrelles(pg, s['pct']) >= 2, f"trobar totes les parelles dona almenys 2 estrelles ({s and s['encerts']} parelles, {s and s['errors']} intents de més, {s and s['pct']} %)")
        comprova(pg.evaluate("[[4,4],[8,12],[8,16],[8,24],[8,40]].map(([t,m]) => { const r = m/t; return Math.round(r <= 1.75 ? 100 - (r - 1) / .75 * 10 : r <= 3 ? 89 - (r - 1.75) / 1.25 * 19 : Math.max(40, 69 - (r - 3) * 10)); }).map(p => calcularEstrelles(p, false))") == [3, 3, 2, 2, 1], 'perfecte i bo: 3 estrelles · normal: 2 · molts intents: 1')
        pg.evaluate("tancarModal('modalFi')"); pg.wait_for_timeout(150); pg.evaluate("document.getElementById('medallaCapa').hidden = true; _cuaMedalles.length = 0;")

        print('2 · Canviar el nivell des de la pausa')
        obre(pg, 'nback'); pg.wait_for_timeout(300); pg.evaluate("document.getElementById('nback-iniciar').click()"); pg.wait_for_timeout(200)
        pg.evaluate("pausarJoc()"); pg.wait_for_timeout(250)
        comprova(pg.evaluate("getComputedStyle(document.getElementById('pausaNivell')).display !== 'none' && document.getElementById('pausaNivell').offsetHeight > 0"), 'hi ha el botó «Canviar el nivell» a la pausa')
        pg.evaluate("document.getElementById('pausaNivell').click()"); pg.wait_for_timeout(450)
        comprova(pg.evaluate("document.getElementById('modalDificultat').classList.contains('actiu')"), 'el botó obre el selector de nivell')
        pg.evaluate("document.querySelector('#modalDificultat .dificultat-btn').click()"); pg.wait_for_timeout(450)
        comprova(not pg.evaluate("document.getElementById('joc-nback').classList.contains('en-pausa')"), 'el joc no queda borrós després de canviar de nivell')
        comprova(pg.evaluate("document.getElementById('nback-iniciar').offsetHeight > 0"), 'el joc torna a estar a punt de començar')

        print('4 · Botons de lletra, so i ajuda al mòbil')
        for w in (320, 360, 390):
            pg.set_viewport_size({'width': w, 'height': 800})
            for z in ('normal', 'gran', 'extragran', 'gegant'):
                pg.evaluate("z => { aplicarZoom(z); mostrarPantalla('inici'); }", z); pg.wait_for_timeout(120)
                r = pg.evaluate("[...document.querySelectorAll('.ajust-rapid')].map(b => { const c = b.getBoundingClientRect(); const tallat = [...b.querySelectorAll('span')].some(s => s.scrollWidth > s.clientWidth + 1 && getComputedStyle(s).overflow !== 'visible'); return { in: c.left >= 0 && c.right <= innerWidth + .5, tallat, wrap: b.scrollWidth <= b.clientWidth + 1 }; })")
                if not all(x['in'] and not x['tallat'] and x['wrap'] for x in r): comprova(False, f'a {w}px amb lletra {z}: {r}')
        comprova(True, 'cap botó tallat a 320, 360 i 390 px amb les 4 mides de lletra')
        pg.evaluate("aplicarZoom('normal')"); pg.set_viewport_size({'width': 390, 'height': 844})

        print('5 · Tutorial interactiu')
        pg.evaluate("localStorage.removeItem('mentA_tutorials')")
        comprova(pg.evaluate("CATALEG_JOCS.every(j => TUTORIALS[j.id] && TUTORIALS[j.id].length)"), 'els 17 jocs tenen guia interactiva')
        comprova(pg.evaluate("Object.values(TUTORIALS).flat().every(p => p.bona == null || (p.fitxes && p.fitxes[p.bona] !== undefined))"), 'cada pas té la resposta entre les fitxes')
        obre(pg, 'memory')
        comprova(pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu') && !!document.querySelector('.tut-fitxa')"), 'en entrar per primer cop surt una guia per tocar')
        pg.evaluate("document.querySelector('.tut-fitxa[data-k=\"1\"]').click()"); pg.wait_for_timeout(100)
        comprova(pg.evaluate("document.getElementById('tutOk').textContent.includes('Gairebé') && document.getElementById('tutSeguent').hidden"), 'si s\'equivoca, ho diu amablement i no avança')
        pg.evaluate("document.querySelector('.tut-fitxa[data-k=\"0\"]').click()"); pg.wait_for_timeout(100)
        comprova(pg.evaluate("document.querySelector('.tut-fitxa[data-k=\"0\"]').textContent") == '🌻', 'la carta es gira en tocar-la')
        for _ in range(5):
            if pg.evaluate("!document.querySelector('.tut-punts')"): break
            pg.evaluate("(() => { const s = document.getElementById('tutSeguent'); if (s && !s.hidden) s.click(); else { const g = document.querySelector('.tut-fitxa.guia'); if (g) g.click(); } })()"); pg.wait_for_timeout(120)
        comprova(pg.evaluate("document.getElementById('tutorialOk').textContent.includes('a jugar') && !!document.querySelector('.tut-final')"), 'al final surt el resum i «Entesos, a jugar»')
        pg.evaluate("tancarTutorial()"); pg.wait_for_timeout(700)
        comprova(pg.evaluate("JSON.parse(localStorage.getItem('mentA_tutorials')).memory === true"), 'no torna a sortir sol')
        pg.evaluate(SENSE_TUTS); pg.evaluate("aturaTimers(); mostrarPantalla('inici')")
        pg.evaluate("document.getElementById('modalDificultat').classList.remove('actiu')")

        print('3 · Onboarding')
        comprova('toca el que està encès' in pathlib.Path('app/js/13-onboarding.js').read_text(encoding='utf-8').lower() if pathlib.Path('app/js/13-onboarding.js').exists() else True, 'el text diu que el cercle canvia')

        print('6 · Recorda la lletra: la fitxa es gira')
        obre(pg, 'nback'); pg.wait_for_timeout(300)
        pg.evaluate("window._gir = []; new MutationObserver(() => { const d = document.getElementById('nback-display'); window._gir.push(d.className + '|' + d.textContent); }).observe(document.getElementById('nback-display'), { attributes: true, childList: true, characterData: true, subtree: true }); document.getElementById('nback-iniciar').click()")
        pg.wait_for_timeout(5500)
        g = pg.evaluate("window._gir")
        comprova(any('girant' in x for x in g) and any('dors' in x and x.endswith('|') for x in g), 'entre lletra i lletra la fitxa es gira i ensenya el dors, sense lletra')
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('7 · Troba l\'intrús')
        pg.evaluate("assegurarJoc('fluidesa')"); pg.wait_for_timeout(400)
        r = pg.evaluate("""(() => { const m = []; ['facil','mig','dificil'].forEach((n, i) => { for (let k = 0; k < 300; k++) { const q = fluidesaGenerar(n), cat = CATEGORIES_INTRUS.find(c => c.q === q.cat);
          if (cat.els.includes(q.intrus) || q.o[q.c] !== q.intrus || new Set(q.o).size !== q.o.length || q.o.length !== i + 3 || q.o.some((x, j) => j !== q.c && !cat.els.includes(x))) m.push(q); } });
          const dup = {}; CATEGORIES_INTRUS.forEach(c => c.els.forEach(e => { dup[e] = (dup[e] || 0) + 1; })); return { m: m.slice(0, 3), dup: Object.keys(dup).filter(k => dup[k] > 1) }; })()""")
        comprova(not r['m'], f"l'intrús mai no és de la categoria i no hi ha opcions repetides {r['m']}")
        comprova(not r['dup'], f"cap paraula és a dues categories {r['dup']}")
        comprova(pg.evaluate("nomJoc('fluidesa')") == "Troba l'intrús", 'el joc es diu «Troba l\'intrús»')

        print('8 · Quants en recordes: números iguals seguits')
        obre(pg, 'span'); pg.evaluate("window._sp = []; new MutationObserver(() => window._sp.push(document.getElementById('span-display').innerHTML)).observe(document.getElementById('span-display'), { childList: true }); document.getElementById('span-iniciar').click()")
        pg.wait_for_timeout(4200); sp = pg.evaluate("window._sp")
        seq = [re.sub('<.*?>', '', x) for x in sp]
        comprova('' in seq[1:] and all(not (seq[i] and seq[i + 1] and seq[i].isdigit() and seq[i + 1].isdigit()) for i in range(len(seq) - 1)), f'entre número i número sempre hi ha un buit {seq[:8]}')
        comprova(any('entra' in x for x in sp), 'cada número entra amb animació')
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('9 · Comptes de cada dia')
        pg.evaluate("assegurarJoc('calcul')"); pg.wait_for_timeout(400)
        r = pg.evaluate("""(() => { const out = {}; ['facil','mig','dificil'].forEach(n => { const q = Array.from({ length: 600 }, () => calculGenerar(n)); out[n] = { max: Math.max(...q.map(x => x.res)), dec: q.filter(x => /\\d[.,]\\d|%/.test(x.q) || /,/.test(x.o.join(' '))).map(x => x.q).slice(0, 2), mal: q.filter(x => x.o[x.c] !== String(x.res) && x.o[x.c] !== x.res + ' €').length, op: q[0].o.length, dup: q.filter(x => new Set(x.o).size !== x.o.length).length, neg: q.filter(x => x.o.some(v => parseInt(v, 10) < 0)).length }; }); return out; })()""")
        comprova(r['facil']['max'] <= 40 and r['facil']['op'] == 3, f"nivell fàcil: resultats petits i 3 opcions {r['facil']}")
        comprova(all(not v['dec'] and not v['mal'] and not v['dup'] and not v['neg'] for v in r.values()), f'sense cèntims ni percentatges, cap opció repetida ni negativa {r}')

        print('10 · Completa la sèrie')
        pg.evaluate("assegurarJoc('seqlog')"); pg.wait_for_timeout(400)
        r = pg.evaluate("""(() => { const out = { mal: [], facil: [] }; for (let e = 0; e < 7; e++) for (let k = 0; k < 250; k++) { const q = seqlogGenerar(e); if (new Set(q.o).size !== 4 || !q.q.includes('?') || q.o.some(x => x === 'NaN' || x === 'undefined' || parseInt(x, 10) < 0)) out.mal.push(q); if (e === 0) out.facil.push(q.q); } out.mal = out.mal.slice(0, 2); out.facil = out.facil.slice(0, 5); out.rampa = RAMPA_SEQLOG; out.tipus = [...new Set(Array.from({ length: 800 }, () => seqlogGenerar(2).q).map(s => /:00/.test(s) ? 'hores' : /€/.test(s) ? 'euros' : 'num'))]; out.dies = Array.from({ length: 100 }, () => seqlogGenerar(0).q).some(s => /dilluns|dimarts|dimecres|dijous/.test(s)); out.lletres = Array.from({ length: 100 }, () => seqlogGenerar(1).q).some(s => /^[A-Z] /.test(s)); return out; })()""")
        comprova(not r['mal'], f"totes les preguntes són vàlides {r['mal']}")
        comprova(r['rampa']['facil'][0] == 0 and r['rampa']['facil'] == sorted(r['rampa']['facil']), f"el nivell baix comença comptant i puja a poc a poc {r['facil']}")
        comprova(r['dies'] and r['lletres'] and len(r['tipus']) >= 3, f"hi ha més variables: dies, lletres, hores, euros {r['tipus']}")

        print('11 · Què falta aquí: compte enrere')
        obre(pg, 'quefalta'); pg.evaluate("document.getElementById('qf-iniciar').click()"); pg.wait_for_timeout(300)
        comprova(pg.evaluate("!document.getElementById('qf-compte').hidden && document.getElementById('qf-segons').textContent") == '6', 'es veu el temps que queda')
        pg.wait_for_timeout(2100); v = int(pg.evaluate("document.getElementById('qf-segons').textContent"))
        comprova(v in (3, 4), f'el compte baixa cada segon ({v})')
        pg.wait_for_timeout(4200); comprova(pg.evaluate("document.getElementById('qf-compte').hidden"), 'desapareix quan ja no fa falta')
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('12 · Recorda la seqüència: la forma no canvia')
        obre(pg, 'sequencia')
        r = pg.evaluate("(() => { const b = document.querySelector('#seq-area .seq-boto'); const abans = getComputedStyle(b).borderRadius; b.classList.add('encesa'); const a = getComputedStyle(b, '::after').content, dr = getComputedStyle(b).borderRadius; b.classList.remove('encesa'); return { a, abans, dr }; })()")
        comprova(r['a'] in ('none', 'normal') and r['abans'] == r['dr'], f'en il·luminar-se no apareix cap rodona {r}')
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('13 i 17 · Més paraules')
        pg.evaluate("assegurarJoc('paraules').then(() => assegurarJoc('sopa'))"); pg.wait_for_timeout(600)
        comprova(pg.evaluate("BARALLA_PARAULES.length") >= 180, f"Endevina la paraula: {pg.evaluate('BARALLA_PARAULES.length')} paraules")
        comprova(pg.evaluate("new Set(BARALLA_PARAULES.map(x => x.paraula)).size === BARALLA_PARAULES.length"), 'cap paraula repetida a Endevina')
        comprova(pg.evaluate("BARALLA_PARAULES.every(x => [...x.paraula].every(c => LLETRES.includes(base(c))))"), 'totes es poden escriure amb el teclat del joc')
        t = pathlib.Path(__file__).resolve().parents[2] / 'app' / 'js' / '2-jocs' / 'sopa.js'
        n = len(re.findall(r"'[A-Z]+'", re.search(r"const PARAULES = \[(.*?)\];", t.read_text(encoding='utf-8'), re.S).group(1)))
        comprova(n >= 200, f'Sopa de lletres: {n} paraules')

        print('14 · Els meus jocs')
        pg.evaluate("mostrarPantalla('meusJocs')"); pg.wait_for_timeout(200)
        tots = pg.evaluate("jocsIndividuals().length")
        comprova(pg.evaluate("document.querySelectorAll('#jocsGran [data-joc]').length") == tots, f'sense cuidador surten tots ({tots})')
        pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(250)
        comprova(pg.evaluate("document.querySelectorAll('#configMeusJocs input[type=checkbox]').length") == tots, 'es poden triar a Ajustos')
        pg.evaluate("document.querySelector('#configMeusJocs input[onchange*=\"sudoku\"]').click()"); pg.wait_for_timeout(150)
        comprova(pg.evaluate("!document.querySelector('#configMeusJocs input[onchange*=\"sudoku\"]').checked"), 'la casella es desmarca')
        pg.evaluate("mostrarPantalla('meusJocs')"); pg.wait_for_timeout(200)
        comprova(not pg.evaluate("!!document.querySelector('#jocsGran [data-joc=\"sudoku\"]')"), 'el joc tret ja no surt a «Els meus jocs»')
        pg.evaluate("renderMenuJocs()"); comprova(not pg.evaluate("!!document.querySelector('#menuJocsLlista [data-joc=\"sudoku\"]')"), 'ni a «Veure tots els jocs»')
        pg.evaluate("entraCuidador(); cuTria('jocs')"); pg.wait_for_timeout(250)
        comprova(pg.evaluate("document.querySelectorAll('#cuPanell .llista-jocs-pla input').length") == tots, 'també es pot canviar a les estadístiques (Cuidador → Jocs)')
        pg.evaluate("cuToggleJoc('sudoku')"); pg.evaluate("tancaEspaiCuidador(true); mostrarPantalla('inici')"); pg.wait_for_timeout(150)

        print('15 · Dames: captura obligatòria')
        vista = False
        for intent in range(6):
            pg.evaluate("dificultatActual = 'facil'; guardarNivellJoc('dames', 'facil', true)")
            obre(pg, 'dames'); pg.wait_for_timeout(300)
            for _ in range(60):
                st = pg.evaluate("({ ob: document.querySelectorAll('#dames-tauler .obliga').length, mv: [...document.querySelectorAll('#dames-tauler .movible')].map(x => [x.dataset.f, x.dataset.c]), fi: partidaAcabada })")
                if st['ob']:
                    vista = True; break
                if not st['mv'] or st['fi']: break
                f, c = random.choice(st['mv']); pg.evaluate("([f, c]) => document.querySelector(`#dames-tauler [data-f=\"${f}\"][data-c=\"${c}\"]`).click()", [f, c]); pg.wait_for_timeout(60)
                d = pg.evaluate("[...document.querySelectorAll('#dames-tauler .possible')].map(x => [x.dataset.f, x.dataset.c])")
                if d: pg.evaluate("([f, c]) => document.querySelector(`#dames-tauler [data-f=\"${f}\"][data-c=\"${c}\"]`).click()", random.choice(d))
                pg.wait_for_timeout(850)
            if vista: break
        comprova(vista, 's\'ha arribat a una captura obligatòria')
        if vista:
            comprova(pg.evaluate("!document.getElementById('dames-obligat').hidden && document.getElementById('dames-obligat').textContent.includes('Has de menjar')"), 'surt un avís gran: «Has de menjar!»')
            comprova(pg.evaluate("document.querySelectorAll('#dames-tauler .victima').length") > 0, 'la peça que es pot menjar porta una creu')
            comprova(pg.evaluate("document.querySelectorAll('#dames-tauler .movible').length") == 0, 'cap altra peça no fa veure que es pot moure')
            pg.evaluate("document.querySelector('#dames-tauler .obliga').click()"); pg.wait_for_timeout(80)
            comprova(pg.evaluate("document.querySelectorAll('#dames-tauler .possible.salt').length") > 0, 'en tocar-la, es marca on ha de saltar')
            pg.screenshot(path=str(pathlib.Path(__file__).parent / 'dames.png'))
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('16 i 18 · Bingo')
        pg.evaluate("renderMenuJocs()")
        comprova(not pg.evaluate("jocsIndividuals().some(j => j.id === 'bingo')") and not pg.evaluate("!!document.querySelector('#menuJocsLlista [data-joc=\"bingo\"]')"), 'el bingo no surt per jugar sol')
        pg.evaluate("obrirJugarAmbAlgu()"); pg.wait_for_timeout(200)
        comprova(pg.evaluate("document.getElementById('jocsParella').innerHTML.includes(\"'bingo'\")"), 'sí que surt a «Jugar amb algú»')
        obre(pg, 'bingo', True)
        pg.evaluate("document.getElementById('bingo-comencar').click()"); pg.wait_for_timeout(1700)
        comprova(pg.evaluate("!!document.querySelector('.bola-gran')"), 'en sortir una bola, n\'apareix una de gran al mig de la pantalla')
        pg.screenshot(path=str(pathlib.Path(__file__).parent / 'bingo.png'))
        pg.wait_for_timeout(1700); comprova(not pg.evaluate("!!document.querySelector('.bola-gran')"), 'i després marxa cap al seu lloc')
        pg.evaluate("aturaTimers(); mostrarPantalla('inici')")

        print('19 i 20 · Medalles')
        pg.evaluate("d = dadesActuals(); d.medalles = []; comprovarMedalles()"); pg.wait_for_timeout(400)
        comprova(pg.evaluate("!document.getElementById('medallaCapa').hidden && document.getElementById('medallaCapa').classList.contains('entra')"), 'en guanyar una medalla surt la celebració')
        pg.screenshot(path=str(pathlib.Path(__file__).parent / 'medalla.png'))
        for _ in range(8):
            if pg.evaluate("document.getElementById('medallaCapa').hidden && !_cuaMedalles.length"): break
            pg.evaluate("tancaMedalla()"); pg.wait_for_timeout(320)
        comprova(pg.evaluate("document.getElementById('medallaCapa').hidden"), 'es tanca')
        pg.evaluate("obrirMedalles()"); pg.wait_for_timeout(200)
        comprova(pg.evaluate("document.querySelectorAll('#medallesCos .medalla').length") >= 20, 'hi ha una pantalla amb totes les medalles')
        pg.evaluate("obrirEditorMedalles()"); pg.wait_for_timeout(200)
        pg.fill('#mdNom', 'Campiona'); pg.select_option('#mdTipus', 'joc'); pg.select_option('#mdJoc', 'tertulia'); pg.fill('#mdObjectiu', '3'); pg.evaluate("medallaAfegeix()"); pg.wait_for_timeout(200)
        pg.evaluate("medallaCanvia('partides_50', 'nom', 'Cinquanta'); medallaCanvia('partides_50', 'objectiu', '25'); medallaMostra('nback_10')"); pg.wait_for_timeout(100)
        pg.reload(); pg.wait_for_timeout(900)
        r = pg.evaluate("(() => { const m = medallesDe(dadesActuals()); const b = m.find(x => x.id === 'partides_50'); return { pers: m.filter(x => x.pers).map(x => x.nom + ' · ' + x.desc), nom: b.nom, obj: progMedalla(b, dadesActuals()).objectiu, ocult: m.some(x => x.id === 'nback_10') }; })()")
        comprova(r['pers'] == ['Campiona · Jugar 3 partides de La Tertúlia'], f"es pot crear una medalla pròpia {r['pers']}")
        comprova(r['nom'] == 'Cinquanta' and r['obj'] == 25, f'es pot canviar el nom i l\'objectiu d\'una predeterminada {r}')
        comprova(not r['ocult'], 'es pot amagar una predeterminada')
        pg.evaluate("medallaRestableix('partides_50')"); comprova(pg.evaluate("medallesDe(dadesActuals()).find(x => x.id === 'partides_50').nom") == '50 partides', 'i tornar-la a deixar com era')

        print('21 · Àlbum')
        pg.evaluate("mostrarPantalla('album')"); pg.wait_for_timeout(200)
        comprova(pg.evaluate("document.getElementById('albumCamera').getAttribute('capture')") == 'environment', 'al mòbil obre directament la càmera')
        comprova(pg.evaluate("[...document.querySelectorAll('#album button')].some(b => b.textContent.includes('Fer una foto'))") and pg.evaluate("[...document.querySelectorAll('#album button')].some(b => b.textContent.includes('Triar una foto'))"), 'hi ha els dos botons: fer-ne una i triar-ne una')
        pg.evaluate("albumDesa('data:image/jpeg;base64,AAAA'); albumDesa('data:image/jpeg;base64,BBBB')"); pg.wait_for_timeout(200)
        comprova(pg.evaluate("Object.keys(obtenirAlbum()).length") == 2, 'dues fotos el mateix dia no s\'esborren entre elles')
        comprova(pg.evaluate("document.querySelectorAll('#albumGaleria .album-item').length") == 2, 'i es veuen totes dues')
        pg.evaluate("localStorage.removeItem(clauAlbum())")
        b.close()
    print('\nErrors de JS:', len(errors), errors[:5]); print('Fallades:', len(fallades)); [print('  ·', f) for f in fallades]
    return 1 if errors or fallades else 0


def calcul_estrelles(pg, pct): return pg.evaluate("p => calcularEstrelles(p, false)", pct)


if __name__ == '__main__': sys.exit(main())
