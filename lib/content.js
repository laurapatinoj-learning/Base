// Contenido editorial base. Se carga en la base de datos solo la primera vez; luego se edita desde el CMS.
export const SRC = 'Almonacid Sierra, J. J. (2025). «El enigmático hueso de Ishango: ¿secreto ancestral de números primos gemelos?». Periódico UNAL, 20 de agosto de 2025.';
export const SRC_URL = 'https://periodico.unal.edu.co/articulos/el-enigmatico-hueso-de-ishango-secreto-ancestral-de-numeros-primos-gemelos';

// Lectura convencional de la tabla de Ishango (De Heinzelin, 1957): grupos de muescas por columna.
export const ISHANGO = {
  M: { name: 'Central (M)', groups: [3, 6, 4, 8, 10, 5, 5, 7] },
  G: { name: 'Izquierda (G)', groups: [11, 13, 17, 19] },
  D: { name: 'Derecha (D)', groups: [11, 21, 19, 9] },
};

export const fichas = [
  { slug: 'el-artefacto-de-ishango', ord: 1, kind: 'Ficha 01 · Objeto', year: 1950, title: 'El artefacto: un peroné con 168 marcas', subtitle: 'Hallazgo, contexto y conservación',
    summary: 'En 1950, en la actual República Democrática del Congo, Jean de Heinzelin descubrió un peroné de babuino fosilizado con más de 20.000 años y 168 líneas talladas.',
    tags: 'Ishango, arqueología, RD Congo, De Heinzelin',
    body: `## El hallazgo\n\nEn 1950, en la actual República Democrática del Congo, el geólogo belga **Jean de Heinzelin** descubrió un artefacto que sigue desconcertando a antropólogos y matemáticos: un **peroné de babuino fosilizado** con más de **20.000 años** de antigüedad.\n\nLa pieza presenta **168 líneas** finamente talladas, reunidas en **16 grupos** y distribuidas en **3 columnas**. Su nombre —hueso de Ishango— procede del lugar donde fue encontrado.\n\n## ¿Herramienta o registro?\n\nA primera vista pudo parecer un simple instrumento de conteo primitivo. Sin embargo, la disposición de las marcas sugiere una intención: la posición, las relaciones y la complejidad de los grupos no son comparables con las de ninguna otra tablilla conocida.\n\n## Dónde verlo\n\nHoy el hueso se conserva y puede contemplarse en el **Museo Real de Ciencias Naturales de Bélgica**, en Bruselas.\n\n## Para leer a continuación\n\nLa ficha 02 describe las tres columnas y sus sumas; la 03 se ocupa de los números primos que aparecen en ellas.` },
  { slug: 'tres-columnas-dieciseis-numeros', ord: 2, kind: 'Ficha 02 · Lectura', year: 1957, title: 'Tres columnas, dieciséis números', subtitle: 'La tabla y sus relaciones internas',
    summary: 'Siete años después del hallazgo, De Heinzelin propuso que los grupos de muescas representan números y que sus relaciones no son casuales.',
    tags: 'tabla, columnas, suma 60, De Heinzelin',
    body: `## La hipótesis de 1957\n\nSiete años después del hallazgo, De Heinzelin planteó que los grupos de líneas representan **números**. Para él, las relaciones internas convierten la tabla en un juego en el que nunca se está seguro de haber agotado todas las combinaciones: duplicación de números, productos iguales a sumas, sumas iguales a números primos, sumas de columnas iguales a 60, etc.\n\n## Los números de cada columna\n\n- **Columna central (M):** 3, 6, 4, 8, 10, 5, 5, 7 — suma 48.\n- **Columna izquierda (G):** 11, 13, 17, 19 — suma 60.\n- **Columna derecha (D):** 11, 21, 19, 9 — suma 60.\n\nEn total: 48 + 60 + 60 = **168** marcas en **16** grupos.\n\n## Una simetría llamativa\n\nLas columnas izquierda y derecha suman lo mismo (60 = 5 × 12). Esa coincidencia es una de las razones por las que se ha leído la tabla como algo más que una cuenta.\n\n> Pruébalo tú mismo en el **explorador interactivo** del [Archivo principal](/archivo#explorador).` },
  { slug: 'primos-gemelos-en-el-hueso', ord: 3, kind: 'Ficha 03 · Análisis', year: 2025, title: 'Primos gemelos en el hueso', subtitle: '10 de 16 números son primos',
    summary: 'Un nuevo examen señala que 10 de los 16 números de la tabla (62 %) son primos y que aparecen parejas de primos gemelos: (3,5), (5,7), (11,13) y (17,19).',
    tags: 'primos, primos gemelos, patrón, Almonacid',
    body: `## Qué es un primo\n\nLos números primos son los mayores que 1 que solo se dividen por sí mismos y por 1: 2, 3, 5, 7, 11, 13, 17, 19… Son los «átomos» a partir de los cuales se construyen los demás enteros, y sustentan la criptografía moderna.\n\n## Lo que encuentra el análisis\n\nSegún el nuevo examen de Almonacid Sierra, **10 de los 16 números** de la tabla (un **62 %**) son primos, hecho que refuerza la existencia de un patrón intencional.\n\nAdemás aparecen **primos gemelos** —pares que difieren en 2, de la forma (p, p+2)—:\n\n- en la columna central: **(3, 5)** y **(5, 7)**;\n- en la columna izquierda: **(11, 13)** y **(17, 19)**.\n\n## Con cautela\n\nDécadas antes, Marshack, Huylebrouck y Pletser respaldaron la idea de un sistema de notación numérica, pero concluyeron que **no había pruebas suficientes** para afirmar una comprensión de los números primos. La ficha 05 recoge ese debate.` },
  { slug: 'numeros-empedocles-e-ishango-60', ord: 4, kind: 'Ficha 04 · Concepto', year: 2025, title: 'Números Empédocles e Ishango 60', subtitle: 'Dos estructuras que se replican',
    summary: 'El análisis de las sumas simétricas (60) introduce los números Empédocles n(e) y Ishango n(i), con un sexteto mixto de primos e impares.',
    tags: 'Empédocles, simetría, geometría, triángulo',
    body: `## Nuevos términos\n\nEl estudio de las sumas simétricas de 60 en las columnas derecha e izquierda permitió introducir nuevos términos y relaciones:\n\n- **Número Empédocles n(e):** se define el 60 como el primer n(e), resultante de la suma de dos pares de primos gemelos horizontales (pppp).\n- **Relación entre 60 n(e) y 60 n(i):** en ambas columnas se forman pares que suman la mitad de 60, y los cuatro primos del 60 n(e) se encuentran entre los dos impares del 60 n(i), formando un **sexteto mixto (ippppi)**.\n\n## Geometría\n\nLa representación en el plano cartesiano muestra la simetría de estas relaciones. El análisis aritmético y geométrico identifica una estructura que se replica y da cuenta de un **triángulo rectángulo isósceles** a diferentes escalas.\n\n## Por qué importa\n\nSegún el autor, esta lectura puede servir para comenzar a descifrar enigmas de los primos, como la forma en que están distribuidos y la distancia entre ellos.` },
  { slug: '168-pi-de-mil', ord: 5, kind: 'Ficha 05 · Debate', year: 2025, title: '168 = π(1000): ¿coincidencia?', subtitle: 'Entre la evidencia y la cautela',
    summary: 'El total de marcas coincide con la cantidad de primos menores que 1.000. El artículo lo plantea como pregunta abierta, no como prueba.',
    tags: 'π(1000), debate, método, evidencia',
    body: `## Una coincidencia numérica\n\nEl número total de marcas, **168**, coincide exactamente con π(1.000): la cantidad de números primos menores que 1.000. El artículo se pregunta: *¿coincidencia u otra evidencia de un conocimiento adelantado a su tiempo?*\n\n## Cómo leerlo en el aula\n\nUn buen ejercicio de pensamiento matemático es distinguir **tres niveles**:\n\n- **Dato:** 168 marcas, 16 grupos, 3 columnas; 10 de 16 números son primos.\n- **Patrón:** las sumas de 60, los pares de primos gemelos.\n- **Interpretación:** que los tallistas conocieran los primos. Es una hipótesis; las y los especialistas citados concluyen que aún no hay pruebas suficientes.\n\n## Pregunta de cierre\n\nEl autor lo formula así: ¿cuál es el verdadero orden detrás del caos aparente de los números primos?\n\n**Fuente:** ${'Almonacid Sierra (2025), Periódico UNAL'}.` },
];

