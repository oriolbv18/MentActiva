"""Crea el .zip de la versió (sense .git, node_modules ni les captures històriques de versions anteriors).
Ús: python tools/fes-zip.py   → ../Menta_Web.<versió>.zip (al costat de la carpeta del projecte)"""
import os, pathlib, sys, zipfile
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
EXCLOU = {'.git', 'node_modules', '__pycache__'}
EXCLOU_REL = {'docs/captures', 'docs/captures-1.8', 'docs/captures-1.9', 'docs/web-abans', 'docs/web-despres'}        # captures de versions anteriors: ja són als seus .zip


def main():
    desti = ARREL.parent / (ARREL.name + '.zip')
    if desti.exists(): desti.unlink()
    n = 0
    with zipfile.ZipFile(desti, 'w', zipfile.ZIP_DEFLATED) as z:
        for r, ds, fs in os.walk(ARREL):
            rel = pathlib.Path(r).relative_to(ARREL).as_posix()
            ds[:] = [d for d in ds if d not in EXCLOU and (d if rel == '.' else rel + '/' + d) not in EXCLOU_REL]
            for f in fs:
                p = pathlib.Path(r) / f; z.write(p, pathlib.Path(ARREL.name) / p.relative_to(ARREL)); n += 1
    print(n, 'fitxers ·', round(desti.stat().st_size / 1e6, 1), 'MB →', desti)

if __name__ == '__main__': main()
