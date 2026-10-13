"""Còpia de seguretat i importació segura (v1.9): fitxers corruptes, enormes, d'altres versions, quota plena, combinar/substituir i desfer.
Ús: python tests/copia/test_copia.py"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

def base(p):
    b, pg = nou(p, 390, 844)
    pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1')"); pg.reload(); pg.wait_for_timeout(1200)
    pg.evaluate("for (const n of ['Anna', 'Pere']) { const u = afegirUsuari({ nom: n }, false); u.dades.totalPartides = 12; } guardarUsuaris(); notificaUsuaris();")
    return b, pg

def valida(pg, text):
    return pg.evaluate("t => { const v = validaPaquet(t); return v.ok ? { ok: true, resum: v.resum } : { ok: false, error: v.error }; }", text)

def paquet(pg, **canvis):
    p = json.loads(pg.evaluate("JSON.stringify(construeixPaquet())")); p.update(canvis); return p

def main():
    with sync_playwright() as pw:
        b, pg = base(pw)
        p = paquet(pg)
        r = valida(pg, json.dumps(p)); comprova(r['ok'] and r['resum']['persones'] == 2 and r['resum']['partides'] == 24, f'còpia vàlida: resum {r.get("resum")}')
        casos = [('JSON trencat', '{"app": "MentA", "claus": {'), ('no és un objecte', '[1,2,3]'), ('altra app', json.dumps({'app': 'Altra', 'claus': {'mentA_x': '1'}})),
                 ('sense claus', json.dumps({'app': 'MentA', 'claus': {}})), ('claus no mentA_', json.dumps({'app': 'MentA', 'claus': {'altra': '1'}})),
                 ('clau amb __proto__', json.dumps({'app': 'MentA', 'claus': {'mentA___proto__': '1'}})),
                 ('valor amb __proto__', json.dumps({'app': 'MentA', 'claus': {'mentA_usuaris': '[{"id":"a","nom":"a","dades":{"__proto__":{"x":1}}}]'}})),
                 ('valor no és text', json.dumps({'app': 'MentA', 'claus': {'mentA_x': 5}})),
                 ('versió futura', json.dumps(dict(p, schema=99))), ('versió negativa', json.dumps(dict(p, schema=-3))),
                 ('persones mal formades', json.dumps({'app': 'MentA', 'claus': {'mentA_usuaris': json.dumps([{'id': 5, 'nom': 'x'}])}})),
                 ('apartat malmès', json.dumps({'app': 'MentA', 'claus': {'mentA_ajustes': '{"a": '}})),
                 ('text llarg sense format', json.dumps({'app': 'MentA', 'claus': {'mentA_x': 'a' * 900}}))]
        for nom, text in casos:
            r = valida(pg, text); comprova(not r['ok'], f'rebutja: {nom} → «{r.get("error")}»')
        gran = '{"app":"MentA","claus":{"mentA_x":"' + 'a' * (26 * 1024 * 1024) + '"}}'
        r = valida(pg, gran); comprova(not r['ok'] and 'gran' in r['error'], 'rebutja un fitxer de 26 MB')
        antic = {'app': 'MentA', 'versio': '1.6.0', 'claus': {'mentA_usuaris': json.dumps([{'id': 'u_1', 'nom': 'Maria', 'dades': {'totalPartides': 7}}]), 'mentA_ajustes': '{"zoom":"gran"}'}}
        r = valida(pg, json.dumps(antic)); comprova(r['ok'] and r['resum']['persones'] == 1, 'accepta una còpia antiga sense camp «schema» (1.6)')
        nova = paquet(pg); us = json.loads(nova['claus']['mentA_usuaris']); us.append({'id': 'u_nou_1', 'nom': 'Laia', 'dades': {'totalPartides': 3}}); us[0]['dades']['totalPartides'] = 99
        nova['claus']['mentA_usuaris'] = json.dumps(us)
        pg.evaluate("t => importaText(t)", json.dumps(nova)); pg.wait_for_timeout(300)
        txt = pg.evaluate("document.getElementById('importaResum').innerText")
        comprova('3' in txt and 'persones' in txt and 'partides' in txt, f'abans d\'aplicar mostra el resum «{txt[:70]}»')
        comprova(pg.evaluate("[...document.querySelectorAll('#modalImporta .confirm-botons button')].length") == 3 and pg.evaluate("[...document.querySelectorAll('#modalImporta .confirm-botons button')].every(b => b.getBoundingClientRect().height >= 44)"), 'tres botons grans: Combinar, Substituir, Cancel·lar')
        pg.evaluate("aplicaImportacio('combina')"); pg.wait_for_timeout(2500)
        noms = pg.evaluate("usuaris.map(u => u.nom + ':' + u.dades.totalPartides)")
        comprova(sorted(noms) == sorted(['Anna:99', 'Pere:12', 'Laia:3']), f'combinar: afegeix la nova i es queda la que té més partides {noms}')
        pg.evaluate("desferImportacio()"); pg.wait_for_timeout(600); pg.evaluate("confirmarAccio()"); pg.wait_for_timeout(2500)
        noms = pg.evaluate("usuaris.map(u => u.nom + ':' + u.dades.totalPartides)"); comprova(sorted(noms) == sorted(['Anna:12', 'Pere:12']), f'desfer: torna al que hi havia abans {noms}')
        pg.evaluate("t => importaText(t)", json.dumps(nova)); pg.evaluate("aplicaImportacio('substitueix')"); pg.wait_for_timeout(2500)
        noms = pg.evaluate("usuaris.map(u => u.nom)"); comprova(sorted(noms) == sorted(['Anna', 'Pere', 'Laia']), f'substituir: queda exactament la còpia {noms}')
        # quota plena: no es canvia res
        antes = pg.evaluate("localStorage.getItem('mentA_usuaris')")
        pg.evaluate("t => importaText(t)", json.dumps(paquet(pg, schema=3)))
        pg.evaluate("(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (window.__bloqueja && k === 'mentA_usuaris') { window.__bloqueja = false; throw new DOMException('ple', 'QuotaExceededError'); } return o.call(this, k, v); }; window.__bloqueja = true; })()")
        pg.evaluate("aplicaImportacio('substitueix')"); pg.wait_for_timeout(800)
        comprova(pg.evaluate("localStorage.getItem('mentA_usuaris')") == antes, 'quota plena: la importació es desfà sola i no es perd res')
        pg.evaluate("window.__bloqueja = false")
        pg.evaluate("localStorage.removeItem('mentA_copiaInfo'); renderRecordatoris()"); pg.wait_for_timeout(200)
        comprova(pg.evaluate("!!document.querySelector('#recordatorisInici .avis-copia')"), 'recordatori de còpia a l\'inici quan no n\'hi ha cap i hi ha partides')
        pg.evaluate("copiaDesada()"); comprova(pg.evaluate("!document.querySelector('#recordatorisInici .avis-copia')"), 'el recordatori desapareix després de la còpia')
        pg.evaluate("lsSet('mentA_copiaInfo', { data: dataMenys(40), partides: 24 }); renderRecordatoris()")
        comprova(pg.evaluate("!!document.querySelector('#recordatorisInici .avis-copia')"), 'recordatori als 30+ dies')
        pg.evaluate("mostrarPantalla('configuracio')"); pg.wait_for_timeout(800)
        comprova('utilitzats' in pg.evaluate("document.getElementById('espaiUtilitzat').innerText"), 'Configuració mostra l\'espai utilitzat')
        with pg.expect_download() as d: pg.evaluate("exportarDades()")
        comprova(d.value.suggested_filename.startswith('MentA-copia-'), 'exportar descarrega el fitxer')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:3]); print('Fallades:', len(fallades)); return 1 if errors or fallades else 0
if __name__ == '__main__': sys.exit(main())
