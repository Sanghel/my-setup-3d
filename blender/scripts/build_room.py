"""Punto de entrada: arma el cuarto a partir de measurements.json y exporta el .glb.

Uso (desde la raíz del repo):
    npm run assets            → blender/out/room.blend + blender/out/room.raw.glb (+ optimizado)
    npm run assets:preview    → además renderiza blender/out/preview.png con Cycles
"""

import sys
from pathlib import Path

# Blender no agrega la carpeta del script al path de Python: lo hacemos a mano para importar lib/
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: E402

from lib.bake import add_light_uvs, apply_modifiers, bake_lightmap, is_bake_target  # noqa: E402
from lib.common import ROOT, export_glb, load_measurements, parse_args, reset_scene, save_blend  # noqa: E402
from lib.lights import build_night_lights  # noqa: E402
from lib.preview import WEB_BACKGROUND  # noqa: E402
from lib.room import build_room  # noqa: E402
from lib.setup import (  # noqa: E402
    build_desk,
    build_frame,
    build_keyboard,
    build_poster,
    build_ultrawide,
    build_vertical_monitor,
    build_window_view,
)


def main() -> None:
    args = parse_args()
    m = load_measurements()
    reset_scene()

    build_room(m)
    desk = build_desk(m)
    ultrawide = build_ultrawide(m, desk)
    build_vertical_monitor(m, desk)
    build_keyboard(m, desk)
    build_frame(m, "jersey2008", "item_jersey_2008", "jersey_2008.jpg")
    build_frame(m, "jerseyScholes", "item_jersey_scholes", "jersey_scholes.jpg")
    poster = build_poster(m)
    build_window_view(m)
    build_night_lights(m, desk, ultrawide, poster, WEB_BACKGROUND)

    targets = [obj for obj in bpy.data.objects if is_bake_target(obj) and not obj.get("cutter")]
    apply_modifiers(targets)
    # Los cortadores de los booleanos (hueco de la ventana) ya cumplieron: no se hornean ni se exportan
    for cutter in [obj for obj in bpy.data.objects if obj.get("cutter")]:
        bpy.data.objects.remove(cutter)
    add_light_uvs(targets)

    if args.bake:
        size, samples = (2048, 1024) if args.final else (1024, 128)
        out = ROOT / "blender" / "out"
        out.mkdir(parents=True, exist_ok=True)
        meta = bake_lightmap(targets, size, samples, out / "lightmap.png", out / "lightmap.json")
        print(f"[build_room] lightmap {size}px · {samples} muestras · intensidad {meta['intensity']:.3f}")

    blend = save_blend(args.blend)
    glb = export_glb(args.out)
    print(f"[build_room] medidas: {m['_status']} · .blend: {blend} · .glb: {glb} ({glb.stat().st_size} bytes)")

    if args.preview:
        from lib.preview import render_preview

        print(f"[build_room] preview: {render_preview(m, args.focus)}")


main()
