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
