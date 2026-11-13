## 1. Cuentas de prueba

- **Estudiante:** `estudiante@baseparkway.test` / `Estudiante#2026`. Ya está matriculada en el curso piloto, con 3 de 8 lecciones completadas.
- **Administración (CMS):** `admin@baseparkway.test` / `Admin#2026`.

Cambia estas claves antes de publicar el sitio (variable `ADMIN_PASSWORD` y rol de usuarios en el CMS).

## 2. Recorrido del sitio

- **Inicio:** hero animado, esquema del hueso, criba de Eratóstenes en movimiento, fichas, catálogo, aula y agenda.
- **Archivo Ishango:** dossier principal basado en el artículo de Juan Jorge Almonacid Sierra (Periódico UNAL), con el *explorador interactivo* de la tabla.
- **Fichas:** las cinco fichas editoriales de la Colección Ishango.
- **Catálogo:** PDF con entrega digital, ediciones físicas con inventario y la matrícula al aula.
- **Agenda:** eventos con inscripción, confirmación por correo y archivo de calendario `.ics`.
- **Boletín:** suscripción con confirmación en dos pasos y baja con un clic.

## 3. Comprar (carrito, pedidos, pasarela y entrega digital)

- Añade productos al carrito. Los productos físicos respetan el inventario disponible.
- Pulsa **Continuar al pago**. Si no has iniciado sesión, el sitio te lleva a ingresar o crear cuenta.
- Paga con una tarjeta de prueba: `4242 4242 4242 4242` (aprobada), `4000 0000 0000 0002` (rechazada) o `4000 0000 0000 9995` (fondos insuficientes). Usa cualquier fecha futura y un CVC de 3 dígitos.
- Al aprobarse el pago: se descuenta el inventario, se envían los correos de confirmación y de entrega, y los PDF quedan disponibles en **Mi cuenta → Pedido** (máximo 5 descargas por archivo, solo para quien compró).
- Si el pago falla, el inventario reservado se libera automáticamente.
- La pasarela es un **simulador**. Para cobrar de verdad hay que integrar un proveedor (Wompi, Stripe, PayU…) en `lib/gateway.js` con la misma función `charge()`.

## 4. Aula

- En **Aula**, abre el curso y pulsa **Matricularme gratis** (o compra la matrícula si el curso es de pago).
- Cada lección tiene contenido, recursos y navegación anterior/siguiente. Las lecturas y talleres se marcan como completadas con un botón; las evaluaciones se aprueban con 70 %.
- El avance se guarda en la base de datos y se ve como barra de progreso en el aula y en el programa del curso.
- Los recursos PDF del aula solo se descargan con sesión iniciada y matrícula.

## 5. CMS (`/admin`)

Entra con la cuenta de administración. Menú lateral:

- **Contenido:** fichas, catálogo e inventario, agenda. Crear, editar, ocultar (casilla *Publicado*) y, solo para administradores, eliminar.
- **Aula:** cursos, módulos, lecciones (con quiz opcional en JSON), recursos y la tabla de **estudiantes y avance**.
- **Tienda:** pedidos (marcar enviado, entregado, cancelar con reposición de inventario) e inventario con historial de movimientos.
- **Comunidad:** campañas del boletín (redactar y enviar a los suscriptores confirmados), suscriptores, mensajes de contacto e inscripciones a eventos.
- **Sistema:** bandeja de correos enviados y gestión de roles (`user`, `editor`, `admin`).
- **Analítica:** vistas por día, visitantes, embudo de compra, páginas más vistas y acciones registradas.

Formato del contenido: `## Título`, listas con `- `, `**negrita**`, `*cursiva*`, `> cita` y `[texto](url)`.

## 6. Correos

Todo correo (bienvenida, pedido, entrega digital, matrícula, boletín, eventos, contacto) se guarda en **Sistema → Correos enviados** y en `data/outbox/`. Para enviarlos de verdad, define `RESEND_API_KEY` y `MAIL_FROM` (cuenta de Resend con dominio verificado) y reinicia.

## 7. Analítica y privacidad

Es analítica propia, sin terceros: páginas vistas y acciones clave con un identificador aleatorio de sesión. No se guardan IP ni huellas del navegador.

## 8. Puesta en marcha

- Requiere Node 22.13 o superior. Ejecuta `npm start` (puerto 3000 o `PORT`).
- Variables: `SITE_URL` (dominio público, para SEO y enlaces de correo), `COOKIE_SECURE=1` (con HTTPS), `ADMIN_PASSWORD`, `RESEND_API_KEY`, `MAIL_FROM`.
- Copias de seguridad: guarda `data/base.db`. Los PDF viven en `storage/`.
- Pruebas automáticas: `npm test`.
