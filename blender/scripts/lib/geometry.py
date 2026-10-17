"""Geometría básica construida directo sobre mallas (sin bpy.ops): rápida y sin depender del contexto.

Convención: las funciones reciben coordenadas del CUARTO en cm, como en measurements.json:
    x = a lo largo de la pared del fondo, d = hacia adentro del cuarto, up = altura.
y las convierten a coordenadas de Blender en metros (Z arriba). Como el exportador glTF
convierte Blender (x, y, z) → glTF (x, z, -y), "hacia adentro del cuarto" en Blender es -y.
"""

from typing import Iterable, Sequence

import bpy

Bounds = tuple[float, float, float, float, float, float]  # x0, x1, d0, d1, up0, up1 (cm)

# Las 6 caras de una caja, con los vértices en orden antihorario visto desde afuera (normal hacia afuera)
_FACES = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]


def to_blender(x: float, d: float, up: float) -> tuple[float, float, float]:
    return (x / 100, -d / 100, up / 100)


def _box_vertices(b: Bounds) -> list[tuple[float, float, float]]:
    x0, x1, d0, d1, u0, u1 = b
    # piso de la caja (up0) y luego techo (up1); con -d, el orden queda antihorario visto desde abajo
    corners = [(x0, d0), (x1, d0), (x1, d1), (x0, d1)]
    bottom = [to_blender(x, d, u0) for x, d in corners]
    top = [to_blender(x, d, u1) for x, d in corners]
    return bottom + top


def add_box_uvs(mesh: bpy.types.Mesh, tile: float, rotate: bool = False) -> None:
    """UVs por proyección de caja en metros: cada cara usa las dos coordenadas que no son su normal,
    divididas por `tile` (metros que cubre una repetición de la textura). Así la escala del material
    es la real en cualquier superficie, sin importar el tamaño de la caja.
    `rotate` intercambia U y V (p. ej. para orientar las tablas del piso a lo largo del cuarto)."""
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        n = poly.normal
        axis = max(range(3), key=lambda i: abs(n[i]))
        a, b = [i for i in range(3) if i != axis]
        for loop_index in poly.loop_indices:
            co = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            u, v = co[a] / tile, co[b] / tile
            uv_layer.data[loop_index].uv = (v, u) if rotate else (u, v)


def boxes(
    name: str,
    parts: Iterable[Bounds],
    material: bpy.types.Material,
    collection=None,
    uv_tile: float | None = None,
    uv_rotate: bool = False,
) -> bpy.types.Object:
    """Un objeto con una o varias cajas en la misma malla (p. ej. una pared con un hueco).
    Con `uv_tile` (metros por repetición) se generan UVs para materiales con textura."""
    verts: list[tuple[float, float, float]] = []
    faces: list[Sequence[int]] = []
    for part in parts:
        offset = len(verts)
        verts += _box_vertices(part)
        faces += [tuple(offset + i for i in face) for face in _FACES]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    # el orden de los vértices define las normales; se recalculan por las dudas
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    if uv_tile:
        add_box_uvs(mesh, uv_tile, uv_rotate)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def box(name: str, b: Bounds, material: bpy.types.Material, collection=None, **uv) -> bpy.types.Object:
    return boxes(name, [b], material, collection, **uv)
