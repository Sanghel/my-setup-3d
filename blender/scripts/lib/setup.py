"""Objetos del setup (items seleccionables). Cada uno es un Empty `item_*` con sus piezas como hijos.
Coordenadas del cuarto en cm: x a lo largo de la pared del fondo, d hacia adentro, up hacia arriba."""

from dataclasses import dataclass

from . import materials
from .geometry import bar, box, group, quad


@dataclass(frozen=True)
class DeskFrame:
    """Dónde quedó el escritorio; los demás objetos se apoyan en él."""

    x0: float
    x1: float
    d0: float  # borde trasero
    d1: float  # borde frontal
    top: float  # altura de la superficie

    @property
    def center_x(self) -> float:
        return (self.x0 + self.x1) / 2


def build_desk(m: dict) -> DeskFrame:
    desk, mat_size, W = m["desk"], m["deskMat"], m["room"]["width"]
    x1 = W - desk["gapToSideWall"]
    x0 = x1 - desk["width"]
    d0 = desk["gapToBackWall"]
    d1 = d0 + desk["depth"]
    top = desk["height"]
    frame = DeskFrame(x0, x1, d0, d1, top)

    top_mat = materials.principled("desk_top", "#18181a", roughness=0.55)
    metal = materials.principled("desk_metal", "#111214", roughness=0.35, metallic=0.7)
    t = desk["legThickness"]
    under = top - desk["top"]  # cara inferior del tablero

    parts = [box("desk_top", (x0, x1, d0, d1, under, top), top_mat)]

    # Patas en X a cada lado (en el plano d–up), con un riel bajo el tablero
    for i, x in enumerate((x0 + 6, x1 - 6)):
        parts += [
            bar(f"desk_leg_{i}_a", (x, d0 + 4, 0), (x, d1 - 4, under - t), t, t, metal),
            bar(f"desk_leg_{i}_b", (x, d1 - 4, 0), (x, d0 + 4, under - t), t, t, metal),
            box(f"desk_rail_{i}", (x - t / 2, x + t / 2, d0 + 2, d1 - 2, under - t, under), metal),
        ]
    # Larguero trasero entre las dos X, para que se vea estable
    parts.append(box("desk_stretcher", (x0 + 6, x1 - 6, d0 + 8, d0 + 8 + t, 8, 8 + t), metal))

    # Desk mat: goma negra de 3 mm con la foto encima, centrado bajo el ultrawide, cerca del borde frontal
    mw, md = mat_size["width"], mat_size["depth"]
    mx0 = x1 - 18 - mw
    md1 = d1 - 2
    md0 = md1 - md
    rubber = materials.principled("desk_mat_rubber", "#151517", roughness=0.9)
    parts.append(box("desk_mat_base", (mx0, mx0 + mw, md0, md1, top, top + 0.3), rubber))
    parts.append(
        quad(
            "desk_mat_print",
            [(mx0, md1, top + 0.31), (mx0 + mw, md1, top + 0.31), (mx0 + mw, md0, top + 0.31), (mx0, md0, top + 0.31)],
            materials.photo("desk_mat_print", "desk_mat.jpg", roughness=0.85),
        )
    )

    group("item_desk", parts, (frame.center_x, (d0 + d1) / 2, 0))
    return frame


