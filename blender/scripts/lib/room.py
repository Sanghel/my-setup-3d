"""Estructura del cuarto: piso, pared del fondo, pared lateral con el hueco de la ventana, techo,
zócalo y la ventana corrediza. Todos los nodos llevan el prefijo room_ (no seleccionables en la web)."""

from . import materials
from .geometry import box, boxes

BACK_WALL_THICKNESS = 10  # cm; la pared lateral usa la profundidad del hueco de la ventana
SLAB = 10  # grosor de piso y techo (cm)


def build_room(m: dict) -> None:
    room, win, base = m["room"], m["window"], m["room"]["baseboard"]
    W, D, H = room["width"], room["depth"], room["height"]
    side_t = win["depth"]

    floor_mat = materials.principled("floor_tile", "#cdbfae", roughness=0.35)
    wall_mat = materials.principled("wall_paint", "#ece3d9", roughness=0.9)
    ceiling_mat = materials.principled("ceiling_popcorn", "#f2ece6", roughness=0.95)
    baseboard_mat = materials.principled("baseboard", "#e6dfd6", roughness=0.6)

    # Piso y techo cubren también el grosor de las paredes, para que no queden rendijas en las esquinas
    box("room_floor", (-BACK_WALL_THICKNESS, W + side_t, -BACK_WALL_THICKNESS, D + BACK_WALL_THICKNESS, -SLAB, 0), floor_mat)
    box("room_ceiling", (-BACK_WALL_THICKNESS, W + side_t, -BACK_WALL_THICKNESS, D + BACK_WALL_THICKNESS, H, H + SLAB), ceiling_mat)
    box("room_wall_back", (0, W + side_t, -BACK_WALL_THICKNESS, 0, 0, H), wall_mat)
    # Paredes izquierda y frontal: cierran el cuarto para que desde adentro nunca se vea el vacío.
    # Lisas por ahora; la puerta se agrega con las medidas reales (M5).
    box("room_wall_left", (-BACK_WALL_THICKNESS, 0, -BACK_WALL_THICKNESS, D + BACK_WALL_THICKNESS, 0, H), wall_mat)
    box("room_wall_front", (0, W + side_t, D, D + BACK_WALL_THICKNESS, 0, H), wall_mat)

    # Pared lateral (x = W) armada con 4 bloques alrededor del hueco de la ventana.
    # A lo largo de esta pared la coordenada que avanza es d (desde la esquina).
    d0, d1 = win["fromCorner"], win["fromCorner"] + win["width"]
    u0, u1 = win["sill"], win["sill"] + win["height"]
    x0, x1 = W, W + side_t
    boxes(
        "room_wall_side",
        [
            (x0, x1, 0, d0, 0, H),  # entre la esquina y la ventana
            (x0, x1, d1, D, 0, H),  # después de la ventana
            (x0, x1, d0, d1, 0, u0),  # bajo el alféizar
            (x0, x1, d0, d1, u1, H),  # sobre la ventana
        ],
        wall_mat,
    )

    # Zócalo en ambas paredes
    bh, bt = base["height"], base["thickness"]
    boxes(
        "room_baseboard",
        [
            (0, W, 0, bt, 0, bh),  # pared del fondo
            (W - bt, W, bt, D, 0, bh),  # pared lateral (desde donde termina el otro tramo)
            (0, bt, bt, D, 0, bh),  # pared izquierda
            (bt, W - bt, D - bt, D, 0, bh),  # pared frontal
        ],
        baseboard_mat,
    )

    build_window(m, x0, x1, d0, d1, u0, u1)


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
