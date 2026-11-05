"""v2.0: jocs nous, ajuda de l'Elefant, tema de la setmana, activitat de grup, Família i cuidador, informe PDF i mètriques.
Ús: python tests/v200/test_v200.py [--pdf carpeta]   (amb --pdf hi desa els informes per mirar-los)"""
import pathlib, random, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'jocs'))
from playwright.sync_api import sync_playwright  # noqa: E402
from comu import Partida  # noqa: E402
from bots import BOTS  # noqa: E402
from captures import APP, nou_context  # noqa: E402

fallades = []
def comprova(ok, msg):
    print(('  ✓ ' if ok else '  ✗ ') + str(msg), flush=True)
    if not ok: fallades.append(msg)

ES = "new Promise(r => I18N.assegura(ok => { I18N.canvia('es', true); r(ok); }))"
VISTOS = "localStorage.setItem('mentA_tutorials', JSON.stringify(Object.fromEntries(CATALEG_JOCS.map(j => [j.id, true]))))"

def proves_contingut(p):
    par = Partida(p)
    par.js("Promise.all(['associa','encreuats','tertulia','refranys'].map(assegurarJoc))"); par.pg.wait_for_function("JOCS.associa && JOCS.encreuats && JOCS.tertulia && JOCS.refranys", timeout=8000)
    comprova(par.js("CATALEG_JOCS.length") == 19, 'hi ha 19 jocs al catàleg')
    comprova(par.js("CATALEG_JOCS.every(j => FER_JOC[j.id] && TUTORIALS[j.id] && TUTORIALS[j.id].length)"), 'tots els jocs tenen la frase de l\'Elefant i tutorial')
    for idioma in ('ca', 'es'):
        if idioma == 'es': par.js(ES)
        r = par.js("""() => { const b = I18N.llengua === 'es' ? BANCS_ES.associa : { facils: PARELLES_CA, cultura: PARELLES_CULTURA_CA }; const t = [...b.facils, ...b.cultura].flat(), rep = t.filter((x, i) => t.indexOf(x) !== i); return { rep, n: t.length }; }""")
        comprova(not r['rep'] and r['n'] > 70, f"Què va amb què? ({idioma}): {r['n']} paraules, cap de repetida {r['rep']}")
        r = par.js("""() => { const ts = temesTertulia(), m = [], vistes = new Set(); ts.forEach(t => t.q.forEach(q => { if (q.length !== 4 || new Set(q.slice(1)).size !== 3) m.push('opcions: ' + q[0]); if (vistes.has(q[0])) m.push('repetida: ' + q[0]); vistes.add(q[0]); }));
            const base = (I18N.llengua === 'es' ? BANCS_ES.tertulia.map(x => x[0]) : BARALLA_TERTULIA.map(x => x.q)); ts.forEach(t => t.q.forEach(q => { if (base.includes(q[0])) m.push('ja és al banc: ' + q[0]); })); return { m, temes: ts.length, q: vistes.size }; }""")
        comprova(not r['m'] and r['temes'] == 6 and r['q'] == 48, f"Temes ({idioma}): {r['temes']} temes, {r['q']} preguntes {r['m'][:3]}")
        r = par.js("""() => { const m = []; const rr = I18N.llengua === 'es' ? BANCS_ES.refranys.map(([inici, correcta, ...falses]) => ({ inici, correcta, falses })) : BARALLA_REFRANYS; const v = new Set(); rr.forEach(x => { if (v.has(x.inici)) m.push(x.inici); v.add(x.inici); if (x.falses.length !== 2 || x.falses.includes(x.correcta)) m.push('opcions ' + x.inici); }); return { m, n: rr.length }; }""")
        comprova(not r['m'], f"Refranys ({idioma}): {r['n']}, sense repetits {r['m'][:3]}")
    r = par.js("""() => { const noms = new Set(); for (let k = 0; k < 7 * 7; k++) noms.add(temaSetmana(new Date(2026, 0, 1 + k)).tema.nom); const a = temaSetmana(new Date(2026, 10, 2)).tema.nom, b = temaSetmana(new Date(2026, 10, 8)).tema.nom, c = temaSetmana(new Date(2026, 10, 9)).tema.nom; return { n: noms.size, igual: a === b, canvia: b !== c }; }""")
    comprova(r['n'] == 6 and r['igual'] and r['canvia'], f'el tema és igual tota la setmana i canvia el dilluns {r}')
    par.tanca()