def curved_panel(prefix: str, xc: float, dc: float, bottom: float, width: float, height: float,
                 radius: float, thickness: float, screen_mat, housing_mat, columns: int = 32):
    """Pantalla curva: frente (con UV 0–1 para la imagen) y carcasa trasera con sus cantos.
    El arco está en el plano x–d; los bordes quedan más cerca del usuario (más d) que el centro."""
    import math

    from .geometry import _mesh_object, to_blender

    half = (width / 2) / radius  # ángulo de media pantalla (radianes)
    center_d = dc + radius  # el centro del círculo está frente a la pantalla
    front, back = [], []
    for i in range(columns + 1):
        a = -half + 2 * half * i / columns
        x, d = xc + radius * math.sin(a), dc + radius * (1 - math.cos(a))
        nx, nd = (xc - x) / radius, (center_d - d) / radius  # normal hacia el usuario
        front.append((x, d))
        back.append((x - nx * thickness, d - nd * thickness))
    top = bottom + height

    def strip(points, z0, z1):
        return [to_blender(x, d, z) for x, d in points for z in (z0, z1)]

    # Frente: columnas (abajo, arriba) con UV u = columna, v = altura
    verts = strip(front, bottom, top)
    faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(columns)]
    uvs = [(i / columns, v) for i in range(columns + 1) for v in (0.0, 1.0)]
    screen = _mesh_object(f"{prefix}_screen", verts, faces, screen_mat, uvs)

    # Carcasa: espalda + cantos superior, inferior y laterales
    n = columns + 1
    verts = strip(front, bottom, top) + strip(back, bottom, top)
    faces = [(n * 2 + 2 * i + 1, n * 2 + 2 * i + 3, n * 2 + 2 * i + 2, n * 2 + 2 * i) for i in range(columns)]  # espalda
    faces += [(2 * i + 1, 2 * i + 3, n * 2 + 2 * i + 3, n * 2 + 2 * i + 1) for i in range(columns)]  # canto superior
    faces += [(2 * i, n * 2 + 2 * i, n * 2 + 2 * i + 2, 2 * i + 2) for i in range(columns)]  # canto inferior
    faces += [(0, 1, n * 2 + 1, n * 2), (2 * columns, n * 2 + 2 * columns, n * 2 + 2 * columns + 1, 2 * columns + 1)]
    housing = _mesh_object(f"{prefix}_housing", verts, faces, housing_mat)
    return screen, housing


def build_ultrawide(m: dict, desk: DeskFrame):
    """Xiaomi G34WQi: 34" curvo 1500R sobre su base, con el wallpaper como pantalla emisiva."""
    uw = m["ultrawide"]
    w, h, lift, gap = uw["width"], uw["height"], uw["lift"], uw["wallGap"]
    xc = desk.x1 - 10 - w / 2  # un poco a la derecha del centro, como en las fotos
    bottom = desk.top + lift
    plastic = materials.principled("ultrawide_plastic", "#1c1c1f", roughness=0.45)
    stand = materials.principled("ultrawide_stand", "#2a2b2f", roughness=0.35, metallic=0.6)
    screen, housing = curved_panel(
        "ultrawide", xc, gap, bottom, w, h, uw["radius"], 2.0,
        materials.screen("ultrawide_screen", "screen_ultrawide.jpg"), plastic,
    )
    bw, bd = uw["base"]["width"], uw["base"]["depth"]
    back = gap - 2.0
    parts = [
        screen,
        housing,
        # Bulto trasero de la electrónica (donde va la luz ámbar en el grupo 7)
        box("ultrawide_back", (xc - 18, xc + 18, back - 4, back, bottom + 7, bottom + 27), plastic),
        # Cuello y base
        box("ultrawide_neck", (xc - 2.5, xc + 2.5, back - 7, back - 4, desk.top, bottom + 20), stand),
        box("ultrawide_base", (xc - bw / 2, xc + bw / 2, back - 10, back - 10 + bd, desk.top, desk.top + 1), stand),
    ]
    group("item_ultrawide", parts, (xc, gap, desk.top))


