# Contrast de la web (WCAG 2.1 AA)

Calculat per `tools/contrast-web.py` a partir dels tokens reals de `web/web.css`. Mínim: 4,5:1 text · 3:1 text gran i components.

## Clar

| Parell | Text | Fons | Ràtio | Mínim | |
|---|---|---|---|---|---|
| Text principal sobre el fons | `#241f19` | `#faf7f2` | **15.3:1** | 4.5:1 | ✅ |
| Text principal sobre superfície alterna | `#241f19` | `#f4efe7` | **14.3:1** | 4.5:1 | ✅ |
| Text suau sobre el fons | `#5a5146` | `#faf7f2` | **7.3:1** | 4.5:1 | ✅ |
| Text suau sobre superfície alterna | `#5a5146` | `#f4efe7` | **6.8:1** | 4.5:1 | ✅ |
| Text suau sobre targeta blanca | `#5a5146` | `#ffffff` | **7.8:1** | 4.5:1 | ✅ |
| Text suau sobre el fons del hero | `#5a5146` | `#e8f2ec` | **6.8:1** | 4.5:1 | ✅ |
| Títol sobre el fons del hero | `#241f19` | `#e8f2ec` | **14.3:1** | 4.5:1 | ✅ |
| Enllaç / marca fosca sobre el fons | `#1d6b40` | `#faf7f2` | **6.1:1** | 4.5:1 | ✅ |
| Enllaç sobre superfície alterna | `#1d6b40` | `#f4efe7` | **5.7:1** | 4.5:1 | ✅ |
| Marca molt fosca (logo) sobre el fons | `#134a2c` | `#faf7f2` | **9.6:1** | 4.5:1 | ✅ |
| Botó d'acció: text sobre ambre | `#2d1904` | `#f2a65a` | **8.3:1** | 4.5:1 | ✅ |
| Botó primari: text sobre verd | `#ffffff` | `#1d6b40` | **6.5:1** | 4.5:1 | ✅ |
| Botó secundari: text sobre el fons del hero | `#134a2c` | `#e8f2ec` | **9.0:1** | 4.5:1 | ✅ |
| Xip: text sobre verd suau | `#134a2c` | `#e1f0e7` | **8.7:1** | 4.5:1 | ✅ |
| Xip d'estat: text sobre ambre suau | `#8f4f0d` | `#fdecd6` | **5.5:1** | 4.5:1 | ✅ |
| Avís: text sobre blau suau | `#241f19` | `#e1eff9` | **13.9:1** | 4.5:1 | ✅ |
| CTA final: text sobre el fons verd | `#ffffff` | `#134a2c` | **10.3:1** | 4.5:1 | ✅ |
| CTA final: text suau sobre el fons verd | `#cfe6d7` | `#134a2c` | **7.8:1** | 4.5:1 | ✅ |
| CTA final: botó ambre sobre el fons verd (component) | `#f2a65a` | `#134a2c` | **5.1:1** | 3:1 | ✅ |
| Vora de camp de formulari sobre el fons (component) | `#8c806e` | `#faf7f2` | **3.6:1** | 3:1 | ✅ |
| Anell de focus sobre el fons (component) | `#1a4fd0` | `#faf7f2` | **6.4:1** | 3:1 | ✅ |
| Anell de focus sobre el verd final (component) | `#ffd166` | `#134a2c` | **7.1:1** | 3:1 | ✅ |

## Fosc

