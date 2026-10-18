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


def _link(obj: bpy.types.Object, collection=None) -> bpy.types.Object:
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def _mesh_object(name: str, verts, faces, material: bpy.types.Material, uvs=None) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    if uvs is not None:
        layer = mesh.uv_layers.new(name="UVMap")
        for poly in mesh.polygons:
            for loop_index in poly.loop_indices:
                layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]
    mesh.materials.append(material)
    return _link(bpy.data.objects.new(name, mesh))


def bar(name: str, p0: Sequence[float], p1: Sequence[float], width: float, depth: float,
        material: bpy.types.Material, side: Sequence[float] = (1, 0, 0)) -> bpy.types.Object:
    """Barra de sección rectangular (width × depth, en cm) entre dos puntos del cuarto (x, d, up en cm).
    `side` indica hacia dónde se mide `width` (por defecto, a lo largo de x)."""
    from mathutils import Vector

    a, b = Vector(to_blender(*p0)), Vector(to_blender(*p1))
    axis = (b - a).normalized()
    s = Vector(to_blender(*side)) - Vector(to_blender(0, 0, 0))
    u = (s - axis * s.dot(axis)).normalized() * (width / 200)  # mitad del ancho, en metros
    v = axis.cross(u).normalized() * (depth / 200)
    corners = [-u - v, u - v, u + v, -u + v]
    verts = [tuple(a + c) for c in corners] + [tuple(b + c) for c in corners]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    obj = _mesh_object(name, verts, faces, material)
    _recalc_normals(obj.data)
    return obj


def quad(name: str, corners: Sequence[Sequence[float]], material: bpy.types.Material) -> bpy.types.Object:
    """Plano de 4 esquinas del cuarto (cm) en orden: abajo-izq, abajo-der, arriba-der, arriba-izq,
    vistas desde el frente. La imagen del material cubre el plano entero (UV 0–1)."""
    verts = [to_blender(*c) for c in corners]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    return _mesh_object(name, verts, [(0, 1, 2, 3)], material, uvs)


def _recalc_normals(mesh: bpy.types.Mesh) -> None:
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()


def group(name: str, children: Iterable[bpy.types.Object], origin: Sequence[float]) -> bpy.types.Object:
    """Nodo vacío (Empty) que agrupa las piezas de un objeto seleccionable (item_*).
    `origin` (cm del cuarto) es su punto de referencia; los hijos conservan su posición en el mundo."""
    empty = _link(bpy.data.objects.new(name, None))
    empty.location = to_blender(*origin)
    bpy.context.view_layer.update()
    for child in children:
        world = child.matrix_world.copy()
        child.parent = empty
        child.matrix_world = world
    return empty
