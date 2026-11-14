// Ruta de aprendizaje, ejercicios académicos, recorrido guiado y navegación. [es, en, pt]
import { addCopy } from './i18n.js';

addCopy({
  'portrait.cta': ['Ver perfil', 'View profile', 'Ver perfil'],
  'portrait.aria': ['Ver el perfil de Juan Jorge Almonacid Sierra', 'View the profile of Juan Jorge Almonacid Sierra', 'Ver o perfil de Juan Jorge Almonacid Sierra'],
  'route.kicker': ['Ruta de aprendizaje', 'Learning path', 'Trilha de aprendizagem'],
  'route.h2': ['Empieza por aquí', 'Start here', 'Comece por aqui'],
  'route.s1.k': ['Paso 1', 'Step 1', 'Passo 1'], 'route.s1.t': ['Entiende', 'Understand', 'Entenda'],
  'route.s1.p': ['Cinco preguntas sencillas: cuándo, dónde, qué es, qué es una muesca y para qué sirven los primos.', 'Five simple questions: when, where, what it is, what a notch is and what primes are for.', 'Cinco perguntas simples: quando, onde, o que é, o que é uma marca e para que servem os primos.'],
  'route.s1.c': ['Ver las preguntas', 'See the questions', 'Ver as perguntas'],
  'route.s2.k': ['Paso 2', 'Step 2', 'Passo 2'], 'route.s2.t': ['Explora', 'Explore', 'Explore'],
  'route.s2.p': ['Recorre la tabla de las tres columnas, mira los gráficos originales y lee el artículo del profesor.', 'Walk through the three-column table, see the original charts and read the professor’s article.', 'Percorra a tabela das três colunas, veja os gráficos originais e leia o artigo do professor.'],
  'route.s2.c': ['Abrir el archivo', 'Open the archive', 'Abrir o arquivo'],
  'route.s3.k': ['Paso 3', 'Step 3', 'Passo 3'], 'route.s3.t': ['Profundiza', 'Go deeper', 'Aprofunde'],
  'route.s3.p': ['Fichas editoriales, biblioteca de obras y el curso piloto del aula.', 'Editorial sheets, the library of works and the classroom pilot course.', 'Fichas editoriais, biblioteca de obras e o curso piloto da sala de aula.'],
  'route.s3.c': ['Ver las fichas', 'See the sheets', 'Ver as fichas'],
  'route.also': ['También', 'Also', 'Também'],
  'home.prof.h': ['Conoce al profesor', 'Meet the professor', 'Conheça o professor'],

  'toc.title': ['En esta página', 'On this page', 'Nesta página'],
  'faq.nextq': ['Siguiente pregunta →', 'Next question →', 'Próxima pergunta →'],
  'faq.seen': ['vistas', 'viewed', 'vistas'],
  'q6.q': ['6. Pon a prueba lo aprendido', '6. Test what you learned', '6. Teste o que aprendeu'],
  'q6.lead': ['Cinco preguntas rápidas, una por cada tema. Sin límite de intentos.', 'Five quick questions, one per topic. Unlimited attempts.', 'Cinco perguntas rápidas, uma para cada tema. Tentativas ilimitadas.'],

  'lab.progress': ['Pregunta {i} de {t}', 'Question {i} of {t}', 'Pergunta {i} de {t}'],
  'lab.right': ['¡Correcto!', 'Correct!', 'Correto!'], 'lab.wrong': ['Casi.', 'Not quite.', 'Quase.'],
  'lab.next': ['Siguiente', 'Next', 'Próxima'], 'lab.finish': ['Ver resultado', 'See result', 'Ver resultado'], 'lab.retry': ['Intentar de nuevo', 'Try again', 'Tentar novamente'],
  'lab.score': ['Acertaste {n} de {t}.', 'You got {n} of {t}.', 'Você acertou {n} de {t}.'],
  'lab.msg.hi': ['Excelente lectura.', 'Excellent reading.', 'Excelente leitura.'],
  'lab.msg.mid': ['Buen avance: repasa las respuestas que fallaste.', 'Good progress: review the answers you missed.', 'Bom progresso: revise as respostas que errou.'],
  'lab.msg.lo': ['Vuelve a leer las preguntas y prueba de nuevo.', 'Read the questions again and try once more.', 'Leia as perguntas novamente e tente de novo.'],

  'lab.a.title': ['Ejercicio: dato, patrón o interpretación', 'Exercise: data, pattern or interpretation', 'Exercício: dado, padrão ou interpretação'],
  'lab.a.intro': ['Distinguir estos tres niveles es la base del pensamiento científico. Clasifica cada afirmación.', 'Telling these three levels apart is the foundation of scientific thinking. Classify each statement.', 'Distinguir esses três níveis é a base do pensamento científico. Classifique cada afirmação.'],
  'lab.cat.d': ['Dato', 'Data', 'Dado'], 'lab.cat.p': ['Patrón', 'Pattern', 'Padrão'], 'lab.cat.i': ['Interpretación', 'Interpretation', 'Interpretação'],
  'lab.def.d': ['lo que se observa o se cuenta', 'what is observed or counted', 'o que se observa ou se conta'],
  'lab.def.p': ['una relación entre datos', 'a relation between data', 'uma relação entre dados'],
  'lab.def.i': ['una hipótesis sobre su significado', 'a hypothesis about its meaning', 'uma hipótese sobre seu significado'],

  'tour.start': ['Recorrido guiado', 'Guided tour', 'Percurso guiado'], 'tour.prev': ['Anterior', 'Previous', 'Anterior'], 'tour.next': ['Siguiente', 'Next', 'Próximo'], 'tour.end': ['Terminar', 'Finish', 'Concluir'], 'tour.close': ['Cerrar', 'Close', 'Fechar'],
  'tour.label': ['Recorrido guiado de la tabla', 'Guided tour of the table', 'Percurso guiado da tabela'],
});