def proves_jocs(p):
    for idioma in ('ca', 'es'):
        par = Partida(p)
        if idioma == 'es': par.js(ES)
        dolentes = []
        for n in (0, 1, 2):
            for rep in range(12):
                par.obre_joc('encreuats', False, n)
                g = par.js("""() => { const g = JOCS.encreuats._graella(), m = [], ps = g.paraules.map(p => p.paraula); if (new Set(ps).size !== ps.length) m.push('repetides');
                  g.paraules.forEach(p => [...p.paraula].forEach((l, k) => { const c = g.cells[(p.dir ? p.f + k : p.f) + ',' + (p.dir ? p.c : p.c + k)]; if (!c || c.sol !== base(l).toUpperCase()) m.push('cel·la ' + p.paraula); }));
                  return { m, n: g.paraules.length, f: g.fils, c: g.cols }; }""")
                if g['m'] or g['n'] != 3 + n or g['c'] > 8 or g['f'] > 7: dolentes.append(g)
        comprova(not dolentes, f'Mots encreuats ({idioma}): 36 graelles correctes, de 8×7 com a màxim {dolentes[:2]}')
        par.tanca()
    for joc in ('associa', 'encreuats'):
        for nivell in (None, 0, 2):
            par = Partida(p); par.js(VISTOS)
            par.obre_joc(joc, False, nivell); BOTS[joc][0](par, random.Random(3), False); par.avanca(2500)
            s = par.js("dadesActuals().historial.slice(-1)[0] || null")
            comprova(bool(s) and s['joc'] == joc and 0 <= s['pct'] <= 100 and not par.errors, f"{joc} n{nivell}: partida sencera registrada ({s and s['pct']} %) {par.errors[:2]}")
            par.tanca()
    par = Partida(p); par.js(VISTOS)
    par.obre_joc('tertulia'); t = par.js("document.getElementById('tertulia-tema').textContent")
    comprova(t.startswith('Aquesta setmana:'), f'La Tertúlia mostra el tema ({t})')
    comprova(par.js("document.querySelectorAll('#tertulia-opcions .opcio').length") == 3, 'La Tertúlia continua amb 3 respostes')
    par.obre_joc('span'); par.js("document.getElementById('span-iniciar').click()")
    for _ in range(100):
        if par.js("document.querySelectorAll('#span-input .span-tap').length"): break
        par.avanca(100)
    comprova(par.js("document.getElementById('span-nivell').textContent") == '2', 'Quants en recordes? comença amb 2 números')
    par.js("[...document.querySelectorAll('#span-input .span-tap')].slice(0, 1).forEach(b => b.click())"); par.js("(() => { const b = document.querySelectorAll('#span-input .span-tap'); b[0].click(); })()"); par.avanca(100)
    if par.js("!partidaAcabada && document.querySelector('#span-feedback').classList.contains('incorrecte')"):
        comprova(not par.js("partidaAcabada"), 'en fallar dona una segona oportunitat')
    par.tanca()

