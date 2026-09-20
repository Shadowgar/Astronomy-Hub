"""Shared, JSON-safe stellar science for catalog metadata and native STAR tiles.

Astrometric quantities use degrees, Julian years, mas/year (RA includes cos Dec),
mas parallax and km/s radial velocity. No epoch is inferred from a catalog name.
Photometry retains the source band even when SWE uses an approximate V value.
"""
from __future__ import annotations

from collections import defaultdict
import math
from typing import Any, Iterable

SCHEMA_VERSION = 1
SUPPLEMENTAL_RENDER_CATALOGS = {"gliese cns3"}
GAIA_BP_RP_RANGE = (-0.5, 5.0)
JOHNSON_BV_RANGE = (-0.4, 3.3)
TYCHO_BT_VT_RANGE = (-0.2, 1.8)

def _build_utab() -> list[int]:
    values: list[int] = []
    for m in range(256):
        value = (
            (m & 0x01)
            | ((m & 0x02) << 1)
            | ((m & 0x04) << 2)
            | ((m & 0x08) << 3)
            | ((m & 0x10) << 4)
            | ((m & 0x20) << 5)
            | ((m & 0x40) << 6)
            | ((m & 0x80) << 7)
        )
        values.append(value)
    return values


UTAB = _build_utab()


def healpix_xyf2nest(nside: int, ix: int, iy: int, face_num: int) -> int:
    return (
        face_num * nside * nside
        + (UTAB[ix & 0xFF] | (UTAB[ix >> 8] << 16) | (UTAB[iy & 0xFF] << 1) | (UTAB[iy >> 8] << 17))
    )


def _fmodulo(value: float, divisor: float) -> float:
    if value >= 0:
        return value if value < divisor else math.fmod(value, divisor)
    result = math.fmod(value, divisor) + divisor
    return 0.0 if result == divisor else result


def healpix_ang2pix(nside: int, theta: float, phi: float) -> int:
    z = math.cos(theta)
    za = abs(z)
    tt = _fmodulo(phi, 2 * math.pi) * (2 / math.pi)

    if za <= 2.0 / 3.0:
        temp1 = nside * (0.5 + tt)
        temp2 = nside * (z * 0.75)
        jp = int(temp1 - temp2)
        jm = int(temp1 + temp2)
        ifp = jp // nside
        ifm = jm // nside
        face_num = (ifp | 4) if ifp == ifm else (ifp if ifp < ifm else ifm + 8)
        ix = jm & (nside - 1)
        iy = nside - (jp & (nside - 1)) - 1
    else:
        ntt = int(tt)
        if ntt >= 4:
            ntt = 3
        tp = tt - ntt
        tmp = nside * math.sqrt(3 * (1 - za))
        jp = int(tp * tmp)
        jm = int((1.0 - tp) * tmp)
        if jp >= nside:
            jp = nside - 1
        if jm >= nside:
            jm = nside - 1
        if z >= 0:
            face_num = ntt
            ix = nside - jm - 1
            iy = nside - jp - 1
        else:
            face_num = ntt + 8
            ix = jp
            iy = jm

    return healpix_xyf2nest(nside, ix, iy, face_num)


def safe_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def native_epoch(record: dict[str, Any]) -> float:
    value = safe_float(record.get("coordinate_epoch"))
    if value is None:
        raise ValueError("star coordinate_epoch is required; rebuild stale catalog metadata")
    return value


def parse_hip_number(record: dict[str, Any]) -> int:
    hip_id = _clean_identifier(record.get("hip_id"), "HIP")
    if hip_id.isdigit():
        return int(hip_id)
    values = [record.get("source_id"), record.get("display_name")]
    values.extend(record.get("names") or [])
    values.extend(record.get("aliases") or [])
    for value in values:
        text = str(value or "").strip().upper()
        if text.startswith("HIP-"):
            text = "HIP " + text[4:]
        if text.startswith("HIP "):
            digits = "".join(ch for ch in text[4:] if ch.isdigit())
            if digits:
                return int(digits)
    return 0


def parse_gaia_id(record: dict[str, Any]) -> int:
    gaia_id = str(record.get("gaia_id") or "").strip()
    if gaia_id.isdigit():
        return int(gaia_id)
    if str(record.get("catalog") or "").lower().startswith("gaia"):
        source_id = str(record.get("source_id") or "").strip()
        if source_id.isdigit():
            return int(source_id)
    return 0


def _clean_identifier(value: Any, prefix: str = "") -> str:
    text = str(value or "").strip()
    if prefix and text.upper().startswith(prefix.upper() + " "):
        text = text[len(prefix) + 1 :].strip()
    if prefix and text.upper().startswith(prefix.upper() + "-"):
        text = text[len(prefix) + 1 :].strip()
    return text