| Parell | Text | Fons | Ràtio | Mínim | |
|---|---|---|---|---|---|
| Text principal sobre el fons | `#f6f0e5` | `#15120e` | **16.5:1** | 4.5:1 | ✅ |
| Text principal sobre superfície alterna | `#f6f0e5` | `#2b261e` | **13.2:1** | 4.5:1 | ✅ |
| Text suau sobre el fons | `#c9bfae` | `#15120e` | **10.3:1** | 4.5:1 | ✅ |
| Text suau sobre superfície alterna | `#c9bfae` | `#2b261e` | **8.3:1** | 4.5:1 | ✅ |
| Text suau sobre targeta blanca | `#c9bfae` | `#201c16` | **9.3:1** | 4.5:1 | ✅ |
| Text suau sobre el fons del hero | `#c9bfae` | `#1a2a20` | **8.3:1** | 4.5:1 | ✅ |
| Títol sobre el fons del hero | `#f6f0e5` | `#1a2a20` | **13.3:1** | 4.5:1 | ✅ |
| Enllaç / marca fosca sobre el fons | `#5fcf8d` | `#15120e` | **9.6:1** | 4.5:1 | ✅ |
| Enllaç sobre superfície alterna | `#5fcf8d` | `#2b261e` | **7.7:1** | 4.5:1 | ✅ |
| Marca molt fosca (logo) sobre el fons | `#8fe0b0` | `#15120e` | **12.0:1** | 4.5:1 | ✅ |
| Botó d'acció: text sobre ambre | `#2d1904` | `#f5b86c` | **9.5:1** | 4.5:1 | ✅ |
| Botó primari: text sobre verd | `#0d1f15` | `#5fcf8d` | **8.8:1** | 4.5:1 | ✅ |
| Botó secundari: text sobre el fons del hero | `#8fe0b0` | `#1a2a20` | **9.6:1** | 4.5:1 | ✅ |
| Xip: text sobre verd suau | `#8fe0b0` | `#1f3a2b` | **7.9:1** | 4.5:1 | ✅ |
| Xip d'estat: text sobre ambre suau | `#f5b86c` | `#3b2c17` | **7.7:1** | 4.5:1 | ✅ |
| Avís: text sobre blau suau | `#f6f0e5` | `#1b3043` | **11.9:1** | 4.5:1 | ✅ |
| CTA final: text sobre el fons verd | `#f6f0e5` | `#0f2a1b` | **13.5:1** | 4.5:1 | ✅ |
| CTA final: text suau sobre el fons verd | `#b9d6c4` | `#0f2a1b` | **9.9:1** | 4.5:1 | ✅ |
| CTA final: botó ambre sobre el fons verd (component) | `#f5b86c` | `#0f2a1b` | **8.7:1** | 3:1 | ✅ |
| Vora de camp de formulari sobre el fons (component) | `#81776a` | `#15120e` | **4.3:1** | 3:1 | ✅ |
| Anell de focus sobre el fons (component) | `#ffd166` | `#15120e` | **12.9:1** | 3:1 | ✅ |
| Anell de focus sobre el verd final (component) | `#ffd166` | `#0f2a1b` | **10.7:1** | 3:1 | ✅ |

## Clar · alt contrast

| Parell | Text | Fons | Ràtio | Mínim | |
|---|---|---|---|---|---|
| Text principal sobre el fons | `#000` | `#faf7f2` | **19.7:1** | 4.5:1 | ✅ |
| Text principal sobre superfície alterna | `#000` | `#f4efe7` | **18.3:1** | 4.5:1 | ✅ |
| Text suau sobre el fons | `#1c1812` | `#faf7f2` | **16.5:1** | 4.5:1 | ✅ |
| Text suau sobre superfície alterna | `#1c1812` | `#f4efe7` | **15.4:1** | 4.5:1 | ✅ |
| Text suau sobre targeta blanca | `#1c1812` | `#ffffff` | **17.7:1** | 4.5:1 | ✅ |
| Text suau sobre el fons del hero | `#1c1812` | `#e8f2ec` | **15.4:1** | 4.5:1 | ✅ |
| Títol sobre el fons del hero | `#000` | `#e8f2ec` | **18.3:1** | 4.5:1 | ✅ |
| Enllaç / marca fosca sobre el fons | `#0f4a2a` | `#faf7f2` | **9.7:1** | 4.5:1 | ✅ |
| Enllaç sobre superfície alterna | `#0f4a2a` | `#f4efe7` | **9.0:1** | 4.5:1 | ✅ |
| Marca molt fosca (logo) sobre el fons | `#134a2c` | `#faf7f2` | **9.6:1** | 4.5:1 | ✅ |
| Botó d'acció: text sobre ambre | `#2d1904` | `#f2a65a` | **8.3:1** | 4.5:1 | ✅ |
| Botó primari: text sobre verd | `#ffffff` | `#0f4a2a` | **10.3:1** | 4.5:1 | ✅ |
| Botó secundari: text sobre el fons del hero | `#134a2c` | `#e8f2ec` | **9.0:1** | 4.5:1 | ✅ |
| Xip: text sobre verd suau | `#134a2c` | `#e1f0e7` | **8.7:1** | 4.5:1 | ✅ |
| Xip d'estat: text sobre ambre suau | `#6b3a05` | `#fdecd6` | **8.1:1** | 4.5:1 | ✅ |
| Avís: text sobre blau suau | `#000` | `#e1eff9` | **17.9:1** | 4.5:1 | ✅ |
| CTA final: text sobre el fons verd | `#ffffff` | `#134a2c` | **10.3:1** | 4.5:1 | ✅ |
| CTA final: text suau sobre el fons verd | `#cfe6d7` | `#134a2c` | **7.8:1** | 4.5:1 | ✅ |
| CTA final: botó ambre sobre el fons verd (component) | `#f2a65a` | `#134a2c` | **5.1:1** | 3:1 | ✅ |
| Vora de camp de formulari sobre el fons (component) | `#1c1812` | `#faf7f2` | **16.5:1** | 3:1 | ✅ |
| Anell de focus sobre el fons (component) | `#1a4fd0` | `#faf7f2` | **6.4:1** | 3:1 | ✅ |
| Anell de focus sobre el verd final (component) | `#ffd166` | `#134a2c` | **7.1:1** | 3:1 | ✅ |