export const products = [
  { slug: 'dossier-ishango-pdf', kind: 'digital', price: 24000, file: 'dossier-ishango.pdf', title: 'Dossier Ishango (PDF)', description: 'Resumen académico: hallazgo, tabla de columnas, primos gemelos y bibliografía. Descarga inmediata y autorizada.', ficha: 1 },
  { slug: 'coleccion-completa-fichas-pdf', kind: 'digital', price: 39000, file: 'coleccion-fichas-ishango.pdf', title: 'Colección completa de fichas (PDF)', description: 'Las cinco fichas editoriales en un solo volumen, listas para imprimir y citar.', ficha: 3 },
  { slug: 'guia-didactica-curso-piloto-pdf', kind: 'digital', price: 18000, file: 'guia-didactica-ishango.pdf', title: 'Guía didáctica del curso piloto (PDF)', description: 'Plan de lecciones, actividades y rúbrica del curso «Ishango y los números primos».' },
  { slug: 'poster-ishango-borgona', kind: 'physical', price: 62000, stock: 25, title: 'Póster «Ishango» — borgoña y negro (50 × 70 cm)', description: 'Impresión offset en papel mate de 150 g con la tabla de las tres columnas. Envío a toda Colombia.' },
  { slug: 'cuaderno-de-campo-numerico', kind: 'physical', price: 48000, stock: 12, title: 'Cuaderno de campo numérico (tapa dura)', description: '96 páginas de cuadrícula para registrar muescas, criba de Eratóstenes y notas de lectura.' },
  { slug: 'curso-piloto-ishango', kind: 'course', price: 0, course: 'ishango-numeros-primos', title: 'Matrícula — Curso piloto «Ishango y los números primos»', description: 'Ocho lecciones, recursos descargables y seguimiento de avance. Gratuito durante el piloto.' },
];