def proves_elefant(p):
    nav, ctx = nou_context(p, 'mobil', 'clar', 'normal'); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(APP); pg.wait_for_timeout(400); pg.evaluate(VISTOS); pg.evaluate("ajustes.dificultatMode = 'adaptatiu'; obrirJoc('memory')"); pg.wait_for_function("idPantallaActiva() === 'joc-memory'", timeout=8000); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#joc-memory [data-accio=\"ajuda\"]').click()"); pg.wait_for_timeout(700)
    g = pg.evaluate("(() => { const g = document.querySelector('.el-globus.visible'); return g && { t: g.querySelector('.el-globus-text').textContent, b: [...g.querySelectorAll('.el-boto')].map(x => x.textContent) }; })()")
    comprova(g and 'iguals' in g['t'], f"el «?» fa que l'Elefant digui què cal fer ({g and g['t']})")
    comprova(g and g['b'][0] == 'Entesos' and 'Com es juga' in g['b'] and 'Sortir del joc' in g['b'], f"l'Elefant ofereix sortides {g and g['b']}")
    comprova(not pg.evaluate("document.getElementById('modalAjudaJoc').classList.contains('actiu')"), 'no surt cap finestra a sobre')
    comprova(pg.evaluate("_ajudaOberta"), 'el temps queda aturat mentre parla')
    pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Entesos').click()"); pg.wait_for_timeout(300)
    comprova(not pg.evaluate("_ajudaOberta") and not pg.evaluate("document.querySelector('.el-globus.visible')"), '«Entesos» tanca la bafarada i el joc continua')
    pg.evaluate("document.querySelector('#joc-memory [data-accio=\"ajuda\"]').click()"); pg.wait_for_timeout(400)
    pg.evaluate("[...document.querySelectorAll('.el-globus.visible .el-boto')].find(b => b.textContent === 'Com es juga').click()"); pg.wait_for_timeout(400)
    comprova(pg.evaluate("document.getElementById('tutorialOverlay').classList.contains('actiu')"), '«Com es juga» obre el tutorial')
    pg.evaluate("tancarTutorial()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('#joc-memory [data-accio=\"ajuda\"]').click()"); pg.wait_for_timeout(400)
    pg.mouse.click(180, 400); pg.wait_for_timeout(300)
    comprova(not pg.evaluate("_ajudaOberta"), 'tocar el joc tanca la bafarada')
    # Elefant apagat: el mateix surt en una finestra
    pg.evaluate("elefantPermes = () => false") if False else None
    pg.evaluate("window.__p = elefantPermes; ajustes.elefantPresencia = 'apagat'; ajustes.presencia = 'apagat'; guardarAjustes();")
    if pg.evaluate("presenciaActual() === 'apagat'"):
        pg.evaluate("document.querySelector('#joc-memory [data-accio=\"ajuda\"]').click()"); pg.wait_for_timeout(400)
        comprova(pg.evaluate("document.getElementById('modalAjudaJoc').classList.contains('actiu')") and 'iguals' in pg.evaluate("document.getElementById('ajudaJocFer').textContent"), 'amb l\'Elefant apagat, el mateix surt en una finestra')
        pg.evaluate("ajudaJocSeguir()"); pg.wait_for_timeout(200); comprova(not pg.evaluate("_ajudaOberta"), 'la finestra es tanca bé')
    pg.evaluate("document.body.style.width") ; comprova(pg.evaluate("[...document.querySelectorAll('#modalPausa button')].some(b => b.textContent.includes('silenciar'))"), 'el so es pot canviar des de la pausa')
    pg.set_viewport_size({'width': 360, 'height': 740}); pg.wait_for_timeout(100)
    comprova(pg.evaluate("getComputedStyle(document.querySelector('#joc-memory [data-accio=\"so\"]')).display") == 'none', 'al mòbil el botó de so no ocupa la barra')
    comprova(not errs, f'sense errors {errs[:2]}')
    nav.close()

