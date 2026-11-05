'use strict';
// ==========================================================
//  TEMA DE LA SETMANA (v2.0): contingut que es renova sol (S04, S07: «que no se'n cansin»)
//  Cada setmana La Tertúlia en destaca un tema: 3 de les preguntes de cada partida en són. Cada 6 setmanes torna a començar.
//  Format: [pregunta, resposta correcta, falsa, falsa]. Per afegir-ne, només cal escriure'n més aquí i a continguts.es.js.
// ==========================================================
const TEMES_TERTULIA_CA = [
  { nom: 'la cuina', q: [
    ["Quin és l'ingredient principal de l'allioli?", 'All', 'Ceba', 'Tomàquet'],
    ['Què es posa al pa amb tomàquet, a més de pa i tomàquet?', 'Oli i sal', 'Mantega i sucre', 'Llet i mel'],
    ['Quin plat porta arròs i pot ser de marisc o de muntanya?', 'Paella', 'Escudella', 'Truita'],
    ['Què és la crema catalana?', 'Unes postres', 'Una sopa', 'Una salsa per a la carn'],
    ['Quin ingredient fa pujar la massa del pa?', 'El llevat', 'La sal', "L'oli"],
    ['Amb quin fruit sec es fa el torró de Xixona?', 'Ametlla', 'Nou', 'Avellana'],
    ['Quin dolç amb pinyons és típic de la Castanyada?', 'Panellets', 'Bunyols', 'Coca'],
    ['Què es menja per Nadal a Catalunya, amb galets?', 'Escudella', 'Gaspatxo', 'Paella']
  ] },
  { nom: 'la música', q: [
    ['Quin ball tradicional català es balla en rotllana?', 'Sardana', 'Jota', 'Vals'],
    ['Quin conjunt musical acompanya la sardana?', 'La cobla', 'La coral', "L'orquestra simfònica"],
    ['De quin país és originari el tango?', 'Argentina', 'Espanya', 'Cuba'],
    ['Qui cantava «Paraules d\'amor»?', 'Joan Manuel Serrat', 'Lluís Llach', 'Raimon'],
    ['Qui cantava «L\'estaca»?', 'Lluís Llach', 'Joan Manuel Serrat', 'Raimon'],
    ['Quantes cordes té una guitarra espanyola?', '6', '4', '12'],
    ['Qui va compondre «Les quatre estacions»?', 'Vivaldi', 'Bach', 'Chopin'],
    ['Quin gènere cantava Montserrat Caballé?', 'Òpera', 'Flamenc', 'Rumba']
  ] },
  { nom: 'el cinema i la tele', q: [
    ['En quina pel·lícula surt Escarlata O\'Hara?', "Allò que el vent s'endugué", 'Casablanca', 'Ben-Hur'],
    ['Quin actor feia de Charlot?', 'Charles Chaplin', 'Buster Keaton', 'Groucho Marx'],
    ['Com es coneixia Gaby, Fofó i Miliki?', 'Els pallassos de la tele', 'Els germans Marx', 'Els tres tenors'],
    ['Com es diu el ratolí de Walt Disney?', 'Mickey', 'Tom', 'Speedy'],
    ['Qui va dirigir «Psicosi»?', 'Alfred Hitchcock', 'Steven Spielberg', 'Luis Buñuel'],
    ['En quin país passa la pel·lícula «Casablanca»?', 'Marroc', 'Egipte', 'Algèria'],
    ['Qui protagonitzava «Vacances a Roma»?', 'Audrey Hepburn', 'Marilyn Monroe', 'Sophia Loren'],
    ['Qui va dirigir «Tot sobre la meva mare»?', 'Pedro Almodóvar', 'Luis Buñuel', 'Carlos Saura']
  ] },
  { nom: 'els llocs', q: [
    ['Quina és la muntanya més alta de Catalunya?', "Pica d'Estats", 'Montseny', 'Tibidabo'],
    ['Quin riu passa per Saragossa i per Tortosa?', 'Ebre', 'Tajo', 'Segre'],
    ['Quin riu travessa París?', 'Sena', 'Danubi', 'Tàmesi'],
    ['En quina ciutat hi ha la torre Eiffel?', 'París', 'Londres', 'Berlín'],
    ['En quin continent és Egipte?', 'Àfrica', 'Àsia', 'Europa'],
    ['Quina és l\'illa més gran de les Balears?', 'Mallorca', 'Menorca', 'Eivissa'],
    ['Quin mar banya Barcelona?', 'Mediterrani', 'Cantàbric', 'Bàltic'],
    ['A quina província és Tossa de Mar?', 'Girona', 'Lleida', 'Tarragona']
  ] },
  { nom: 'les festes', q: [
    ['Quin dia es regalen llibres i roses a Catalunya?', 'Sant Jordi', 'Sant Joan', 'La Mercè'],
    ['Què s\'encén la nit de Sant Joan?', 'Fogueres', 'Pessebres', 'Espelmes de Nadal'],
    ['Quants són els Reis d\'Orient?', '3', '2', '4'],
    ['Què es fa cagar per Nadal?', 'El tió', 'La mona', 'El pessebre'],
    ['Quin dolç regala el padrí per Pasqua?', 'La mona', 'El tortell', 'El panellet'],
    ['Quina ciutat celebra les festes de la Mercè?', 'Barcelona', 'Girona', 'Lleida'],
    ['Quin dia és Nadal?', '25 de desembre', '6 de gener', '1 de novembre'],
    ['Què es menja a la Castanyada, a més de panellets?', 'Castanyes', 'Torró', 'Mona']
  ] },
  { nom: 'la història', q: [
    ["Quin país va regalar l'Estàtua de la Llibertat als Estats Units?", 'França', 'Anglaterra', 'Itàlia'],
    ['Qui va pintar la volta de la Capella Sixtina?', 'Miquel Àngel', 'Leonardo da Vinci', 'Rafael'],
    ['Quin vaixell es va enfonsar el 1912?', 'Titanic', 'Lusitania', 'Queen Mary'],
    ['Qui va ser el primer a trepitjar la Lluna?', 'Neil Armstrong', 'Iuri Gagarin', 'Buzz Aldrin'],
    ['Quin arquitecte va fer la Pedrera?', 'Gaudí', 'Domènech i Montaner', 'Puig i Cadafalch'],
    ['Quina moneda hi havia a Espanya abans de l\'euro?', 'La pesseta', 'El franc', 'La lira'],
    ['Qui va escriure «El Quixot»?', 'Cervantes', 'Lope de Vega', 'Quevedo'],
    ['Quina científica va guanyar dos premis Nobel?', 'Marie Curie', 'Rosalind Franklin', 'Ada Lovelace']
  ] }
];
const temesTertulia = () => bancIdioma('tertuliaTemes', TEMES_TERTULIA_CA);
// Canvia cada dilluns. Es calcula amb el calendari local perquè sigui igual tota la setmana.
function temaSetmana(data = new Date()) {
  const dies = Math.floor((Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) - Date.UTC(2024, 0, 1)) / 86400000), t = temesTertulia();
  return { i: ((Math.floor(dies / 7) % t.length) + t.length) % t.length, tema: t[((Math.floor(dies / 7) % t.length) + t.length) % t.length] };
}
function preguntesDelTema(n) {
  const { i, tema } = temaSetmana();
  return trianSenseRepetir(idiomaBanc('tertuliaTema' + i), tema.q.map(([q, ...o]) => ({ q, o, c: 0 })), n);
}
