'use strict';
// ==========================================================
//  TROBA L'INTRÚS (abans «Digues paraules»; l'id es manté perquè l'historial no es perdi)
//  «Quina paraula NO és un animal?»: una llista de paraules d'una categoria i una que no hi pertany.
//  Fàcil: 3 paraules i un intrús molt diferent. Mig: 4. Difícil: 5 i intrús de la mateixa família (fruita enmig de verdures).
//  Sense paraules dobles: res que pugui ser de dues categories (taronja, rosa, tomàquet…).
// ==========================================================
const CATEGORIES_INTRUS = [
  { q: 'un animal', g: 'viu', els: ['Gos', 'Gat', 'Vaca', 'Cavall', 'Ovella', 'Conill', 'Elefant', 'Lleó', 'Tortuga', 'Porc', 'Gallina', 'Ànec', 'Ós', 'Mico', 'Cabra'] },
  { q: 'una flor', g: 'viu', els: ['Clavell', 'Margarida', 'Tulipa', 'Gira-sol', 'Gessamí', 'Orquídia', 'Lliri'] },
  { q: 'una fruita', g: 'menjar', els: ['Poma', 'Pera', 'Plàtan', 'Maduixa', 'Cirera', 'Raïm', 'Meló', 'Síndria', 'Préssec', 'Llimona', 'Figa'] },
  { q: 'una verdura', g: 'menjar', els: ['Ceba', 'Enciam', 'Pastanaga', 'Patata', 'Col', 'Espinacs', 'Carbassa', 'Pebrot', 'Mongeta', 'All', 'Albergínia', 'Coliflor'] },
  { q: 'una beguda', g: 'menjar', els: ['Aigua', 'Cafè', 'Llet', 'Vi', 'Te', 'Cervesa', 'Suc', 'Xocolata desfeta'] },
  { q: 'un color', g: 'idea', els: ['Vermell', 'Blau', 'Groc', 'Verd', 'Negre', 'Blanc', 'Lila', 'Marró', 'Gris'] },
  { q: 'un ofici', g: 'gent', els: ['Metge', 'Mestre', 'Forner', 'Bomber', 'Pagès', 'Fuster', 'Pescador', 'Infermera', 'Cuiner', 'Paleta', 'Carter', 'Sabater'] },
  { q: 'una part del cos', g: 'cos', els: ['Mà', 'Peu', 'Cap', 'Braç', 'Cama', 'Nas', 'Orella', 'Genoll', 'Colze', 'Espatlla', 'Dit', 'Ull'] },
  { q: 'una peça de roba', g: 'casa', els: ['Camisa', 'Jersei', 'Mitjons', 'Pantalons', 'Abric', 'Bufanda', 'Faldilla', 'Barret', 'Guants', 'Sabates'] },
  { q: 'un moble', g: 'casa', els: ['Taula', 'Cadira', 'Llit', 'Armari', 'Sofà', 'Prestatgeria', 'Tauleta', 'Calaixera'] },
  { q: 'un estri de cuina', g: 'casa', els: ['Forquilla', 'Cullera', 'Ganivet', 'Olla', 'Paella', 'Plat', 'Got', 'Cassola', 'Tassa'] },
  { q: 'una eina', g: 'casa', els: ['Martell', 'Serra', 'Tenalles', 'Tornavís', 'Pala', 'Clau anglesa', 'Trepant', 'Falç'] },
  { q: 'un instrument musical', g: 'idea', els: ['Piano', 'Guitarra', 'Violí', 'Flauta', 'Tambor', 'Acordió', 'Trompeta', 'Arpa'] },
  { q: 'un mitjà de transport', g: 'lloc', els: ['Tren', 'Avió', 'Bicicleta', 'Cotxe', 'Autobús', 'Vaixell', 'Moto', 'Metro', 'Taxi'] },
  { q: 'un país', g: 'lloc', els: ['Itàlia', 'França', 'Japó', 'Mèxic', 'Portugal', 'Alemanya', 'Grècia', 'Marroc', 'Argentina'] },
  { q: 'una ciutat', g: 'lloc', els: ['Barcelona', 'París', 'Roma', 'Girona', 'Londres', 'Tarragona', 'Lleida', 'Madrid', 'Lisboa'] }
];
const TEXTOS_INTRUS = () => (I18N.llengua === 'es'
  ? { pregunta: q => `¿Qué palabra NO es ${q}?`, expl: (x, qx, q) => `«${x}» es ${qx}, no ${q}.` }
  : { pregunta: q => `Quina paraula NO és ${q}?`, expl: (x, qx, q) => `«${x}» és ${qx}, no ${q}.` });

function fluidesaGenerar(nivell = 'facil', cat) {
  const banc = bancIdioma('fluidesa', CATEGORIES_INTRUS), c = cat || aleatori(banc);
  const n = nivell === 'facil' ? 2 : nivell === 'mig' ? 3 : 4;
  const pool = nivell === 'dificil' ? banc.filter(x => x !== c && x.g === c.g) : banc.filter(x => x !== c && x.g !== c.g);
  const altra = aleatori(pool.length ? pool : banc.filter(x => x !== c)), intrus = aleatori(altra.els);
  const bones = barreja(c.els).slice(0, n), { o, c: idx } = opcionsBarrejades(intrus, bones), tx = TEXTOS_INTRUS();
  return { q: tx.pregunta(c.q), o, c: idx, expl: tx.expl(intrus, altra.q, c.q), err: tx.pregunta(c.q), h1: 'Llegeix totes les paraules i pensa en quin grup va cadascuna.', cat: c.q, intrus };
}

crearQuiz({
  id: 'fluidesa',
  pista: { mode: 'descarta' },
  nivells: { titol: 'Troba l\'intrús', subtitol: 'Tria la dificultat', descripcions: ['3 paraules molt diferents', '4 paraules', '5 paraules, més semblants'] },
  tutorial: { titol: 'Troba l\'intrús', cos: '<p>Et preguntarem, per exemple: <strong>«Quina paraula NO és un animal?»</strong></p><div class="exemple"><span style="width:auto;padding:0 .5rem;font-size:1rem">Gos</span><span style="width:auto;padding:0 .5rem;font-size:1rem">Cadira</span><span style="width:auto;padding:0 .5rem;font-size:1rem">Gat</span></div><p>Toca la que no hi encaixa: aquí, la <strong>cadira</strong>. Quan falles, t\'expliquem per què.</p>' },
  preparar: (dos, nivell) => { const cs = barreja(bancIdioma('fluidesa', CATEGORIES_INTRUS)); return Array.from({ length: 10 }, (_, i) => fluidesaGenerar(nivell, cs[i % cs.length])); }
});
