#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import shutil
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional

HIPPARCOS_URL = 'https://cdsarc.cds.unistra.fr/ftp/cats/I/239/hip_main.dat'
MAX_LEVEL = 3
COLUMN_NAMES = (
    'Catalog', 'HIP', 'Proxy', 'RAhms', 'DEdms', 'Vmag',
    'VarFlag', 'r_Vmag', 'RAdeg', 'DEdeg', 'AstroRef', 'Plx', 'pmRA',
    'pmDE', 'e_RAdeg', 'e_DEdeg', 'e_Plx', 'e_pmRA', 'e_pmDE', 'DE:RA',
    'Plx:RA', 'Plx:DE', 'pmRA:RA', 'pmRA:DE', 'pmRA:Plx', 'pmDE:RA',
    'pmDE:DE', 'pmDE:Plx', 'pmDE:pmRA', 'F1', 'F2', '---', 'BTmag',
    'e_BTmag', 'VTmag', 'e_VTmag', 'm_BTmag', 'B-V', 'e_B-V', 'r_B-V',
    'V-I', 'e_V-I', 'r_V-I', 'CombMag', 'Hpmag', 'e_Hpmag', 'Hpscat',
    'o_Hpmag', 'm_Hpmag', 'Hpmax', 'HPmin', 'Period', 'HvarType',
    'moreVar', 'morePhoto', 'CCDM', 'n_CCDM', 'Nsys', 'Ncomp',
    'MultFlag', 'Source', 'Qual', 'm_HIP', 'theta', 'rho', 'e_rho',
    'dHp', 'e_dHp', 'Survey', 'Chart', 'Notes', 'HD', 'BD', 'CoD',
    'CPD', '(V-I)red', 'SpType', 'r_SpType',
)


@dataclass(frozen=True)
class TileBounds:
    ra_min_deg: float
    ra_max_deg: float
    dec_min_deg: float
    dec_max_deg: float


@dataclass(frozen=True)
class TileDescriptor:
    tile_id: str
    level: int
    parent_tile_id: Optional[str]
    child_tile_ids: List[str]
    bounds: TileBounds


def parse_args() -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parents[2]
    default_source = repo_root / 'data' / 'sky-engine' / 'hipparcos' / 'source' / 'hip_main.dat'
    default_output = repo_root / 'frontend' / 'public' / 'sky-engine-assets' / 'catalog' / 'hipparcos'
    default_lookup = Path(__file__).with_name('hipparcos_name_lookup.csv')

    parser = argparse.ArgumentParser(description='Generate Sky Engine runtime tiles from Hipparcos data.')
    parser.add_argument('--input', type=Path, default=default_source, help='Path to hip_main.dat or an equivalent pipe-delimited Hipparcos file.')
    parser.add_argument('--output', type=Path, default=default_output, help='Directory where manifest.json and tile files should be written.')
    parser.add_argument('--name-lookup', type=Path, default=default_lookup, help='Optional HIP-name enrichment CSV.')
    parser.add_argument('--download', action='store_true', help='Download the official hip_main.dat if the input file is missing.')
    parser.add_argument('--max-mag', type=float, default=6.5, help='Maximum V magnitude to emit into the first runtime slice.')
    return parser.parse_args()


def ensure_source_file(input_path: Path, allow_download: bool) -> Path:
    if input_path.exists():
      return input_path

    if not allow_download:
      raise FileNotFoundError(f'Missing Hipparcos source file: {input_path}. Re-run with --download to fetch {HIPPARCOS_URL}.')

    input_path.parent.mkdir(parents=True, exist_ok=True)
    print(f'Downloading Hipparcos catalog to {input_path}...')
    urllib.request.urlretrieve(HIPPARCOS_URL, input_path)
    return input_path


