# my-setup-3d

Recreación interactiva de mi habitación y mi setup en 3D, como un **diorama** en dos ambientes: **Tarde**, con el sol entrando por la ventana, y **Noche**, con los LEDs reales del cuarto. Dos paredes, el escritorio con sus dos monitores, las camisetas enmarcadas y el poster de Old Trafford.

Cada objeto tiene un punto numerado: al tocarlo, la cámara vuela hacia él, el resto del cuarto se atenúa y un panel muestra su ficha. El diseño parte de un mock hecho en Claude Design.

| Tarde | Noche |
|---|---|
| ![Vista general de tarde](docs/screenshot.jpg) | ![Vista general de noche](docs/screenshot-noche.jpg) |

## Cómo usarlo

| Acción | Escritorio | Celular |
|---|---|---|
| Orbitar el cuarto | Arrastrar | Un dedo |
| Zoom | Rueda | Pinza |
| Inspeccionar un objeto | Click sobre él, sobre su punto o en el índice | Tap |
| Anterior / siguiente objeto | `←` `→` o los botones del panel | Botones del panel |
| Volver | `Esc`, "Volver", "Vista general" o click en el fondo | "Volver" |
| Tarde ⇄ Noche | `N` o el selector de abajo | Selector |
| Ocultar los puntos | `H` o "Ocultar puntos" | "Ocultar puntos" |

Todo se puede usar solo con teclado: `Tab` recorre el índice y `Enter` inspecciona. Con *reducir movimiento* activado en el sistema, la entrada es directa y el LED y el polvo quedan quietos.

## Correrlo en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest (escena, catálogo, estado, cámara, interfaz)
npm run build      # build de producción en dist/
```

El modelo ya optimizado (`public/models/room.glb`) y la luz horneada de los dos ambientes (`lightmap-tarde.webp`, `lightmap-noche.webp`) están en el repo: **no hace falta Blender** para correr el sitio.

## Cómo se construye el cuarto

El cuarto no se modela a mano: lo genera **código Python que controla Blender** a partir de medidas reales (`blender/measurements.json`, en centímetros).

```
measurements.json + texturas
        │
        ▼
blender/scripts/build_room.py   (Blender sin interfaz: geometría, materiales PBR, sol y LEDs)
        │  hornea la luz con Cycles dos veces (Tarde y Noche) sobre la misma UV2 + denoise OIDN
        ▼
blender/out/room.raw.glb        (~16 MB, intermedio, no se versiona)
        │  gltf-transform: meshopt + WebP
        ▼
public/models/room.glb (~3 MB) + lightmap-tarde.webp + lightmap-noche.webp (~170 KB c/u)
        │
        ▼
React Three Fiber: los dos lightmaps se mezclan en el shader (onBeforeCompile),
bloom, AgX, cámara con easing, puntos de interés e interfaz
```

| Script | Qué hace |
|---|---|
| `npm run assets` | Construye, hornea los dos ambientes (rápido, 1024 px, ~1 min) y optimiza. Requiere **Blender 5.2** en el `PATH` |
| `npm run assets:final` | Igual, con el horneado de calidad final (2048 px, 1024 muestras, ~8 min) |
| `npm run assets:preview` | Render de Blender para comparar con la web (`-- --ambience tarde\|noche`) |
| `npm run textures:sky` | Genera el cielo de atardecer de la ventana (por código, sin fotos) |
| `npm run textures` | Descarga y tiñe las texturas de Poly Haven |
| `npm run textures:photos` | Corrige la perspectiva de las fotos (los originales no están en el repo) |
| `npm run textures:screens` | Genera el contenido de las pantallas con código real de este repo |

## Stack

- **Vite + React 19 + TypeScript**
- **three.js** vía **React Three Fiber** y **drei** (CameraControls, Environment, useProgress)
- **postprocessing**: bloom y tone mapping AgX
- **zustand** para el estado (vista general ↔ inspección)
- **Blender 5.2** (bpy, sin interfaz) + **Cycles** para la luz horneada
- **gltf-transform** para optimizar el modelo
- **Vitest + Testing Library**; **oxlint**; CI en GitHub Actions

## Rendimiento

- **3,7 MB** transferidos en la primera visita (modelo, dos lightmaps, código y fuentes).
- **~68 draw calls** por cuadro con el post-procesado; ~89 fps en la vista general y ~79 inspeccionando, en un portátil.
- Sin luces en tiempo real: toda la luz difusa está horneada. Lo que se mueve (el LED que respira, el polvo) va encima.

## Créditos y licencias

| Recurso | Origen | Licencia |
|---|---|---|
| Piso laminado (`laminate_floor_02`, `laminate_floor_03`) y pared (`beige_wall_001`) | [Poly Haven](https://polyhaven.com) | CC0 |
| Poster, camiseta 2008, desk mat, teclado, vista por la ventana | Fotos propias, procesadas | Del autor |
| Camiseta Scholes 18 (provisional) | Foto de producto de [Casual Football Shirts](https://casualfootballshirts.co.uk) | Uso provisional mientras se reemplaza por una foto propia |
| Contenido de las pantallas | Código de este mismo repo | — |
| Cielo de atardecer de la ventana | Generado por código (`scripts/render-sky.mjs`) | — |
| Tipografías Manrope y JetBrains Mono | [Google Fonts](https://fonts.google.com) | SIL Open Font License |
| Diseño de la interfaz | Mock propio hecho en Claude Design | — |

Las marcas y escudos que aparecen en las camisetas, el poster y los productos pertenecen a sus dueños. Es un proyecto personal sin fines comerciales.

## Bitácora

Este proyecto se hizo para aprender: cada grupo de tareas tiene una nota con los conceptos nuevos (Blender como código, glTF, PBR, luz horneada, raycasting, cámaras, accesibilidad, deploy…) en mi bóveda de Obsidian, y las especificaciones viven en [OpenSpec](https://github.com/Fission-AI/OpenSpec).
