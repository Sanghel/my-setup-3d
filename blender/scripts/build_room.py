"""Punto de entrada: arma el cuarto a partir de measurements.json y exporta el .glb.

Uso (desde la raíz del repo):
    npm run assets            → blender/out/room.blend + public/models/room.raw.glb (+ optimizado)
    npm run assets:preview    → además renderiza blender/out/preview.png con Cycles
"""

import sys
from pathlib import Path

# Blender no agrega la carpeta del script al path de Python: lo hacemos a mano para importar lib/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.common import export_glb, load_measurements, parse_args, reset_scene, save_blend  # noqa: E402
from lib.room import build_room  # noqa: E402
from lib.setup import build_desk  # noqa: E402


def main() -> None:
    args = parse_args()
    m = load_measurements()
    reset_scene()

    build_room(m)
    build_desk(m)

    blend = save_blend(args.blend)
    glb = export_glb(args.out)
    print(f"[build_room] medidas: {m['_status']} · .blend: {blend} · .glb: {glb} ({glb.stat().st_size} bytes)")

    if args.preview:
        from lib.preview import render_preview

        print(f"[build_room] preview: {render_preview(m, args.focus)}")


main()
