# my-setup-3d

Recreación interactiva de mi habitación y mi setup en 3D, como un **diorama nocturno**: dos paredes, el escritorio con sus dos monitores, las camisetas enmarcadas, el poster con su LED rojo y la ciudad de noche por la ventana.

Cada objeto se puede inspeccionar: la cámara vuela hacia él, el resto del cuarto se atenúa, se puede orbitar y hacer zoom, y un panel muestra sus detalles.

![Vista general del cuarto](docs/screenshot.jpg)

## Cómo usarlo

| Acción | Escritorio | Celular |
|---|---|---|
| Orbitar el cuarto | Arrastrar | Un dedo |
| Zoom | Rueda | Pinza |
| Inspeccionar un objeto | Click sobre él, o la lista "Objetos" | Tap, o la lista |
| Volver | `Esc`, botón "Volver" o click en el fondo | Botón "Volver" |

Todo se puede usar solo con teclado: `Tab` recorre la lista de objetos y `Enter` inspecciona.

## Correrlo en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest (escena, catálogo, estado, cámara, interfaz)
npm run build      # build de producción en dist/
```

El modelo ya optimizado (`public/models/room.glb`) y la luz horneada (`lightmap.webp`) están en el repo: **no hace falta Blender** para correr el sitio.

## Cómo se construye el cuarto

El cuarto no se modela a mano: lo genera **código Python que controla Blender** a partir de medidas reales (`blender/measurements.json`, en centímetros).

```
measurements.json + texturas
        │
        ▼
blender/scripts/build_room.py   (Blender sin interfaz: geometría, materiales PBR, LEDs)
        │  hornea la luz con Cycles → lightmap
        ▼
blender/out/room.raw.glb        (~16 MB, intermedio, no se versiona)
        │  gltf-transform: meshopt + WebP
        ▼
public/models/room.glb (~3 MB) + lightmap.webp
        │
        ▼
React Three Fiber: lightmap en tiempo real, bloom, AgX, cámara e interfaz
```

| Script | Qué hace |
|---|---|
| `npm run assets` | Construye, hornea la luz (rápido, 1024 px) y optimiza. Requiere **Blender 5.2** en el `PATH` |
| `npm run assets:final` | Igual, con el horneado de calidad final (2048 px, más muestras) |
| `npm run assets:preview` | Render de Blender para comparar con la web |
| `npm run textures` | Descarga y tiñe las texturas de Poly Haven |
| `npm run textures:photos` | Corrige la perspectiva de las fotos (los originales no están en el repo) |
| `npm run textures:screens` | Genera el contenido de las pantallas con código real de este repo |

## Stack

- **Vite + React 19 + TypeScript**
- **three.js** vía **React Three Fiber** y **drei** (CameraControls, Environment, useProgress)
- **postprocessing**: bloom, outline y tone mapping AgX
- **zustand** para el estado (vista general ↔ inspección)
- **Blender 5.2** (bpy, sin interfaz) + **Cycles** para la luz horneada
- **gltf-transform** para optimizar el modelo
- **Vitest + Testing Library**; **oxlint**; CI en GitHub Actions

## Rendimiento

- **4 MB** transferidos en la primera visita (modelo + lightmap + código).
- **~65 draw calls** por cuadro con el post-procesado; más de 60 fps en un portátil.
- Sin luces en tiempo real: toda la luz difusa está horneada.

## Créditos y licencias

| Recurso | Origen | Licencia |
|---|---|---|
| Piso laminado (`laminate_floor_02`, `laminate_floor_03`) y pared (`beige_wall_001`) | [Poly Haven](https://polyhaven.com) | CC0 |
| Poster, camiseta 2008, desk mat, teclado, vista por la ventana | Fotos propias, procesadas | Del autor |
| Camiseta Scholes 18 (provisional) | Foto de producto de [Casual Football Shirts](https://casualfootballshirts.co.uk) | Uso provisional mientras se reemplaza por una foto propia |
| Contenido de las pantallas | Código de este mismo repo | — |

Las marcas y escudos que aparecen en las camisetas, el poster y los productos pertenecen a sus dueños. Es un proyecto personal sin fines comerciales.

## Bitácora

Este proyecto se hizo para aprender: cada grupo de tareas tiene una nota con los conceptos nuevos (Blender como código, glTF, PBR, luz horneada, raycasting, cámaras, accesibilidad, deploy…) en mi bóveda de Obsidian, y las especificaciones viven en [OpenSpec](https://github.com/Fission-AI/OpenSpec).