## Fosc · alt contrast

| Parell | Text | Fons | Ràtio | Mínim | |
|---|---|---|---|---|---|
| Text principal sobre el fons | `#fff` | `#15120e` | **18.7:1** | 4.5:1 | ✅ |
| Text principal sobre superfície alterna | `#fff` | `#2b261e` | **15.0:1** | 4.5:1 | ✅ |
| Text suau sobre el fons | `#f1ebdf` | `#15120e` | **15.7:1** | 4.5:1 | ✅ |
| Text suau sobre superfície alterna | `#f1ebdf` | `#2b261e` | **12.6:1** | 4.5:1 | ✅ |
| Text suau sobre targeta blanca | `#f1ebdf` | `#201c16` | **14.3:1** | 4.5:1 | ✅ |
| Text suau sobre el fons del hero | `#f1ebdf` | `#1a2a20` | **12.7:1** | 4.5:1 | ✅ |
| Títol sobre el fons del hero | `#fff` | `#1a2a20` | **15.0:1** | 4.5:1 | ✅ |
| Enllaç / marca fosca sobre el fons | `#5fcf8d` | `#15120e` | **9.6:1** | 4.5:1 | ✅ |
| Enllaç sobre superfície alterna | `#5fcf8d` | `#2b261e` | **7.7:1** | 4.5:1 | ✅ |
| Marca molt fosca (logo) sobre el fons | `#8fe0b0` | `#15120e` | **12.0:1** | 4.5:1 | ✅ |
| Botó d'acció: text sobre ambre | `#2d1904` | `#f5b86c` | **9.5:1** | 4.5:1 | ✅ |
| Botó primari: text sobre verd | `#0d1f15` | `#5fcf8d` | **8.8:1** | 4.5:1 | ✅ |
| Botó secundari: text sobre el fons del hero | `#8fe0b0` | `#1a2a20` | **9.6:1** | 4.5:1 | ✅ |
| Xip: text sobre verd suau | `#8fe0b0` | `#1f3a2b` | **7.9:1** | 4.5:1 | ✅ |
| Xip d'estat: text sobre ambre suau | `#f5b86c` | `#3b2c17` | **7.7:1** | 4.5:1 | ✅ |
| Avís: text sobre blau suau | `#fff` | `#1b3043` | **13.5:1** | 4.5:1 | ✅ |
| CTA final: text sobre el fons verd | `#f6f0e5` | `#0f2a1b` | **13.5:1** | 4.5:1 | ✅ |
| CTA final: text suau sobre el fons verd | `#b9d6c4` | `#0f2a1b` | **9.9:1** | 4.5:1 | ✅ |
| CTA final: botó ambre sobre el fons verd (component) | `#f5b86c` | `#0f2a1b` | **8.7:1** | 3:1 | ✅ |
| Vora de camp de formulari sobre el fons (component) | `#fff` | `#15120e` | **18.7:1** | 3:1 | ✅ |
| Anell de focus sobre el fons (component) | `#ffd166` | `#15120e` | **12.9:1** | 3:1 | ✅ |
| Anell de focus sobre el verd final (component) | `#ffd166` | `#0f2a1b` | **10.7:1** | 3:1 | ✅ |

**Parells que no arriben a AA: 0**
