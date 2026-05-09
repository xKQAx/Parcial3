# Batalla naval (Parcial 3)

Proyecto web estático **sin Node ni bundler**: HTML, CSS, JS con ES modules. Las librerías son solo CDN en el HTML (por ejemplo Bootstrap); no hace falta instalar aplicaciones ni ejecutar builds.

La aplicación del juego está en la carpeta [`Batalla_Naval`](Batalla_Naval).

## Probar en local

Los módulos ES (`import`/`export`) no funcionan abriendo `index.html` como archivo (`file://`) en la mayoría de navegadores. Usa un servidor HTTP estático en la carpeta del juego:

```bash
cd Batalla_Naval
npx serve .
```

O con Python:

```bash
cd Batalla_Naval
python -m http.server 8080
```

Abre `http://localhost:3000` (serve) o `http://localhost:8080` (Python).

En PowerShell, si `cd ... && python` falla, ejecuta `cd` y el servidor en líneas separadas.

## Publicar en GitHub Pages **sin mover archivos a la raíz del repo**

En **Settings → Pages**, la opción **Deploy from a branch** solo permite **`/` (root)** o **`/docs`**. No existe un menú para “publicar desde `Batalla_Naval`” ahí; es normal que no lo veas.

Para servir **solo el contenido de `Batalla_Naval`** como raíz del sitio (`index.html` en la URL base del proyecto):

1. Sube el repo con la carpeta `Batalla_Naval` y el workflow en [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml).
2. Ve a **Settings → Pages → Build and deployment**.
3. En **Source**, elige **GitHub Actions** (no “Deploy from a branch”).
4. Haz push a la rama `main` (o cambia el nombre de la rama en el workflow si usas otra). El workflow sube como artefacto la carpeta `Batalla_Naval` y GitHub Pages la publica como sitio estático.

La URL será `https://<usuario>.github.io/<nombre-repo>/`. Las rutas del proyecto son relativas (`css/…`, `js/…`), así que encajan con esa URL.

### Alternativa sin Actions

- Poner una copia del juego en **`docs/`** y en Pages elegir branch + **`/docs`** (implica duplicar o mantener dos copias).
- O dejar los archivos en la **raíz del repo** y usar **Deploy from branch** con **`/`**.

### Rama distinta de `main`

Si tu rama principal no se llama `main`, edita el archivo del workflow y cambia `branches: ["main"]` por la rama que uses.

## Estructura relevante

| Ruta | Descripción |
|------|-------------|
| `Batalla_Naval/index.html` | Entrada HTML |
| `Batalla_Naval/css/battle.css` | Estilos |
| `Batalla_Naval/js/main.js` | Orquestación y eventos |
| `Batalla_Naval/js/config.js` | Constantes del juego |
| `Batalla_Naval/js/board.js` | Tablero (matriz) |
| `Batalla_Naval/js/placement.js` | Colocación y validación |
| `Batalla_Naval/js/gameRules.js` | Fin de flota / disparos repetidos |
| `Batalla_Naval/js/ui/domBoard.js` | Renderizado del DOM |