def _record_identity(record: dict[str, Any]) -> dict[str, str]:
    catalog = str(record.get("catalog") or "").casefold()
    source_id = str(record.get("source_id") or "").strip()
    identity: dict[str, str] = {}
    gaia_id = _clean_identifier(record.get("gaia_id"))
    if not gaia_id and catalog.startswith("gaia") and source_id.isdigit():
        gaia_id = source_id
    if gaia_id.isdigit():
        identity["gaia_id"] = gaia_id

    hip_id = _clean_identifier(record.get("hip_id"), "HIP")
    if not hip_id:
        parsed_hip = parse_hip_number(record)
        hip_id = str(parsed_hip) if parsed_hip else ""
    if hip_id.isdigit():
        identity["hip_id"] = hip_id

    tycho2_id = _clean_identifier(record.get("tycho2_id"), "TYC")
    if not tycho2_id and "tycho" in catalog:
        tycho2_id = _clean_identifier(source_id, "TYC")
    if tycho2_id:
        identity["tycho2_id"] = tycho2_id
    return identity


def _record_priority(record: dict[str, Any]) -> tuple[int, str, str]:
    catalog = str(record.get("catalog") or "").casefold()
    if catalog.startswith("gaia"):
        rank = 0
    elif "hipparcos" in catalog:
        rank = 1
    elif "tycho" in catalog:
        rank = 2
    else:
        rank = 3
    return rank, catalog, str(record.get("source_id") or "")


def _gaia_g_minus_v(bp_rp: float) -> float:
    return -0.02704 + 0.01424 * bp_rp - 0.2156 * bp_rp**2 + 0.01426 * bp_rp**3


def _johnson_g_minus_v(bv: float) -> float:
    return -0.04749 - 0.0124 * bv - 0.2901 * bv**2 + 0.02008 * bv**3


def _gaia_bp_rp_to_johnson_bv(bp_rp: float) -> float | None:
    if not GAIA_BP_RP_RANGE[0] <= bp_rp <= GAIA_BP_RP_RANGE[1]:
        return None
    target = _gaia_g_minus_v(bp_rp)
    # The Johnson polynomial has a shallow maximum in the blue-star range, so
    # invert each monotonic branch independently instead of bisecting the full
    # domain as though it were monotonic.
    derivative_discriminant = 0.5802**2 + 4 * 0.06024 * 0.0124
    turning_point = (0.5802 - math.sqrt(derivative_discriminant)) / (2 * 0.06024)
    candidates: list[float] = []
    for low, high in (
        (JOHNSON_BV_RANGE[0], turning_point),
        (turning_point, JOHNSON_BV_RANGE[1]),
    ):
        low_value = _johnson_g_minus_v(low)
        high_value = _johnson_g_minus_v(high)
        if not min(low_value, high_value) <= target <= max(low_value, high_value):
            continue
        increasing = low_value < high_value
        for _ in range(60):
            midpoint = (low + high) / 2
            value = _johnson_g_minus_v(midpoint)
            if (value < target) == increasing:
                low = midpoint
            else:
                high = midpoint
        candidates.append((low + high) / 2)
    if not candidates:
        return None
    return min(candidates, key=lambda candidate: abs(candidate - bp_rp))


def _first_finite(records: list[dict[str, Any]], field: str) -> float | None:
    for record in records:
        value = safe_float(record.get(field))
        if value is not None:
            return value
    return None