def proves_cuidador(p, carpeta):
    nav, ctx = nou_context(p, 'mobil', 'clar', 'normal'); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(APP); pg.wait_for_timeout(400)
    comprova('Família i cuidador' in pg.evaluate("document.getElementById('btnCuidador').textContent"), 'el botó de l\'inici es diu «Família i cuidador»')
    comprova(pg.evaluate("PASSOS_GUIA.some(x => x.sel === '#btnCuidador')"), 'la guia de primer ús l\'explica')
    pg.evaluate("ajustes.rol = 'jo'; entraCuidador()"); pg.wait_for_timeout(200)
    txt = lambda: pg.evaluate("document.getElementById('cuPanell').textContent")
    comprova('Què és aquest espai?' in txt(), 'la primera vegada explica què és')
    comprova(pg.evaluate("document.querySelectorAll('.cu-accions button').length") == 2, 'els dos informes són a la primera pantalla')
    comprova(pg.evaluate("TABS_CU[1][0]") == 'informe', 'la pestanya Informe és la segona')
    pg.evaluate("cuEntesBenvinguda()"); pg.wait_for_timeout(100); comprova('Què és aquest espai?' not in txt(), 'l\'explicació es tanca i no torna')
    pg.evaluate("(() => { const d = dadesActuals(); for (let i = 7; i >= 0; i--) d.historial.push({ id:'s'+i, data: dataMenys(5+i), joc:'memory', domini:'memoria', pct:70, encerts:7, errors:3, durada:60, ts:0 }); renderCuidador(); })()"); pg.wait_for_timeout(100)
    comprova('Fa 5 dies' in txt() and 'Enviar-li un missatge' in txt(), 'avisa si fa 3 dies o més que no juga')
    pg.evaluate("cuTria('jocs')"); pg.wait_for_timeout(100); comprova('Els que més juga' in txt() and 'No els ha jugat' in txt(), 'mostra què li agrada i què no ha jugat')
    # Sense cap dada: el PDF també ha de sortir
    pg.evaluate("(() => { const d = dadesActuals(); d.historial = []; })()")
    def baixa(variant, nom):
        with pg.expect_download(timeout=30000) as dl: pg.evaluate(f"informeCuidadorPDF('{variant}')")
        desti = pathlib.Path(carpeta) / nom; dl.value.save_as(desti); return desti.read_bytes()
    pathlib.Path(carpeta).mkdir(parents=True, exist_ok=True)
    b = baixa('familia', 'buit-familia.pdf'); comprova(b[:4] == b'%PDF', 'informe sense dades (família)')
    b = baixa('professional', 'buit-professional.pdf'); comprova(b[:4] == b'%PDF', 'informe sense dades (professional)')
    # Amb 5 mesos de dades de demostració
    pg.evaluate("carregarDemo()"); pg.wait_for_timeout(1000)
    r = pg.evaluate("""(() => { const d = dadesActuals(), D = dadesInformeCuidador(d); return { n: D.totals.partides, ws: D.ws.length, jocs: D.jocs.filter(j => j.n).length, franges: D.franges.reduce((t, f) => t + f.n, 0), r28: D.a28.n, mapa: D.mapa.length, anim: D.anim.n, tr: D.ws.some(w => w.tr) }; })()""")
    comprova(r['n'] > 20 and r['ws'] == 12 and r['jocs'] > 5 and r['franges'] == r['r28'] and r['mapa'] == 84, f'les xifres de l\'informe quadren {r}')
    b = baixa('professional', 'demo-professional.pdf'); n_pro = len(re.findall(rb'/Type /Page\b', b)); comprova(b[:4] == b'%PDF' and n_pro >= 3, f'informe professional: {n_pro} pàgines')
    b = baixa('familia', 'demo-familia.pdf'); n_fam = len(re.findall(rb'/Type /Page\b', b)); comprova(b[:4] == b'%PDF' and 2 <= n_fam <= n_pro, f'informe per a la família: {n_fam} pàgines')
    pg.evaluate(ES); pg.wait_for_timeout(200)
    b = baixa('professional', 'demo-professional-es.pdf'); comprova(b[:4] == b'%PDF', 'informe en castellà')
    comprova(not errs, f'sense errors {errs[:2]}')
    nav.close()