export const course = {
  slug: 'ishango-numeros-primos', title: 'Ishango y los números primos', level: 'Introductorio · 2 h 20 min', free: 1,
  summary: 'Curso piloto: aprende a leer un objeto de hace más de 20.000 años como si fuera un dato matemático, distingue evidencia de interpretación y construye tu propia criba de primos.',
  modules: [
    { title: 'Módulo 1 · El objeto', lessons: [
      { kind: 'Lectura', minutes: 15, title: 'Hallazgo y contexto', body: `## Un peroné en Ishango\n\nEn 1950, el geólogo **Jean de Heinzelin** descubrió en la actual República Democrática del Congo un peroné de babuino con **más de 20.000 años** y **168 marcas** talladas.\n\n## Objetivos\n\n- Ubicar el hallazgo en el tiempo y el espacio.\n- Describir el objeto con vocabulario preciso: marcas, grupos, columnas.\n\n## Actividad\n\nAntes de seguir, escribe en tu cuaderno **tres preguntas** que te harías ante un objeto así. Volveremos a ellas en la última lección.` },
      { kind: 'Taller', minutes: 20, title: 'Leer las tres columnas', body: `## Taller con el explorador\n\nAbre el [explorador interactivo](/archivo#explorador) y completa:\n\n- Suma cada columna. ¿Cuáles coinciden?\n- Activa «Mostrar primos». ¿Cuántos de los 16 números lo son?\n- Activa «Primos gemelos». Anota las parejas.\n\n**Entrega:** una tabla con las tres sumas y la lista de parejas encontradas.` },
      { kind: 'Evaluación', minutes: 10, title: 'Quiz 1 · El objeto y su tabla', body: 'Responde con lo visto en el módulo. Necesitas **70 %** para completar la lección.',
        quiz: [
          { q: '¿Cuántas marcas talladas tiene el hueso de Ishango?', o: ['60', '168', '48', '1.000'], a: 1 },
          { q: '¿En cuántas columnas se distribuyen los grupos de marcas?', o: ['2', '3', '4', '16'], a: 1 },
          { q: '¿Qué suman las columnas izquierda y derecha?', o: ['48 cada una', '60 cada una', '168 en total cada una', '12'], a: 1 },
        ] },
    ] },
    { title: 'Módulo 2 · Números primos', lessons: [
      { kind: 'Lectura', minutes: 15, title: '¿Qué es un número primo?', body: `## Átomos de los enteros\n\nUn **número primo** es mayor que 1 y solo se divide por sí mismo y por 1: 2, 3, 5, 7, 11, 13, 17, 19…\n\nTodo entero mayor que 1 se puede escribir como producto de primos; por eso se les llama los «átomos» de los números. Hoy sustentan la **criptografía** que protege transacciones y mensajes.\n\n## Para practicar\n\n- ¿Es 21 primo? ¿Y 23?\n- Escribe todos los primos menores que 30.` },
      { kind: 'Lectura', minutes: 15, title: 'Primos gemelos', body: `## Pares que difieren en 2\n\nDos primos son **gemelos** si son de la forma (p, p+2): (3, 5), (5, 7), (11, 13), (17, 19)…\n\nEn la tabla de Ishango aparecen cuatro parejas: (3, 5) y (5, 7) en la columna central, (11, 13) y (17, 19) en la izquierda.\n\n## Pregunta abierta\n\nNadie sabe aún si hay infinitos pares de primos gemelos. Es uno de los grandes problemas abiertos de la teoría de números.` },
      { kind: 'Taller', minutes: 25, title: 'Taller: la criba de Eratóstenes', body: `## Construye tu criba\n\nDibuja una cuadrícula del 1 al 100 y tacha:\n\n- el 1;\n- los múltiplos de 2 (menos el 2), de 3, de 5 y de 7.\n\nLo que queda son los primos menores que 100. Compáralo con la animación de la [portada](/#criba).\n\n**Entrega:** foto de tu criba y la lista de parejas de primos gemelos menores que 100.` },
    ] },
    { title: 'Módulo 3 · Interpretar con rigor', lessons: [
      { kind: 'Lectura', minutes: 15, title: 'Evidencia, patrón e interpretación', body: `## Tres niveles\n\n- **Dato:** 168 marcas, 16 grupos, 3 columnas.\n- **Patrón:** sumas de 60; 10 de 16 números son primos; parejas gemelas.\n- **Interpretación:** que quienes tallaron el hueso conocieran los primos.\n\n## El debate\n\nAlexander Marshack, Dirk Huylebrouck y Vladimir Pletser respaldaron que las marcas expresan un sistema de notación numérica, pero concluyeron que **no hay pruebas suficientes** para afirmar que comprendían los números primos. Almonacid Sierra, en su libro *Fin de la soledad de los números primos* (2025), sostiene que al menos hay un registro temprano de información sobre ellos.\n\n## Actividad\n\nRedacta en 5 líneas qué evidencia adicional te convencería.` },
      { kind: 'Evaluación', minutes: 20, title: 'Evaluación final', body: 'Cierre del curso piloto. Necesitas **70 %** para completar la lección.',
        quiz: [
          { q: '¿Cuántos de los 16 números de la tabla son primos?', o: ['6', '8', '10', '16'], a: 2 },
          { q: '¿Cuál de estas parejas es de primos gemelos?', o: ['(7, 11)', '(11, 13)', '(13, 19)', '(9, 11)'], a: 1 },
          { q: '¿Cuántos números primos hay menores que 1.000?', o: ['100', '168', '250', '1.000'], a: 1 },
          { q: 'Que los tallistas conocieran los primos es…', o: ['un dato comprobado', 'una hipótesis en debate', 'una definición', 'un error de cálculo'], a: 1 },
        ] },
    ] },
  ],
  resources: [
    { title: 'Artículo original · Periódico UNAL', url: SRC_URL, kind: 'Enlace' },
    { title: 'Hoja de trabajo: criba de Eratóstenes y tabla de Ishango (PDF)', url: '/recursos/hoja-de-trabajo-ishango.pdf', kind: 'PDF' },
    { title: 'Explorador interactivo de la tabla', url: '/archivo#explorador', kind: 'Interactivo' },
  ],
};

export const events = [
  { slug: 'lectura-guiada-hueso-de-ishango', days: 19, hour: 18, dur: 2, mode: 'Virtual', capacity: 60, location: 'Videollamada (enlace enviado por correo)', title: 'Seminario: lectura guiada del hueso de Ishango', description: 'Sesión abierta para recorrer la tabla de las tres columnas, los primos gemelos y los límites de la interpretación.' },
  { slug: 'taller-primos-gemelos', days: 27, hour: 17, dur: 2, mode: 'Presencial', capacity: 25, location: 'Sala Base Parkway, Bogotá', title: 'Taller: primos gemelos con papel y lápiz', description: 'Actividad práctica: criba de Eratóstenes y búsqueda de parejas (p, p+2).' },
  { slug: 'presentacion-coleccion-ishango', days: 65, hour: 19, dur: 2, mode: 'Híbrido', capacity: 120, location: 'Auditorio por confirmar + transmisión', title: 'Presentación de la Colección Ishango', description: 'Lanzamiento de las cinco fichas editoriales y del curso piloto, con conversatorio.' },
];
