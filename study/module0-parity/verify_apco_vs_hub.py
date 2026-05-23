#!/usr/bin/env python3
"""
Compare PyERFA `erfa.apco` outputs to committed Hub goldens (`apcoInputs` + `astrom` slice).

Run from repo root after `pip install -r study/module0-parity/requirements.txt`, or use CI.
"""
from __future__ import annotations

import json
import math
import pathlib
import sys

import erfa
import numpy as np
from erfa import ufunc as erfa_ufunc

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
FIXTURE = REPO_ROOT / "frontend" / "tests" / "fixtures" / "module0_replay_astrom_goldens.json"


def _json_ebpv_to_dt_pv(rows: list) -> np.ndarray:
    """Match PyERFA/SOFA `eraApco` `ebpv` layout (`erfa_ufunc.dt_pv`), not a raw (2,3) float64."""
    ebpv = np.empty((), erfa_ufunc.dt_pv)
    p = rows[0]
    v = rows[1]
    ebpv["p"][0] = float(p[0])
    ebpv["p"][1] = float(p[1])
    ebpv["p"][2] = float(p[2])
    ebpv["v"][0] = float(v[0])
    ebpv["v"][1] = float(v[1])
    ebpv["v"][2] = float(v[2])
    return ebpv


def _close(name: str, got: float, want: float, tol: float = 2e-14, *, wrap_twopi: bool = False) -> None:
    if wrap_twopi:
        delta = (got - want + math.pi) % (2 * math.pi) - math.pi
        if not math.isclose(delta, 0.0, rel_tol=0.0, abs_tol=max(tol, 1e-12)):
            raise AssertionError(f"{name}: got {got!r} want {want!r} (wrapped Δ {delta:.3e})")
        return
    if not math.isclose(got, want, rel_tol=0.0, abs_tol=tol):
        raise AssertionError(f"{name}: got {got!r} want {want!r} (abs {abs(got - want):.3e})")


def assert_astrom_matches_golden(astrom: np.void, exp: dict) -> None:
    """PyERFA vs committed Hub slice; loose tol bridges JS `toFixed(14)` vs Python `round(14)`."""
    _close("eral", float(astrom["eral"]), exp["eral"], wrap_twopi=True)
    _close("xpl", float(astrom["xpl"]), exp["xpl"])
    _close("ypl", float(astrom["ypl"]), exp["ypl"])
    _close("along", float(astrom["along"]), exp["along"], wrap_twopi=True)
    for i in range(3):
        _close(f"eb[{i}]", float(astrom["eb"][i]), exp["eb"][i])
    _close("bpn00", float(astrom["bpn"][0, 0]), exp["bpn00"])
    _close("bpn01", float(astrom["bpn"][0, 1]), exp["bpn01"])
    _close("bpn02", float(astrom["bpn"][0, 2]), exp["bpn02"])


def main() -> int:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    if data.get("schema") != "module0-replay-astrom-v2":
        print(f"Expected schema module0-replay-astrom-v2, got {data.get('schema')!r}", file=sys.stderr)
        return 1

    for case in data["cases"]:
        cid = case["id"]
        inp = case["apcoInputs"]
        ebpv = _json_ebpv_to_dt_pv(inp["ebpv"])
        ehp = np.empty((3,), float)
        ehp[0] = float(inp["ehp"][0])
        ehp[1] = float(inp["ehp"][1])
        ehp[2] = float(inp["ehp"][2])
        try:
            astrom = erfa.apco(
                float(inp["date1"]),
                float(inp["date2"]),
                ebpv,
                ehp,
                float(inp["x"]),
                float(inp["y"]),
                float(inp["s"]),
                float(inp["theta"]),
                float(inp["elong"]),
                float(inp["phi"]),
                float(inp["hm"]),
                float(inp["xp"]),
                float(inp["yp"]),
                float(inp["sp"]),
                float(inp["refa"]),
                float(inp["refb"]),
            )
        except Exception as exc:  # noqa: BLE001 — surface ufunc / wheel errors clearly
            print(f"erfa.apco failed for case {cid!r}: {exc}", file=sys.stderr)
            return 2

        exp = case["astrom"]
        try:
            assert_astrom_matches_golden(astrom, exp)
        except AssertionError as exc:
            print(f"Mismatch for case {cid!r}: {exc}", file=sys.stderr)
            return 3

    print(f"OK: PyERFA apco matches Hub astrom slice for {len(data['cases'])} cases.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
