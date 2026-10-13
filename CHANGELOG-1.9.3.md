# MentA · Registre de canvis · v1.9.3 «Aparador lliure i moviment amb sentit»

Base: la v1.9.2 (`Menta_Web.1.9.2`, que no s'ha tocat). **Només canvia la web** (`index.html`, `web/`) i les seves eines i proves. A l'app només `VERSIO = '1.9.3'` (i el nom de la memòria cau del *service worker*). Principi de la versió: **l'usuari mana, el moviment només convida.**

## Què veurà de nou
- **Aparador de jocs amb control real.** Ja no hi ha dues files que es mouen soles: hi ha **una sola fila, ordenada per àrea** (Memòria · Atenció · Llenguatge · Càlcul · Lògica) que és un *scroller* natiu. Es mou amb la **roda o el trackpad**, **arrossegant amb el ratolí** (amb impuls en deixar anar i una petita goma als extrems), amb **fletxes** de 48 px, amb el **teclat** (Tab entra a la fila i ←/→ van carta a carta) i amb el **dit** (amb una mica de la carta següent a la vora perquè es noti). Un indicador diu «1 – 6 de 17». Passar el ratolí per una carta **l'eleva**; ja no atura res.
- **Una sola invitació.** La primera vegada que s'hi arriba (només amb cursor), la fila es desplaça uns píxels i torna. Qualsevol interacció la fa tornar a zero i no hi ha cap moviment automàtic sostingut.
- **Moviment amb sentit (7 propostes, cadascuna amb propòsit escrit):** els quatre fets entren escalonats; el **«17 jocs» compta de 0 a 17** una vegada; el mòbil viu canvia de pantalla **amb direcció** (la que surt marxa cap amunt, la que entra puja des de sota); els **botons i enllaços** responen a la premuda i els enllaços de text **subratllen creixent des de l'esquerra**; la **navegació entre pàgines** fa un *crossfade* de 200 ms; **l'Elefant saluda quan el toques**; i es manté l'obertura animada de les preguntes.
- **Petits detalls:** la salutació del hero segons l'hora real («Bon dia / Bona tarda / Bona nit»), un **«Torna a dalt»** discret en arribar al peu, `decoding="async"` a les captures de sota el plec.

## Corregit
- **Problema 1 (l'Oriol):** el *marquee* anava a **25,8 px/s** (veure els 17 jocs costava més d'un minut), el hover només l'aturava sense deixar-lo moure i dues files en sentits oposats competien per l'atenció. Reproduït a `docs/web-premium/BASE-1.9.2.md` amb un test que **falla** a la 1.9.2 i passa a la 1.9.3.
- L'auditoria va descobrir un **CLS de 0,07** als amples ≥ 1024 px que jo mateix havia introduït: el compte del 17 feia moure el «jocs» i, de passada, vaig comprovar que la invitació no suma res si es fa amb `translate`. Arreglat (l'ample del número es fixa al del número més ample mesurat amb canvas): CLS 0,004.
- Doble subratllat al peu en passar-hi el cursor (el nou subratllat creixent i el natiu); queda només el nou.

## Proves i mesures (abans → després)

| Mesura | 1.9.2 | 1.9.3 |
|---|---|---|
| Veure els 17 jocs | > 60 s, sense control | **3,0 s** amb les fletxes · **2,9 s** amb la roda · **6,4 s** arrossegant (test cronometrat) |
| Velocitat del moviment automàtic | 25,8 px/s, sense parar | **cap** (només una invitació de ≈ 1,5 s) |
| Hover a l'aparador | atura la fila, no la mou | eleva la carta (`translateY(-6px)`) |
| `tools/audit-web.py` (30 combinacions) | 0 incidències | **0 incidències** (CLS màxim 0,022, només amb el zoom del navegador al 200 % a 1024 px, i ≤ 0,02 a la resta; 0 tasques > 50 ms en fer scroll) |
| Lighthouse mòbil, rendiment (5 tandes) | 74 · 76 · 81 · 85 · 95 (mediana **81**) | **71 · 73 · 95 · 95 · 97 (mediana 95)** |
| Lighthouse Accessibilitat · Bones pràctiques · SEO · CLS | 100 · 100 · 100 · 0 | **100 · 100 · 100 · 0** |
| Pes de la pàgina (sense vídeo, comprimit) | 213 KB | **217 KB** |
| Tests web (`test_web`, `test_premium`, `test_aparador_control`, `test_moviment_reduit`, `test_sense_js`, `test_accessibilitat`, `test_domini_web`) | verds | **verds**; axe-core 0 violacions |
| Contrast | 0 parells sota AA | **0 parells sota AA** |
| Regressió de l'app (16 conjunts) | verda | **verda** |
| JS de la web | 21 KB (8 KB gzip) | 30 KB (10,7 KB gzip) + `mol.js` 1 KB (0,6 KB gzip) |

