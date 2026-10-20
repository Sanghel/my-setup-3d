"""Materiales Principled BSDF. En el grupo 5 se reemplazan por materiales PBR con texturas."""

import bpy

from .common import ROOT

TEXTURES = ROOT / "blender" / "textures" / "processed"
PHOTOS = ROOT / "blender" / "textures" / "photos"


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


def glass(name: str = "glass", alpha: float = 0.08) -> bpy.types.Material:
    """Vidrio barato para tiempo real: casi transparente, liso y con reflejos (alphaMode BLEND en glTF).

    No se usa transmisión (KHR_materials_transmission): en three.js obliga a renderizar la escena
    una segunda vez y bajó de 120 a 75 fps en la prueba. Para ventanas y marcos no hace falta
    refracción; basta con transparencia + reflejos del environment map.
    """
    # Color base casi negro: el vidrio aporta reflejos (especular), no "niebla" sobre lo que hay detrás.
    # Con un color claro, la camiseta detrás del vidrio se veía lechosa.
    mat = principled(name, "#0e1113", roughness=0.04)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Alpha"].default_value = alpha
    mat.surface_render_method = "BLENDED"
    return mat


def _image_node(mat: bpy.types.Material, filename: str, color: bool, x: int, y: int, folder=None):
    path = (folder or TEXTURES) / filename
    if not path.exists():
        raise FileNotFoundError(f"{path} no existe: corre `npm run textures` antes de `npm run assets`")
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = bpy.data.images.load(str(path), check_existing=True)
    # El color base es sRGB; normal y rugosidad son datos, no colores
    node.image.colorspace_settings.name = "sRGB" if color else "Non-Color"
    node.location = (x, y)
    return node


def pbr(name: str, base: str, normal: str | None = None, roughness: str | None = None,
        normal_strength: float = 1.0, roughness_value: float = 0.8) -> bpy.types.Material:
    """Material PBR con texturas de blender/textures/processed (generadas por `npm run textures`).
    Solo usa conexiones que el exportador glTF entiende: imagen → Base Color, imagen → Normal Map → Normal,
    imagen → Roughness. Ajustes con otros nodos (Hue/Saturation, Mix…) no llegarían a la web."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    links.new(_image_node(mat, base, True, -700, 300).outputs["Color"], bsdf.inputs["Base Color"])
    if normal:
        nmap = nodes.new("ShaderNodeNormalMap")
        nmap.location = (-300, -250)
        nmap.inputs["Strength"].default_value = normal_strength
        links.new(_image_node(mat, normal, False, -700, -250).outputs["Color"], nmap.inputs["Color"])
        links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    if roughness:
        links.new(_image_node(mat, roughness, False, -700, 0).outputs["Color"], bsdf.inputs["Roughness"])
    else:
        bsdf.inputs["Roughness"].default_value = roughness_value
    return mat


def photo(name: str, filename: str, roughness: float = 0.7, glow: float = 0.0) -> bpy.types.Material:
    """Material con una foto procesada (blender/textures/photos) como color base: cuadros, desk mat.
    `glow` > 0 suma la misma foto como emisión tenue: el cuadro se lee aunque su pared quede en
    sombra (como una lámina retroiluminada); en la web se atenúa con el resto al inspeccionar."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    image = _image_node(mat, filename, True, -500, 200, folder=PHOTOS)
    mat.node_tree.links.new(image.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = roughness
    if glow > 0:
        mat.node_tree.links.new(image.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = glow
    return mat


def screen(name: str, filename: str, strength: float = 1.6) -> bpy.types.Material:
    """Pantalla encendida: color base negro y la imagen como emisión (emite luz propia).
    Se exporta como emissiveTexture + KHR_materials_emissive_strength; sirve para hornear la luz
    de las pantallas (grupo 7) y para el bloom."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.25
    image = _image_node(mat, filename, True, -500, 200, folder=PHOTOS)
    mat.node_tree.links.new(image.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def emission(name: str, color: str, strength: float) -> bpy.types.Material:
    """Superficie que emite luz (tiras LED). En Cycles, una malla emisiva ilumina la escena como una luz real."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    bsdf.inputs["Emission Color"].default_value = hex_color(color)
    bsdf.inputs["Emission Strength"].default_value = strength
    return mat
