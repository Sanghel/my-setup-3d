"""Luz nocturna con la configuración real del usuario (measurements.json → led, design D5):
LED rojo detrás del poster, tira LED blanca bajo el borde del escritorio, luz trasera ámbar del
ultrawide, pantallas emisivas (ya creadas en setup.py) y un relleno tenue de la ventana.
Las tiras son mallas emisivas `led_*` (iluminan en Cycles y se hornean; no se exportan a la web)."""

import bpy

from . import materials
from .common import cm
from .geometry import box, to_blender


def night_world(background_hex: str, ambient_hex: str = "#0b0d16", ambient_strength: float = 2.0) -> None:
    """Mundo nocturno: casi negro para la luz, pero la cámara ve el color de fondo del diorama.
    'Is Camera Ray' separa lo que ve la cámara de lo que ilumina la escena."""
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    light = nodes.new("ShaderNodeBackground")
    light.inputs["Color"].default_value = materials.hex_color(ambient_hex)
    light.inputs["Strength"].default_value = ambient_strength
    seen = nodes.new("ShaderNodeBackground")
    seen.inputs["Color"].default_value = materials.hex_color(background_hex)
    seen.inputs["Strength"].default_value = 1.0
    path = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    out = nodes.new("ShaderNodeOutputWorld")
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(light.outputs["Background"], mix.inputs[1])
    links.new(seen.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])


# Exposición de la "cámara" (en pasos, como en fotografía): igual que el celular de noche, se sube la
# exposición en vez de inflar las luces, para conservar la proporción entre rojo, ámbar y blanco.
# La web usa el mismo valor en el tone mapping (toneMappingExposure = 2 ** NIGHT_EXPOSURE).
NIGHT_EXPOSURE = 1.3


def build_night_lights(m: dict, desk, ultrawide: dict, poster: dict, background_hex: str) -> None:
    led = m["led"]
    night_world(background_hex)
    scene = bpy.context.scene
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = NIGHT_EXPOSURE

    # LED rojo detrás del poster: 4 tiras entre la pared y el panel, 2 cm hacia adentro del borde
    red = materials.emission("led_poster", led["poster"]["color"], 120.0)
    u0, u1, b0, b1 = poster["u0"] + 2, poster["u1"] - 2, poster["b0"] + 2, poster["b1"] - 2
    for name, bounds in {
        "bottom": (u0, u1, 0.2, 0.8, b0, b0 + 1),
        "top": (u0, u1, 0.2, 0.8, b1 - 1, b1),
        "left": (u0, u0 + 1, 0.2, 0.8, b0, b1),
        "right": (u1 - 1, u1, 0.2, 0.8, b0, b1),
    }.items():
        box(f"led_poster_{name}", bounds, red)  # pared del fondo: u = x, out = d

    # Tira LED blanca bajo el borde del tablero, en los 4 lados (ilumina hacia afuera y al piso)
    white = materials.emission("led_desk", led["desk"]["color"], 40.0)
    under = desk.top - m["desk"]["top"]
    x0, x1, d0, d1 = desk.x0 + 1.5, desk.x1 - 1.5, desk.d0 + 1.5, desk.d1 - 1.5
    z0, z1 = under - 0.6, under
    for name, bounds in {
        "front": (x0, x1, d1 - 0.8, d1, z0, z1),
        "back": (x0, x1, d0, d0 + 0.8, z0, z1),
        "left": (x0, x0 + 0.8, d0, d1, z0, z1),
        "right": (x1 - 0.8, x1, d0, d1, z0, z1),
    }.items():
        box(f"led_desk_{name}", bounds, white)

    # Luz trasera ámbar propia del ultrawide: panel emisivo en la espalda, mirando a la pared
    amber = materials.emission("led_ultrawide", led["ultrawideRear"]["color"], 25.0)
    xc, back, bottom = ultrawide["xc"], ultrawide["back"], ultrawide["bottom"]
    box("led_ultrawide_rear", (xc - 14, xc + 14, back - 0.4, back, bottom + 9, bottom + 25), amber)

    # Relleno de la ventana: la ciudad de noche entra muy tenue, azul violeta
    W = m["room"]["width"]
    win = m["window"]
    fill = bpy.data.lights.new("window_fill", type="AREA")
    fill.shape = "RECTANGLE"
    fill.size, fill.size_y = cm(win["width"]), cm(win["height"])
    fill.energy = 80
    fill.color = materials.hex_color("#7a7fd6")[:3]
    obj = bpy.data.objects.new("window_fill", fill)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = to_blender(W + win["depth"] + 5, win["distance"] + win["width"] / 2, win["sill"] + win["height"] / 2)
    obj.rotation_euler = (0, -1.5708, 0)  # el área emite por su -Z: girada para apuntar hacia el cuarto (-x)
