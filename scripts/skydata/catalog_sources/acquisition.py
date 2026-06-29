from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import tarfile
import tempfile
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .release import CatalogReleaseInputs


VIZIER_ENDPOINT = "https://vizier.cds.unistra.fr/viz-bin/asu-tsv"
ATNF_PACKAGE_URL = "https://www.atnf.csiro.au/research/pulsar/psrcat/downloads/psrcat_pkg.tar.gz"


@dataclass(frozen=True)
class VizieRAcquisition:
    family: str
    profile: str
    table: str
    filename: str
    max_rows: str = "unlimited"
    sort: str | None = None
    constraints: tuple[tuple[str, str], ...] = ()

    @property
    def url(self) -> str:
        query: list[tuple[str, str]] = [
            ("-source", self.table),
            ("-out.max", self.max_rows),
            ("-out", "_RAJ2000,_DEJ2000,*"),
        ]
        if self.sort:
            query.append(("-sort", self.sort))
        query.extend(self.constraints)
        return f"{VIZIER_ENDPOINT}?{urlencode(query)}"


VIZIER_ACQUISITIONS = (
    VizieRAcquisition("stars", "gaia_dr3", "I/355/gaiadr3", "gaia_dr3_bright.tsv", "10000", constraints=(("Gmag", "..10"),)),
    VizieRAcquisition("stars", "tycho2", "I/259/tyc2", "tycho2_bright.tsv", "25000", constraints=(("VTmag", "..10"),)),
    VizieRAcquisition("stars", "gliese", "V/70A/catalog", "gliese_cns3.tsv"),
    VizieRAcquisition("dsos", "open_clusters", "B/ocl/clusters", "dias_open_clusters.tsv"),
    VizieRAcquisition("dsos", "barnard", "VII/220A/barnard", "barnard.tsv"),
    VizieRAcquisition("dsos", "lbn", "VII/9/catalog", "lbn.tsv"),
    VizieRAcquisition("dsos", "ldn", "VII/7A/ldn", "ldn.tsv"),
    VizieRAcquisition("dsos", "sharpless", "VII/20/catalog", "sharpless.tsv"),
    VizieRAcquisition("dsos", "arp", "VII/74A/table2", "arp.tsv"),
    VizieRAcquisition("dsos", "markarian", "VII/61A/catalog", "markarian.tsv"),
    VizieRAcquisition("dsos", "3c", "VIII/1A/3c", "3c.tsv"),
    VizieRAcquisition("double-stars", "wds", "B/wds/wds", "wds_bright.tsv", "25000", constraints=(("mag1", "..10"),)),
    VizieRAcquisition("unusual-objects", "milliquas", "VII/290/catalog", "milliquas_bright.tsv", "10000", constraints=(("Rmag", "..18"),)),
    VizieRAcquisition("unusual-objects", "blackcat", "J/A+A/587/A61/tablea1", "blackcat.tsv"),
)


def default_release_inputs(source_root: str | Path, repo_root: str | Path) -> CatalogReleaseInputs:
    root = Path(source_root)
    repo = Path(repo_root)
    by_family: dict[str, list[tuple[str, Path]]] = {}
    for source in VIZIER_ACQUISITIONS:
        by_family.setdefault(source.family, []).append((source.profile, root / source.filename))
    wds = by_family["double-stars"][0][1]
    return CatalogReleaseInputs(
        hipparcos=repo / "backend/app/data/sky/hipparcos_tier2_subset.json",
        openngc=repo / "backend/app/data/sky/openngc_dso_catalog.json.gz",
        star_sources=tuple(by_family["stars"]),
        dso_sources=tuple(by_family["dsos"]),
        wds=wds,
        atnf=root / "psrcat.db",
        unusual_sources=tuple(by_family["unusual-objects"]),
    )


def acquire_sources(output_root: str | Path, *, force: bool = False) -> dict:
    root = Path(output_root)
    root.mkdir(parents=True, exist_ok=True)
    files: list[dict] = []
    for source in VIZIER_ACQUISITIONS:
        path = root / source.filename
        if force or not path.is_file():
            _download(source.url, path)
        files.append(_file_manifest(path, source.url, source.profile, source.family))

    atnf_path = root / "psrcat.db"
    if force or not atnf_path.is_file():
        _download_atnf(atnf_path)
    files.append(_file_manifest(atnf_path, ATNF_PACKAGE_URL, "atnf", "unusual-objects"))
    manifest = {
        "schema_version": 1,
        "acquired_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "files": files,
    }
    (root / "source-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return manifest


def _download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "Astronomy-Hub catalog pack builder/1.0"})
    with urlopen(request, timeout=180) as response:
        payload = response.read()
    if not payload:
        raise RuntimeError(f"empty catalog response from {url}")
    _validate_download_payload(payload, url=url, destination=destination)
    destination.with_suffix(destination.suffix + ".tmp").write_bytes(payload)
    destination.with_suffix(destination.suffix + ".tmp").replace(destination)


def _download_atnf(destination: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp_dir:
        archive = Path(tmp_dir) / "psrcat_pkg.tar.gz"
        _download(ATNF_PACKAGE_URL, archive)
        with tarfile.open(archive, "r:gz") as handle:
            members = [member for member in handle.getmembers() if Path(member.name).name == "psrcat.db"]
            if len(members) != 1:
                raise RuntimeError("ATNF package does not contain one psrcat.db")
            extracted = handle.extractfile(members[0])
            if extracted is None:
                raise RuntimeError("cannot read psrcat.db from ATNF package")
            destination.write_bytes(extracted.read())


def _file_manifest(path: Path, url: str, profile: str, family: str) -> dict:
    payload = path.read_bytes()
    return {
        "path": path.name,
        "family": family,
        "profile": profile,
        "source_url": url,
        "byte_size": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
    }


def _validate_download_payload(payload: bytes, *, url: str, destination: Path) -> None:
    if destination.suffix != ".tsv":
        return
    try:
        text = payload[:4096].decode("utf-8", errors="strict")
    except UnicodeDecodeError as error:
        raise RuntimeError(f"catalog response from {url} is not UTF-8 TSV") from error
    normalized = text.lstrip().lower()
    if normalized.startswith("<!doctype") or normalized.startswith("<html") or "<html" in normalized[:512]:
        raise RuntimeError(f"catalog response from {url} looks like HTML, not TSV")
    if "_RAJ2000" not in text or "_DEJ2000" not in text or "\t" not in text:
        raise RuntimeError(f"catalog response from {url} does not look like expected VizieR TSV")
