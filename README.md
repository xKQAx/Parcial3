# Batalla naval (Parcial 3)

Proyecto web estático (sin bundler): ES modules, HTML/CSS/JS.

La aplicación del juego está en la carpeta [`Batalla Naval`](Batalla Naval).

## Probar en local

Los módulos ES (`import`/`export`) no funcionan abriendo `index.html` como archivo (`file://`) en la mayoría de navegadores. Usa un servidor HTTP estático en la carpeta del juego:

```bash
cd "Batalla Naval"
npx serve .
```

O con Python:

```bash
cd "Batalla Naval"
python -m http.server 8080
```

Abre `http://localhost:3000` (serve) o `http://localhost:8080` (Python).

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub (asegúrate de incluir la carpeta `Batalla Naval` con `index.html`, `css/`, `js/`).
2. En el repositorio: **Settings → Pages**.
3. En **Build and deployment**, elige la fuente:
   - **Deploy from a branch**: por ejemplo rama `main` y carpeta **`/ (root)`** si la raíz del sitio es donde está `index.html`, o **`/docs`** si copias/mueves el contenido de `Batalla Naval` a `docs/`.
4. Guarda. La URL será `https://<usuario>.github.io/<repo>/` cuando el sitio se sirva desde la raíz del proyecto publicado.

Si el sitio publicado está en una subcarpeta del repo (por ejemplo solo `Batalla Naval/` como raíz del artifact), configura Pages para que la raíz del sitio sea esa carpeta, o mueve `index.html`, `css/` y `js/` a la raíz del branch que Pages sirve.

Las rutas del proyecto son relativas (`css/battle.css`, `js/main.js`), así que funcionan tanto en local como en `usuario.github.io/nombre-repo/` siempre que `index.html` sea la entrada del sitio.

## Estructura relevante

| Ruta | Descripción |
|------|-------------|
| `Batalla Naval/index.html` | Entrada HTML |
| `Batalla Naval/css/battle.css` | Estilos |
| `Batalla Naval/js/main.js` | Orquestación y eventos |
| `Batalla Naval/js/config.js` | Constantes del juego |
| `Batalla Naval/js/board.js` | Tablero (matriz) |
| `Batalla Naval/js/placement.js` | Colocación y validación |
| `Batalla Naval/js/gameRules.js` | Fin de flota / disparos repetidos |
| `Batalla Naval/js/ui/domBoard.js` | Renderizado del DOM |
