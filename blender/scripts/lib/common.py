"""Utilidades compartidas por los scripts de Blender: argumentos, medidas y escena limpia."""

import argparse
import json
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[3]  # raíz del repo


def parse_args() -> argparse.Namespace:
    """Blender pasa sus propios argumentos; los del script van después de `--`."""
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="blender/out/room.raw.glb")
    parser.add_argument("--blend", default="blender/out/room.blend")
    parser.add_argument("--preview", action="store_true", help="renderizar blender/out/preview.png")
    parser.add_argument("--focus", help="con --preview: encuadrar solo este objeto (p. ej. item_desk)")
    parser.add_argument("--bake", action="store_true", help="hornear el lightmap (rápido, para iterar)")
    parser.add_argument("--ambience", choices=["tarde", "noche"], default="noche",
                        help="con --preview: ambiente de luz del render")
    parser.add_argument("--final", action="store_true", help="con --bake: calidad final (más muestras y resolución)")
    return parser.parse_args(argv)


def load_measurements() -> dict:
    with open(ROOT / "blender" / "measurements.json", encoding="utf-8") as f:
        return json.load(f)


def cm(value: float) -> float:
    """Las medidas están en cm; Blender y glTF trabajan en metros."""
    return value / 100


def reset_scene() -> None:
    """--factory-startup ya arranca limpio, pero la escena trae cubo, cámara y luz por defecto."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def export_glb(path: str) -> Path:
    """Exporta todo menos las luces de Blender: las mallas `led_*` solo iluminan al hornear."""
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        obj.select_set(not obj.name.startswith("led_"))
    bpy.ops.export_scene.gltf(
        use_selection=True,
        filepath=str(out),
        export_format="GLB",
        export_yup=True,
        export_cameras=False,  # la cámara y las luces de preview no van a la web
        export_lights=False,
        export_apply=True,  # aplica los modificadores (bevel) a la geometría exportada
    )
    return out


def save_blend(path: str) -> Path:
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out))
    return out
