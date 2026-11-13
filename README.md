# Base Parkway

Plataforma editorial y académica: CMS, 5 fichas editoriales, catálogo, agenda, boletín, analítica, tienda (carrito, pedidos, pasarela, entrega digital, inventario, correos) y Aula (matrícula, curso piloto, lecciones, recursos y progreso). Archivo principal sobre el **hueso de Ishango**. Paleta borgoña, negro y blanco.

```bash
npm start        # http://localhost:3000  (Node ≥ 22.13, sin dependencias)
npm test         # 116 pruebas de extremo a extremo
npm run build:pdfs   # regenera los PDF (requiere python3 + reportlab)
```

Cuentas de prueba, recorrido y operación: ver [MANUAL.md](MANUAL.md) (también en `/ayuda`).

**Pendiente para producción:** la pasarela es un simulador (`lib/gateway.js`); los correos se registran en `data/outbox` y solo se envían si defines `RESEND_API_KEY` y `MAIL_FROM`; cambia las claves de prueba y define `SITE_URL` y `COOKIE_SECURE=1`.

Fuente del archivo: J. J. Almonacid Sierra, *El enigmático hueso de Ishango…*, Periódico UNAL, 20-ago-2025.
