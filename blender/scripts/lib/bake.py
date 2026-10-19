"""Luz horneada (design D5): segundo set de UV sin solapamientos (UVMap_light) para todas las mallas
estáticas, y horneado de la iluminación difusa (directa + indirecta, sin color) a un atlas."""

import math

import bpy

LIGHT_UV = "UVMap_light"


def is_bake_target(obj: bpy.types.Object) -> bool:
    """Mallas que reciben luz horneada. Quedan fuera las que emiten (LED, pantallas) y el vidrio."""
    if obj.type != "MESH":
        return False
    name = obj.name
    return not (name.startswith("led_") or name.endswith("_screen") or "glass" in name)


def apply_modifiers(objects) -> None:
    """Aplica los modificadores (bevel) a la malla: las UV de luz deben desplegarse sobre la
    geometría final, no sobre la caja original."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in objects:
        if not obj.modifiers:
            continue
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
        obj.modifiers.clear()
        old = obj.data
        obj.data = mesh
        bpy.data.meshes.remove(old)
        mesh.name = obj.name  # sin el sufijo ".001": el nombre de la malla llega al glTF


def add_light_uvs(objects, margin: float = 0.004) -> None:
    """Crea UVMap_light en todas las mallas y las despliega JUNTAS en un solo atlas sin solapamientos.
    UVMap (texturas) queda primero → TEXCOORD_0; UVMap_light segundo → TEXCOORD_1 en el glTF."""
    objects = list(objects)
    for obj in objects:
        uvs = obj.data.uv_layers
        if not uvs:
            uvs.new(name="UVMap")  # sin textura: UV vacía, solo para que la de luz quede en el índice 1
        uvs.new(name=LIGHT_UV)
        uvs.active = uvs[LIGHT_UV]

    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    # Smart UV Project corta por ángulos; en edición multi-objeto, todas las islas comparten el atlas
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margin, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")

    for obj in objects:  # al exportar, la UV "activa" para render sigue siendo la de las texturas
        uvs = obj.data.uv_layers
        uvs.active = uvs["UVMap"]
        uvs["UVMap"].active_render = True


def bake_lightmap(objects, size: int, samples: int, out_png, out_json) -> dict:
    """Hornea la iluminación difusa (directa + indirecta, sin el color del material) de todas las
    mallas a un único atlas, usando UVMap_light. Devuelve el factor de escala usado al codificar."""
    import json

    import numpy as np

    from .preview import setup_gpu

    objects = list(objects)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    setup_gpu()
    scene.cycles.samples = samples
    bake = scene.render.bake
    bake.use_pass_direct, bake.use_pass_indirect, bake.use_pass_color = True, True, False
    bake.margin = 6
    bake.margin_type = "EXTEND"

    image = bpy.data.images.new("lightmap_hdr", size, size, float_buffer=True, alpha=False)

    # Cycles hornea en la imagen del nodo ACTIVO de cada material, sobre la UV activa de cada malla
    added = []
    for mat in {slot.material for obj in objects for slot in obj.material_slots if slot.material}:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        mat.node_tree.nodes.active = node
        added.append((mat, node))
    for obj in objects:
        obj.data.uv_layers.active = obj.data.uv_layers[LIGHT_UV]

    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)

    for mat, node in added:  # el nodo solo servía para hornear: no debe llegar al glTF
        mat.node_tree.nodes.remove(node)
    for obj in objects:
        obj.data.uv_layers.active = obj.data.uv_layers["UVMap"]

    # Codificación: luz lineal / k → sRGB 8 bits (más precisión en las sombras)
    hdr = np.array(image.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., :3]
    # k: percentil 97 del brillo, SOLO sobre píxeles iluminados (los huecos del atlas son ceros).
    # Lo más brillante (junto a los LED) satura; el bloom de la web lo disimula.
    brightness = hdr.max(axis=2)
    lit = brightness[brightness > 1e-4]
    k = float(np.percentile(lit, 97)) if lit.size else 1.0
    linear = np.clip(hdr / k, 0.0, 1.0)
    srgb = np.where(linear <= 0.0031308, linear * 12.92, 1.055 * np.power(linear, 1 / 2.4) - 0.055)
    ldr = bpy.data.images.new("lightmap", size, size, alpha=False)
    ldr.colorspace_settings.name = "sRGB"
    rgba = np.concatenate([srgb, np.ones((size, size, 1), dtype=np.float32)], axis=2)
    ldr.pixels[:] = rgba.ravel()
    ldr.filepath_raw = str(out_png)
    ldr.file_format = "PNG"
    ldr.save()

    meta = {"intensity": k, "size": size, "samples": samples, "encoding": "srgb", "uv": "TEXCOORD_1"}
    out_json.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    return meta
