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
