# KMS Movies

Trivia en vivo para hasta 15 jugadores sobre **El Poeta** (Colombia, 2025), **El Contador** (2016) y **Tropic Thunder** (2008).

```
kms-movies/
├─ server/          Versión para montar en un servidor (Node, sin dependencias)
├─ remotion-intro/  Motion graphics (Remotion) que se reproducen en el juego
└─ artifact-v1/     Primera versión publicada como artefacto de Claude (sin servidor)
```

## Montar el servidor

Requiere Node 18 o superior. No hay que instalar paquetes.

```bash
cd server
PORT=3000 HOST_PASSWORD=una-clave node server.js
```

Abre `http://localhost:3000`. El organizador entra con **Organizar** (o `/#host`), crea la sala y comparte el PIN.
Los jugadores entran con **Jugar** o escaneando el QR (`/?pin=123456`).

| Variable | Qué hace |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3000) |
| `HOST_PASSWORD` | Si se define, crear una sala exige esta contraseña |

### Docker

```bash
cd server
docker build -t kms-movies .
docker run -p 3000:3000 -e HOST_PASSWORD=una-clave kms-movies
```

### Publicar en internet

Sirve en cualquier host que ejecute Node o Docker (Render, Railway, Fly.io, un VPS).
Detrás de Nginx o Caddy, desactiva el buffering para `/events`, que usa Server-Sent Events
(Nginx: `proxy_buffering off;`). El servidor ya envía `X-Accel-Buffering: no`.
La salud del servicio se consulta en `/healthz`.

Notas de operación:
- El estado vive en memoria: reiniciar el servidor cierra las salas activas.
- Las respuestas correctas solo existen en el servidor (`questions.js`) y se envían a los clientes al terminar cada pregunta.
- Cada sala admite 15 jugadores; no se puede entrar una vez iniciada la partida.
- El código QR del lobby se genera con `qrcode-generator` desde jsDelivr. Sin internet, el organizador comparte el PIN o el enlace.

## Modalidades de respuesta

Opción múltiple, adivina la imagen, elige la imagen, verdadero/falso (tarjeta que se desliza), selección múltiple,
respuesta escrita, deslizador numérico, ordenar arrastrando y emparejar. Además: reacciones en vivo, racha de aciertos,
ranking animado, +10 s y saltar tiempo para el organizador, y atajo de teclado (Espacio/Enter) para avanzar.

## Editar preguntas

`server/questions.js` contiene el banco (`BANK`) y el orden de la partida (`ORDER`).

## Motion graphics (Remotion)

```bash
cd remotion-intro
npm install @remotion/google-fonts@4.0.290
mkdir -p public && cp ../server/public/img/*.jpg public/
./render.sh        # escribe los .mp4 en server/public/media
```

Composiciones: `Intro` (sala de espera), `Film` (presentación de cada película, con la imagen de Canva) y `Finale` (podio).

## Imágenes

Las tres ilustraciones (`server/public/img`) se generaron con Canva y se exportaron en 1600×900.
