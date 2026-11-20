# Equipo KMS · foto segmentada

- `index.html`: página autónoma (abre el archivo en el navegador). Toca a cualquiera de las 14 personas para aislarla, ver su recorte y su información; los nombres y roles se guardan en el navegador.
- `personas/persona-01.png … persona-14.png`: recortes con fondo transparente.
- `mascaras.json`: contornos (polígonos) de cada persona sobre la foto de 1099×688 px.
- `personas.json`: caja, centro, área y descripción visual de cada persona.
- `imagen-original.jpg`: foto fuente.

La segmentación se hizo con semillas manuales y watershed (OpenCV). Donde dos personas se superponen, el borde es una estimación.
