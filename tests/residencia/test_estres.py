"""Residència a escala real (v1.10): 15 persones x 1 any. Mesura la mida de les dades i el temps de desar, i comprova que
el semàfor, la còpia de seguretat i la recàrrega segueixen funcionant.
Ús: python tests/residencia/test_estres.py"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

GENERA = """() => {
  const jocs = jocsIndividuals(); let n = 0;
  for (let u = 0; u < 15; u++) {
    const id = 'u_estres_' + u, d = getDadesBuit();
    for (let i = 364; i >= 0; i--) {
      if ((i * 7 + u * 3) % 10 > 6) continue;
      const iso = dataMenys(i); d.diesJugats.push(iso);
      for (let k = 0; k < 1 + (i + u) % 2; k++) {
        const j = jocs[(i + u + k) % jocs.length], pct = 55 + ((i * 13 + u * 7 + k) % 40), enc = Math.round(pct / 10);
        d.historial.push({ id: 's_e_' + u + '_' + i + '_' + k, usuari: id, data: iso, ts: dataDeISO(iso).getTime() + (9 + k * 3) * 3600e3, horaInici: '10:00', joc: j.id, domini: j.domini, nivell: null, mode: 'individual', encerts: enc, errors: 10 - enc, pct, puntuacio: enc * 10, durada: 120 + (i % 200), adaptatiu: true, abandonada: false, ajudesUsades: 0, pausesFetes: 0 });
        d.totalPartides++; d.totalEncerts += enc; d.totalErrors += 10 - enc; n++;
      }
    }
    usuaris.push({ id, nom: 'Resident ' + (u + 1), color: '#2e8b57', foto: null, avatar: 'inicial', dades: d });
  }
  ajustes.rol = 'residencia'; guardarAjustes(); usuariActualId = 'u_estres_0';
  return n;
}"""


def main():
    with sync_playwright() as p:
        b, pg = nou(p, 390, 844)
        pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1')")
        pg.reload(); pg.wait_for_timeout(1000)
        n = pg.evaluate(GENERA)
        print(f'  {n} partides en 15 persones')
        t = pg.evaluate("() => { const t0 = performance.now(); for (let i = 0; i < 10; i++) guardarUsuaris(); return (performance.now() - t0) / 10; }")
        mida = pg.evaluate("localStorage.getItem('mentA_usuaris').length")
        print(f'  mida mentA_usuaris: {mida/1e6:.2f} M caràcters · desar: {t:.1f} ms')
        comprova(mida > 0, 'les dades de 15 persones x 1 any es poden desar al navegador')
        comprova(t < 150, f'desar després de cada partida triga < 150 ms ({t:.1f} ms)')
        pg.reload(); pg.wait_for_timeout(2500)
        comprova(pg.evaluate("usuaris.length") == 15, 'en recarregar, les 15 persones hi són')
        r = pg.evaluate("() => { const t0 = performance.now(); const e = usuaris.map(u => calculaSemafor(u.dades).estat); return { ms: performance.now() - t0, e }; }")
        comprova(len(r['e']) == 15 and r['ms'] < 1500, f'el semàfor de les 15 persones es calcula en {r["ms"]:.0f} ms ({sorted(set(r["e"]))})')
        pg.evaluate("canviarUsuari(usuaris[3].id)")
        pg.wait_for_timeout(500)
        pg.evaluate("mostrarPantalla('selectorResident')")
        pg.wait_for_timeout(800)
        with pg.expect_download(timeout=60000) as d:
            pg.evaluate("exportarDades()")
        txt = pathlib.Path(d.value.path()).read_text(encoding='utf-8')
        comprova(len(txt) > 1e6, f'la còpia de seguretat es genera i pesa {len(txt)/1e6:.2f} M caràcters')
        lliure = pg.evaluate("() => { let k = 0; try { while (k < 400) { localStorage.setItem('mentA_prova_' + k, 'x'.repeat(100000)); k++; } } catch (e) { } for (let i = 0; i < k; i++) localStorage.removeItem('mentA_prova_' + i); return k * 100000; }")
        print(f'  espai lliure aproximat a localStorage després de les 15 persones: {lliure/1e6:.1f} M caràcters')
        comprova(lliure > 0, 'queda espai lliure després de 15 persones x 1 any')
        b.close()
    print('\nErrors de JS:', len(errors), errors[:3]); print('Fallades:', len(fallades))
    return 1 if errors or fallades else 0


if __name__ == '__main__': sys.exit(main())
