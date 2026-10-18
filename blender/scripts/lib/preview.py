"""Render de prueba con Cycles desde la vista general de la web, para verificar sin abrir Blender.
La cámara y las luces de este módulo NO se exportan al .glb."""

import json
import math

import bpy
from mathutils import Vector

from .common import ROOT

# Pose de la vista general: la misma que usa la web (src/scene/overviewCamera.json, Y arriba)
_POSE = json.loads((ROOT / "src" / "scene" / "overviewCamera.json").read_text(encoding="utf-8"))
WEB_CAMERA = tuple(_POSE["position"])
WEB_TARGET = tuple(_POSE["target"])
WEB_FOV_DEG = _POSE["fov"]  # vertical, como en <Canvas camera={{ fov }}>


def web_to_blender(p: tuple[float, float, float]) -> Vector:
    """three.js (x, y, z) con Y arriba → Blender (x, -z, y) con Z arriba."""
    return Vector((p[0], -p[2], p[1]))


def setup_gpu() -> None:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = True
    bpy.context.scene.cycles.device = "GPU"


def _focus_pose(name: str) -> tuple[Vector, Vector]:
    """Posición y objetivo para encuadrar el objeto `name` (y sus hijos) desde el mismo ángulo
    diagonal de la vista general."""
    root = bpy.data.objects[name]
    points = [
        obj.matrix_world @ Vector(corner)
        for obj in [root, *root.children_recursive]
        if obj.type == "MESH"
        for corner in obj.bound_box
    ]
    center = sum(points, Vector()) / len(points)
    radius = max((p - center).length for p in points)
    direction = (web_to_blender(WEB_CAMERA) - web_to_blender(WEB_TARGET)).normalized()
    distance = radius / math.sin(math.radians(WEB_FOV_DEG) / 2) * 1.1
    return center + direction * distance, center


def add_preview_camera(width: int, height: int, focus: str | None = None) -> None:
    cam_data = bpy.data.cameras.new("preview_camera")
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle_y = math.radians(WEB_FOV_DEG)
    cam = bpy.data.objects.new("preview_camera", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    position, target = _focus_pose(focus) if focus else (web_to_blender(WEB_CAMERA), web_to_blender(WEB_TARGET))
    cam.location = position
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    bpy.context.scene.render.resolution_x = width
    bpy.context.scene.render.resolution_y = height


def add_preview_lights(m: dict) -> None:
    """Luz neutra provisoria para ver la geometría. La luz nocturna real llega en el grupo 7."""
    W, D, H = m["room"]["width"] / 100, m["room"]["depth"] / 100, m["room"]["height"] / 100
    light = bpy.data.lights.new("preview_ceiling", type="AREA")
    light.energy = 90
    light.size = 1.2
    obj = bpy.data.objects.new("preview_ceiling", light)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (W / 2, -D / 2, H - 0.05)
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    # Mismo color de fondo que la web; con fuerza baja para que casi no ilumine
    from .materials import hex_color

    background.inputs["Color"].default_value = hex_color(_POSE["background"])
    background.inputs["Strength"].default_value = 1.0


def render_preview(m: dict, focus: str | None = None, samples: int = 64) -> str:
    out = f"blender/out/preview-{focus}.png" if focus else "blender/out/preview.png"
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    setup_gpu()
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    add_preview_camera(1280, 720, focus)
    add_preview_lights(m)
    path = str(ROOT / out)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path
