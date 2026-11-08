"""Independent source-to-product review; does not import the product builder.

Run with the already qualified observation and CSPICE tool environments on
PYTHONPATH. All sources are local; no acquisition or runtime-pack writes occur.
"""
import hashlib
import json
from pathlib import Path

import cdflib
import numpy as np
import spiceypy as spice

ROOT = Path(__file__).resolve().parents[2]


def main():
    source = ROOT / 'data/source/solar26-observations'
    pack = ROOT / 'data/runtime-packs/heliophysics/release-v1'
    ibex = json.loads((pack / 'ibex-ena-map.json').read_bytes())['data']
    flux = np.loadtxt(source / 'hv60.hide-trp-mono_80-2.73-flux.txt')
    variance = np.loadtxt(source / 'hv60.hide-trp-mono_80-2.73-fvar.txt')
    assert flux.shape == (30, 60) and np.isfinite(flux).all() and flux.min() >= 0
    assert np.array_equal(flux, np.asarray(ibex['flux']))
    assert np.allclose(np.sqrt(variance), ibex['uncertainty'], rtol=0, atol=1e-15)
    assert not np.asarray(ibex['mask']).any()
    cdf = cdflib.CDF(source / 'imap_mag_l2_norm-gse_20260701_v002.0003.cdf')
    epochs = cdf.varget('epoch')
    magnitude = cdf.varget('magnitude').astype(float)
    flags, bits = cdf.varget('quality_flags'), cdf.varget('quality_bitmask')
    # Independent exact integer TT2000 conversion for this non-leap day only.
    # TT-UTC = 69.184 s, independently checked below against CSPICE + naif0012.
    utc_ns = np.datetime64('2000-01-01T12:00:00', 'ns').astype('int64') + epochs - 69_184_000_000
    start = np.datetime64('2026-07-01T00:00:00', 'ns').astype('int64')
    assert utc_ns[0] == start and utc_ns[-1] == start + 86_399_500_000_000
    assert np.all(np.diff(utc_ns) == 500_000_000)
    minute = (utc_ns - start) // 60_000_000_000
    valid = (flags == 0) & (bits == 0) & np.isfinite(magnitude) & (magnitude >= 0) & (magnitude <= 100000)
    actual = json.loads((pack / 'imap-magnetic-field.json').read_bytes())['data']
    maximum_difference = 0.
    for index in range(1440):
        samples = magnitude[(minute == index) & valid]
        assert len(samples) == actual['count'][index]
        assert int(((minute == index) & ~valid).sum()) == actual['rejected_count'][index]
        assert int(np.bitwise_or.reduce(bits[minute == index])) == actual['quality_bitmask'][index]
        if not len(samples):
            assert all(actual[key][index] is None for key in ('value', 'minimum', 'maximum'))
        else:
            delta = abs(float(samples.mean()) - actual['value'][index])
            assert delta < 3e-14
            maximum_difference = max(maximum_difference, delta)
            assert samples.min() == actual['minimum'][index] and samples.max() == actual['maximum'][index]
    kernel = ROOT / 'data/source-cache/solar25-missions/naif0012.tls'
    spice.furnsh(str(kernel))
    checks = []
    try:
        for index in (0, 86400, 172799):
            et = spice.unitim(int(epochs[index]) / 1e9, 'TDT', 'TDB')
            utc = spice.et2utc(et, 'ISOC', 3) + 'Z'
            expected = str(np.datetime64(int(utc_ns[index]), 'ns').astype('datetime64[ms]')) + 'Z'
            assert utc == expected
            checks.append(dict(sample=index, utc=utc, tt2000_ns=int(epochs[index])))
    finally:
        spice.unload(str(kernel))
    report = dict(reviewer='solar26_physics; not observation author',
                  pack_manifest_sha256=hashlib.sha256((pack / 'manifest.json').read_bytes()).hexdigest(),
                  ibex=dict(cells=flux.size, flux_exact=True, uncertainty_sqrt_variance=True,
                            source_min=float(flux.min()), source_max=float(flux.max()),
                            nonduplicated_seam=not np.array_equal(flux[:, 0], flux[:, -1]),
                            source_max_cell=dict(longitude_center_deg=ibex['longitude_deg'][int(np.argmax(flux) % 60)],
                                                 latitude_center_deg=ibex['latitude_deg'][int(np.argmax(flux) // 60)])),
                  imap=dict(source_samples=len(epochs), accepted=int(valid.sum()), excluded=int((~valid).sum()),
                            bins_verified=1440, empty_bins=actual['value'].count(None),
                            maximum_mean_difference_nt=maximum_difference, utc_spice_checks=checks),
                  result='pass; scope is source normalization and numerical semantics, not UI or owner acceptance')
    output = ROOT / 'docs/validation/solar-system-2.6/observations-independent-numerics.json'
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(f'PASS: {flux.size} IBEX cells; 1440 IMAP bins; {len(checks)} UTC reference checks.')


if __name__ == '__main__':
    main()
