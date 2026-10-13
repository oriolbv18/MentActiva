"""Auditoria de la traducció: mira els textos que l'app ha mostrat en mode castellà (tests/i18n/textos-es.json, generat per recull.py --llengua es)
i diu quins encara semblen catalans. Surt amb codi 1 si en queda cap (excepcions justificades a EXCEPCIONS).
Ús: python tests/i18n/catala_restant.py"""
import json, pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent
MARCADORS = re.compile(r"[àèòç]|·(?!\s)|\b(amb|és|això|aquest|aquesta|aquests|aquestes|sense|també|quan|dins|teu|teva|vols|pots|tens|hi ha|més|fins|però|així|encara|dels|tots|totes|algú|ningú|avui|demà|joc|jocs|setmana|setmanes|dies|molt|vegada|podeu|voleu|feu|heu)\b", re.I)
# Text que és igual en els dos idiomes o és contingut de l'usuari (noms, codis): no és una traducció pendent
EXCEPCIONS = [r"^Català$", r"^MentA\b", r"^[A-Z]{1,3}\d*$", r"^Bingo$", r"^Memory", r"^Sudoku", r"^Stroop", r"^N-back", r"^PIN\b", r"^SUS\b", r"^P\d\d$", r"^JSON|CSV|PDF", r"^· Cuidador ·$"]
def main():
    ca = set(json.loads((ARREL / 'textos-ca.json').read_text(encoding='utf-8')))
    es = json.loads((ARREL / 'textos-es.json').read_text(encoding='utf-8'))
    norm = lambda s: re.sub(r'\d+', '{n}', s)
    ca_n = {norm(x) for x in ca}
    # Els paràgrafs dels tutorials es tradueixen sencers (la clau és el seu HTML): els trossos entre <strong> que el recull
    # veu un instant abans de la traducció no són textos pendents. Es comprova que el tros és dins d'una clau del diccionari.
    tut = (ARREL.parent.parent / 'app' / 'js' / 'i18n' / 'es-4-tutorials.js').read_text(encoding='utf-8')
    claus_tut = [re.sub(r'<[^>]+>', ' ', k) for k in re.findall(r'"([^"]+)":\s*"', tut)]
    dins_tutorial = lambda t: any(t.strip() and t.strip() in k for k in claus_tut)
    restants = []
    for t in es:
        if any(re.search(e, t) for e in EXCEPCIONS): continue
        if dins_tutorial(t): continue
        if MARCADORS.search(t): restants.append(t)
    # el recull en es també enregistra el text original (català) abans de traduir-lo: només ens interessen els que NO tenen versió traduïda,
    # però com que el recull és diferit (60 ms) només queda el text final; igualment descartem els que són d'un nom propi
    restants = sorted(set(restants))
    # El recull pot veure un text un instant abans que s'hi apliqui la traducció (fragments d'un paràgraf amb negretes, etc.):
    # es descarten els que el motor sí que sap traduir (I18N.t els canvia) i només queden els realment pendents.
    if restants:
        sys.path.insert(0, str(ARREL.parent))
        from test_viatge18 import nou
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b, pg = nou(p, 390, 844)
            pg.evaluate("ajustes.idioma = 'es'; guardarAjustes()"); pg.reload(); pg.wait_for_timeout(1500)
            traduits = pg.evaluate("ls => ls.map(s => I18N.t(s) !== s)", restants); b.close()
        restants = [r for r, ok in zip(restants, traduits) if not ok]
    print(f'{len(es)} textos vistos en castellà · {len(restants)} sembla que encara són en català')
    for r in restants[:200]: print('  ✗', r[:200])
    return 1 if restants else 0
if __name__ == '__main__': sys.exit(main())
