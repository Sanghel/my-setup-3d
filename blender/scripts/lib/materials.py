"""Materiales Principled BSDF. En el grupo 5 se reemplazan por materiales PBR con texturas."""

import bpy


def srgb_to_linear(c: float) -> float:
    """Los colores hex son sRGB; Blender espera colores lineales en los nodos."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_color(value: str) -> tuple[float, float, float, float]:
    value = value.lstrip("#")
    r, g, b = (int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1.0)


def principled(name: str, color: str, roughness: float = 0.8, metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_color(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def glass(name: str = "glass") -> bpy.types.Material:
    """Vidrio: transmisión total y rugosidad baja (se exporta como KHR_materials_transmission)."""
    mat = principled(name, "#ffffff", roughness=0.05)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["IOR"].default_value = 1.45
    return mat
