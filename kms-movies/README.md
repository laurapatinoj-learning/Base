# KMS Movies · Get it together

Trivia cooperativa de cine para hasta 15 jugadores sobre **El Poeta** (Colombia, 2025), **El Contador** (2016) y
**Tropic Thunder** (2008), con microjuegos de pocos segundos al estilo *WarioWare: Get It Together!*.

```
kms-movies/
├─ server/          Juego para montar en un servidor (Node, sin dependencias)
├─ remotion-intro/  Motion graphics (Remotion) que se reproducen en el juego
└─ artifact-v1/     Primera versión publicada como artefacto de Claude (sin servidor)
render.yaml         Blueprint para desplegar en Render
```

## Cómo se juega

Todos los jugadores forman **un solo equipo** que comparte vidas y puntos.

- **Vidas:** el equipo empieza con 4 (máximo 5). Si falla una pregunta o un microjuego, pierde una. A cero se corta la función.
- **Preguntas:** el equipo las supera si al menos la mitad de los aciertos del grupo lo logra (cuenta el porcentaje de acierto de todos).
- **Microjuegos:** entre pregunta y pregunta, cada jugador juega el mismo microjuego en su celular. Pasa si lo supera al menos la mitad del equipo. Cada ronda superada sube la velocidad.
- **Jefes:** cada película termina con un jefe en el que todos suman toques a una misma barra. Vencerlo devuelve una vida.
- **Personajes:** cada jugador elige uno y puede usar su habilidad una vez por función.

| Personaje | Habilidad |
|---|---|
| El Director | ¡Acción!: +8 s de tiempo para todos |
| La Guionista | Pista: quita opciones incorrectas en preguntas de opciones |
| El Productor | Seguro: el equipo absorbe el próximo fallo |
| La Doble | Corazón: +1 vida |
| El Compositor | Fanfarria: puntos dobles en lo siguiente |

- **Combo:** cada acierto seguido sube el multiplicador de puntos del equipo (hasta ×1.5).
- **Al final:** estrellas según las vidas que quedan y premios individuales (máximo anotador, gatillo más rápido, estrella de los microjuegos).

Microjuegos: ¡TOCA!, ¡ATRAPA!, ¡DESLIZA!, ¡PARA!, ¡ESQUIVA!, ¡ENCUENTRA!, ¡ALTERNA!, ¡MEMORIZA!, ¡CUENTA!, ¡SUMA! y dos jefes (¡TODOS A TOCAR! y ¡TODOS A ALTERNAR!).

Tipos de pregunta: opción múltiple, adivina la imagen, elige la imagen, verdadero/falso (tarjeta que se desliza),
selección múltiple, respuesta escrita, deslizador, ordenar arrastrando y emparejar.

## Montar el servidor en local

Requiere Node 18 o superior. No hay que instalar paquetes.

```bash
cd server
PORT=3000 HOST_PASSWORD=una-clave node server.js
```

Abre `http://localhost:3000`. El organizador entra con **Organizar** (o `/#host`), crea la sala y comparte el PIN.
Los jugadores entran con **Jugar** o escaneando el QR (`/?pin=123456`).

| Variable | Qué hace |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3000; Render lo define solo) |
| `HOST_PASSWORD` | Si se define, crear una sala exige esta contraseña |

## Desplegar en Render

1. Sube este repositorio a GitHub (ya incluye `render.yaml` en la raíz).
2. En Render: **New → Blueprint**, elige el repositorio y confirma.
3. Cuando lo pida, escribe un valor para `HOST_PASSWORD` (la clave con la que el organizador crea salas).
4. Al terminar el despliegue, abre la URL `https://kms-movies.onrender.com` (o la que te asigne Render).

Sin Blueprint también puedes crear un **Web Service** a mano con estos datos:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Root Directory | `kms-movies/server` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Health Check Path | `/healthz` |

Cosas a tener en cuenta en Render:
- El plan gratuito apaga el servicio tras 15 minutos sin tráfico y tarda cerca de un minuto en despertar. Abre la URL antes de empezar con el grupo.
- El estado vive en memoria: si Render reinicia el servicio, se cierran las salas activas.
- El juego usa Server-Sent Events (HTTP normal), así que no necesita WebSockets ni configuración extra.
- El código QR del lobby se genera con `qrcode-generator` desde jsDelivr. Sin internet, el organizador comparte el PIN o el enlace.

### Docker

```bash
cd server
docker build -t kms-movies .
docker run -p 3000:3000 -e HOST_PASSWORD=una-clave kms-movies
```

## Editar contenido

- `server/questions.js`: banco de preguntas (`BANK`) y orden por película (`ORDER`).
- `server/server.js`: plan de la función (`buildPlan`), vidas, puntos y habilidades.
- `server/public/minigames.js`: los microjuegos.

## Motion graphics (Remotion)

```bash
cd remotion-intro
npm install @remotion/google-fonts@4.0.290
mkdir -p public && cp ../server/public/img/*.jpg public/
./render.sh        # escribe los .mp4 en server/public/media
```

Composiciones: `Intro` (sala de espera), `Film` (presentación de cada película, con la imagen de Canva) y `Finale`.

## Imágenes

Las tres ilustraciones (`server/public/img`) se generaron con Canva y se exportaron en 1600×900.