def build_vertical_monitor(m: dict, desk: DeskFrame):
    """Gigabyte 25" en vertical, girado hacia el usuario, sostenido por un brazo Huanuo con abrazadera."""
    import math

    from .geometry import quad

    vm, arm = m["verticalMonitor"], m["monitorArm"]
    w, h, lift = vm["width"], vm["height"], vm["lift"]
    a = math.radians(vm["angleDeg"])
    n = (math.sin(a), math.cos(a))  # normal de la pantalla en el plano x–d (hacia el usuario, girada a la derecha)
    s = (math.cos(a), -math.sin(a))  # dirección del ancho del panel
    cx, cd = desk.x0 + 27, 24  # centro del panel: a la izquierda del ultrawide, como en las fotos
    bottom, top = desk.top + lift, desk.top + lift + h
    plastic = materials.principled("vertical_plastic", "#1b1b1e", roughness=0.45)
    metal = materials.principled("arm_metal", "#141416", roughness=0.35, metallic=0.7)

    def at(along: float, out: float, up: float):
        """Punto a `along` cm sobre el ancho y `out` cm hacia el frente del centro del panel."""
        return (cx + s[0] * along + n[0] * out, cd + s[1] * along + n[1] * out, up)

    panel = bar("vertical_panel", at(0, -1, bottom), at(0, -1, top), w, 2.0, plastic, side=(s[0], s[1], 0))
    screen = quad(
        "vertical_screen",
        [at(-w / 2 + 0.6, 0.02, bottom + 0.6), at(w / 2 - 0.6, 0.02, bottom + 0.6),
         at(w / 2 - 0.6, 0.02, top - 0.6), at(-w / 2 + 0.6, 0.02, top - 0.6)],
        materials.screen("vertical_screen", "screen_vertical.jpg"),
    )
    vesa = at(0, -3.5, (bottom + top) / 2)
    # Brazo: abrazadera sobre el tablero → poste → codo → placa VESA en la espalda del panel
    px, pd = desk.x0 + arm["fromDeskLeft"], arm["fromBackWall"]
    elbow = (px - 6, pd + 10, vesa[2] - 4)
    parts = [
        panel,
        screen,
        box("vertical_vesa", (vesa[0] - 5, vesa[0] + 5, vesa[1] - 1.5, vesa[1] + 1.5, vesa[2] - 5, vesa[2] + 5), metal),
        box("arm_clamp", (px - 4, px + 4, pd - 4, pd + 4, desk.top, desk.top + 2.5), metal),
        bar("arm_pole", (px, pd, desk.top), (px, pd, vesa[2] - 4), 3.5, 3.5, metal),
        bar("arm_lower", (px, pd, vesa[2] - 4), elbow, 4, 3, metal, side=(0, 0, 1)),
        bar("arm_upper", elbow, vesa, 4, 3, metal, side=(0, 0, 1)),
    ]
    group("item_vertical_monitor", parts, (cx, cd, desk.top))


# Logitech MX Mechanical Mini: anchos de tecla en unidades (1u ≈ 1,86 cm). "m" = modificador (gris oscuro).
KEY_ROWS = [
    ["m1"] + ["1"] * 12 + ["m1"] * 3,  # esc, F1–F12, teclas de función extra
    ["1"] * 13 + ["m2"] + ["m1"],  # ` 1–0 - =, backspace, home
    ["m1.5"] + ["1"] * 12 + ["m1.5"] + ["m1"],  # tab, Q–], \, pg up
    ["m1.75"] + ["1"] * 11 + ["m2.25"] + ["m1"],  # caps, A–', enter, pg dn
    ["m2.25"] + ["1"] * 10 + ["m1.75"] + ["m1"] * 2,  # shift, Z–/, shift, ↑, end
    ["m1.25"] * 3 + ["6.25"] + ["m1"] * 6,  # ctrl, opt, cmd, espacio, cmd, fn, ctrl, ← ↓ →
]


def build_keyboard(m: dict, desk: DeskFrame):
    from .geometry import boxes

    kb = m["keyboard"]
    W, D = kb["width"], kb["depth"]
    x0 = desk.center_x + 6 - W / 2  # sobre el desk mat, un poco a la izquierda del centro del ultrawide
    d0 = desk.d1 - 26.5
    base_top = desk.top + 1.6
    unit = (W - 1.4) / 16  # 16 unidades por fila entre los márgenes de la carcasa
    pitch_d = (D - 1.6) / len(KEY_ROWS)
    gap = 0.17  # separación entre teclas (cm)

    body = materials.principled("keyboard_body", "#3a3d43", roughness=0.4, metallic=0.5)
    letters = materials.principled("keycap_light", "#6f747d", roughness=0.6)
    mods = materials.principled("keycap_dark", "#3d4046", roughness=0.6)

    light_keys, dark_keys = [], []
    for row_i, row in enumerate(KEY_ROWS):
        x = x0 + 0.7
        kd0 = d0 + 0.8 + row_i * pitch_d
        for key in row:
            dark = key.startswith("m")
            size = float(key.lstrip("m")) * unit
            cap = (x + gap, x + size - gap, kd0 + gap, kd0 + pitch_d - gap, base_top, base_top + 0.7)
            (dark_keys if dark else light_keys).append(cap)
            x += size

    parts = [
        box("keyboard_body", (x0, x0 + W, d0, d0 + D, desk.top, base_top), body),
        boxes("keyboard_keys_light", light_keys, letters),
        boxes("keyboard_keys_dark", dark_keys, mods),
    ]
    group("item_keyboard", parts, (x0 + W / 2, d0 + D / 2, desk.top))


