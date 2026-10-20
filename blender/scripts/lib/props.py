"""Objetos nuevos del mock de Claude Design (match-mock-content, grupo 4): silla, organizador de pared,
Funko de Madara y adornos del escritorio. Medidas en measurements.json (`_source: mock`), en cm.
Coordenadas del cuarto: x a lo largo de la pared del fondo, d hacia adentro, up hacia arriba."""

import math

import bpy

from . import materials
from .common import cm
from .geometry import bevel, box, group, to_blender


def cylinder(name: str, center, radius: float, height: float, mat, top_radius: float | None = None,
             axis: str = "up", vertices: int = 24) -> bpy.types.Object:
    """Cilindro (o cono truncado con `top_radius`) centrado en `center` (cm del cuarto).
    `axis`: "up" (vertical), "x" o "d" (acostado a lo largo de ese eje)."""
    rotation = {"up": (0, 0, 0), "x": (0, math.pi / 2, 0), "d": (math.pi / 2, 0, 0)}[axis]
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=cm(radius), radius2=cm(radius if top_radius is None else top_radius),
        depth=cm(height), location=to_blender(*center), rotation=rotation,
    )
    return _named(name, mat)


def sphere(name: str, center, radius: float, mat, scale=(1, 1, 1), segments: int = 20) -> bpy.types.Object:
    """Esfera (o elipsoide con `scale` = (x, d, up)) centrada en `center` (cm del cuarto)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments // 2, radius=cm(radius),
                                         location=to_blender(*center))
    obj = _named(name, mat)
    obj.scale = (scale[0], scale[1], scale[2])  # ejes de Blender: x, y (= d), z (= up)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def _named(name: str, mat) -> bpy.types.Object:
    obj = bpy.context.active_object
    obj.name = obj.data.name = name
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return obj


def rbox(name: str, center, size, mat, radius: float = 1.0) -> bpy.types.Object:
    """Caja redondeada (como RoundedBoxGeometry del mock): `size` = (x, d, up) en cm."""
    (x, d, up), (sx, sd, su) = center, size
    return bevel(box(name, (x - sx / 2, x + sx / 2, d - sd / 2, d + sd / 2, up - su / 2, up + su / 2), mat),
                 min(radius, sx / 2 - 0.05, sd / 2 - 0.05, su / 2 - 0.05), 3)


def build_chair(m: dict) -> None:
    """Silla de malla negra frente al escritorio: base de 5 patas con ruedas, pistón, asiento, respaldo y
    cabecero inclinados y apoyabrazos. Se arma mirando a la pared del fondo (-d) y se gira `yawDeg`."""
    c = m["chair"]
    cx, cd = c["x"], c["d"]
    frame = materials.principled("chair_frame", "#1c1d21", roughness=0.75)
    mesh_mat = materials.principled("chair_mesh", "#16171b", roughness=0.9)
    chrome = materials.principled("chair_piston", "#2a2a2e", roughness=0.3, metallic=0.7)
    b, s, bk, hd, arm = c["base"], c["seat"], c["back"], c["head"], c["arm"]
    parts = []
    for k in range(5):  # base en estrella
        a = 2 * math.pi * k / 5
        ux, ud = math.cos(a), math.sin(a)
        r0, r1 = 2, b["legLength"]
        from .geometry import bar
        parts.append(bevel(bar(f"chair_leg_{k}", (cx + ux * r0, cd + ud * r0, 6), (cx + ux * r1, cd + ud * r1, 5), 4, 2.5, frame), 0.6))
        parts.append(sphere(f"chair_caster_{k}", (cx + ux * b["casterRing"], cd + ud * b["casterRing"], b["casterRadius"]), b["casterRadius"], frame))
    p = c["piston"]
    parts.append(cylinder("chair_piston", (cx, cd, p["bottom"] + p["height"] / 2), p["radius"] - 0.3, p["height"], chrome, top_radius=p["radius"] - 0.6))
    parts.append(rbox("chair_seat", (cx, cd, s["height"]), (s["width"], s["depth"], s["thickness"]), frame, 3))

    # Respaldo y cabecero detrás del asiento (+d), inclinados hacia atrás
    def tilted(name, w, h, t, center_up, offset, tilt_deg, mat):
        obj = rbox(name, (cx, cd + offset, center_up), (w, t, h), mat, 2)
        # box() deja el origen en (0, 0, 0) del mundo: se lleva al centro de la pieza antes de inclinarla,
        # si no, gira alrededor de la esquina del cuarto y sale volando
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
        obj.rotation_euler = (math.radians(-tilt_deg), 0, 0)  # el respaldo se recuesta hacia +d (atrás)
        return obj

    parts.append(tilted("chair_back", bk["width"], bk["height"], bk["thickness"], bk["center"], bk["offset"], bk["tiltDeg"], mesh_mat))
    parts.append(tilted("chair_head", hd["width"], hd["height"], hd["thickness"], hd["center"], hd["offset"], hd["tiltDeg"], mesh_mat))
    parts.append(rbox("chair_spine", (cx, cd + hd["offset"], 92), (3, 3, 32), frame, 1))
    for side in (-1, 1):  # apoyabrazos: poste y almohadilla
        ax = cx + side * arm["x"]
        parts.append(rbox(f"chair_arm_post_{side}", (ax, cd + 5, s["height"] + arm["postHeight"] / 2), (3, 4, arm["postHeight"]), frame, 1))
        parts.append(rbox(f"chair_arm_pad_{side}", (ax, cd + 3, arm["padHeight"]), (7, arm["padLength"], 2.5), frame, 1))
    chair = group("item_chair", parts, (cx, cd, 0))
    chair.rotation_euler = (0, 0, math.radians(c["yawDeg"]))


def build_pegboard(m: dict) -> None:
    """Organizador de pared (pegboard) en la pared de la ventana, con los accesorios del mock.
    Posiciones locales del mock (cm): `lx` a lo largo de la pared, `ly` hacia arriba, `lz` hacia el cuarto."""
    from .geometry import quad
    from .setup import _wall_point

    pb = m["pegboard"]
    W = m["room"]["width"]
    p = _wall_point(m, pb["wall"])
    cu, cup, w, h, t = pb["centerU"], pb["centerUp"], pb["width"], pb["height"], pb["thickness"]

    def at(lx, ly, lz):  # local del mock → cuarto
        return p(cu + lx, lz, cup + ly)

    def item_box(name, local, size, mat, radius=0.6):
        """Caja en la pared: `size` = (a lo largo, alto, hacia el cuarto)."""
        x, d, up = at(*local)
        return rbox(name, (x, d, up), (size[2], size[0], size[1]), mat, radius)

    board_mat = materials.principled("pegboard_board", "#1b1b1d", roughness=0.6)
    black = materials.principled("pegboard_black", "#151517", roughness=0.5)
    parts = [
        box("pegboard_board", (W - t, W, cu - w / 2, cu + w / 2, cup - h / 2, cup + h / 2), board_mat),
        # Frente con la textura de perforaciones (generada por código, como en el mock)
        quad("pegboard_holes", [at(-w / 2, -h / 2, t + 0.01), at(w / 2, -h / 2, t + 0.01),
                                at(w / 2, h / 2, t + 0.01), at(-w / 2, h / 2, t + 0.01)],
             materials.photo("pegboard_holes", "pegboard.jpg", roughness=0.6)),
        item_box("pegboard_cup_top", (-7, 24, 3.6), (8, 7, 6), black),
        item_box("pegboard_card", (-7, 29, 3), (5, 6, 0.2), materials.principled("pegboard_card", "#cfe1ea", roughness=0.8), 0.05),
        cylinder("pegboard_jbl", at(8, 16, 3), 4.5, 3.5, materials.principled("jbl_orange", "#c7682f", roughness=0.6), axis="x"),
        item_box("pegboard_shelf_top", (-3, -2, 3.6), (17, 1, 7), black, 0.3),
        item_box("pegboard_ps5", (-3, 0.6, 4), (14, 4, 6), materials.principled("ps5_red", "#b3172a", roughness=0.4), 1.5),
        item_box("pegboard_ps5_center", (-3, 1.2, 5), (6, 3, 4.5), materials.principled("ps5_black", "#111111", roughness=0.4), 1.0),
        sphere("pegboard_keychain", at(10, -6, 2), 1.5, materials.principled("keychain_white", "#f2eee6", roughness=0.5)),
        cylinder("pegboard_keychain_strap", at(11, -13, 2), 0.2, 8, materials.principled("keychain_strap", "#d04a2a", roughness=0.5)),
        item_box("pegboard_shelf_bottom", (3, -26, 3.8), (17, 1, 7.5), black, 0.3),
        # Mini balón del United: blanco con una franja roja
        sphere("pegboard_ball", at(-1, -22.8, 4.5), 2.6, materials.principled("ball_white", "#f4f0ea", roughness=0.45)),
        cylinder("pegboard_ball_band", at(-1, -22.8, 4.5), 2.65, 1.6, materials.principled("ball_red", "#c8102e", roughness=0.45)),
        cylinder("pegboard_cactus", at(5.5, -23, 4.5), 1.3, 5, materials.principled("cactus_green", "#6cbf4a", roughness=0.6), top_radius=1.5),
        item_box("pegboard_cup_bottom", (-13, -29, 3.6), (6, 8, 6), black),
    ]
    group("item_pegboard", parts, at(0, -h / 2, 0))


def build_funko(m: dict, ultrawide: dict, desk) -> None:
    """Funko de Madara (modo Seis Caminos) frente a la base del ultrawide: base translúcida, piernas,
    túnica clara, cabeza grande, cabello claro y un bastón, como en el mock."""
    f = m["funko"]
    x, d, on = ultrawide["xc"] + f["offsetX"], f["d"], desk.top
    cream = materials.principled("funko_robe", "#f4efe8", roughness=0.55)
    skin = materials.principled("funko_head", "#f0e4d6", roughness=0.5)
    hair = materials.principled("funko_hair", "#f7f3ee", roughness=0.6)
    dark = materials.principled("funko_dark", "#222222", roughness=0.5)
    base = materials.principled("funko_base", "#ffd6a8", roughness=0.1)
    parts = [
        cylinder("funko_base", (x, d, on + 0.2), f["baseRadius"], 0.4, base),
        cylinder("funko_leg_l", (x - 1.1, d, on + 1.7), 0.9, 3, dark, vertices=12),
        cylinder("funko_leg_r", (x + 1.1, d, on + 1.7), 0.9, 3, dark, vertices=12),
        cylinder("funko_robe", (x, d, on + 5.5), 2.0, 4.5, cream, top_radius=2.4 * 0.85),
        rbox("funko_head_box", (x, d, on + 11), (6.2, 5.6, 5.8), skin, 1.6),
        sphere("funko_hair", (x, d + 1.2, on + 13.2), 4.0, hair, scale=(1, 1.1, 0.9)),
        cylinder("funko_staff", (x + 3, d - 1, on + 6), 0.25, 11, dark, vertices=8),
    ]
    group("item_funko", parts, (x, d, on))


def build_desk_props(m: dict, desk) -> None:
    """Adornos sobre el escritorio: termo, power bank y el iPhone 17 verde con la pantalla encendida. Son
    `prop_*` (no `item_*`): se ven y se hornean, pero no son seleccionables. (El bowl del mock se quitó en
    ajustes visuales 2: estorbaba delante de las portátiles.)"""
    pr, on = m["deskProps"], desk.top
    t, pb, ph = pr["tumbler"], pr["powerBank"], pr["phone"]
    tumbler_mat = materials.principled("prop_tumbler", "#1b1b1e", roughness=0.35, metallic=0.3)
    steel = materials.principled("prop_steel", "#b8b8b8", roughness=0.25, metallic=0.9)
    cylinder("prop_tumbler", (t["x"], t["d"], on + t["height"] / 2), t["radius"] - 0.5, t["height"], tumbler_mat, top_radius=t["radius"])
    cylinder("prop_tumbler_lid", (t["x"], t["d"], on + t["height"] + 0.5), t["radius"] + 0.2, 2, steel)
    cylinder("prop_tumbler_straw", (t["x"] + 1, t["d"], on + t["height"] + 5), 0.3, 10, materials.principled("prop_straw", "#e8e8e8", roughness=0.2), vertices=8)
    rbox("prop_power_bank", (pb["x"], pb["d"], on + pb["size"][2] / 2), tuple(pb["size"]), materials.principled("prop_black", "#18181b", roughness=0.55), 0.8)
    # iPhone 17 verde boca arriba: marco de aluminio salvia, vidrio negro y la pantalla de bloqueo encendida
    # (el mismo fondo de ondas de los monitores). Se arma alineado a los ejes, se une y se gira entero.
    from .geometry import quad

    w, l, h = ph["size"]
    x, d = ph["x"], ph["d"]
    phone = rbox("prop_phone", (x, d, on + h / 2), (w, l, h), materials.principled("prop_phone_frame", ph["frame"], roughness=0.3, metallic=0.7), 0.9)
    glass = rbox("prop_phone_glass", (x, d, on + h - 0.03), (w - 0.3, l - 0.3, 0.08), materials.principled("prop_phone_glass", "#0b0b0d", roughness=0.08), 0.75)
    lock = quad("prop_phone_screen", [(x - w / 2 + 0.45, d + l / 2 - 0.45, on + h + 0.02), (x + w / 2 - 0.45, d + l / 2 - 0.45, on + h + 0.02),
                                      (x + w / 2 - 0.45, d - l / 2 + 0.45, on + h + 0.02), (x - w / 2 + 0.45, d - l / 2 + 0.45, on + h + 0.02)],
                materials.screen("prop_phone_screen", "screen_vertical.jpg", strength=0.7))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in (glass, lock, phone):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = phone
    bpy.ops.object.join()
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    phone.rotation_euler = (0, 0, math.radians(ph["yawDeg"]))


def build_laptops(m: dict, ultrawide: dict, desk) -> None:
    """Portátiles en el dock vertical (ajustes visuales 2, foto IMG_0214): MacBook Pro 14" M4 adelante y
    ASUS TUF Gaming 15" con stickers detrás, paradas sobre su lado largo, detrás del plano del ultrawide y
    a la derecha de su cuello. Desde el frente se ven por debajo de la pantalla, como en la foto."""
    lp = m["laptops"]
    x, on = ultrawide["xc"] + lp["offsetX"], desk.top
    dk, mac, asus = lp["dock"], lp["macbook"], lp["asus"]
    dock_mat = materials.principled("dock_black", "#1a1a1c", roughness=0.4, metallic=0.6)
    # Poco metálicas: quedan en la sombra del ultrawide y un metal oscuro sin reflejos se ve negro
    mac_mat = materials.principled("laptop_macbook", mac["color"], roughness=0.38, metallic=0.2)
    asus_mat = materials.principled("laptop_asus", asus["color"], roughness=0.55, metallic=0.1)
    logo_mat = materials.principled("laptop_logo", "#c9ccd2", roughness=0.15, metallic=0.6)
    base_d = dk["d0"] + dk["depth"] / 2
    parts = [rbox("dock_base", (x, base_d, on + dk["height"] / 2), (dk["width"], dk["depth"], dk["height"]), dock_mat, 0.5)]
    stand = on + dk["height"]
    for name, spec, mat in (("laptop_asus", asus, asus_mat), ("laptop_macbook", mac, mac_mat)):
        parts.append(rbox(name, (x, spec["d"], stand + spec["height"] / 2),
                          (spec["width"], spec["thickness"], spec["height"]), mat, 0.6))
        # Aletas del dock a cada lado de la portátil (sujetan su borde inferior)
        for side in (-1, 1):
            fd = spec["d"] + side * (spec["thickness"] / 2 + 0.4)
            parts.append(rbox(f"dock_fin_{name}_{side}", (x, fd, stand + dk["finHeight"] / 2),
                              (dk["width"] - 2, 0.6, dk["finHeight"]), dock_mat, 0.25))
    # Marca circular en la tapa de la MacBook (brillo pulido, como el logo)
    parts.append(cylinder("macbook_logo", (x, mac["d"] + mac["thickness"] / 2 + 0.05, stand + mac["height"] * 0.55), 1.6, 0.1, logo_mat, axis="d", vertices=24))
    # Stickers de la ASUS en lo que no tapa la MacBook (genéricos hasta la foto F26)
    front = asus["d"] + asus["thickness"] / 2 + 0.05
    stickers = [("#e94f37", -16.0, 6), ("#3fa7d6", -15.6, 13), ("#f6c445", -16.2, 20), ("#59cd90", 15.9, 8),
                ("#ffffff", 16.1, 15), ("#7b61ff", 15.8, 22), ("#ff7aa2", -6, 24.2), ("#f6c445", 7, 24.4)]
    for i, (color, dx, up) in enumerate(stickers):
        parts.append(rbox(f"asus_sticker_{i}", (x + dx, front, stand + up), (2.6, 0.1, 2.6), materials.principled(f"sticker_{i}", color, roughness=0.6), 0.04))
    group("item_laptops", parts, (x, base_d, on))
