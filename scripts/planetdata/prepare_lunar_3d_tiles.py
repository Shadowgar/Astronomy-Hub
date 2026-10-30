#!/usr/bin/env python3
"""Prepare a pinned, bounded Apollo 17 NAC 3D Tiles 1.1 quadtree.

Default is offline verification. --build consumes hash-checked original HTTP
ranges; --fetch explicitly acquires only those pinned ranges into a task cache.
Requires NumPy (no GDAL, mesh simplifier, fabricated elevation or global data).
"""

from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import urllib.request
import zlib
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
PIN = Path(__file__).with_name("lunar_apollo17_sources.json")
OUT = ROOT / "frontend/public/planet-terrain/apollo17-nac-v1"
RADIUS = 1737400.0
CROP_ROW, CROP_COL, SIZE = 6300, 4071, 1025
SKIRT_DEPTH = 80.0
BASE_URL = "/planet-terrain/apollo17-nac-v1/"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def verified_bytes(path, expected):
    data = Path(path).read_bytes()
    if sha256(data) != expected:
        raise ValueError(f"Source hash mismatch: {path}")
    return data


def pixel_lonlat(row, column):
    # Attached v1.9 label: offsets FROM pixel(1,1) TO projection origin.
    # CENTER_LATITUDE is the standard parallel, not an additive latitude offset.
    lat = np.degrees((129197.5 - np.asarray(row)) * 5.0 / RADIUS)
    lon = 180.0 + np.degrees(
        (np.asarray(column) - 855375.5) * 5.0 / (RADIUS * math.cos(math.radians(20.0)))
    )
    return lat, lon


def body_fixed(latitude, longitude, height):
    lat, lon = np.radians(latitude), np.radians(longitude)
    radius = RADIUS + np.asarray(height, dtype=np.float64)
    return np.stack(
        np.broadcast_arrays(
            radius * np.cos(lat) * np.cos(lon),
            radius * np.cos(lat) * np.sin(lon),
            radius * np.sin(lat),
        ),
        axis=-1,
    )


def local_frame(latitude, longitude, height):
    lat, lon = math.radians(latitude), math.radians(longitude)
    east = [-math.sin(lon), math.cos(lon), 0]
    north = [
        -math.sin(lat) * math.cos(lon),
        -math.sin(lat) * math.sin(lon),
        math.cos(lat),
    ]
    up = [math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)]
    return body_fixed(latitude, longitude, height), np.array([east, north, up]).T


def valid_samples(height, image, confidence):
    # Preserve legitimate signed imagery/elevations; reject documented special
    # pixels. Confidence quality is disclosed separately, not invented away.
    return (
        np.isfinite(height)
        & (height > -1e20)
        & (image > -32764)
        & (confidence > 0)
        & (confidence < 255)
    )


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def json_bytes(value):
    return (json.dumps(value, indent=2, allow_nan=False) + "\n").encode()


def fetch(cache):
    pin = json.loads(PIN.read_text())
    budget = 0
    for source in pin["sources"]:
        for suffix, start, end, expected in [
            (".head", 0, 32767, source["labelSha256"]),
            (".strip", *source["range"], source["sha256"]),
        ]:
            path = cache / (source["id"] + suffix)
            if path.exists():
                verified_bytes(path, expected)
                continue
            length = end - start + 1
            budget += length
            if budget > pin["networkBudgetBytes"]:
                raise ValueError("Acquisition budget exceeded")
            request = urllib.request.Request(
                source["url"],
                headers={"Range": f"bytes={start}-{end}", "If-Match": source["etag"]},
            )
            with urllib.request.urlopen(request, timeout=90) as response:
                if (
                    response.status != 206
                    or response.headers.get("Content-Range")
                    != f"bytes {start}-{end}/{source['originalBytes']}"
                ):
                    raise ValueError("Source server failed the exact range contract")
                data = response.read(length + 1)
            if len(data) != length or sha256(data) != expected:
                raise ValueError("Downloaded source length/hash mismatch")
            write(path, data)
    return budget


