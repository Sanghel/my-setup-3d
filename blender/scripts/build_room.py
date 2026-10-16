"""Punto de entrada: arma el cuarto a partir de measurements.json y exporta el .glb.

Uso (desde la raíz del repo):
    npm run assets
que equivale a:
    blender --background --factory-startup --python blender/scripts/build_room.py -- --out public/models/room.raw.glb
"""

import sys
from pathlib import Path

# Blender no agrega la carpeta del script al path de Python: lo hacemos a mano para importar lib/
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: E402

from lib.common import cm, export_glb, load_measurements, parse_args, reset_scene, save_blend  # noqa: E402


def main() -> None:
    args = parse_args()
    m = load_measurements()
    reset_scene()

    # Paso mínimo (tarea 3.3): un bloque con el tamaño del escritorio, para probar el pipeline.
    # Blender usa Z hacia arriba; el exportador glTF lo convierte a Y-up (export_yup).
    desk = m["desk"]
    bpy.ops.mesh.primitive_cube_add(size=1)
    cube = bpy.context.active_object
    cube.name = "room_placeholder"
    cube.scale = (cm(desk["width"]), cm(desk["depth"]), cm(desk["height"]))
    cube.location = (0, 0, cm(desk["height"]) / 2)

    blend = save_blend(args.blend)
    glb = export_glb(args.out)
    print(f"[build_room] medidas: {m['_status']} · .blend: {blend} · .glb: {glb} ({glb.stat().st_size} bytes)")


main()
