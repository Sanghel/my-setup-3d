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