def _resolve_photometry(records: list[dict[str, Any]]) -> dict[str, Any] | None:
    for record in records:
        vmag = safe_float(record.get("johnson_v_mag"))
        if vmag is None and str(record.get("magnitude_band") or "") == "V":
            vmag = safe_float(record.get("magnitude"))
        if vmag is None:
            continue
        bv = safe_float(record.get("johnson_bv"))
        if bv is None and str(record.get("magnitude_band") or "") == "V":
            bv = safe_float(record.get("color_index"))
        gaia_g_mag = _first_finite(records, "gaia_g_mag")
        return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
            "render_vmag": vmag,
            "render_gmag": gaia_g_mag if gaia_g_mag is not None else vmag,
            "render_bv": bv if bv is not None else None,
            "photometry_source": "johnson",
        }

    for record in records:
        bt_mag = safe_float(record.get("tycho_bt_mag"))
        vt_mag = safe_float(record.get("tycho_vt_mag"))
        if vt_mag is None and str(record.get("magnitude_band") or "") == "Tycho V_T":
            vt_mag = safe_float(record.get("magnitude"))
        if vt_mag is None:
            continue
        if bt_mag is None:
            return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
                "render_vmag": vt_mag,
                "render_gmag": vt_mag,
                "render_bv": None,
                "photometry_source": "tycho_vt_only",
            }
        color = bt_mag - vt_mag
        if not TYCHO_BT_VT_RANGE[0] <= color <= TYCHO_BT_VT_RANGE[1]:
            return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
                "render_vmag": vt_mag,
                "render_gmag": vt_mag,
                "render_bv": None,
                "photometry_source": "tycho_vt_only",
            }
        return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
            "render_vmag": vt_mag - 0.09 * color,
            "render_gmag": vt_mag,
            "render_bv": 0.85 * color,
            "photometry_source": "tycho_transformed",
        }

    for record in records:
        gmag = safe_float(record.get("gaia_g_mag"))
        if gmag is None and str(record.get("magnitude_band") or "") == "Gaia G":
            gmag = safe_float(record.get("magnitude"))
        if gmag is None:
            continue
        bp_rp = safe_float(record.get("gaia_bp_rp"))
        if bp_rp is None and str(record.get("magnitude_band") or "") == "Gaia G":
            bp_rp = safe_float(record.get("color_index"))
        bv = _gaia_bp_rp_to_johnson_bv(bp_rp) if bp_rp is not None else None
        if bv is None:
            return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
                "render_vmag": gmag,
                "render_gmag": gmag,
                "render_bv": None,
                "photometry_source": "gaia_g_only",
            }
        return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
            "render_vmag": gmag - _gaia_g_minus_v(bp_rp),
            "render_gmag": gmag,
            "render_bv": bv,
            "photometry_source": "gaia_edr3_transformed",
        }

    for record in records:
        magnitude = safe_float(record.get("magnitude"))
        if magnitude is not None:
            return {
                "photometry_source_catalog": str(record.get("catalog") or ""),
                "photometry_source_id": str(record.get("source_id") or ""),
                "render_vmag": magnitude,
                "render_gmag": magnitude,
                "render_bv": None,
                "photometry_source": "catalog_magnitude_only",
            }
    return None



def _source_color(record: dict[str, Any]) -> tuple[float | None, str | None]:
    color = safe_float(record.get('color_index'))
    band = record.get('color_index_band')
    if color is not None and band:
        return color, str(band)
    for field, label in (('johnson_bv', 'Johnson B-V'), ('gaia_bp_rp', 'Gaia BP-RP')):
        value = safe_float(record.get(field))
        if value is not None:
            return value, label
    bt, vt = safe_float(record.get('tycho_bt_mag')), safe_float(record.get('tycho_vt_mag'))
    if bt is not None and vt is not None:
        return bt - vt, 'Tycho B_T-V_T'
    return None, None