def png_gray(image):
    height, width = image.shape

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    scanlines = b"".join(b"\0" + row.tobytes() for row in image)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(scanlines, 9))
        + chunk(b"IEND", b"")
    )


def glb(positions_enu, uv, indices, png):
    # glTF Y-up -> 3D Tiles Z-up is applied by the standard loader.
    p = positions_enu[:, [0, 2, 1]].copy()
    p[:, 2] *= -1
    arrays = [p.astype("<f4"), uv.astype("<f4"), indices.astype("<u2")]
    blob = bytearray()
    views = []
    for array in arrays:
        while len(blob) % 4:
            blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": array.nbytes})
        blob.extend(array.tobytes())
    while len(blob) % 4:
        blob.append(0)
    views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(png)})
    blob.extend(png)
    while len(blob) % 4:
        blob.append(0)
    doc = {
        "asset": {
            "version": "2.0",
            "generator": "Astronomy Hub pinned LROC NAC converter",
        },
        "extensionsUsed": ["KHR_materials_unlit"],
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": views,
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(p),
                "type": "VEC3",
                "min": p.min(axis=0).tolist(),
                "max": p.max(axis=0).tolist(),
            },
            {"bufferView": 1, "componentType": 5126, "count": len(uv), "type": "VEC2"},
            {
                "bufferView": 2,
                "componentType": 5123,
                "count": indices.size,
                "type": "SCALAR",
            },
        ],
        "images": [{"bufferView": 3, "mimeType": "image/png"}],
        "samplers": [
            {"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}
        ],
        "textures": [{"source": 0, "sampler": 0}],
        "materials": [
            {
                "name": "PDS orthophoto; source illumination; display stretch",
                "extensions": {"KHR_materials_unlit": {}},
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 0},
                    "metallicFactor": 0,
                    "roughnessFactor": 1,
                },
            }
        ],
        "meshes": [
            {
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "TEXCOORD_0": 1},
                        "indices": 2,
                        "material": 0,
                    }
                ]
            }
        ],
    }
    js = json.dumps(doc, separators=(",", ":"), allow_nan=False).encode()
    js += b" " * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    return (
        struct.pack("<III", 0x46546C67, 2, total)
        + struct.pack("<II", len(js), 0x4E4F534A)
        + js
        + struct.pack("<II", len(blob), 0x004E4942)
        + blob
    )


def decode_glb(data):
    magic, version, length = struct.unpack_from("<III", data)
    if magic != 0x46546C67 or version != 2 or length != len(data):
        raise ValueError("Invalid GLB")
    n = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20 : 20 + n])
    binary = data[28 + n :]

    def accessor(i):
        a = doc["accessors"][i]
        v = doc["bufferViews"][a["bufferView"]]
        count = {"SCALAR": 1, "VEC2": 2, "VEC3": 3}[a["type"]]
        dtype = {5126: "<f4", 5123: "<u2"}[a["componentType"]]
        return np.frombuffer(
            binary, dtype=dtype, count=a["count"] * count, offset=v.get("byteOffset", 0)
        ).reshape(a["count"], count)

    return doc, accessor(0), accessor(2)


