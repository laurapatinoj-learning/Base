# Base Parkway

Plataforma editorial y académica: CMS, 5 fichas editoriales, catálogo, agenda, boletín, analítica, tienda (carrito, pedidos, pasarela, entrega digital, inventario, correos) y Aula (matrícula, curso piloto, lecciones, recursos y progreso). Archivo principal sobre el **hueso de Ishango**. Paleta borgoña, negro y blanco.

```bash
npm start        # http://localhost:3000  (Node ≥ 22.13, sin dependencias)
npm test         # 116 pruebas de extremo a extremo
npm run build:pdfs   # regenera los PDF (requiere python3 + reportlab)
```

Cuentas de prueba, recorrido y operación: ver [MANUAL.md](MANUAL.md) (también en `/ayuda`).

**Pendiente para producción:** la pasarela es un simulador (`lib/gateway.js`); los correos se registran en `data/outbox` y solo se envían si defines `RESEND_API_KEY` y `MAIL_FROM`; cambia las claves de prueba y define `SITE_URL` y `COOKIE_SECURE=1`.

## Publicar en Netlify (sitio estático)

`netlify.toml` ya está configurado: Netlify ejecuta `npm run build`, que genera el HTML en `dist/` (32 páginas: portada, archivo, fichas, catálogo, agenda, curso en lectura abierta, boletín y contacto).

1. En Netlify: **Add new site → Import from Git** y elige este repositorio y la rama.
2. Deja el comando y la carpeta que propone `netlify.toml`. No hace falta configurar nada más.
3. Tras el primer despliegue, en **Forms** aparecerán `boletin`, `contacto` e `inscripcion-evento`; activa ahí las notificaciones por correo.
4. Opcional: define `SITE_URL` con tu dominio propio (para canonical, sitemap y Open Graph).

Qué incluye y qué no: la versión estática no tiene cuentas, carrito, pagos, matrícula con progreso ni CMS; esas funciones requieren el servidor Node (`npm start`) con base de datos persistente. Antes de lanzar, sustituye `public/img/og-base.svg` por un PNG para las vistas previas en redes.

Prueba local: `npm run build && npm run check:static`.

Fuente del archivo: J. J. Almonacid Sierra, *El enigmático hueso de Ishango…*, Periódico UNAL, 20-ago-2025.
