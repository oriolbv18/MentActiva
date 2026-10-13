# Domini propi per a MentA — guia per a l'Oriol

**Resum:** el codi ja està preparat. Tu només has de **comprar el domini** i **posar uns registres DNS** (~30 minuts); després, **una sola comanda** ho aplica tot:

```bash
python tools/aplica-domini.py elmeudomini.cat
```

> **Fes-ho ABANS de la prova pilot.** El `localStorage`, el service worker i la PWA instal·lada estan lligats al domini. Si els provadors fan servir `usuari.github.io/…` i després passem a un domini propi, **perdran les dades i hauran de reinstal·lar l'app**. Si cal canviar-ho més endavant, primer cal fer una còpia de dades (Configuració → Dades i privadesa → Exportar) i importar-la al domini nou.

## 1. Triar el nom
- Curt, fàcil de **dictar per telèfon** («mentactiva punt cat»), sense guions si es pot, coherent amb la marca.
- «Menta» és una paraula molt comuna: **abans d'invertir-hi, comprova marques registrades semblants** a l'OEPM (oepm.es) i a TMview/EUIPO (tmdn.org/tmview).

## 2. Extensions i preus (orientatius, verifica'ls al registrador)
| Extensió | Notes | Preu aprox. |
|---|---|---|
| `.cat` | Per a continguts en català o vinculats a la comunitat catalana. **Comprova els requisits** al registre (fundació .cat). | 10–20 €/any |
| `.com` | La més coneguda; molts noms ja estan agafats. | 10–15 €/any |
| `.app` | Obliga a HTTPS (bé per a una PWA). | 12–20 €/any |
| `.es` | Pot demanar vincle amb Espanya. | 8–12 €/any |

Atenció a la **renovació**: el preu del segon any pot ser diferent del primer.

## 3. On comprar-lo
Registradors de confiança: Cloudflare Registrar (si l'extensió hi és), Porkbun, Namecheap, i locals com CDmon o Dinahosting (ofereixen `.cat` i `.es`).
**Mira si el GitHub Student Developer Pack encara inclou un domini gratuït** (educación.github.com): com a estudiant de la UPC podria sortir-te gratis el primer any.

## 4. Allotjament gratuït amb el domini propi
**GitHub Pages** és el més senzill (HTTPS automàtic). Alternatives: Cloudflare Pages, Netlify.

1. Puja el projecte a un repositori de GitHub i activa Pages (Settings → Pages → «Deploy from a branch» → `main` / `/ (root)`).
2. Al panell DNS del registrador crea aquests registres (**verificats a la documentació oficial de GitHub el 11/10/2026; torna'ls a mirar quan ho facis**: docs.github.com → *Managing a custom domain for your GitHub Pages site*):

| Tipus | Nom | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `<el-teu-usuari>.github.io` (sense el nom del repositori) |

   El `www` es redirigeix sol cap al domini sense `www` quan Pages el té configurat.
3. A Settings → Pages → *Custom domain* escriu el domini i desa. (L'arxiu `CNAME` del repositori el crea l'script.)
4. Quan GitHub digui que el DNS és correcte, marca **«Enforce HTTPS»**. Pot trigar de minuts a unes hores.
5. Comprova la propagació: `nslookup elmeudomini.cat` (Windows) o `dig elmeudomini.cat` (Mac/Linux).

## 5. Aplicar el domini al projecte
```bash
python tools/aplica-domini.py elmeudomini.cat --simula   # només ensenya què canviaria
python tools/aplica-domini.py elmeudomini.cat            # ho aplica
python tools/aplica-domini.py --treu                     # torna a «sense domini» (rutes relatives)
```
Què fa: posa `canonical`, `og:url`, `og:image` i `twitter:image` absoluts; omple el JSON-LD, el `sitemap.xml` i el `robots.txt`; escriu `CNAME`; fixa `DOMINI` a `app/js/config.js` (enllaços de compartir) i genera `.well-known/security.txt` si hi ha correu a `CONTACTE.email`. És **idempotent** (executar-lo dues vegades no canvia res), pot canviar d'un domini a un altre i al final **comprova que no queda cap marcador ni URL antiga**. Després, publica (commit + push).

Sense domini tot segueix funcionant amb rutes relatives i amb `file://`. Les pàgines `404.html` (amb l'Elefant), `.nojekyll`, `robots.txt` i `sitemap.xml` ja hi són.

## 6. Correu amb el teu domini (`hola@elmeudomini.cat`)
Gratuït amb **reenviament** cap a la teva bústia:
- Cloudflare Email Routing (si el DNS és a Cloudflare), o el reenviament que ofereix el registrador.
- Crea l'adreça `hola@` i que reenviï a la teva bústia.
- Registres DNS per perquè no vagi a brossa (els valors exactes te'ls dona el proveïdor del reenviament):
  - **SPF** (TXT a `@`): `v=spf1 include:<proveïdor> ~all`
  - **DKIM** (TXT que et dona el proveïdor, p. ex. `selector._domainkey`)
  - **DMARC** (TXT a `_dmarc`): `v=DMARC1; p=none; rua=mailto:hola@elmeudomini.cat`
- Quan funcioni, omple `CONTACTE.email` a `app/js/config.js`: l'app i la web només mostren els contactes que no són buits.

## 7. Cost per a l'assignatura d'Empresa
El domini és una **despesa anual recurrent** (~10–20 €/any) al pla econòmic, dins de «serveis exteriors / web». Aporta imatge de marca (adreça pròpia, correu professional) i credibilitat davant residències. L'allotjament amb GitHub Pages i el reenviament de correu tenen cost 0.

## 8. Comprovació de disponibilitat feta el 11/10/2026 (orientativa; torna-ho a comprovar al registrador)
- `mentactiva.com`: **ja està registrat** (registrador CDmon, caduca el 2027-02-11). Si no el vas comprar tu, no és teu.
- `mentapp.com`: **registrat** (GoDaddy).
- `menta-app.com`: **registrat** (Porkbun).
- `menta-activa.com`: **no ha aparegut al registre** (possiblement lliure).
- Les extensions `.cat`, `.app` i `.es` no s'han pogut comprovar des d'aquí: cal mirar-les al registrador.

## 9. Llista «Què ha de fer l'Oriol»
1. Triar el nom i comprovar marques (OEPM/TMview).
2. Comprar el domini.
3. Posar els registres DNS (A, AAAA, CNAME `www`) i activar HTTPS a GitHub Pages.
4. Crear `hola@` amb reenviament (+ SPF/DKIM/DMARC).
5. Executar `python tools/aplica-domini.py elmeudomini.cat`, omplir `CONTACTE.email` a `config.js` i tornar-lo a executar (per generar el `security.txt`).
6. Publicar i, **abans de donar l'app a ningú**, comprovar-la al mòbil.
