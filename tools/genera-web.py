"""Genera les pàgines legals (legal/*.html), el sitemap i el robots, i injecta les icones SVG de l'app a la web.
Ús: python tools/genera-web.py   (després de canviar plantilles o icones)"""
import pathlib, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ARREL = pathlib.Path(__file__).resolve().parent.parent
ICONES = ['check', 'usuari', 'familia', 'casa', 'info', 'jocs', 'dos', 'compartir', 'escut', 'cadenat', 'document', 'volum']

def sprite():
    app = (ARREL / 'app' / 'index.html').read_text(encoding='utf8')
    peces = []
    for i in ICONES:
        m = re.search(r'<symbol id="i-' + i + r'"[^>]*>.*?</symbol>', app, re.S)
        if m: peces.append(m.group(0))
    return ''.join(peces)

PLANTILLA = '''<!DOCTYPE html>
<html lang="ca" data-tema="clar" data-arrel="../">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' file:; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline' file:; img-src 'self' data: blob: file:; media-src 'self' data: blob: file:; font-src 'self' data: file:; connect-src 'self' blob: file:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>{titol} · MentA</title>
<meta name="description" content="{descripcio}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="" data-domini="/legal/{nom}.html">
<link rel="icon" href="../app/img/favicon.svg" type="image/svg+xml">
<script>
  (function () {{
    var h = document.documentElement; h.classList.add('js');
    var t = null; try {{ t = localStorage.getItem('mentA_web_tema'); }} catch (e) {{ /* sense emmagatzematge */ }}
    if (t !== 'clar' && t !== 'fosc') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'fosc' : 'clar';
    h.setAttribute('data-tema', t);
    if (window.matchMedia && matchMedia('(prefers-contrast: more)').matches) h.setAttribute('data-contrast', 'alt');
  }})();
</script>
<link rel="stylesheet" href="../web/web.css">
</head>
<body>
<!--SHELL:sprite--><!--/SHELL:sprite-->
<a class="salta-contingut" href="#principal">Saltar al contingut</a>
<!--SHELL:cap--><!--/SHELL:cap-->
<main id="principal">
<section class="l-seccio"><div class="l-ample"><div class="l-legal">
<a class="l-torna" href="../index.html">← Torna a l'inici</a>
<h1>{titol}</h1>
<p class="nota">Versió <span data-versio>{versio}</span> · Última actualització: {data} · Aquest text és <strong>orientatiu</strong> i s'ha de revisar amb un professional del dret abans d'usar MentA amb residències o amb dades reals de tercers.</p>
{cos}
</div></div></section>
</main>
<!--SHELL:peu--><!--/SHELL:peu-->
<script src="../app/js/config.js" defer></script>
<script src="../web/web.js" defer></script>
</body>
</html>
'''

PLANTILLA_404 = '''<!DOCTYPE html>
<html lang="ca" data-tema="clar" data-arrel="">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' file:; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline' file:; img-src 'self' data: blob: file:; media-src 'self' data: blob: file:; font-src 'self' data: file:; connect-src 'self' blob: file:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>Pàgina no trobada · MentA</title>
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light dark">
<!-- Aquesta pàgina es serveix des de qualsevol ruta que no existeix: fixem la base perquè les rutes relatives funcionin sempre -->
<script>
  (function () {{
    var b = document.createElement('base'), h = location.hostname, projecte = /\.github\.io$/.test(h) ? '/' + (location.pathname.split('/')[1] || '') + '/' : '/';
    b.href = location.origin === 'null' || location.protocol === 'file:' ? '.' : location.origin + projecte; document.head.appendChild(b);
    var d = document.documentElement; d.classList.add('js');
    var t = null; try {{ t = localStorage.getItem('mentA_web_tema'); }} catch (e) {{ /* sense emmagatzematge */ }}
    if (t !== 'clar' && t !== 'fosc') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'fosc' : 'clar';
    d.setAttribute('data-tema', t);
  }})();
</script>
<link rel="icon" href="app/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="web/web.css">
</head>
<body>
<!--SHELL:sprite--><!--/SHELL:sprite-->
<a class="salta-contingut" href="#principal">Saltar al contingut</a>
<!--SHELL:cap--><!--/SHELL:cap-->
<main id="principal">
<section class="l-seccio"><div class="l-ample"><div class="l-404">
<img src="img/web/elefant.svg" width="200" height="200" alt="L'Elefant de MentA, una mica despistat">
<h1>Aquesta pàgina no existeix</h1>
<p>No passa res: de vegades ens equivoquem de camí. Torna a l'inici i hi som.</p>
<div class="l-botons"><a class="btn btn-accio" href="./">Torna a l'inici</a><a class="btn btn-sec" href="app/index.html">Obre l'app</a></div>
</div></div></section>
</main>
<!--SHELL:peu--><!--/SHELL:peu-->
<script src="app/js/config.js" defer></script>
<script src="web/web.js" defer></script>
</body>
</html>
'''

