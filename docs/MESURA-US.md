# Proposta: mesurar si algú arriba a «17 jocs» (sense instal·lar res)

**Estat:** només una proposta. **No s'ha instal·lat cap analítica** a la 1.9.3 i no se'n posarà sense una decisió de l'Oriol (RGPD, públic gran i, a més, la web diu que no té cookies ni seguiment).

## Què es voldria saber
Si els visitants arriben a l'aparador («17 jocs»), si el fan servir (fletxes, arrossegar) i si premen «Prova l'app» o «Demana una demo».

## Opcions, de menys a més intrusiva
1. **Cap mesura (recomanat de moment).** Fer el «test de la mare» (`docs/PROVA-WEB-5-SEGONS.md`) amb 5–10 persones i mirar-los mentre naveguen. Sense dades, sense consentiment, i s'aprèn més.
2. **Comptadors del servidor, sense cookies ni identificadors** (p. ex. els registres d'accés del hosting, o una eina que només compti pàgines vistes agregades). No identifica ningú, però només dona visites per pàgina, no si algú arriba al «17 jocs».
3. **Esdeveniments agregats sense identificadors** (una eina respectuosa amb la privadesa, autoallotjada o europea, sense cookies). Requeriria: actualitzar `legal/privadesa.html` i `legal/cookies.html`, afegir l'origen a la CSP (`connect-src`/`script-src`) i decidir quin esdeveniment es compta (només «ha arribat a l'aparador» i «ha premut Prova l'app»).

## Condicions que posaria
- Decisió **per escrit** de l'Oriol i de l'equip.
- Cap dada personal, cap identificador, cap tercer que rebi IP completes.
- Es diu a la política de privadesa abans d'activar-ho.
- Que no empitjori el rendiment (Lighthouse) ni la CSP (`connect-src 'self'` actual).