// Ejercicio A: clasificar afirmaciones. c: d = dato, p = patrón, i = interpretación.
export const LAB_A = [
  { c: 'd', s: ['El hueso tiene 168 marcas talladas, en 16 grupos y 3 columnas.', 'The bone has 168 carved marks, in 16 groups and 3 columns.', 'O osso tem 168 marcas entalhadas, em 16 grupos e 3 colunas.'], e: ['Se puede contar directamente sobre el objeto: es un dato.', 'It can be counted directly on the object: it is data.', 'Pode ser contado diretamente no objeto: é um dado.'] },
  { c: 'd', s: ['El peroné de babuino tiene más de 20.000 años de antigüedad.', 'The baboon fibula is more than 20,000 years old.', 'A fíbula de babuíno tem mais de 20.000 anos de antiguidade.'], e: ['La edad es una medición del objeto, no una opinión: es un dato.', 'The age is a measurement of the object, not an opinion: it is data.', 'A idade é uma medição do objeto, não uma opinião: é um dado.'] },
  { c: 'p', s: ['Las columnas izquierda y derecha suman 60 cada una.', 'The left and right columns add up to 60 each.', 'As colunas esquerda e direita somam 60 cada uma.'], e: ['Es una relación entre datos (los números de cada columna): un patrón.', 'It is a relation between data (the numbers in each column): a pattern.', 'É uma relação entre dados (os números de cada coluna): um padrão.'] },
  { c: 'd', s: ['10 de los 16 números de la tabla son primos.', '10 of the 16 numbers in the table are prime.', '10 dos 16 números da tabela são primos.'], e: ['Se obtiene contando los números de la tabla: es un dato.', 'It is obtained by counting the numbers in the table: it is data.', 'Obtém-se contando os números da tabela: é um dado.'] },
  { c: 'p', s: ['Aparecen las parejas de primos gemelos (3, 5), (5, 7), (11, 13) y (17, 19).', 'The twin-prime pairs (3, 5), (5, 7), (11, 13) and (17, 19) appear.', 'Aparecem os pares de primos gêmeos (3, 5), (5, 7), (11, 13) e (17, 19).'], e: ['Es una regularidad entre los números de la tabla: un patrón.', 'It is a regularity among the numbers in the table: a pattern.', 'É uma regularidade entre os números da tabela: um padrão.'] },
  { c: 'p', s: ['Los primos 11 + 13 + 17 + 19 suman 60, igual que 9 + 11 + 19 + 21.', 'The primes 11 + 13 + 17 + 19 add up to 60, just like 9 + 11 + 19 + 21.', 'Os primos 11 + 13 + 17 + 19 somam 60, assim como 9 + 11 + 19 + 21.'], e: ['Compara dos grupos de números y encuentra una igualdad: un patrón.', 'It compares two groups of numbers and finds an equality: a pattern.', 'Compara dois grupos de números e encontra uma igualdade: um padrão.'] },
  { c: 'i', s: ['Quienes tallaron el hueso conocían los números primos.', 'Whoever carved the bone knew about prime numbers.', 'Quem entalhou o osso conhecia os números primos.'], e: ['Habla de la intención de personas del pasado: es una hipótesis. Los especialistas citados concluyen que aún no hay pruebas suficientes.', 'It speaks of the intent of people in the past: it is a hypothesis. The specialists cited conclude that there is not yet enough proof.', 'Fala da intenção de pessoas do passado: é uma hipótese. Os especialistas citados concluem que ainda não há provas suficientes.'] },
  { c: 'i', s: ['El hueso funcionaba como un temprano «hardware cognitivo» para conservar relaciones numéricas.', 'The bone worked as an early “cognitive hardware” to preserve numerical relations.', 'O osso funcionava como um precoce «hardware cognitivo» para conservar relações numéricas.'], e: ['El propio autor la presenta como una hipótesis interpretativa, no como un hecho demostrado.', 'The author himself presents it as an interpretive hypothesis, not as a demonstrated fact.', 'O próprio autor a apresenta como uma hipótese interpretativa, não como um fato demonstrado.'] },
];

