from __future__ import annotations

from scripts.skydata.run_public_parity_pipeline import build_mirror_cmd


def test_build_mirror_cmd() -> None:
    cmd = build_mirror_cmd("python3", "dss_survey", 0, 4, 16, 0.0, 4, 30)
    assert cmd[:5] == ["python3", "scripts/skydata/mirror_public_runtime_data.py", "--class", "dss_survey", "--confirm-download"]
    assert "--resume" in cmd
    assert "--checksum-manifest" in cmd
    assert "--order-min" in cmd and cmd[cmd.index("--order-min") + 1] == "0"
    assert "--order-max" in cmd and cmd[cmd.index("--order-max") + 1] == "4"
    assert "--request-timeout" in cmd and cmd[cmd.index("--request-timeout") + 1] == "30"
    assert "--workers" in cmd
    assert "--progress" in cmd