def normalize_star_science(record: dict[str, Any], *, photometry_records: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Normalize one explicitly dated ICRS astrometric solution without inventing values."""
    epoch = native_epoch(record)
    frame = str(record.get('coordinate_frame') or '')
    if frame != 'ICRS':
        raise ValueError('star coordinate_frame must be explicitly normalized to ICRS')
    ra, dec = safe_float(record.get('ra')), safe_float(record.get('dec'))
    if ra is None or dec is None or not 0 <= ra < 360 or not -90 <= dec <= 90:
        raise ValueError('star coordinates must be finite and in range')
    photometry = _resolve_photometry(photometry_records or [record])
    method = photometry['photometry_source'] if photometry else None
    visual_method = method if method in ('johnson', 'tycho_transformed', 'gaia_edr3_transformed') else None
    render = photometry['render_vmag'] if photometry else None
    render_band = 'V' if visual_method else {'gaia_g_only': 'Gaia G', 'tycho_vt_only': 'Tycho V_T'}.get(method, record.get('magnitude_band'))
    color, color_band = _source_color(record)
    ids = _record_identity(record)
    identity = (f"HIP {ids['hip_id']}" if ids.get('hip_id') else
                f"GAIA {ids['gaia_id']}" if ids.get('gaia_id') else
                f"TYC {ids['tycho2_id']}" if ids.get('tycho2_id') else None)
    bv = safe_float(photometry.get('render_bv')) if photometry else None
    science = {
        'schema_version': SCHEMA_VERSION, 'ra': ra, 'dec': dec,
        'coordinate_epoch': epoch, 'coordinate_frame': frame,
        'proper_motion_ra_mas_per_year': safe_float(record.get('proper_motion_ra')),
        'proper_motion_dec_mas_per_year': safe_float(record.get('proper_motion_dec')),
        'parallax_mas': safe_float(record.get('parallax')),
        'radial_velocity_km_s': safe_float(record.get('radial_velocity_km_s')),
        'spectral_type': str(record.get('spectral_type') or '').strip() or None,
        'source_catalog': str(record.get('catalog') or ''),
        'source_id': str(record.get('source_id') or ''),
        'source_magnitude': safe_float(record.get('magnitude')),
        'source_magnitude_band': str(record.get('magnitude_band') or '') or None,
        'visual_magnitude': render if visual_method else None,
        'visual_magnitude_method': visual_method,
        'render_magnitude': render, 'render_magnitude_band': render_band,
        'render_magnitude_method': method,
        'photometry_source_catalog': photometry.get('photometry_source_catalog') if photometry else None,
        'photometry_source_id': photometry.get('photometry_source_id') if photometry else None,
        'color_index': color, 'color_index_band': color_band,
        'bv': bv, 'bv_method': method if bv is not None else None,
        'gaia_id': ids.get('gaia_id'), 'hip_id': ids.get('hip_id'), 'tycho2_id': ids.get('tycho2_id'),
        'native_tile': {'order': 3, 'pix': healpix_ang2pix(8, math.radians(90-dec), math.radians(ra)), 'identity': identity} if identity else None,
    }
    return science


def _merge_star_group(records: list[dict[str, Any]]) -> dict[str, Any] | None:
    ordered = sorted(records, key=_record_priority)
    astrometry = ordered[0]
    # Validate every contributing record, including inputs whose astrometry loses
    # reconciliation. A stale row must not silently become a plausible new tile.
    for record in ordered:
        normalize_star_science(record)
    photometry = _resolve_photometry(ordered)
    if photometry is None:
        return None
    ids: dict[str, str] = {}
    aliases: list[str] = []
    for record in ordered:
        ids.update({k: v for k, v in _record_identity(record).items() if k not in ids})
        for value in [record.get('display_name'), record.get('source_id'), *(record.get('names') or []), *(record.get('aliases') or [])]:
            if value and str(value) not in aliases:
                aliases.append(str(value))
    common_names = list(dict.fromkeys(name for record in ordered for name in record.get('common_names', [])))
    aliases = list(dict.fromkeys([*('NAME '+name for name in common_names), *aliases]))
    result = {**astrometry, **ids, **photometry, 'aliases': aliases, 'common_names': common_names}
    science = normalize_star_science(result, photometry_records=ordered)
    science['ambiguous_cross_ids'] = astrometry.get('ambiguous_cross_ids') or {}
    science['canonical_catalog'] = str(astrometry['catalog'])
    science['canonical_source_id'] = str(astrometry['source_id'])
    # A spectrum may enrich an identity but proper motion/parallax/RV must stay
    # together with their own astrometric solution, never mixed across epochs.
    science['spectral_type'] = next((str(r['spectral_type']) for r in ordered if r.get('spectral_type')), None)
    result['spectral_type'] = science['spectral_type']
    result['star_science'] = science
    return result


def _identity_groups(records: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    parents = list(range(len(records)))
    def find(index):
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index
    owners = {}
    for index, record in enumerate(records):
        for identity in _record_identity(record).items():
            if identity in owners:
                parents[find(index)] = find(owners[identity])
            else:
                owners[identity] = index
    groups = defaultdict(list)
    for index, record in enumerate(records):
        groups[find(index)].append(record)
    return list(groups.values())


def _isolate_ambiguous_components(group: list[dict[str, Any]]) -> tuple[list[list[dict[str, Any]]], int]:
    identities = defaultdict(set)
    for record in group:
        for key, value in _record_identity(record).items():
            identities[key].add(value)
    if all(len(values) <= 1 for values in identities.values()):
        return [group], 0
    # A many-to-one component crossmatch is not evidence that two IDs from the
    # same catalog are one star. Preserve each catalog's own identities and
    # discard only cross-catalog merge edges, retaining raw edges in the source.
    isolated, affected = [], 0
    for record in group:
        ids = _record_identity(record)
        catalog = str(record.get('catalog') or '').casefold()
        own = 'gaia_id' if catalog.startswith('gaia') else 'hip_id' if 'hipparcos' in catalog else 'tycho2_id' if 'tycho' in catalog else None
        removed = {key: value for key, value in ids.items() if key != own}
        clean = dict(record)
        for key in ('gaia_id', 'hip_id', 'tycho2_id'):
            clean.pop(key, None)
        if own in ids:
            clean[own] = ids[own]
        if own != 'hip_id':
            clean['common_names'] = []
            clean['display_name'] = str(record['catalog']) + ' ' + str(record['source_id'])
            clean['names'] = [clean['display_name']]
            clean['aliases'] = []
        else:
            clean['aliases'] = [a for a in record.get('aliases', []) if not str(a).upper().startswith(('GAIA ', 'TYC '))]
        clean['ambiguous_cross_ids'] = removed
        affected += bool(removed)
        isolated.append(clean)
    return _identity_groups(isolated), affected


def reconcile_star_records(records: Iterable[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Reconcile explicit, unambiguous cross-identifiers; retain distinct components."""
    source_records = [r for r in records if r.get('model') == 'star']
    eligible = [r for r in source_records if str(r.get('catalog') or '').casefold() not in SUPPLEMENTAL_RENDER_CATALOGS or _record_identity(r)]
    groups, ambiguous_count = [], 0
    for group in _identity_groups(eligible):
        subgroups, affected = _isolate_ambiguous_components(group)
        groups.extend(subgroups)
        ambiguous_count += affected
    canonical, skipped = [], 0
    for group in groups:
        merged = _merge_star_group(group)
        if merged is not None:
            canonical.append(merged)
        else:
            skipped += len(group)
    canonical.sort(key=lambda r: (r['catalog'], r['source_id']))
    return canonical, {
        'source_records': len(source_records), 'canonical_records': len(canonical),
        'merged_records': len(eligible) - len(groups),
        'skipped_unmatched_supplemental': len(source_records) - len(eligible),
        'skipped_missing_photometry': skipped,
        'ambiguous_cross_id_records': ambiguous_count,
    }


def attach_canonical_star_science(source_records: Iterable[dict[str, Any]], canonical_records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id, by_source = {}, {}
    for canonical in canonical_records:
        by_source[(canonical['catalog'], canonical['source_id'])] = canonical
        for key, value in _record_identity(canonical).items():
            by_id[(key, value)] = canonical
    result = []
    source_fields = ('source_catalog', 'source_id', 'source_magnitude', 'source_magnitude_band', 'color_index', 'color_index_band')
    for record in source_records:
        source = normalize_star_science(record)
        canonical = by_source.get((record['catalog'], record['source_id']))
        canonical = canonical or next((by_id[(k, v)] for k, v in _record_identity(record).items() if (k, v) in by_id), None)
        contract = dict(canonical['star_science']) if canonical else dict(source)
        contract.update({key: source[key] for key in source_fields})
        result.append({**record, 'source_star_science': source, 'star_science': contract})
    return result


def validate_star_science(science: Any) -> None:
    """Fail closed on a serialized contract; never infer missing source semantics."""
    if not isinstance(science, dict) or science.get('schema_version') != SCHEMA_VERSION:
        raise ValueError('unsupported star_science schema_version')
    for field in ('ra', 'dec', 'coordinate_epoch'):
        if safe_float(science.get(field)) is None:
            raise ValueError(f'star_science {field} must be finite')
    if not 0 <= science['ra'] < 360 or not -90 <= science['dec'] <= 90:
        raise ValueError('star_science coordinates out of range')
    if science.get('coordinate_frame') != 'ICRS':
        raise ValueError('star_science coordinate_frame must be ICRS')
    for field in ('source_catalog', 'source_id'):
        if not isinstance(science.get(field), str) or not science[field]:
            raise ValueError(f'star_science {field} must be a nonempty string')
    for field in ('gaia_id', 'hip_id', 'tycho2_id'):
        if field not in science or (science[field] is not None and not isinstance(science[field], str)):
            raise ValueError(f'star_science {field} must be a string or null')
    for field in ('proper_motion_ra_mas_per_year', 'proper_motion_dec_mas_per_year', 'parallax_mas',
                  'radial_velocity_km_s', 'source_magnitude', 'visual_magnitude', 'render_magnitude', 'color_index', 'bv'):
        if field not in science or (science[field] is not None and safe_float(science[field]) is None):
            raise ValueError(f'star_science {field} must be finite or null')
    if science['visual_magnitude'] is not None and science.get('visual_magnitude_method') not in ('johnson', 'tycho_transformed', 'gaia_edr3_transformed'):
        raise ValueError('star_science visual magnitude requires a known V method')
    if science.get('native_tile') is not None:
        tile = science['native_tile']
        expected = healpix_ang2pix(8, math.radians(90-science['dec']), math.radians(science['ra']))
        if not isinstance(tile, dict) or tile.get('order') != 3 or tile.get('pix') != expected or not isinstance(tile.get('identity'), str):
            raise ValueError('star_science native_tile disagrees with canonical coordinates')