def build(cache, output):
    pin = json.loads(PIN.read_text())
    arrays = []
    sources = []
    for i, s in enumerate(pin["sources"]):
        raw = verified_bytes(cache / (s["id"] + ".strip"), s["sha256"])
        label = verified_bytes(cache / (s["id"] + ".head"), s["labelSha256"])
        text = label.split(b"\r\nEND\r\n")[0] + b"\r\nEND\r\n"
        write(output / "sources" / (s["id"] + ".lbl"), text)
        # A one-post halo was acquired for bounded source inspection.
        arrays.append(
            np.frombuffer(raw, dtype=s["dtype"]).reshape(1027, 9985)[
                1:-1, CROP_COL : CROP_COL + SIZE
            ]
        )
        sources.append(
            {
                **s,
                "attachedLabelSha256": sha256(text),
                "kind": ["elevation", "imagery", "metadata"][i],
                "hashScope": "exact original HTTP byte range, not full product",
                "license": "Public domain PDS product; NASA/GSFC/Arizona State University",
                "labelUrl": BASE_URL + "sources/" + s["id"] + ".lbl",
            }
        )
    heights, imagery, confidence = arrays
    valid = valid_samples(heights, imagery, confidence)
    if not valid.all():
        raise ValueError(
            "Selected bounded crop contains no-data; refusing fabricated fill"
        )
    lat, lon = pixel_lonlat(CROP_ROW + 512, CROP_COL + 512)
    center_height = float(heights[512, 512])
    origin, basis = local_frame(float(lat), float(lon), center_height)
    lats, lons = pixel_lonlat(
        np.arange(SIZE)[:, None] + CROP_ROW, np.arange(SIZE)[None, :] + CROP_COL
    )
    positions = ((body_fixed(lats, lons, heights) - origin) @ basis).astype(np.float32)
    lo, hi = np.percentile(imagery, [1, 99])
    display = np.rint(np.clip((imagery - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)
    tile_records = []

    def tile(level, x, y):
        step = 8 >> level
        span = 128 * step
        row = y * span
        col = x * span
        # Every vertex uses an original source post. No upsampling/no invented detail.
        p = (
            positions[row : row + span + 1 : step, col : col + span + 1 : step]
            .reshape(-1, 3)
            .copy()
        )
        n = 129
        # Border texels shared exactly, plus half-texel UV registration.
        texture = display[row : row + span + 1 : step, col : col + span + 1 : step]
        u, v = np.meshgrid((np.arange(n) + 0.5) / n, (np.arange(n) + 0.5) / n)
        uv = np.stack([u, v], axis=-1).reshape(-1, 2)
        a = (np.arange(n - 1)[:, None] * n + np.arange(n - 1)[None, :]).ravel()
        # North-to-south raster rows: reverse winding so normals face up.
        indices = np.stack([a, a + n, a + 1, a + 1, a + n, a + n + 1], axis=1).reshape(
            -1
        )
        boundary = np.concatenate(
            [
                np.arange(n),
                np.arange(1, n) * n + n - 1,
                np.arange(n - 2, -1, -1) + (n - 1) * n,
                np.arange(n - 2, 0, -1) * n,
            ]
        )
        skirt = p[boundary].copy()
        skirt[:, 2] -= SKIRT_DEPTH
        base = len(p)
        k = np.arange(len(boundary))
        following = (k + 1) % len(boundary)
        skirt_indices = np.stack(
            [
                boundary[k],
                base + k,
                boundary[following],
                boundary[following],
                base + k,
                base + following,
            ],
            axis=1,
        ).reshape(-1)
        p = np.concatenate([p, skirt])
        uv = np.concatenate([uv, uv[boundary]])
        indices = np.concatenate([indices, skirt_indices])
        data = glb(p, uv, indices, png_gray(texture))
        name = f"tiles/{level}/{x}/{y}.glb"
        write(output / name, data)
        dense_positions = positions[row : row + span + 1, col : col + span + 1]
        mins = dense_positions.min(axis=(0, 1)).copy()
        maxs = dense_positions.max(axis=(0, 1)).copy()
        mins[2] -= SKIRT_DEPTH
        center = (mins + maxs) * 0.5
        half = (maxs - mins) * 0.5 + 0.01
        # Measure coarse geometric deviation against the full-resolution input.
        dense = positions[row : row + span + 1, col : col + span + 1, 2]
        coarse = positions[row : row + span + 1 : step, col : col + span + 1 : step, 2]
        q = np.arange(span + 1) / step
        low = np.minimum(q.astype(int), 127)
        f = q - low
        r, c = np.meshgrid(low, low, indexing="ij")
        fr, fc = np.meshgrid(f, f, indexing="ij")
        interp = np.where(
            fr + fc <= 1,
            coarse[r, c]
            + fr * (coarse[r + 1, c] - coarse[r, c])
            + fc * (coarse[r, c + 1] - coarse[r, c]),
            coarse[r + 1, c + 1]
            + (1 - fr) * (coarse[r, c + 1] - coarse[r + 1, c + 1])
            + (1 - fc) * (coarse[r + 1, c] - coarse[r + 1, c + 1]),
        )
        error = float(np.max(np.abs(dense - interp))) if level < 3 else 0.0
        rec = {
            "uri": name,
            "sha256": sha256(data),
            "bytes": len(data),
            "level": level,
            "x": x,
            "y": y,
            "spacingM": 5 * step,
            "surfaceVertices": n * n,
            "skirtVertices": len(boundary),
            "triangles": len(indices) // 3,
            "measuredVerticalErrorM": error,
        }
        tile_records.append(rec)
        node = {
            "boundingVolume": {
                "box": [
                    float(v)
                    for v in [*center, half[0], 0, 0, 0, half[1], 0, 0, 0, half[2]]
                ]
            },
            "geometricError": max(error, 5 * step) if level < 3 else 0,
            "refine": "REPLACE",
            "content": {"uri": name},
        }
        if level < 3:
            node["children"] = [
                tile(level + 1, 2 * x + dx, 2 * y + dy)
                for dy in range(2)
                for dx in range(2)
            ]
        return node

    root = tile(0, 0, 0)
    transform = np.eye(4)
    transform[:3, :3] = basis
    transform[:3, 3] = origin
    root["transform"] = transform.flatten(order="F").tolist()
    tileset = {
        "asset": {"version": "1.1", "gltfUpAxis": "Y"},
        "geometricError": max(root["geometricError"] * 2, 200),
        "root": root,
        "extras": {
            "body": "Moon",
            "radiusM": RADIUS,
            "frame": "LROC_ME",
            "heightDatum": "radial metres above 1737400 m sphere",
        },
    }
    write(output / "tileset.json", json_bytes(tileset))
    unique, counts = np.unique(confidence, return_counts=True)
    manifest = {
        "schema": "oras.planet-terrain.v1",
        "regionId": "apollo17-nac-v1",
        "name": "Apollo 17 · Taurus–Littrow valley",
        "body": "moon",
        "radiusM": RADIUS,
        "frame": "LROC_ME",
        "heightDatum": "Radial metres above the 1737400 m lunar reference sphere",
        "latitudeDeg": float(lat),
        "longitudeDeg": float(lon),
        "centerBodyFixedM": origin.tolist(),
        "centerSurfaceHeightM": center_height,
        "extentM": [5120, 5120],
        "heightRangeM": [float(heights.min()), float(heights.max())],
        "tilesetUrl": BASE_URL + "tileset.json",
        "elevationResolutionM": 5,
        "imageryResolutionM": 5,
        "tiles": {
            "count": len(tile_records),
            "levels": 4,
            "maxContentBytes": max(t["bytes"] for t in tile_records),
            "totalBytes": sum(t["bytes"] for t in tile_records),
        },
        "sources": sources,
        "sourceDocumentation": pin.get("metadata", []),
        "sourceProductVersion": "v1.9",
        "sourceObservationInterval": ["2010-07-28T19:35:36", "2016-03-17T19:55:14"],
        "sourceQuality": {
            "lolaRmsM": 1.77,
            "reportedPrecisionM": 2.55,
            "confidenceInterpretation": "Original composite confidence values preserved as histogram. README documents 0-4,10-15; values 5-9 and16-19 remain uninterpreted; no per-pixel accuracy claim.",
            "confidenceHistogram": {
                str(int(k)): int(v) for k, v in zip(unique, counts)
            },
            "noDataPixels": int((~valid).sum()),
        },
        "crop": pin["crop"],
        "boundsDeg": {
            "west": float(lons.min()),
            "east": float(lons.max()),
            "south": float(lats.min()),
            "north": float(lats.max()),
        },
        "display": {
            "stretch": "linear 1st to 99th percentile of source signed DN; grayscale sRGB visualization",
            "minDN": float(lo),
            "maxDN": float(hi),
            "defaultMaterial": "KHR_materials_unlit",
            "skirtDepthM": SKIRT_DEPTH,
        },
        "attribution": "NASA/GSFC/Arizona State University · LROC NAC stereo DTM and matching orthophoto",
        "termsUrl": "https://www.lroc.im-ldi.com/about/terms",
        "limitations": [
            "Bounded 5.12 km regional patch; no global high-resolution lunar terrain.",
            "Source mean Earth/polar axis frame is documented; exact DE realization is not specified by this product. No claimed sub-metre alignment to ME421.",
            "5 m source posts, 2.55 m reported precision, 1.77 m LOLA RMS; the source contains low-confidence/interpolated stereo estimates.",
            "Source orthophoto retains acquisition shadows and relative display brightness; it is not calibrated albedo or current sunlight.",
            "80 m downward seam skirts are rendering geometry only and are not terrain measurements.",
            "No extrapolation, hole filling, synthetic craters or vertical exaggeration; source grid is directly decimated per LOD.",
            "Original whole products were not downloaded or SHA-hashed; pinned hashes cover exact original HTTP ranges.",
        ],
        "content": tile_records,
    }
    write(output / "manifest.json", json_bytes(manifest))
    return verify_pack(output)


def verify_pack(output):
    manifest = json.loads((output / "manifest.json").read_text())
    tileset = json.loads((output / "tileset.json").read_text())
    total = sum(p.stat().st_size for p in output.rglob("*") if p.is_file())
    if total > 64 * 1024 * 1024:
        raise ValueError("Served pack budget exceeded")
    transform = np.array(tileset["root"]["transform"]).reshape(4, 4, order="F")
    if not np.allclose(transform[:3, 3], manifest["centerBodyFixedM"]):
        raise ValueError("Body-fixed registration mismatch")
    if manifest["radiusM"] != RADIUS or manifest["elevationResolutionM"] != 5:
        raise ValueError("Wrong lunar source contract")
    for source in manifest["sources"]:
        verified_bytes(
            output / "sources" / (source["id"] + ".lbl"), source["attachedLabelSha256"]
        )
    grids = {}
    max_error = 0.0
    for tile in manifest["content"]:
        data = verified_bytes(output / tile["uri"], tile["sha256"])
        if len(data) != tile["bytes"]:
            raise ValueError("Tile size mismatch")
        _, p, idx = decode_glb(data)
        if not np.isfinite(p).all() or idx.max() >= len(p):
            raise ValueError("Invalid geometry")
        grid = p[: 129 * 129].reshape(129, 129, 3)
        grids[(tile["level"], tile["x"], tile["y"])] = grid
        # GLB Y-up -> source ENU; ensure first triangle faces radial-up.
        tri = p[idx[:3, 0]]
        if np.cross(tri[1] - tri[0], tri[2] - tri[0])[1] <= 0:
            raise ValueError("Inverted terrain face")
    for (level, x, y), grid in grids.items():
        east = grids.get((level, x + 1, y))
        south = grids.get((level, x, y + 1))
        if east is not None:
            max_error = max(max_error, float(np.max(np.abs(grid[:, -1] - east[:, 0]))))
        if south is not None:
            max_error = max(max_error, float(np.max(np.abs(grid[-1] - south[0]))))
    if max_error > 0.001:
        raise ValueError("Shared tile seams disagree")

    def walk(node):
        for child in node.get("children", []):
            if child["geometricError"] > node["geometricError"]:
                raise ValueError("Non-monotonic geometric error")
            walk(child)

    walk(tileset["root"])
    return {
        "tileCount": len(grids),
        "totalBytes": total,
        "finestSpacingM": min(t["spacingM"] for t in manifest["content"]),
        "reliefM": manifest["heightRangeM"][1] - manifest["heightRangeM"][0],
        "maxSharedEdgeDeltaM": max_error,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true")
    parser.add_argument("--build", action="store_true")
    parser.add_argument("--cache", type=Path, default=Path("/tmp/solar21-lunar-source"))
    parser.add_argument("--output", type=Path, default=OUT)
    args = parser.parse_args()
    if args.fetch:
        print("FETCH", fetch(args.cache), "bytes")
    print(
        "PASS",
        json.dumps(
            build(args.cache, args.output) if args.build else verify_pack(args.output),
            sort_keys=True,
        ),
    )


if __name__ == "__main__":
    main()
