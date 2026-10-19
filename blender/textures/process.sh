#!/usr/bin/env bash
# Procesa las texturas que usa Blender y deja el resultado en blender/textures/processed/ (ignorado en git).
#   PBR (Poly Haven): tiñe el color base para que coincida con el cuarto real.
#   (5.3) Fotos del usuario: corrección de perspectiva y recorte; ver sources.json.
# Uso: npm run textures   (fetch + process)
set -euo pipefail
cd "$(dirname "$0")"
SRC=polyhaven
OUT=processed
mkdir -p "$OUT"

# tint <entrada> <salida> <saturación %> <R> <G> <B>
# 1) baja la saturación (-modulate) para quitar el tono original;
# 2) multiplica cada canal para que el promedio quede en el color meta (0-255).
tint() {
  local in=$1 out=$2 sat=$3 r=$4 g=$5 b=$6
  local tmp="$OUT/.tmp.png"
  magick "$in" -modulate 100,"$sat",100 "$tmp"
  read -r mr mg mb < <(magick "$tmp" -resize 64x64! -format '%[fx:255*mean.r] %[fx:255*mean.g] %[fx:255*mean.b]\n' info:)
  magick "$tmp" \
    -channel R -evaluate multiply "$(echo "$r / $mr" | bc -l)" \
    -channel G -evaluate multiply "$(echo "$g / $mg" | bc -l)" \
    -channel B -evaluate multiply "$(echo "$b / $mb" | bc -l)" \
    +channel -quality 92 "$out"
  rm -f "$tmp"
  echo "[textures] $out → promedio $(magick "$out" -resize 64x64! -format '%[fx:round(255*mean.r)],%[fx:round(255*mean.g)],%[fx:round(255*mean.b)]' info:) (meta $r,$g,$b)"
}

# Metas de color (albedo). Hasta el grupo 12 salían de las fotos del cuarto (nota 07);
# el rediseño (redesign-showroom-style, D4) usa la paleta cálida del mock de Claude Design:
#   piso   hsl(26 28% 30%) del mock, algo más claro porque el horneado lo oscurece  (antes 117,101,88)
#   zócalo #3a2a20                                                                 (antes 95,72,52)
#   pared  #f0e6da crema                                                           (antes 215,214,210)
tint "$SRC/laminate_floor_02_diff_2k.jpg" "$OUT/floor_diff.jpg" 70 112 82 60
tint "$SRC/laminate_floor_02_diff_2k.jpg" "$OUT/baseboard_diff.jpg" 60 58 42 32
tint "$SRC/beige_wall_001_diff_2k.jpg" "$OUT/wall_diff.jpg" 25 240 230 218

# Normal y rugosidad no cambian de color: se copian tal cual
cp "$SRC/laminate_floor_02_nor_gl_2k.jpg" "$OUT/floor_nor.jpg"
cp "$SRC/laminate_floor_02_rough_2k.jpg" "$OUT/floor_rough.jpg"
cp "$SRC/beige_wall_001_nor_gl_2k.jpg" "$OUT/wall_nor.jpg"
cp "$SRC/beige_wall_001_rough_2k.jpg" "$OUT/wall_rough.jpg"