def proves_grup_pilot(p):
    par = Partida(p)
    par.js("""(() => { ['Rosa','Pere','Joan'].forEach((n, i) => usuaris.push({ id: 'u'+i, nom: n, color: '#333', foto: null, avatar: 'inicial', dades: migraDades({}) })); usuaris[2].dades.consentiment = { estat: 'no' }; usuariActualId = 'u0'; ajustes.rol = 'residencia'; guardarUsuaris(); cuidadorObert = true; pestanyaCu = 'residencia'; mostrarPantalla('cuidador'); })()"""); par.avanca(300)
    t = par.js("document.getElementById('cuPanell').textContent")
    comprova('Activitat de grup' in t and 'Com començar, per a l\'equip' in t, 'el panell ofereix l\'activitat de grup i la guia de l\'equip')
    par.js("grupObrir()"); par.avanca(200); comprova(par.js("idPantallaActiva()") == 'grupActivitat', 'l\'activitat s\'obre')
    comprova(par.js("document.querySelectorAll('.grup-persona input:checked').length") == 2, 'qui no ha donat el consentiment no surt marcat')
    par.js("grupComenca()"); par.pg.wait_for_function("grup.pas === 'joc'", timeout=8000); par.avanca(100)
    comprova(par.js("grup.items.length") == 10 and par.js("document.querySelector('.grup-opcio.bona') === null"), '10 preguntes, amb la resposta tapada')
    par.js("grupDestapa()"); par.avanca(100); comprova(par.js("document.querySelectorAll('.grup-opcio.bona').length") == 1, 'es destapa la resposta bona')
    par.js("grupAcaba()"); par.avanca(100); comprova(par.js("usuaris[0].dades.social.slice(-1)[0].mode") == 'grup' and not par.js("usuaris[2].dades.social"), 'la participació s\'anota només a qui hi era')
    par.js("grupTanca()"); par.avanca(200); comprova(par.js("idPantallaActiva()") == 'cuidador', 'torna al panell')
    par.js("ajustes.rol='jo'; ajustes.pilot = true; usuaris[0].nom='P01'; usuaris[0].dades.historial=[{data:'2026-11-02',joc:'memory',pct:70},{data:'2026-11-03',joc:'memory',pct:70}]; usuaris[0].dades.abandonaments=[{data:'2026-11-03',joc:'sudoku'}]; pilotSenseAjuda('u0')")
    r = par.js("pilotResultats()[0]")
    comprova(r['sessions_iniciades'] == 3 and r['sessions_completades'] == 2 and r['setmanes_actives'] == 1 and r['setmanes_amb_repeticio'] == 1 and r['joc_mes_jugat'] == 'memory' and r['joc_mes_abandonat'] == 'sudoku' and r['grup'] == 1 and r['ha_comencat_sense_ajuda'] is True, f'mètriques del pilot {r}')
    comprova(not par.errors, f'sense errors {par.errors[:2]}')
    par.tanca()

def proves_castella(p):
    par = Partida(p); par.js(VISTOS); par.js(ES); par.avanca(200)
    CAT = re.compile(r"\b(amb|aquest|aquesta|també|següent|dues|mateix|perquè|encara|només|tornar|tria|lletra|paraula|vegades|estona|família|metge|Molt bé)\b", re.I)
    def mira(nom):
        par.avanca(120); t = par.js("(document.querySelector('.screen.activa') || document.body).innerText")
        restes = [l for l in t.split('\n') if CAT.search(l)]; comprova(not restes, f'{nom}: sense català {restes[:3]}')
    par.js("mostrarPantalla('inici')"); mira('inici')
    for j in ('associa', 'encreuats'):
        par.js(f"assegurarJoc('{j}')"); par.pg.wait_for_function(f"JOCS.{j}", timeout=8000); par.obre_joc(j, False, 0); par.avanca(500); mira(j)
    comprova(par.js("t('T')") == 'T', 'cap traducció canvia les lletres del teclat')
    par.obre_joc('tertulia'); par.avanca(300); mira('La Tertúlia'); comprova(par.js("document.getElementById('tertulia-tema').textContent").startswith('Esta semana:'), 'el tema de la setmana és traduït')
    par.js("cuidadorObert = true; ajustes.rol = 'residencia'; pestanyaCu = 'residencia'; mostrarPantalla('cuidador')"); mira('panell de residència')
    par.js("grupObrir()"); mira('activitat de grup')
    comprova(par.js("t('Mots encreuats')") == 'Crucigramas' and par.js("t(FER_JOC.memory)").startswith('Toca dos'), 'el catàleg i les frases de l\'Elefant són traduïts')
    par.tanca()

def main():
    carpeta = sys.argv[sys.argv.index('--pdf') + 1] if '--pdf' in sys.argv else str(pathlib.Path(__file__).parent / '_pdf')
    with sync_playwright() as p:
        for nom, f in [('contingut', proves_contingut), ('jocs', proves_jocs), ('Elefant', proves_elefant), ('cuidador i PDF', lambda x: proves_cuidador(x, carpeta)), ('grup i pilot', proves_grup_pilot), ('castellà', proves_castella)]:
            print('---', nom, flush=True)
            try: f(p)
            except Exception as e: comprova(False, f'{nom}: excepció {str(e)[:500]}')
    print('Fallades:', len(fallades))
    for x in fallades: print('  ✗', x)
    return 1 if fallades else 0

if __name__ == '__main__': sys.exit(main())
