"use strict";
/**
 * Banco de preguntas de KMS Movies.
 * Vive solo en el servidor: los jugadores nunca reciben las respuestas correctas
 * hasta que termina la pregunta.
 *
 * Tipos:
 *   mc      opción múltiple (2-4 opciones de texto)
 *   img     una imagen como pregunta + opciones de texto
 *   imgopt  opciones que son imágenes
 *   tf      verdadero/falso (el jugador desliza una tarjeta)
 *   multi   selección múltiple
 *   type    respuesta escrita
 *   slider  deslizador numérico con tolerancia
 *   order   ordenar arrastrando
 *   match   emparejar columnas
 */
const FILMS = {
  poeta:    { name: "El Poeta",           sub: "Colombia · 2025",         color: "#ff3b8d", img: "/img/poeta.jpg" },
  contador: { name: "El Contador",        sub: "Ben Affleck · 2016",      color: "#22d3ee", img: "/img/contador.jpg" },
  tropic:   { name: "Tropic Thunder",     sub: "Dir. Ben Stiller · 2008", color: "#7cf24a", img: "/img/tropic.jpg" },
  mix:      { name: "Ronda mixta",        sub: "Las tres películas",      color: "#ffc21a", img: "/img/poeta.jpg" }
};

const BANK = [
  { id: "p1", film: "poeta", type: "mc", text: "¿Quién dirige “Un poeta”?", opts: ["Víctor Gaviria", "Simón Mesa Soto", "Ciro Guerra", "Laura Mora"], c: 1, dur: 20, quick: 1, expl: "Simón Mesa Soto, también director de “Amparo” y “Leidi”." },
  { id: "c1", film: "contador", type: "mc", text: "¿Quién dirige “El contador” (2016)?", opts: ["Doug Liman", "David Fincher", "Gavin O’Connor", "Michael Mann"], c: 2, dur: 20, expl: "Gavin O’Connor dirigió la película y también su secuela de 2025." },
  { id: "t1", film: "tropic", type: "mc", text: "¿Quién dirige Tropic Thunder?", opts: ["Ben Stiller", "Judd Apatow", "Todd Phillips", "Adam McKay"], c: 0, dur: 20, expl: "Ben Stiller la dirige, la protagoniza y participó en el guion." },

  { id: "i1", film: "mix", type: "img", img: "/img/contador.jpg", text: "¿De qué película es esta escena?", opts: ["El Poeta", "El Contador", "Tropic Thunder"], c: 1, dur: 15, quick: 1, expl: "Escritorio, calculadora y suspenso: es El Contador." },
  { id: "p2", film: "poeta", type: "tf", text: "“Un poeta” se presentó en el Festival de Cannes de 2025.", c: true, dur: 15, expl: "Verdadero. Compitió en Un Certain Regard y ganó el Premio Especial del Jurado." },
  { id: "c3", film: "contador", type: "tf", text: "Christian Wolff es un contador con autismo de alto funcionamiento.", c: true, dur: 15, quick: 1, expl: "Verdadero. Su condición es clave en su talento con los números." },
  { id: "t3", film: "tropic", type: "tf", text: "Tom Cruise interpreta a Les Grossman, un ejecutivo de estudio de muy mal carácter que baila hip-hop.", c: true, dur: 15, quick: 1, expl: "Verdadero. Es uno de los cameos más recordados de la película." },

  { id: "p3", film: "poeta", type: "mc", text: "¿En qué ciudad colombiana transcurre la historia de “Un poeta”?", opts: ["Bogotá", "Cali", "Medellín", "Cartagena"], c: 2, dur: 20, expl: "Medellín es el escenario de la historia del poeta Óscar." },
  { id: "c4", film: "contador", type: "mc", text: "¿Quién interpreta a Braxton, el hermano de Christian Wolff?", opts: ["J.K. Simmons", "Jon Bernthal", "John Lithgow", "Jeffrey Tambor"], c: 1, dur: 20, quick: 1, expl: "Jon Bernthal. J.K. Simmons es Ray King, el director del Tesoro." },
  { id: "t7", film: "tropic", type: "mc", text: "El grupo de actores rueda una película bélica. ¿Sobre qué guerra?", opts: ["Guerra de Vietnam", "Guerra de Corea", "Guerra del Golfo", "Segunda Guerra Mundial"], c: 0, dur: 20, expl: "La película dentro de la película adapta unas memorias de Vietnam." },

  { id: "m1", film: "mix", type: "match", text: "Empareja a cada director con su película.", pairs: [["Simón Mesa Soto", "Un poeta"], ["Gavin O’Connor", "El contador"], ["Ben Stiller", "Tropic Thunder"]], dur: 30, quick: 1, expl: "Mesa Soto, O’Connor y Stiller." },

  { id: "p4", film: "poeta", type: "type", text: "Escribe el nombre del actor que interpreta al poeta protagonista.", ans: ["ubeimar rios", "ubeimar", "rios"], ctext: "Ubeimar Ríos", dur: 30, expl: "Ubeimar Ríos encabeza el reparto de “Un poeta”." },
  { id: "c2", film: "contador", type: "type", text: "¿Cómo se llama el personaje que interpreta Ben Affleck?", ans: ["christian wolff", "wolff", "christian"], ctext: "Christian Wolff", dur: 30, quick: 1, expl: "Christian Wolff, contador de día y experto en cuentas turbias de noche." },
  { id: "t5", film: "tropic", type: "type", text: "¿Cómo se llama el actor de acción en decadencia que interpreta Ben Stiller?", ans: ["tugg speedman", "tugg", "speedman"], ctext: "Tugg Speedman", dur: 30, expl: "Tugg Speedman, famoso por la saga “Scorcher” y por el fracaso de “Simple Jack”." },

  { id: "p5", film: "poeta", type: "slider", text: "¿En qué año ganó Simón Mesa Soto la Palma de Oro al mejor cortometraje con “Leidi”?", min: 2005, max: 2025, step: 1, ans: 2014, tol: 6, dur: 25, quick: 1, expl: "Fue en 2014, en el Festival de Cannes." },
  { id: "t6", film: "tropic", type: "slider", text: "¿En qué año se estrenó Tropic Thunder?", min: 2000, max: 2020, step: 1, ans: 2008, tol: 5, dur: 25, expl: "Se estrenó en 2008." },

  { id: "i2", film: "mix", type: "imgopt", text: "¿Cuál de estas imágenes es de Tropic Thunder?", imgs: ["/img/poeta.jpg", "/img/contador.jpg", "/img/tropic.jpg"], alts: ["Ciudad de noche con libreta y máquina de escribir", "Escritorio con calculadora y maletín", "Set de rodaje en la selva con explosión"], c: 2, dur: 15, expl: "Selva, cámara de cine y explosión: Tropic Thunder." },
  { id: "c5", film: "contador", type: "mc", text: "¿Qué actriz interpreta a Dana Cummings, la contadora de Living Robotics?", opts: ["Emma Stone", "Amy Adams", "Anna Kendrick", "Brie Larson"], c: 2, dur: 20, expl: "Anna Kendrick. John Lithgow interpreta al fundador de Living Robotics." },

  { id: "m2", film: "contador", type: "match", text: "Empareja a cada actor con su personaje en El Contador.", pairs: [["Ben Affleck", "Christian Wolff"], ["Anna Kendrick", "Dana Cummings"], ["Jon Bernthal", "Braxton"], ["J.K. Simmons", "Ray King"]], dur: 35, expl: "Wolff, Cummings, Braxton y King." },
  { id: "p6", film: "poeta", type: "multi", text: "Selecciona TODAS las obras dirigidas por Simón Mesa Soto.", opts: ["Amparo", "Leidi", "Un poeta", "La vendedora de rosas", "Los colores de la montaña"], c: [0, 1, 2], dur: 25, expl: "“La vendedora de rosas” es de Víctor Gaviria y “Los colores de la montaña” de Carlos César Arbeláez." },
  { id: "t4", film: "tropic", type: "multi", text: "Selecciona TODOS los actores que aparecen en Tropic Thunder.", opts: ["Jack Black", "Nick Nolte", "Matthew McConaughey", "Will Ferrell", "Adam Sandler"], c: [0, 1, 2], dur: 25, quick: 1, expl: "Black, Nolte y McConaughey están en el reparto. Ferrell y Sandler no." },
  { id: "t2", film: "tropic", type: "mc", text: "¿Quién interpreta a Kirk Lazarus, el actor australiano que se oscurece la piel para su papel?", opts: ["Jack Black", "Robert Downey Jr.", "Matthew McConaughey", "Nick Nolte"], c: 1, dur: 25, quick: 1, expl: "Robert Downey Jr. fue nominado al Óscar a mejor actor de reparto." },

  { id: "m3", film: "tropic", type: "match", text: "Empareja a cada actor con su personaje en Tropic Thunder.", pairs: [["Robert Downey Jr.", "Kirk Lazarus"], ["Jack Black", "Jeff Portnoy"], ["Tom Cruise", "Les Grossman"], ["Ben Stiller", "Tugg Speedman"]], dur: 35, expl: "Lazarus, Portnoy, Grossman y Speedman." },
  { id: "c6", film: "mix", type: "order", text: "Ordena de la más antigua a la más reciente.", items: ["Tropic Thunder (2008)", "Leidi (2014)", "El contador (2016)", "Un poeta (2025)"], dur: 30, quick: 1, expl: "2008, 2014, 2016 y 2025." },
  { id: "i3", film: "mix", type: "img", img: "/img/poeta.jpg", text: "Última escena: ¿de qué película es?", opts: ["El Poeta", "El Contador", "Tropic Thunder"], c: 0, dur: 15, expl: "Medellín de noche, poemas y máquina de escribir: El Poeta." }
];

/** Orden por defecto: un bloque por película (con presentación animada) y una ronda mixta al final. */
const ORDER = [
  // Bloque El Poeta
  "p1", "p2", "p3", "p4", "p5", "p6",
  // Bloque El Contador
  "c1", "c3", "c4", "c2", "c5", "m2",
  // Bloque Tropic Thunder
  "t1", "t3", "t7", "t5", "t6", "t4", "t2", "m3",
  // Ronda mixta final
  "i1", "i2", "m1", "c6", "i3"
];

module.exports = { FILMS, BANK, ORDER };
