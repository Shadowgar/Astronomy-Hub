from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from backend.app.services.tonight_geometry import (
    night_interval,
    resolve_night_date,
    threshold_windows,
    refine_peak,
)

UTC = timezone.utc


@pytest.mark.parametrize(
    "instant, expected",
    [
        ("2026-10-01T04:00:00+00:00", "2026-09-30"),
        ("2026-10-01T15:59:59+00:00", "2026-09-30"),
        ("2026-10-01T16:00:00+00:00", "2026-10-01"),
        ("2026-11-01T06:30:00+00:00", "2026-10-31"),
    ],
)
def test_noon_night_date(instant, expected):
    assert (
        str(resolve_night_date(None, now=datetime.fromisoformat(instant))) == expected
    )


@pytest.mark.parametrize(
    "date, hours", [("2026-03-07", 23), ("2026-10-31", 25), ("2026-10-01", 24)]
)
def test_interval_uses_separate_local_noons(date, hours):
    start, end = night_interval(resolve_night_date(date))
    assert (end - start).total_seconds() / 3600 == hours
    assert start.astimezone(ZoneInfo("America/New_York")).hour == 12
    assert end.astimezone(ZoneInfo("America/New_York")).hour == 12


@pytest.mark.parametrize("date", ["bad", "2026-02-30", "20261001", "9999-12-31"])
def test_invalid_dates_rejected(date):
    with pytest.raises(ValueError):
        resolve_night_date(date)


def test_crossings_peak_and_duration():
    f = lambda t: 30 - ((t - 3600) / 120) ** 2
    windows = threshold_windows(f, 0, 7200, 20, above=True)
    assert len(windows) == 1
    a, b = windows[0]
    assert a == pytest.approx(3600 - 120 * 10**0.5, abs=1)
    assert b == pytest.approx(3600 + 120 * 10**0.5, abs=1)
    assert refine_peak(f, 0, 7200) == pytest.approx(3600, abs=1)


def test_continuous_and_absent_darkness():
    assert threshold_windows(lambda t: -20, 0, 86400, -18, above=False) == [(0, 86400)]
    assert threshold_windows(lambda t: -10, 0, 86400, -18, above=False) == []


def test_peak_and_grazing_window_near_interval_boundary():
    f = lambda t: 1 - ((t - 50) / 20) ** 2
    assert refine_peak(f, 0, 3600) == pytest.approx(50, abs=1)
    windows = threshold_windows(f, 0, 3600, 0, above=True)
    assert len(windows) == 1
    assert windows[0][0] == pytest.approx(30, abs=1)
    assert windows[0][1] == pytest.approx(70, abs=1)


def test_monotonic_boundary_segments_do_not_trigger_iterative_peak_searches():
    calls = []

    def trajectory(t):
        calls.append(t)
        return t

    assert refine_peak(trajectory, 0, 3600) == 3600
    assert len(calls) < 30