**Proves noves** (`tests/web/`): `test_aparador_control` (els criteris d'acceptació de la F1: 17 jocs en < 10 s, hover sense efecte, res es mou sol, teclat, objectius ≥ 44 px, tàctil amb *peek*, moviment reduït, sense JS, CLS ≤ 0,02, cap tasca llarga), `test_moviment_reduit` (cap animació que es mogui) i `test_sense_js`. `test_premium` s'amplia amb fets, compte, direcció del mòbil viu, Elefant, transició de pàgines (amb http), salutació i «Torna a dalt».

## Decisions preses
1. **Cap deriva suau (*ambient drift*).** El pla la deixava opcional («si complica el codi… elimina-la»). Una fila que es mou sola és exactament el que molestava; una fila quieta i clara + una sola invitació és millor. Sense deriva tampoc no cal el botó de pausa (WCAG 2.2.2), que s'ha tret.
2. **Una sola fila ordenada per àrea** (no dues files alhora): els filtres existents continuen i el número de cartes no canvia.
3. **Un sol sistema d'entrada** (`data-viu`): els fets s'hi han afegit en lloc de crear `data-revela`. No s'ha posat un *fade-up* a cada títol (era el patró genèric que la crítica de la 1.9.2 va retirar).
4. **La invitació** usa la propietat `translate` (no `scrollLeft`: això sumava CLS) i només es fa amb cursor fi; amb el dit el tros de carta a la vora ja convida.
5. **Rebutjat:** blur/opacitat a la capçalera en compactar-se (cost de repintar el vidre), allargar l'entrada del titular del hero (empitjora l'LCP).
6. **Mesura d'ús:** només una proposta escrita (`docs/MESURA-US.md`); no s'ha instal·lat cap analítica.

## Notes honestes (el que no s'ha assolit del tot)
- **Lighthouse és bimodal:** 3 de 5 tandes donen 95–97 i 2 donen 71–73 (picos de TBT d'1–1,8 s a la mateixa pàgina i la mateixa màquina). La mediana puja de 81 a 95 i la meva lectura és que el soroll de l'entorn no ha desaparegut: la 1.9.2 tenia la mateixa dispersió (74–95). No ho puc afirmar amb un sol equip; cal mesurar-ho en un mòbil real o amb PageSpeed Insights un cop publicada.
- **Tasques llargues amb CPU ×4:** el criteri del pla («0 tasques > 50 ms en fer scroll i arrossegar») **es compleix a l'auditoria normal (CPU ×1) però no del tot amb la CPU ×4**: hi ha 10 tasques > 50 ms en tota la sessió, tres d'elles de 62–63 ms ja amb l'aparador en ús (fletxes i arrossegament) i la resta són maquetats (el primer, el de les tipografies i el d'entrar a una secció, de 130–260 ms). Els fotogrames: mediana 16,7 ms, p95 33 ms, 1 de > 100 ms entre 1.037.
- **Mòbil real:** no s'ha pogut provar l'arrossegament ni el tacte dels molls en un dispositiu físic, ni amb una persona gran (pendent des de la 1.9.2).
- **F5.2 (previsualització social):** `og:image` i `twitter:card` hi són i el test de domini comprova que s'omplen amb URL absolutes quan hi ha domini; no s'ha provat amb un validador de xarxes perquè encara no hi ha URL pública.

## Pendent de l'Oriol
- [ ] Provar a un mòbil real: arrossegar i lliscar l'aparador, el mòbil viu, el menú i la demo; i amb una persona gran.
- [ ] Decidir si es vol mesurar l'ús (`docs/MESURA-US.md`): la recomanació és **no** de moment.
- [ ] La resta del que ja hi havia: formulari extern, xarxes i noms de l'equip, domini, frase del pilot, fotos o clip reals amb consentiment.
