"""Punto de entrada: arma el cuarto a partir de measurements.json y exporta el .glb.

Uso (desde la raíz del repo):
    npm run assets            → blender/out/room.blend + blender/out/room.raw.glb (+ optimizado)
    npm run assets:preview    → además renderiza blender/out/preview.png con Cycles
"""

import json
import sys
from pathlib import Path

# Blender no agrega la carpeta del script al path de Python: lo hacemos a mano para importar lib/
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: E402

from lib.bake import add_light_uvs, apply_modifiers, bake_lightmap, is_bake_target  # noqa: E402
from lib.common import ROOT, export_glb, load_measurements, parse_args, reset_scene, save_blend  # noqa: E402
from lib.lights import AMBIENCES, build_lights, set_ambience  # noqa: E402
from lib.preview import WEB_BACKGROUND  # noqa: E402
from lib.props import build_chair, build_desk_props, build_funko, build_laptops, build_pegboard  # noqa: E402
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
    build_vertical_monitor(m, desk, ultrawide)
    build_keyboard(m, desk)
    build_frame(m, "jersey2008", "item_jersey_2008", "jersey_2008.jpg")
    build_frame(m, "jerseyScholes", "item_jersey_scholes", "jersey_scholes.jpg")
    poster = build_poster(m)
    build_window_view(m)
    build_chair(m)
    build_pegboard(m)
    build_funko(m, ultrawide, desk)
    build_laptops(m, ultrawide, desk)
    build_desk_props(m, desk)
    build_lights(m, desk, ultrawide, poster, WEB_BACKGROUND)

    targets = [obj for obj in bpy.data.objects if is_bake_target(obj) and not obj.get("cutter")]
    apply_modifiers(targets)
    # Los cortadores de los booleanos (hueco de la ventana) ya cumplieron: no se hornean ni se exportan
    for cutter in [obj for obj in bpy.data.objects if obj.get("cutter")]:
        bpy.data.objects.remove(cutter)
    add_light_uvs(targets)

    if args.bake:
        # Un horneado por ambiente sobre la MISMA UV2 (redesign D1/D2): solo cambian luces y mundo
        size, samples = (2048, 1024) if args.final else (1024, 128)
        out = ROOT / "blender" / "out"
        out.mkdir(parents=True, exist_ok=True)
        meta = {"size": size, "samples": samples, "encoding": "srgb", "uv": "TEXCOORD_1", "ambiences": {}}
        for name, cfg in AMBIENCES.items():
            set_ambience(name)
            k = bake_lightmap(targets, size, samples, out / f"lightmap-{name}.png")
            meta["ambiences"][name] = {"intensity": k, "exposure": cfg["exposure"]}
            print(f"[build_room] lightmap {name}: {size}px · {samples} muestras · intensidad {k:.3f}")
        (out / "lightmap.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    # El .glb sale con el exterior nocturno; la web lo mezcla con el cielo de tarde (ambience.ts)
    set_ambience("noche")

    blend = save_blend(args.blend)
    glb = export_glb(args.out)
    print(f"[build_room] medidas: {m['_status']} · .blend: {blend} · .glb: {glb} ({glb.stat().st_size} bytes)")

    if args.preview:
        from lib.preview import render_preview

        set_ambience(args.ambience)
        print(f"[build_room] preview ({args.ambience}): {render_preview(m, args.focus, ambience=args.ambience)}")


main()