// Ejercicio B: cuestionario de repaso (una pregunta por tema de las preguntas frecuentes).
export const LAB_B = [
  { q: ['¿Hace cuántos años se talló el hueso, aproximadamente?', 'Roughly how many years ago was the bone carved?', 'Há aproximadamente quantos anos o osso foi entalhado?'], o: [['2.000', '5.000', '20.000', '100.000'], ['2,000', '5,000', '20,000', '100,000'], ['2.000', '5.000', '20.000', '100.000']], a: 2, e: ['Hace unos 20.000 años, en el Paleolítico superior, antes de la agricultura y de la escritura.', 'About 20,000 years ago, in the Upper Palaeolithic, before agriculture and writing.', 'Há cerca de 20.000 anos, no Paleolítico superior, antes da agricultura e da escrita.'] },
  { q: ['¿Dónde se encontró?', 'Where was it found?', 'Onde foi encontrado?'], o: [['Grecia', 'Egipto', 'África central (RD Congo)', 'Mesopotamia'], ['Greece', 'Egypt', 'Central Africa (DR Congo)', 'Mesopotamia'], ['Grécia', 'Egito', 'África central (RD Congo)', 'Mesopotâmia']], a: 2, e: ['En Ishango, a orillas del lago Eduardo, en la actual RD Congo: no en Grecia ni en Europa.', 'At Ishango, on the shore of Lake Edward, in today’s DR Congo: not in Greece or Europe.', 'Em Ishango, às margens do lago Eduardo, na atual RD Congo: não na Grécia nem na Europa.'] },
  { q: ['¿De qué animal es el hueso?', 'Which animal does the bone come from?', 'De que animal é o osso?'], o: [['De un elefante', 'De un babuino', 'De un cerdo', 'De una cabra'], ['An elephant', 'A baboon', 'A pig', 'A goat'], ['De um elefante', 'De um babuíno', 'De um porco', 'De uma cabra']], a: 1, e: ['Es el peroné de un babuino y mide unos 10 cm.', 'It is the fibula of a baboon and measures about 10 cm.', 'É a fíbula de um babuíno e mede cerca de 10 cm.'] },
  { q: ['¿Cómo se hicieron las muescas?', 'How were the notches made?', 'Como foram feitas as marcas?'], o: [['Con fuego', 'Con herramientas de metal', 'Rayando con una punta de piedra afilada', 'Con un molde'], ['With fire', 'With metal tools', 'By scratching with a sharp stone point', 'With a mould'], ['Com fogo', 'Com ferramentas de metal', 'Riscando com uma ponta de pedra afiada', 'Com um molde']], a: 2, e: ['Se rayó el hueso con una punta de piedra; en un extremo se conserva un fragmento de cuarzo.', 'The bone was scratched with a stone point; a fragment of quartz survives at one end.', 'O osso foi riscado com uma ponta de pedra; numa extremidade conserva-se um fragmento de quartzo.'] },
  { q: ['¿Cuál de estas parejas son primos gemelos?', 'Which of these pairs are twin primes?', 'Qual destes pares são primos gêmeos?'], o: [['(7, 11)', '(11, 13)', '(13, 19)', '(9, 11)'], ['(7, 11)', '(11, 13)', '(13, 19)', '(9, 11)'], ['(7, 11)', '(11, 13)', '(13, 19)', '(9, 11)']], a: 1, e: ['11 y 13 son primos y se diferencian en 2. El 9 no es primo (3 × 3).', '11 and 13 are prime and differ by 2. 9 is not prime (3 × 3).', '11 e 13 são primos e diferem em 2. O 9 não é primo (3 × 3).'] },
];
