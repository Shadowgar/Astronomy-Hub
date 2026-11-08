"""Reproduce two bounded, immutable Solar 2.6 observational products.

Run with acquisition-only cdflib==1.3.6 and numpy==2.5.4. No network call is
made unless --download is passed. Source data and runtime output are ignored,
mounted files; this is not an application provider or a live polling service.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from pathlib import Path
import re
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "data/source/solar26-observations"
PACK = ROOT / "data/runtime-packs/heliophysics/release-v1"
MIB = 1024 * 1024
BUDGETS = {"ibex": 32*MIB, "imap": 56*MIB, "metadata": 8*MIB}
MAX_RESPONSE = 32*MIB
MAX_AGGREGATE = 96*MIB
MAX_PRODUCT = 2*MIB
MAX_PACK = 8*MIB
IBEX_BASE = "https://spdf.gsfc.nasa.gov/pub/data/ibex/release18/Hi/hvset_cg_2009-2022/"
IMAP_FILE = "imap_mag_l2_norm-gse_20260701_v002.0003.cdf"
IMAP_BASE = "https://spdf.gsfc.nasa.gov/pub/data/imap/mag/l2/norm-gse/2026/"
SOURCES = {
    "hv60.hide-trp-mono_80-2.73-flux.txt": (IBEX_BASE, "3e748f5888549e72d6940bf5c30124d53455414f9c4f424b5afd7a930d117ddf", 19748, "ibex"),
    "hv60.hide-trp-mono_80-2.73-fvar.txt": (IBEX_BASE, "883d3ccfdd4a9abfc1307f8cbf56889f3ab67c1b1f24c57025ecce6b2f776a8a", 17923, "ibex"),
    "hv60.hide-trp-mono_80-desc.txt": (IBEX_BASE, "222218f96dc697552c5b26cd9c69fb73e33c9b0f0aae2275735943a02213bda5", 1647, "ibex"),
    "hv60.hide-trp-flux100-hi-5-desc.txt": (IBEX_BASE, "ca585b856d003479868536d8fd83fd8144838f757db0ad76d6ab87045ac2f17b", 153777, "ibex"),
    "README.pdf": ("https://spdf.gsfc.nasa.gov/pub/data/ibex/release18/", "547318dd9820b040f62f04a013ef66602e6e49529570d20690a92fd3fd5cb3ea", 78146, "ibex"),
    IMAP_FILE: (IMAP_BASE, "4a594a3a9a79b78ea1e0db926e53c6820db8be0f32245cd002ad8b36f3e4427f", 3781231, "imap"),
}
RIGHTS = "NASA SPDF default public-domain/CC0 data policy; retain instrument-team attribution and source citation. No restrictive exception appears in these data."
RIGHTS_URL = "https://spdf.gsfc.nasa.gov/data_use_policy.html"


def encode(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n").encode()


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def immutable_write(path, raw):
    """An existing release is verified, never silently overwritten."""
    if path.is_symlink():
        raise ValueError("Refusing symlink output")
    if path.exists():
        if path.read_bytes() != raw:
            raise ValueError(f"Immutable file differs: {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as stream:
        stream.write(raw)


class Acquisition:
    """Only pinned official files; limits include failed/partial transfers."""
    def __init__(self, cache=CACHE):
        self.cache = Path(cache)
        self.cache.mkdir(parents=True, exist_ok=True)
        self.ledger = self.cache / "acquisition-ledger.json"
        self.state = json.loads(self.ledger.read_bytes()) if self.ledger.exists() else {
            "transferred": 0, "categories": dict.fromkeys(BUDGETS, 0), "attempts": []}
        # Discovery receipts are retained separately, but count toward the
        # aggregate budget even when the official sources are already cached.
        self.discovery_bytes = sum(p.stat().st_size for p in self.cache.iterdir()
                                   if p.is_file() and p.name not in {self.ledger.name, "probes.jsonl"})
        self.discovery_categories = dict.fromkeys(BUDGETS, 0)
        for path in self.cache.iterdir():
            if path.is_file() and path.name not in {self.ledger.name, "probes.jsonl"}:
                category = SOURCES[path.name][3] if path.name in SOURCES else "metadata"
                self.discovery_categories[category] += path.stat().st_size
        if self.discovery_bytes + self.state["transferred"] > MAX_AGGREGATE:
            raise ValueError("Retained acquisition budget exhausted")
        if any(self.discovery_categories[k]+self.state["categories"][k] > cap for k, cap in BUDGETS.items()):
            raise ValueError("Retained source category budget exhausted")

    def get(self, name, download=False):
        base, expected_hash, expected_bytes, category = SOURCES[name]
        path = self.cache / name
        if path.is_symlink():
            raise ValueError("Refusing symlink cache")
        if path.exists():
            if path.stat().st_size != expected_bytes:
                raise ValueError(f"Pinned source size mismatch: {name}")
            raw = path.read_bytes()
        elif not download:
            raise FileNotFoundError(f"Missing pinned source; use --download: {name}")
        else:
            receipt = {"url": base + name, "file": name, "bytes": 0, "status": "failed"}
            parts = []
            try:
                with urlopen(Request(base + name, headers={"User-Agent": "Astronomy-Hub-source-qualification/2.6"}), timeout=30) as response:
                    if response.geturl() != base + name:
                        raise ValueError("Unexpected source redirect")
                    size = int(response.headers.get("Content-Length", "0"))
                    if size > min(MAX_RESPONSE, expected_bytes):
                        raise ValueError("Response exceeds pinned source size")
                    while True:
                        # Include one byte beyond the allowed size to reject
                        # chunked responses that lie or omit Content-Length.
                        allowance = min(MAX_RESPONSE-receipt["bytes"],
                                        MAX_AGGREGATE-self.discovery_bytes-self.state["transferred"],
                                        BUDGETS[category]-self.discovery_categories[category]-self.state["categories"][category],
                                        expected_bytes-receipt["bytes"])
                        chunk = response.read(min(65536, allowance+1))
                        if not chunk:
                            break
                        self.state["transferred"] += len(chunk)
                        self.state["categories"][category] += len(chunk)
                        receipt["bytes"] += len(chunk)
                        if len(chunk) > allowance:
                            raise ValueError("Streamed acquisition budget exceeded")
                        parts.append(chunk)
                raw = b"".join(parts)
                if len(raw) != expected_bytes or sha256(raw) != expected_hash:
                    raise ValueError("Pinned source identity mismatch")
                immutable_write(path, raw)
                receipt.update(status="ok", sha256=sha256(raw))
            except Exception as error:
                receipt["error"] = f"{type(error).__name__}: {error}"
                raise
            finally:
                self.state["attempts"].append(receipt)
                self.ledger.write_bytes(encode(self.state))
        if len(raw) != expected_bytes or sha256(raw) != expected_hash:
            raise ValueError(f"Pinned source identity mismatch: {name}")
        return raw


def parse_ibex_matrix(raw, variance=False):
    """Source order is south to north, east longitude 0..360, no seam column."""
    text = raw.decode("ascii")
    header = "\n".join(line for line in text.splitlines() if line.startswith("#"))
    required = [r"^# 28:30x60:", r"skyframe=ECLIPJ2000\b", r"posframe=J2000\b",
                r"min_0=-90 max_0=90 num_0=30\b", r"min_1=0 max_1=360 num_1=60\b",
                r"e_approx='2\.73'", r"hs_radius='1'", r"no_cg_xform='0'",
                r"fe_method='spwloglog'"]
    title = "Flux Var (#/cm^2 s sr keV)^2" if variance else "Flux (#/cm^2 s sr keV)"
    if any(not re.search(pattern, header, re.M) for pattern in required) or f"h_title='{title}'" not in header:
        raise ValueError("Unqualified IBEX frame, units, grid, energy or calibration")
    rows = [[float(v) for v in line.split()] for line in text.splitlines()
            if line.strip() and not line.startswith("#")]
    if len(rows) != 30 or any(len(row) != 60 for row in rows):
        raise ValueError("Incomplete IBEX grid")
    return rows


def map_data(flux, variance):
    if len(flux) != 30 or len(variance) != 30 or any(len(row) != 60 for row in flux+variance):
        raise ValueError("Incomplete IBEX grid")
    mask = [[not (math.isfinite(f) and f >= 0 and math.isfinite(v) and v >= 0)
             for f, v in zip(fr, vr)] for fr, vr in zip(flux, variance)]
    # Negative intensities are not admitted by this positive log-interpolated
    # product. No fill sentinel is documented; reject unknown invalid cells
    # conservatively and expose the mask, never interpolate an observation.
    return {"longitude_deg": list(range(3, 360, 6)), "latitude_deg": list(range(-87, 90, 6)),
            "flux": [[None if m else f for f, m in zip(row, mr)] for row, mr in zip(flux, mask)],
            "uncertainty": [[None if m else math.sqrt(v) for v, m in zip(row, mr)] for row, mr in zip(variance, mask)],
            "mask": mask}


def ecliptic_direction_j2000(longitude_deg, latitude_deg):
    """NAIF ECLIPJ2000 to J2000 direction only, not a position or distance."""
    if not all(math.isfinite(v) for v in (longitude_deg, latitude_deg)) or not -90 <= latitude_deg <= 90:
        raise ValueError("Invalid direction")
    lon, lat = math.radians(longitude_deg), math.radians(latitude_deg)
    x, y, z = math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)
    eps = math.radians(84381.448/3600)
    return [x, math.cos(eps)*y-math.sin(eps)*z, math.sin(eps)*y+math.cos(eps)*z]


def aggregate_minutes(epoch_ns, values, flags, bitmask, start_ns):
    """UTC minute bins; bad quality is excluded, absent bins stay absent."""
    if not len(epoch_ns) == len(values) == len(flags) == len(bitmask):
        raise ValueError("Inconsistent time series arrays")
    bins = [[] for _ in range(1440)]
    rejected = [0]*1440
    quality = [0]*1440
    previous = None
    for stamp, value, flag, bits in zip(epoch_ns, values, flags, bitmask):
        if not isinstance(stamp, int) or not start_ns <= stamp < start_ns+86400_000_000_000:
            raise ValueError("Source epoch outside qualified UTC day")
        if previous is not None and stamp <= previous:
            raise ValueError("Source epochs must be strictly increasing")
        previous = stamp
        index = (stamp-start_ns)//60_000_000_000
        quality[index] |= int(bits)
        if flag != 0 or bits != 0 or not math.isfinite(value) or not 0 <= value <= 100000:
            rejected[index] += 1
        else:
            bins[index].append(float(value))
    if any(len(b)+r > 120 for b, r in zip(bins, rejected)):
        raise ValueError("Source exceeds qualified 2 Hz cadence")
    start = datetime.fromtimestamp(start_ns/1e9, tz=timezone.utc)
    return {"time_utc": [(start+timedelta(minutes=i)).isoformat().replace("+00:00", "Z") for i in range(1440)],
            "value": [math.fsum(b)/len(b) if b else None for b in bins],
            "minimum": [min(b) if b else None for b in bins], "maximum": [max(b) if b else None for b in bins],
            "count": [len(b) for b in bins], "rejected_count": rejected, "quality_bitmask": quality}


def sources_metadata(names):
    return {"source_urls": [SOURCES[n][0]+n for n in names], "source_sha256": [SOURCES[n][1] for n in names]}


def build_ibex(acquisition):
    names = [n for n in SOURCES if n != IMAP_FILE]
    source = {n: acquisition.get(n) for n in names}
    # The flux100 filename is historical, not proof of a 100-AU correction.
    if not source[names[3]].startswith(b"Flux transported from 1 AU to 1.0 AU"):
        raise ValueError("IBEX reference-distance qualification changed")
    data = map_data(parse_ibex_matrix(source[names[0]]), parse_ibex_matrix(source[names[1]], variance=True))
    metadata = {"publisher": "NASA IBEX Science Team / Princeton; NASA SPDF archive",
                "instrument": "IBEX-Hi, triple-coincidence energetic neutral atoms",
                "product": "DR18 hvset_cg_2009-2022 hv60.hide-trp-mono_80-2.73-flux",
                "version": "Data Release 18; generated 2023-08-27",
                "observation_start": "2008-12-25T00:00:00Z", "observation_end": "2022-12-26T00:00:00Z",
                "frame": "ECLIPJ2000; solar ecliptic east longitude, outward-looking directions",
                "units": "ENA / (cm² s sr keV)", "energy": "2.73 keV monoenergetic interpolation of IBEX-Hi energy channels",
                "projection": "6° longitude × 6° latitude rectangular bins; 60 × 30 centers; south-to-north rows, east-increasing columns",
                "calibration": "Published Compton-Getting correction to solar inertial frame; log(flux)-log(energy) interpolation; 1 AU reference, no survival-probability transport to 100 AU. Uncertainty is sqrt(published flux variance).",
                "coverage": "2009–2022 combined directional map, 1800 source bins. Dates are the release's nominal outer interval; each pixel combines non-simultaneous exposures; last listed input arc is 0591b.",
                "rights": RIGHTS, "attribution": "IBEX mission and instrument teams; McComas et al. (2023), Fourteen Years of Energetic Neutral Atom Observations from IBEX; NASA/GSFC SPDF.",
                "limitations": ["Directional processed ENA intensities, not visible-light brightness or a unique 3D heliopause surface.",
                                "Statistical variance does not include all calibration/systematic uncertainty or temporal variability.",
                                "No angular interpolation or duplicated seam column. Unqualified negative/nonfinite cells are masked, not filled.",
                                "The release README's identical-first/last-column statement conflicts with the actual 60-column, 6° bins. All 60 original bins are preserved; plotted coordinates are bin centers.",
                                "Nominal date interval is not precise per-pixel time coverage; no live update or time-dependent inversion."],
                **sources_metadata(names)}
    return {"schema": "oras.heliophysics-observation.v1", "id": "ibex-ena-map", "kind": "angular-map", "metadata": metadata, "data": data}


def build_imap(acquisition):
    import cdflib
    import numpy as np
    if cdflib.__version__ != "1.3.6" or np.__version__ != "2.5.4":
        raise ValueError("Reproduction requires cdflib==1.3.6 and numpy==2.5.4")
    acquisition.get(IMAP_FILE)
    cdf = cdflib.CDF(acquisition.cache / IMAP_FILE)
    attrs = cdf.globalattsget()
    if attrs.get("Logical_file_id") != [IMAP_FILE[:-4]] or attrs.get("Data_version") != ["002.0003"]:
        raise ValueError("IMAP source identity mismatch")
    variable = cdf.varattsget("magnitude")
    epoch_attrs = cdf.varattsget("epoch")
    if variable.get("UNITS") != "nT" or float(variable["VALIDMIN"]) != 0 or float(variable["VALIDMAX"]) != 100000 or epoch_attrs.get("TIME_SCALE") != "Terrestrial Time":
        raise ValueError("IMAP units/range/time metadata mismatch")
    # cdflib performs the TT2000/leap-second conversion; never treat TT ns as
    # Unix UTC or derive timestamps from array offsets.
    stamps = cdflib.cdfepoch.to_datetime(cdf.varget("epoch")).astype("datetime64[ns]").astype(np.int64).tolist()
    start_ns = int(np.datetime64("2026-07-01T00:00:00", "ns").astype(np.int64))
    data = aggregate_minutes(stamps, cdf.varget("magnitude").tolist(), cdf.varget("quality_flags").tolist(), cdf.varget("quality_bitmask").tolist(), start_ns)
    metadata = {"publisher": "IMAP Science Data Center; NASA SPDF archive", "instrument": "IMAP MAG, Imperial College London",
                "product": "imap_mag_l2_norm-gse / magnitude; one-minute aggregation", "version": "002.0003; generated 2026-10-10",
                "observation_start": "2026-07-01T00:00:00Z", "observation_end": "2026-07-01T23:59:59.500Z",
                "frame": "Source magnetic vector: GSE (Geocentric Solar Ecliptic); displayed magnitude is a rotation-invariant scalar",
                "units": "nT", "energy": "Not applicable: magnetic field measurement", "projection": "UTC time series; minute-start bins [start, start+60 s)",
                "calibration": "Published L2 v002 uses corrected spin tables and SPICE spin axis/phase; calibration parent v006 (2026-03-01), offsets v004 (2026-07-01). Only quality_flags=0 and quality_bitmask=0 are admitted.",
                "coverage": f"One archived UTC day near IMAP, 172800 source samples at 2 Hz; {sum(data['count'])} accepted and {sum(data['rejected_count'])} excluded. 1440 explicit minute bins; {sum(v is None for v in data['value'])} empty bins remain gaps.",
                "rights": RIGHTS + " CDF Rules_of_use explicitly permits public scientific citation/use.",
                "attribution": "IMAP MAG team, Imperial College London; IMAP PI Prof. David J. McComas, Princeton (NASA contract 80GSFC19C0027); NASA/GSFC SPDF.",
                "limitations": ["Local in-situ magnetic field near IMAP, not a global heliosphere map or live telemetry.",
                                "One-minute means of the published magnitude variable; minimum/maximum show within-bin variability, not measurement uncertainty. No uncertainty variable is supplied.",
                                "Bad-quality, nonzero-bitmask, fill and out-of-range samples are excluded; no gap interpolation. Partial-bin accepted/rejected counts are retained.",
                                "The entire 130 MB CMAD was not acquired; qualification uses this file's original calibration parents, MODS, quality/range metadata and public mission documentation."],
                **sources_metadata([IMAP_FILE])}
    return {"schema": "oras.heliophysics-observation.v1", "id": "imap-magnetic-field", "kind": "time-series", "metadata": metadata, "data": data}


def build_pack(acquisition, output=PACK):
    products = [build_ibex(acquisition), build_imap(acquisition)]
    manifest = {"schema": "oras.heliophysics-pack.v1", "release_id": "solar26-observations-v1", "products": {}}
    encoded = {}
    for product in products:
        raw = encode(product)
        if len(raw) > MAX_PRODUCT:
            raise ValueError("Browser product budget exceeded")
        name = product["id"] + ".json"
        encoded[name] = raw
        manifest["products"][product["id"]] = {"file": name, "sha256": sha256(raw), "bytes": len(raw), "metadata": product["metadata"]}
    encoded["manifest.json"] = encode(manifest)
    if sum(map(len, encoded.values())) > MAX_PACK or len(encoded["manifest.json"]) > 128*1024:
        raise ValueError("Runtime pack budget exceeded")
    # Validate everything before any product is written. Existing releases
    # must be byte-identical; a changed release requires an explicit new path.
    for name, raw in encoded.items():
        path = Path(output)/name
        if path.exists() and (path.is_symlink() or path.read_bytes() != raw):
            raise ValueError(f"Immutable release differs: {path}")
    for name, raw in encoded.items():
        immutable_write(Path(output)/name, raw)
    return {"manifest_sha256": sha256(encoded["manifest.json"]), "bytes": sum(map(len, encoded.values())),
            "products": {k: {x: v[x] for x in ("sha256", "bytes")} for k, v in manifest["products"].items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Acquire only the six exact hash-pinned sources if absent")
    parser.add_argument("--cache", type=Path, default=CACHE)
    parser.add_argument("--output", type=Path, default=PACK)
    args = parser.parse_args()
    acquisition = Acquisition(args.cache)
    for name in SOURCES:
        acquisition.get(name, download=args.download)
    print(json.dumps(build_pack(acquisition, args.output), indent=2))


if __name__ == "__main__":
    main()
