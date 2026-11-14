// Internacionalización: ES (por defecto), EN y PT. Cada entrada es [es, en, pt].
export const LANGS = ['es', 'en', 'pt'];
export const LANG_NAMES = { es: 'Español', en: 'English', pt: 'Português' };
export const HTML_LANG = { es: 'es-CO', en: 'en', pt: 'pt' };
export const OG_LOCALE = { es: 'es_CO', en: 'en_US', pt: 'pt_BR' };
const IDX = { es: 0, en: 1, pt: 2 };

export const UI = {
  skip: ['Saltar al contenido', 'Skip to content', 'Ir para o conteúdo'],
  'nav.archive': ['Archivo', 'Archive', 'Arquivo'], 'nav.faq': ['Preguntas', 'Questions', 'Perguntas'], 'nav.sheets': ['Fichas', 'Sheets', 'Fichas'],
  'nav.library': ['Biblioteca', 'Library', 'Biblioteca'], 'nav.catalog': ['Catálogo', 'Catalog', 'Catálogo'], 'nav.classroom': ['Aula', 'Classroom', 'Sala de aula'],
  'nav.contact': ['Contacto', 'Contact', 'Contato'], 'nav.cart': ['Carrito', 'Cart', 'Carrinho'], 'nav.account': ['Mi cuenta', 'My account', 'Minha conta'],
  'nav.login': ['Ingresar', 'Sign in', 'Entrar'], 'nav.logout': ['Salir', 'Sign out', 'Sair'], 'nav.menu': ['Menú', 'Menu', 'Menu'], 'nav.main': ['Principal', 'Main', 'Principal'],
  'lang.label': ['Idioma', 'Language', 'Idioma'],
  'foot.tag': ['Editorial y aula académica. Archivo principal sobre el hueso de Ishango.', 'Publisher and academic classroom. Main archive on the Ishango bone.', 'Editora e sala de aula acadêmica. Arquivo principal sobre o osso de Ishango.'],
  'foot.explore': ['Explorar', 'Explore', 'Explorar'], 'foot.community': ['Comunidad', 'Community', 'Comunidade'], 'foot.newsletter': ['Boletín', 'Newsletter', 'Boletim'],
  'foot.agenda': ['Agenda', 'Events', 'Agenda'], 'foot.privacy': ['Privacidad', 'Privacy', 'Privacidade'], 'foot.manual': ['Manual de uso', 'User guide', 'Manual de uso'],
  'foot.source': ['Fuente del archivo', 'Archive source', 'Fonte do arquivo'], 'foot.top': ['Volver arriba ↑', 'Back to top ↑', 'Voltar ao topo ↑'], 'foot.author': ['El profesor', 'The professor', 'O professor'],
  'form.email': ['Correo electrónico', 'Email address', 'E-mail'], 'form.email_ph': ['tu@correo.com', 'you@email.com', 'voce@email.com'], 'form.subscribe': ['Suscribirme', 'Subscribe', 'Assinar'],
  'form.nl_ok': ['¡Listo! Quedaste en la lista del boletín.', 'Done! You are on the newsletter list.', 'Pronto! Você está na lista do boletim.'],
  'form.name': ['Nombre', 'Name', 'Nome'], 'form.message': ['Mensaje', 'Message', 'Mensagem'], 'form.subject': ['Asunto', 'Subject', 'Assunto'], 'form.send': ['Enviar', 'Send', 'Enviar'],
  'form.contact_ok': ['Mensaje enviado. Te responderemos pronto.', 'Message sent. We will reply soon.', 'Mensagem enviada. Responderemos em breve.'],
  'form.enroll_ok': ['¡Listo! Recibimos tu inscripción y te escribiremos con los detalles.', 'Done! We received your registration and will write to you with the details.', 'Pronto! Recebemos sua inscrição e escreveremos com os detalhes.'],
  'form.required': ['obligatorio', 'required', 'obrigatório'],
  'crumb.home': ['Inicio', 'Home', 'Início'], 'crumb.label': ['Migas de pan', 'Breadcrumb', 'Trilha de navegação'],
  'legend.title': ['Convención de color', 'Colour key', 'Convenção de cores'], 'legend.p': ['Primo', 'Prime', 'Primo'], 'legend.o': ['Compuesto impar', 'Odd composite', 'Composto ímpar'], 'legend.e': ['Compuesto par', 'Even composite', 'Composto par'], 'legend.1': ['El 1 no es primo ni compuesto', '1 is neither prime nor composite', 'O 1 não é primo nem composto'],
  more: ['Leer más', 'Read more', 'Ler mais'], back: ['Volver', 'Back', 'Voltar'],
  'fallback.es': ['Este contenido está disponible solo en español.', 'This content is available in Spanish only.', 'Este conteúdo está disponível apenas em espanhol.'],
  'notfound.kicker': ['Error 404', 'Error 404', 'Erro 404'], 'notfound.h1': ['No encontramos esa página', 'We could not find that page', 'Não encontramos essa página'], 'notfound.p': ['Quizá el enlace cambió. Vuelve al archivo o a las preguntas.', 'The link may have changed. Go back to the archive or the questions.', 'O link pode ter mudado. Volte ao arquivo ou às perguntas.'], 'notfound.home': ['Ir al inicio', 'Go to home', 'Ir para o início'],
};

export const tl = (lang) => (key) => { const e = UI[key] || COPY[key]; return e ? e[IDX[lang] ?? 0] ?? e[0] : key; };
export const pick = (arr, lang) => (Array.isArray(arr) ? arr[IDX[lang] ?? 0] ?? arr[0] : arr);

// Copia de páginas (HTML de confianza). Se llena desde i18n-content.js para mantener este archivo corto.
export const COPY = {};
export const addCopy = (obj) => Object.assign(COPY, obj);
