import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_viatge18 import nou, comprova, errors, fallades
from playwright.sync_api import sync_playwright
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
OUT = pathlib.Path(r'C:/Users/oriol/AppData/Local/Temp/claude/C--Users-oriol-Music-MentA/3605539b-f42e-4571-911a-3316d2bb3299/scratchpad')
with sync_playwright() as p:
    b, pg = nou(p, 390, 844)
    pg.evaluate("localStorage.setItem('mentA_onboarding_vist','1');localStorage.setItem('mentA_zoom_vist','1');localStorage.setItem('mentA_tutorials',JSON.stringify({memory:true}))"); pg.reload(); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'app_inici.png'))
    pg.evaluate("obrirJoc('memory')"); pg.wait_for_timeout(600)
    pg.evaluate("document.querySelector('#modalDificultat .dificultat-btn') && document.querySelectorAll('#modalDificultat .dificultat-btn')[1].click()"); pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / 'app_joc.png'))
    pg.click('#joc-memory [data-i="0"]'); pg.wait_for_timeout(300); pg.click('#joc-memory [data-i="1"]'); pg.wait_for_timeout(1200)
    pg.click('#joc-memory .el-slot-joc'); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / 'app_pista1.png'))
    pg.click('.el-globus .el-boto.principal'); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'app_pista2.png'))
    pg.click('.el-globus .el-boto.principal'); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / 'app_pista3.png'))
    print(errors[:5], fallades)
    b.close()