def _wall_point(m: dict, wall: str):
    """Convierte (u, out, up) de una pared a coordenadas del cuarto.
    u avanza de izquierda a derecha para quien mira la pared; out sale de la pared hacia el cuarto."""
    W = m["room"]["width"]
    if wall == "back":
        return lambda u, out, up: (u, out, up)
    if wall == "side":
        return lambda u, out, up: (W - out, u, up)
    raise ValueError(f"pared desconocida: {wall}")


def _span(m: dict, spec: dict) -> tuple[float, float]:
    """Rango [u0, u1] del cuadro a lo largo de su pared, según su referencia (from/distance)."""
    W, D = m["room"]["width"], m["room"]["depth"]
    w, dist, ref = spec["width"], spec["distance"], spec["from"]
    if spec["wall"] == "back":
        u0 = {"leftWall": dist, "corner": W - dist - w}[ref]
    else:
        u0 = {"corner": dist, "frontWall": D - dist - w}[ref]
    return u0, u0 + w


def build_frame(m: dict, key: str, item: str, photo_file: str):
    """Cuadro con marco negro, fondo con la foto y vidrio, colgado en su pared."""
    spec = m["frames"][key]
    p = _wall_point(m, spec["wall"])
    u0, u1 = _span(m, spec)
    b0, b1 = spec["bottom"], spec["bottom"] + spec["height"]
    depth, border = spec["depth"], spec["border"]
    black = materials.principled("frame_black", "#101011", roughness=0.4)

    def cube(name, ua, ub, oa, ob, za, zb, mat):
        (xa, da, _), (xb, db, _) = p(ua, oa, 0), p(ub, ob, 0)
        return box(name, (min(xa, xb), max(xa, xb), min(da, db), max(da, db), za, zb), mat)

    out = 0.4  # la foto queda apenas delante de la pared, dentro del marco
    parts = [
        cube(f"{key}_border_bottom", u0, u1, 0, depth, b0, b0 + border, black),
        cube(f"{key}_border_top", u0, u1, 0, depth, b1 - border, b1, black),
        cube(f"{key}_border_left", u0, u0 + border, 0, depth, b0, b1, black),
        cube(f"{key}_border_right", u1 - border, u1, 0, depth, b0, b1, black),
        quad(
            f"{key}_photo",
            [p(u0 + border, out, b0 + border), p(u1 - border, out, b0 + border),
             p(u1 - border, out, b1 - border), p(u0 + border, out, b1 - border)],
            materials.photo(f"{key}_photo", photo_file, roughness=0.8),
        ),
        cube(f"{key}_glass", u0 + border, u1 - border, depth - 0.5, depth - 0.3, b0 + border, b1 - border,
             materials.glass(f"{key}_glass")),
    ]
    center = p((u0 + u1) / 2, 0, b0)
    group(item, parts, center)


def build_poster(m: dict):
    """Poster de Old Trafford: panel rígido sin marco, con la foto al frente (brillo leve, tipo acrílico)."""
    spec = m["frames"]["poster"]
    p = _wall_point(m, spec["wall"])
    u0, u1 = _span(m, spec)
    b0, b1 = spec["bottom"], spec["bottom"] + spec["height"]
    depth = spec["depth"]
    edge = materials.principled("poster_edge", "#1a1a1c", roughness=0.5)
    (xa, da, _), (xb, db, _) = p(u0, 0, 0), p(u1, depth - 0.05, 0)
    parts = [
        box("poster_panel", (min(xa, xb), max(xa, xb), min(da, db), max(da, db), b0, b1), edge),
        quad("poster_print",
             [p(u0, depth, b0), p(u1, depth, b0), p(u1, depth, b1), p(u0, depth, b1)],
             materials.photo("poster_print", "poster.jpg", roughness=0.25)),
    ]
    group("item_poster", parts, p((u0 + u1) / 2, 0, b0))
