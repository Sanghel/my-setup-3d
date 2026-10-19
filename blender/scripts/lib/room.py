"""Estructura del cuarto en formato diorama (design D13): el piso y las dos paredes del fondo
(la del escritorio y la de la ventana), sin techo ni paredes frontales. Piso y paredes se cortan
justo en el borde del cuarto, así sus cantos muestran el grosor, como una maqueta.
Todos los nodos llevan el prefijo room_ (no seleccionables en la web).
Acabado del mock (redesign D4): cantos redondeados (bevel) en paredes y piso, y una base tipo plinto.
Superficies con texturas PBR CC0 de Poly Haven teñidas según las fotos (blender/textures/process.sh)."""

import bpy

from . import materials
from .geometry import bevel, box, boxes

BACK_WALL_THICKNESS = 10  # cm; la pared lateral usa la profundidad del hueco de la ventana
SLAB = 10  # grosor del piso (cm): se ve en los bordes del diorama
EDGE_BEVEL = 2  # cm: cantos redondeados de paredes y piso (en el mock, radio 0,02 m)
PLINTH = {"height": 16, "overhang": 6, "bevel": 3, "color": "#2e1f16"}  # base oscura bajo el piso


def build_room(m: dict) -> None:
    room, win, base = m["room"], m["window"], m["room"]["baseboard"]
    W, D, H = room["width"], room["depth"], room["height"]
    side_t = win["depth"]

    floor_mat = materials.pbr("floor_laminate", "floor_diff.jpg", "floor_nor.jpg", "floor_rough.jpg")
    wall_mat = materials.pbr("wall_paint", "wall_diff.jpg", "wall_nor.jpg", "wall_rough.jpg", normal_strength=0.6)
    baseboard_mat = materials.pbr("baseboard_wood", "baseboard_diff.jpg", "floor_nor.jpg", roughness_value=0.55)

    # Metros que cubre una repetición de cada textura (ver nota 07):
    # la textura del laminado mide 1,70 m con 8 tablas de 21,25 cm; las reales miden 18,5 cm.
    plank_scale = room["floorPlank"]["width"] / (170 / 8)
    floor_uv = {"uv_tile": 1.70 * plank_scale, "uv_rotate": True}  # tablas a lo largo del cuarto
    wall_uv = {"uv_tile": 3.0}  # beige_wall_001 representa 3 × 3 m

    # El piso llega hasta el grosor de las paredes del fondo (sin rendijas en la esquina)
    # y se corta en los lados abiertos del diorama.
    bevel(box("room_floor", (0, W + side_t, -BACK_WALL_THICKNESS, D, -SLAB, 0), floor_mat, **floor_uv), EDGE_BEVEL, 3)
    bevel(box("room_wall_back", (0, W + side_t, -BACK_WALL_THICKNESS, 0, 0, H), wall_mat, **wall_uv), EDGE_BEVEL, 3)
    build_plinth(W + side_t, D)

    # Pared lateral (x = W): un solo bloque con el hueco de la ventana recortado (booleano).
    # Con 4 bloques pegados, el bevel marcaría surcos en cada unión alrededor del hueco.
    # A lo largo de esta pared la coordenada que avanza es d (desde la esquina).
    d0, d1 = win["distance"], win["distance"] + win["width"]
    u0, u1 = win["sill"], win["sill"] + win["height"]
    x0, x1 = W, W + side_t
    side = box("room_wall_side", (x0, x1, 0, D, 0, H), wall_mat, **wall_uv)
    cut_hole(side, box("cut_window", (x0 - 1, x1 + 1, d0, d1, u0, u1), wall_mat, **wall_uv))
    bevel(side, EDGE_BEVEL, 3)

    # Zócalo en las dos paredes
    bh, bt = base["height"], base["thickness"]
    boxes(
        "room_baseboard",
        [
            (0, W, 0, bt, 0, bh),  # pared del fondo
            (W - bt, W, bt, D, 0, bh),  # pared lateral (desde donde termina el otro tramo)
        ],
        baseboard_mat,
        uv_tile=floor_uv["uv_tile"],  # la veta corre a lo largo del zócalo
    )

    build_window(m, x0, x1, d0, d1, u0, u1)


def cut_hole(obj: bpy.types.Object, cutter: bpy.types.Object) -> None:
    """Recorta `cutter` de `obj` con un booleano (se aplica al exportar, antes del bevel).
    El cortador lleva las mismas UVs de pared, así las caras nuevas del vano heredan una textura coherente."""
    mod = obj.modifiers.new("Hueco", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    cutter.hide_render = True
    cutter.hide_set(True)
    cutter["cutter"] = True  # no se exporta ni se hornea (ver bake.is_bake_target / common.export_glb)


def build_plinth(width: float, depth: float) -> None:
    """Base tipo maqueta bajo el piso: un poco más grande que el piso y de color madera muy oscura."""
    o, h = PLINTH["overhang"], PLINTH["height"]
    mat = materials.principled("plinth", PLINTH["color"], roughness=0.7)
    plinth = box("room_plinth", (-o, width + o, -BACK_WALL_THICKNESS - o, depth + o, -SLAB - h, -SLAB), mat)
    bevel(plinth, PLINTH["bevel"], 3)


def build_window(m: dict, x0: float, x1: float, d0: float, d1: float, u0: float, u1: float) -> None:
    """Ventana corrediza de dos hojas: marco perimetral, parteluz central y dos vidrios."""
    f = m["window"]["frame"]
    frame_mat = materials.principled("window_aluminium", "#cfd0cc", roughness=0.35, metallic=0.7)
    # El marco ocupa una franja centrada en el grosor de la pared
    mid = (x0 + x1) / 2
    fx0, fx1 = mid - 3, mid + 3
    mullion = (d0 + d1) / 2
    boxes(
        "room_window_frame",
        [
            (fx0, fx1, d0, d1, u0, u0 + f),  # inferior
            (fx0, fx1, d0, d1, u1 - f, u1),  # superior
            (fx0, fx1, d0, d0 + f, u0, u1),  # lado cercano a la esquina
            (fx0, fx1, d1 - f, d1, u0, u1),  # lado lejano
            (fx0, fx1, mullion - f / 2, mullion + f / 2, u0, u1),  # parteluz donde se cruzan las hojas
        ],
        frame_mat,
    )
    # Dos hojas de vidrio en rieles distintos (una un poco más adentro), como una corrediza real
    glass_mat = materials.glass("window_glass")
    boxes(
        "room_window_glass",
        [
            (mid - 1.6, mid - 1.0, d0 + f, mullion + f / 2, u0 + f, u1 - f),
            (mid + 1.0, mid + 1.6, mullion - f / 2, d1 - f, u0 + f, u1 - f),
        ],
        glass_mat,
    )
