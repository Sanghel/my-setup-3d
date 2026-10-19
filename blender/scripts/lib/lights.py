"""Luces del cuarto en dos ambientes (redesign-showroom-style, D2):

- **Noche**: la configuración real del usuario (measurements.json → led): LED rojo detrás del poster,
  tira LED blanca bajo el borde del escritorio, luz trasera ámbar del ultrawide, pantallas emisivas
  (creadas en setup.py) y un relleno tenue de la ventana.
- **Tarde**: un sol cálido que entra por la ventana y dibuja su silueta en el piso, un mundo cálido de
  relleno (el diorama está abierto: sin techo ni paredes frontales) y los LEDs casi apagados.

Todo se crea una vez y `set_ambience()` cambia entre ambientes sin tocar la geometría: así los dos
lightmaps se hornean sobre la MISMA UV2. Las tiras son mallas emisivas `led_*` (iluminan en Cycles y
se hornean; no se exportan a la web)."""

import math

import bpy
from mathutils import Vector

from . import materials
from .common import cm
from .geometry import box, to_blender

# Exposición de la "cámara" en pasos, por ambiente. Viaja a la web en lightmap.json
# (toneMappingExposure = 2 ** exposure), igual que la intensidad de cada lightmap.
AMBIENCES = {
    "tarde": {"exposure": 0.0, "led_scale": 0.12, "window_image": "window_tarde.jpg", "window_strength": 1.0},
    "noche": {"exposure": 1.3, "led_scale": 1.0, "window_image": "window_night.jpg", "window_strength": 0.35},
}
NIGHT_EXPOSURE = AMBIENCES["noche"]["exposure"]

# Sol de tarde: alto (57°) para que la silueta de la ventana caiga entera en el piso del cuarto
# (170 cm de ancho, alféizar a 87 cm y dintel a 232 cm) y un poco hacia el frente, como en el mock.
SUN = {"color": "#ffb067", "strength": 4.0, "elevation_deg": 57, "toward_front": 0.18, "angle_deg": 1.5}
TARDE_WORLD = {"ambient": "#ffe4c8", "strength": 0.35}
# Noche del mock: además de los LEDs, una luz cálida general que ilumina parejo las paredes
ROOM_FILL = {"color": "#ffcf9e", "energy": 15.0, "radius": 0.6, "up": 220}

_state: dict = {}


def make_world(name: str, background_hex: str, ambient_hex: str, ambient_strength: float) -> bpy.types.World:
    """Mundo que ilumina con `ambient_hex` pero que la cámara ve del color de fondo del diorama.
    'Is Camera Ray' separa lo que ve la cámara de lo que ilumina la escena."""
    world = bpy.data.worlds.new(name)
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
    return world


def build_lights(m: dict, desk, ultrawide: dict, poster: dict, background_hex: str) -> None:
    """Crea las luces de los dos ambientes y deja activo el de noche."""
    _state["worlds"] = {
        # Noche: casi negro para la luz. Exposición alta (como el celular de noche) en vez de inflar
        # las luces, para conservar la proporción entre rojo, ámbar y blanco.
        "noche": make_world("world_noche", background_hex, "#0b0d16", 2.0),
        "tarde": make_world("world_tarde", background_hex, TARDE_WORLD["ambient"], TARDE_WORLD["strength"]),
    }
    bpy.context.scene.view_settings.view_transform = "AgX"
    build_leds(m, desk, ultrawide, poster)
    _state["fill"] = build_window_fill(m)
    _state["room_fill"] = build_room_fill(m)
    _state["sun"] = build_sun()
    set_ambience("noche")


def set_ambience(name: str) -> None:
    """Cambia luces, mundo, intensidad de los LEDs y exterior de la ventana. La geometría no cambia."""
    cfg = AMBIENCES[name]
    scene = bpy.context.scene
    scene.world = _state["worlds"][name]
    scene.view_settings.exposure = cfg["exposure"]
    _state["sun"].data.energy = SUN["strength"] if name == "tarde" else 0.0
    _state["fill"].data.energy = _state["fill_energy"] if name == "noche" else 0.0
    _state["room_fill"].data.energy = ROOM_FILL["energy"] if name == "noche" else 0.0
    for mat, base in _state["leds"].items():
        mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = base * cfg["led_scale"]
    view = bpy.data.materials.get("window_view")
    if view:  # exterior de la ventana: cielo de atardecer o ciudad de noche
        image_node = next(n for n in view.node_tree.nodes if n.type == "TEX_IMAGE")
        image_node.image = bpy.data.images.load(str(materials.PHOTOS / cfg["window_image"]), check_existing=True)
        view.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = cfg["window_strength"]
    _state["ambience"] = name


def build_sun() -> bpy.types.Object:
    """Sol de tarde que entra por la ventana (pared lateral, x = W) hacia el cuarto (-x), bajando."""
    sun = bpy.data.lights.new("sun_tarde", type="SUN")
    sun.color = materials.hex_color(SUN["color"])[:3]
    sun.angle = math.radians(SUN["angle_deg"])  # diámetro aparente: bordes de sombra suaves
    obj = bpy.data.objects.new("sun_tarde", sun)
    bpy.context.scene.collection.objects.link(obj)
    horizontal = Vector((-1.0, SUN["toward_front"])).normalized()  # (x, d) del cuarto
    down = math.tan(math.radians(SUN["elevation_deg"]))
    # Ejes de Blender: (x, -d, up). La luz Sun emite por su -Z local
    direction = Vector((horizontal.x, -horizontal.y, -down)).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def build_leds(m: dict, desk, ultrawide: dict, poster: dict) -> None:
    led = m["led"]

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

    # Intensidad de noche de cada material emisivo (los ambientes la escalan). Las pantallas no:
    # están encendidas en los dos ambientes.
    _state["leds"] = {
        mat: mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value
        for mat in (red, white, amber)
    }


def build_room_fill(m: dict) -> bpy.types.Object:
    """Luz cálida general de noche (como la del mock): una esfera grande y suave sobre el centro del cuarto."""
    light = bpy.data.lights.new("room_fill", type="POINT")
    light.color = materials.hex_color(ROOM_FILL["color"])[:3]
    light.shadow_soft_size = ROOM_FILL["radius"]
    obj = bpy.data.objects.new("room_fill", light)
    bpy.context.scene.collection.objects.link(obj)
    room = m["room"]
    obj.location = to_blender(room["width"] / 2, room["depth"] / 2, ROOM_FILL["up"])
    return obj


def build_window_fill(m: dict) -> bpy.types.Object:
    """Relleno de noche: la ciudad entra muy tenue por la ventana, azul violeta."""
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
    _state["fill_energy"] = fill.energy
    return obj
