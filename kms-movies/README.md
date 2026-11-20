# KMS Movies · Get it together

Trivia cooperativa de cine para hasta 15 jugadores sobre **El Poeta** (Colombia, 2025), **El Contador** (2016) y
**Tropic Thunder** (2008), con microjuegos de pocos segundos al estilo *WarioWare: Get It Together!*.

```
kms-movies/
├─ server/          Juego para montar en un servidor (Node, sin dependencias)
├─ remotion-intro/  Motion graphics (Remotion) que se reproducen en el juego
└─ artifact-v1/     Primera versión publicada como artefacto de Claude (sin servidor)
render.yaml         Blueprint para desplegar el servidor en Render
.github/workflows/  Publicación de la página en GitHub Pages
```

## Cómo se juega

Todos los jugadores forman **un solo equipo** que comparte vidas y puntos.

- **Vidas:** el equipo empieza con 4 (máximo 5). Si falla una pregunta o un microjuego, pierde una. A cero se corta la función.
- **Preguntas:** el equipo las supera si al menos la mitad de los aciertos del grupo lo logra (cuenta el porcentaje de acierto de todos).
- **Microjuegos:** entre pregunta y pregunta, cada jugador juega el mismo microjuego en su celular. Pasa si lo supera al menos la mitad del equipo. Cada ronda superada sube la velocidad.
- **Jefes:** cada película termina con un jefe en el que todos suman toques a una misma barra. Vencerlo devuelve una vida.
- **La foto del equipo es el escenario:** en la portada tocas tu cara en la foto para entrar con ella. En la sala, el organizador ve la foto llenándose en vivo con los nombres, y cada jugador puede cambiar de cara tocando otra en la foto. Cada cara la usa una sola persona (hay 13; si entran más, los últimos usan la inicial de su apodo).
- **El foco:** en cada pregunta o microjuego, un jugador rotativo queda "en el foco". Su resultado vale doble para el equipo, y el organizador lo ve resaltado en la barra del equipo.
- **Barra del equipo:** en pantalla grande, las caras muestran en vivo quién respondió, quién superó el microjuego, el personaje de cada uno, y de ellas salen las reacciones con emojis.
- **Más rápido en acertar:** al revelar cada pregunta se destaca a quien acertó primero.
- **Premios en cámara:** al final, la foto hace zoom a cada ganador de los premios.
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

Microjuegos: ¡TOCA!, ¡ATRAPA!, ¡DESLIZA!, ¡PARA!, ¡ESQUIVA!, ¡ENCUENTRA!, ¡ALTERNA!, ¡MEMORIZA!, ¡CUENTA!, ¡SUMA!, ¡BUSCA! (encuentra la cara de un compañero), ¡ENFOCA! (toma la foto cuando su cara pasa por el visor) y dos jefes (¡TODOS A TOCAR! y ¡TODOS A ALTERNAR!).

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

## Publicar el juego

El juego tiene dos partes: la **página** (HTML, JavaScript, imágenes y videos) y el **servidor en tiempo real** (`server/server.js`).
GitHub Pages solo sirve la página, así que el servidor siempre va en Render (o en otro hosting con Node).

### Opción A · Todo en Render (la más simple)

1. Sube este repositorio a GitHub (incluye `render.yaml` en la raíz).
2. En Render: **New → Blueprint**, elige el repositorio y confirma.
3. Escribe un valor para `HOST_PASSWORD` (la clave con la que el organizador crea salas).
4. Abre la URL que te asigne Render (por ejemplo `https://kms-movies.onrender.com`). Render sirve la página y el servidor juntos, sin más configuración.

Sin Blueprint también puedes crear un **Web Service** a mano:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Root Directory | `kms-movies/server` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Health Check Path | `/healthz` |

### Opción B · Página en GitHub Pages y servidor en Render

1. Despliega el servidor en Render como en la opción A y copia su URL.
2. En Render, en la variable `ALLOWED_ORIGIN`, escribe el origen de tu página: `https://TU-USUARIO.github.io` (sin barra final ni nombre del repositorio).
3. En GitHub: **Settings → Pages → Source: GitHub Actions**.
4. En GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**: nombre `KMS_API_URL`, valor la URL de Render (`https://kms-movies.onrender.com`).
5. Haz push a la rama `main` (o ejecuta **Actions → Publicar en GitHub Pages → Run workflow**). La página queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

El flujo `.github/workflows/pages.yml` ejecuta `node kms-movies/server/build-static.js dist` y publica la carpeta `dist`.

### Opción C · Subir el HTML a mano

```bash
cd kms-movies/server
KMS_API_URL=https://kms-movies.onrender.com node build-static.js dist
```

Genera `dist/` con `index.html` (CSS y JavaScript incluidos), `config.js`, `img/` y `media/`. Sube esa carpeta a cualquier hosting de archivos.
Si cambias de servidor después, solo edita `config.js` (`window.KMS_CONFIG = { api: "https://..." }`).

### Archivos listos para usar

- `kms-movies/kms-movies.html`: **un solo archivo HTML** (CSS, JavaScript e imágenes incluidos, 2 MB). Ábrelo con un editor, busca `window.KMS_CONFIG` y escribe en `api` la URL de tu servidor en Render. No incluye los videos de Remotion: usa las animaciones de respaldo.
- `kms-movies/kms-movies-github-pages.zip`: carpeta completa (`index.html`, `config.js`, `img/`, `media/` con los videos) lista para subir a GitHub Pages o a cualquier hosting. Edita `config.js` con la URL de Render.

Para regenerarlos: `node kms-movies/server/build-static.js kms-movies.html --single` y `node kms-movies/server/build-static.js dist`.

### Qué tener en cuenta

- El plan gratuito de Render apaga el servicio tras 15 minutos sin tráfico y tarda cerca de un minuto en despertar. Abre la URL del servidor antes de empezar con el grupo.
- El estado vive en memoria: si Render reinicia el servicio, se cierran las salas activas.
- El juego usa Server-Sent Events (HTTP normal): no necesita WebSockets ni configuración extra.
- El código QR del lobby se genera con `qrcode-generator` desde jsDelivr. Sin internet, el organizador comparte el PIN o el enlace.
- Todas las rutas de archivos son relativas, por eso la página funciona también en subcarpetas como `usuario.github.io/repo/`.

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
- `server/public/team.js`: la foto interactiva del equipo (círculos de cada cara, zoom de cámara).

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