def load_name_lookup(path: Path) -> Dict[int, Dict[str, str]]:
    if not path.exists():
        return {}

    with path.open('r', encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        return {
            int(row['hip']): {
                'proper_name': row.get('proper_name', '').strip(),
                'bayer': row.get('bayer', '').strip(),
                'flamsteed': row.get('flamsteed', '').strip(),
                'constellation': row.get('constellation', '').strip(),
            }
            for row in reader
            if row.get('hip')
        }


def build_tile_descriptor(tile_id: str, level: int, parent_tile_id: Optional[str], bounds: TileBounds) -> TileDescriptor:
    child_tile_ids = [] if level >= MAX_LEVEL else [f'{tile_id}-{suffix}' for suffix in ('nw', 'ne', 'sw', 'se')]
    return TileDescriptor(tile_id=tile_id, level=level, parent_tile_id=parent_tile_id, child_tile_ids=child_tile_ids, bounds=bounds)


def subdivide_bounds(bounds: TileBounds) -> Dict[str, TileBounds]:
    ra_mid_deg = (bounds.ra_min_deg + bounds.ra_max_deg) / 2
    dec_mid_deg = (bounds.dec_min_deg + bounds.dec_max_deg) / 2
    return {
        'nw': TileBounds(bounds.ra_min_deg, ra_mid_deg, dec_mid_deg, bounds.dec_max_deg),
        'ne': TileBounds(ra_mid_deg, bounds.ra_max_deg, dec_mid_deg, bounds.dec_max_deg),
        'sw': TileBounds(bounds.ra_min_deg, ra_mid_deg, bounds.dec_min_deg, dec_mid_deg),
        'se': TileBounds(ra_mid_deg, bounds.ra_max_deg, bounds.dec_min_deg, dec_mid_deg),
    }


def build_tile_index() -> Dict[str, TileDescriptor]:
    descriptors: Dict[str, TileDescriptor] = {}

    def add_tile_family(descriptor: TileDescriptor) -> None:
        descriptors[descriptor.tile_id] = descriptor
        if descriptor.level >= MAX_LEVEL:
            return

        for suffix, bounds in subdivide_bounds(descriptor.bounds).items():
            add_tile_family(build_tile_descriptor(f'{descriptor.tile_id}-{suffix}', descriptor.level + 1, descriptor.tile_id, bounds))

    roots = [
        build_tile_descriptor('root-nw', 0, None, TileBounds(0, 180, 0, 90)),
        build_tile_descriptor('root-ne', 0, None, TileBounds(180, 360, 0, 90)),
        build_tile_descriptor('root-sw', 0, None, TileBounds(0, 180, -90, 0)),
        build_tile_descriptor('root-se', 0, None, TileBounds(180, 360, -90, 0)),
    ]

    for root in roots:
        add_tile_family(root)

    return descriptors


def parse_float(value: str) -> Optional[float]:
    stripped = value.strip()
    if not stripped:
        return None
    return float(stripped)


def parse_int(value: str) -> Optional[int]:
    stripped = value.strip()
    if not stripped:
        return None
    return int(stripped)


def resolve_tier(magnitude: float) -> str:
    if magnitude <= 2.5:
        return 'T0'
    if magnitude <= 6.5:
        return 'T1'
    if magnitude <= 10.5:
        return 'T2'
    return 'T3'


def round_optional(value: Optional[float], digits: int) -> Optional[float]:
    if value is None:
        return None
    return round(value, digits)


def iter_catalog_rows(source_path: Path) -> Iterator[Dict[str, str]]:
    with source_path.open('r', encoding='latin-1', newline='') as handle:
        reader = csv.reader(handle, delimiter='|')
        for row in reader:
            if len(row) < len(COLUMN_NAMES):
                continue
            yield {name: row[index].strip() for index, name in enumerate(COLUMN_NAMES)}


def normalize_runtime_star(row: Dict[str, str], name_lookup: Dict[int, Dict[str, str]]) -> Optional[Dict[str, object]]:
    hip = parse_int(row['HIP'])
    magnitude = parse_float(row['Vmag'])
    ra_deg = parse_float(row['RAdeg'])
    dec_deg = parse_float(row['DEdeg'])

    if hip is None or magnitude is None or ra_deg is None or dec_deg is None:
        return None

    lookup = name_lookup.get(hip, {})
    return {
        'id': f'hip-{hip}',
        'sourceId': f'HIP {hip}',
        'raDeg': round(ra_deg, 6),
        'decDeg': round(dec_deg, 6),
        'pmRaMasYr': round_optional(parse_float(row['pmRA']), 3),
        'pmDecMasYr': round_optional(parse_float(row['pmDE']), 3),
        'parallaxMas': round_optional(parse_float(row['Plx']), 3),
        'mag': round(magnitude, 2),
        'colorIndex': round_optional(parse_float(row['B-V']), 3),
        'tier': resolve_tier(magnitude),
        'properName': lookup.get('proper_name') or None,
        'bayer': lookup.get('bayer') or None,
        'flamsteed': lookup.get('flamsteed') or None,
        'constellation': lookup.get('constellation') or None,
    }


def get_root_tile_id(ra_deg: float, dec_deg: float) -> str:
    if dec_deg >= 0:
        return 'root-ne' if ra_deg >= 180 else 'root-nw'
    return 'root-se' if ra_deg >= 180 else 'root-sw'


def choose_child_tile(parent: TileDescriptor, ra_deg: float, dec_deg: float, descriptor_map: Dict[str, TileDescriptor]) -> Optional[TileDescriptor]:
    if parent.level >= MAX_LEVEL:
        return None

    ra_mid_deg = (parent.bounds.ra_min_deg + parent.bounds.ra_max_deg) / 2
    dec_mid_deg = (parent.bounds.dec_min_deg + parent.bounds.dec_max_deg) / 2

    if dec_deg >= dec_mid_deg:
        suffix = 'ne' if ra_deg >= ra_mid_deg else 'nw'
    else:
        suffix = 'se' if ra_deg >= ra_mid_deg else 'sw'

    return descriptor_map.get(f'{parent.tile_id}-{suffix}')


def assign_star_to_tile_path(star: Dict[str, object], descriptor_map: Dict[str, TileDescriptor]) -> List[str]:
    ra_deg = float(star['raDeg'])
    dec_deg = float(star['decDeg'])
    current = descriptor_map[get_root_tile_id(ra_deg, dec_deg)]
    tile_path = [current.tile_id]

    while current.level < MAX_LEVEL:
        next_tile = choose_child_tile(current, ra_deg, dec_deg, descriptor_map)
        if not next_tile:
            break
        tile_path.append(next_tile.tile_id)
        current = next_tile

    return tile_path


def build_label_candidate(star: Dict[str, object]) -> Optional[Dict[str, object]]:
    label = star.get('properName') or star.get('bayer') or star.get('flamsteed')
    magnitude = float(star['mag'])

    if not label or magnitude > 4.6:
        return None

    priority = int(max(48, round((11.5 - magnitude) * 16)))
    if star.get('properName'):
        priority += 18

    return {
        'starId': star['id'],
        'label': label,
        'priority': priority,
    }


def emit_tiles(stars: Iterable[Dict[str, object]], descriptor_map: Dict[str, TileDescriptor], output_dir: Path, source_path: Path) -> None:
    generated_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    tile_star_map: Dict[str, List[Dict[str, object]]] = defaultdict(list)
    tile_label_map: Dict[str, Dict[str, Dict[str, object]]] = defaultdict(dict)
    emitted_count = 0

    for star in stars:
        emitted_count += 1
        for tile_id in assign_star_to_tile_path(star, descriptor_map):
            tile_star_map[tile_id].append(star)
            candidate = build_label_candidate(star)
            if candidate:
                existing = tile_label_map[tile_id].get(str(candidate['starId']))
                if not existing or int(candidate['priority']) > int(existing['priority']):
                    tile_label_map[tile_id][str(candidate['starId'])] = candidate

    if output_dir.exists():
        shutil.rmtree(output_dir)
    tiles_dir = output_dir / 'tiles'
    tiles_dir.mkdir(parents=True, exist_ok=True)

    manifest_tiles: Dict[str, Dict[str, object]] = {}
    total_star_records = 0

    for tile_id in sorted(tile_star_map.keys()):
        descriptor = descriptor_map[tile_id]
        tile_stars = sorted(tile_star_map[tile_id], key=lambda star: (float(star['mag']), str(star['id'])))
        total_star_records += len(tile_stars)
        magnitudes = [float(star['mag']) for star in tile_stars]
        tier_set = sorted({str(star['tier']) for star in tile_stars})
        payload = {
            'tileId': tile_id,
            'level': descriptor.level,
            'parentTileId': descriptor.parent_tile_id,
            'childTileIds': descriptor.child_tile_ids,
            'bounds': {
                'raMinDeg': descriptor.bounds.ra_min_deg,
                'raMaxDeg': descriptor.bounds.ra_max_deg,
                'decMinDeg': descriptor.bounds.dec_min_deg,
                'decMaxDeg': descriptor.bounds.dec_max_deg,
            },
            'magMin': round(min(magnitudes), 2),
            'magMax': round(max(magnitudes), 2),
            'starCount': len(tile_stars),
            'stars': [{key: value for key, value in star.items() if key != 'constellation' and value is not None} for star in tile_stars],
            'labelCandidates': sorted(tile_label_map[tile_id].values(), key=lambda candidate: (-int(candidate['priority']), str(candidate['label']))),
            'provenance': {
                'catalog': 'hipparcos',
                'sourcePath': str(source_path),
                'generator': 'scripts/sky-engine/build_hipparcos_tiles.py',
                'generatedAt': generated_at,
                'sourceRecordCount': emitted_count,
                'tierSet': tier_set,
            },
        }
        tile_path = tiles_dir / f'{tile_id}.json'
        tile_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
        manifest_tiles[tile_id] = {
            'path': f'tiles/{tile_id}.json',
            'level': descriptor.level,
            'starCount': len(tile_stars),
            'magMin': round(min(magnitudes), 2),
            'magMax': round(max(magnitudes), 2),
        }

    manifest = {
        'schemaVersion': 'sky-runtime-tile.v1',
        'catalog': 'hipparcos',
        'tileIndex': 'equatorial-quadtree-v1',
        'generatedAt': generated_at,
        'generator': 'scripts/sky-engine/build_hipparcos_tiles.py',
        'sourcePath': str(source_path),
        'sourceRecordCount': emitted_count,
        'maxLevel': MAX_LEVEL,
        'tileCount': len(manifest_tiles),
        'totalStarRecords': total_star_records,
        'tiles': manifest_tiles,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'Generated {len(manifest_tiles)} tile assets with {emitted_count} source stars into {output_dir}')


def main() -> None:
    args = parse_args()
    source_path = ensure_source_file(args.input, args.download)
    name_lookup = load_name_lookup(args.name_lookup)
    descriptor_map = build_tile_index()
    stars = []
    for row in iter_catalog_rows(source_path):
        star = normalize_runtime_star(row, name_lookup)
        if not star:
            continue
        if float(star['mag']) > args.max_mag:
            continue
        stars.append(star)

    emit_tiles(stars, descriptor_map, args.output, source_path)


if __name__ == '__main__':
    main()