PAGINES = {
 'privadesa': ('Política de privadesa', 'Quines dades usa MentA, on es guarden i què pots fer amb elles.', '''
<h2>En resum</h2>
<ul><li>MentA <strong>no té servidor ni comptes</strong>. Les dades es guarden només al navegador del teu dispositiu (emmagatzematge local).</li>
<li>No fem servir cookies, publicitat, analítica ni serveis de tercers. Les tipografies i les llibreries són dins de l'app.</li>
<li>Cap dada surt del dispositiu <strong>si tu no ho decideixes</strong>: exportar una còpia, enviar un resum, compartir un PDF o enviar feedback.</li></ul>
<h2>Quines dades es desen</h2>
<ul><li>Perfils locals: nom, color o foto opcional i els ajustos (mida de lletra, so, tema).</li>
<li>Partides: joc, data, durada, encerts, errors i temps de reacció.</li>
<li>Opcionalment: estat d'ànim, xec diari (aigua, passeig, descans, medicació), àlbum de fotos, missatges i notes del cuidador.</li>
<li>L'espai del cuidador: el PIN només es desa com a <em>hash</em> amb sal, mai en clar, i un registre dels accessos.</li></ul>
<h2>Dades de salut</h2>
<p>L'estat d'ànim, la medicació i el rendiment en els jocs poden ser <strong>dades de categoria especial</strong> segons el RGPD. MentA no les envia enlloc. Si algú les exporta o les comparteix (PDF, CSV, WhatsApp, correu), aquesta persona passa a ser responsable de com es tracten. Si la persona no pot decidir per ella mateixa, el consentiment l'han de donar la família o el tutor legal.</p>
<h2>El PIN no és seguretat forta</h2>
<p>El PIN del cuidador evita que la persona gran hi entri per error. No xifra les dades: qui tingui el dispositiu desbloquejat i coneixements tècnics podria llegir-les. Per a protecció real, protegeix el dispositiu amb un bloqueig de pantalla.</p>
<h2>Els teus drets</h2>
<p>Pots veure, exportar o esborrar totes les dades quan vulguis des de l'app (Configuració i Espai del cuidador). Esborrar el navegador o la instal·lació també les elimina.</p>
<h2>Ús anònim i feedback (opcionals)</h2>
<p>L'«ús anònim» és <strong>desactivat per defecte</strong>: si l'actives, es desa un registre local sense noms ni fotos que pots exportar i enviar-nos. El feedback només s'envia quan prems el botó, i el missatge el prepares tu.</p>
<h2>Responsable i contacte</h2>
<p>Titular: <strong data-titular></strong>. <span data-nomes-si-correu hidden>Correu: <a data-correu href="#"></a>.</span></p>'''),
 'avis-legal': ('Avís legal', 'Titular, propietat intel·lectual i llicències de MentA.', '''
<h2>Titular</h2>
<p><strong data-titular></strong>. MentA és un projecte acadèmic d'Empresa de la UPC (Castelldefels), en fase de proves.</p>
<h2>Propietat intel·lectual i llicències</h2>
<ul><li>MentA: codi i continguts del projecte (el titular indicat a dalt).</li>
<li>Tipografies: Atkinson Hyperlegible Next (Braille Institute) i Lexend, amb llicència SIL OFL.</li>
<li>Generació de PDF: jsPDF, llicència MIT.</li></ul>
<h2>Exempció de responsabilitat</h2>
<p>MentA és una eina d'entreteniment i benestar cognitiu, oferta «tal qual», sense garanties. No és un dispositiu sanitari i no substitueix cap professional de la salut. Vegeu les <a href="condicions.html">condicions i l'avís de no-diagnòstic</a>.</p>
<h2>Enllaços</h2>
<p>Els enllaços a xarxes socials només es mostren si el projecte hi té un compte real. No ens fem responsables dels continguts de pàgines externes.</p>'''),
 'condicions': ('Condicions d\'ús i avís de no-diagnòstic', 'Què és i què no és MentA.', '''
<h2>MentA no diagnostica</h2>
<p><strong>MentA no és un dispositiu sanitari i no fa diagnòstics.</strong> No detecta, no prevé, no cura ni avisa de cap malaltia. Els indicadors de l'Espai del cuidador (semàfor, tendències, temps de reacció…) són <strong>orientatius</strong> i mesuren el rendiment en uns jocs, no la salut. Un resultat pot canviar per cansament, medicació, l'hora o simplement perquè el joc és nou.</p>
<p>Si observeu canvis que us preocupen, consulteu un professional de la salut.</p>
<h2>Ús previst</h2>
<ul><li>Entreteniment i estimulació cognitiva suau, amb persones grans i les seves famílies o els seus centres.</li>
<li>L'espai del cuidador és per a qui acompanya la persona. S'ha de fer servir amb el seu coneixement; vegeu la política de <a href="privadesa.html">privadesa</a>.</li>
<li>Els jocs no tenen apostes ni diners.</li></ul>
<h2>Responsabilitat</h2>
<p>L'app es proporciona «tal qual», en fase de proves. Fes còpies de seguretat de les dades que vulguis conservar.</p>'''),
 'cookies': ('Cookies i emmagatzematge', 'MentA no fa servir cookies.', '''
<h2>Cookies</h2>
<p><strong>MentA no fa servir cookies</strong> ni tecnologies de seguiment, ni a l'app ni a aquesta web.</p>
<h2>Emmagatzematge local</h2>
<p>L'app guarda al teu navegador (emmagatzematge local) els teus ajustos, perfils i partides perquè funcioni sense connexió. No és una cookie, no s'envia a cap servidor i pots esborrar-lo des de l'app o des del navegador.</p>
<h2>Serveis externs</h2>
<p>No es carrega cap tipografia, script ni imatge de tercers. L'app i la web funcionen sense cap CDN.</p>'''),
}

def main():
    cfg = (ARREL / 'app' / 'js' / 'config.js').read_text(encoding='utf8')
    versio = re.search(r"VERSIO_CURTA\s*=\s*'([^']+)'", cfg).group(1); data = re.search(r"DATA_VERSIO\s*=\s*'([^']+)'", cfg).group(1)
    (ARREL / 'legal').mkdir(exist_ok=True)
    for nom, (titol, desc, cos) in PAGINES.items():
        (ARREL / 'legal' / f'{nom}.html').write_text(PLANTILLA.format(titol=titol, descripcio=desc, cos=cos.strip(), nom=nom, versio=versio, data=data), encoding='utf8')
    (ARREL / '404.html').write_text(PLANTILLA_404, encoding='utf8')
    print('Fet: legal/*.html i 404.html. Ara executa: python tools/web-shell.py (el sitemap i el robots els gestiona tools/aplica-domini.py)')

if __name__ == '__main__': main()
