"""UTC numerical searches within independently constructed local-noon boundaries."""

import itertools
import re
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

TIMEZONE = "America/New_York"
SAMPLE_SECONDS = 600
REFINE_SECONDS = 1


def resolve_night_date(value: str | None, *, now: datetime | None = None) -> date:
    if value is not None:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError("date must be YYYY-MM-DD (local evening date)")
        parsed = date.fromisoformat(value)
        if parsed.year == 9999:
            raise ValueError("date must allow a following local calendar day")
        return parsed
    local = (now or datetime.now(timezone.utc)).astimezone(ZoneInfo(TIMEZONE))
    return local.date() if local.hour >= 12 else local.date() - timedelta(days=1)


def night_interval(night_date: date) -> tuple[datetime, datetime]:
    zone = ZoneInfo(TIMEZONE)
    # Construct both local dates independently, then do all duration arithmetic in UTC.
    return tuple(
        datetime.combine(d, time(12), zone).astimezone(timezone.utc)
        for d in (night_date, night_date + timedelta(days=1))
    )


def sample_grid(start: float, end: float) -> list[float]:
    return [
        start + i * SAMPLE_SECONDS
        for i in range(int((end - start) // SAMPLE_SECONDS) + 1)
        if start + i * SAMPLE_SECONDS < end
    ] + [end]


def _bounded_peak(f, a: float, b: float) -> float:
    while b - a > REFINE_SECONDS:
        x, y = a + (b - a) / 3, b - (b - a) / 3
        if f(x) < f(y):
            a = x
        else:
            b = y
    return (a + b) / 2


def _edge_extrema(f, left: float, right: float) -> list[float]:
    # Over a ten-minute sky trajectory a reversal can be bracketed by endpoint
    # slopes. Monotonic boundary segments need no expensive iterative search.
    delta = min(1.0, (right - left) / 4)
    first, last = f(left), f(right)
    rising_left = f(left + delta) - first
    rising_right = last - f(right - delta)
    if rising_left > 0 and rising_right < 0:
        return [_bounded_peak(f, left, right)]
    if rising_left < 0 and rising_right > 0:
        return [_bounded_peak(lambda t: -f(t), left, right)]
    return []


def refine_peak(f, start: float, end: float) -> float:
    grid = sample_grid(start, end)
    values = [f(t) for t in grid]
    candidates = [start, end]
    if len(grid) > 1:
        candidates.extend(_edge_extrema(f, grid[0], grid[1]))
        candidates.extend(_edge_extrema(f, grid[-2], grid[-1]))
    for i in range(1, len(grid) - 1):
        if values[i] >= values[i - 1] and values[i] >= values[i + 1]:
            candidates.append(_bounded_peak(f, grid[i - 1], grid[i + 1]))
    return min(candidates, key=lambda t: (-f(t), t))


def threshold_windows(
    f, start: float, end: float, threshold: float, *, above: bool
) -> list[tuple[float, float]]:
    grid = sample_grid(start, end)
    values = [f(t) for t in grid]
    # Include local extrema so a short grazing window between samples is not lost.
    extra = []
    if len(grid) > 1:
        for left, right in [(grid[0], grid[1]), (grid[-2], grid[-1])]:
            extra.extend(_edge_extrema(f, left, right))
    for i in range(1, len(grid) - 1):
        if values[i] > max(values[i - 1], values[i + 1]):
            extra.append(_bounded_peak(f, grid[i - 1], grid[i + 1]))
        elif values[i] < min(values[i - 1], values[i + 1]):
            extra.append(_bounded_peak(lambda t: -f(t), grid[i - 1], grid[i + 1]))
    grid = sorted(set(grid + extra))
    inside = lambda t: f(t) >= threshold if above else f(t) <= threshold
    windows = []
    active = start if inside(start) else None
    for left, right in itertools.pairwise(grid):
        if inside(left) == inside(right):
            continue
        a, b = left, right
        state = inside(a)
        while b - a > REFINE_SECONDS:
            mid = (a + b) / 2
            if inside(mid) == state:
                a = mid
            else:
                b = mid
        crossing = (a + b) / 2
        if state:
            windows.append((active, crossing))
            active = None
        else:
            active = crossing
    if active is not None:
        windows.append((active, end))
    return windows


def duration_minutes(windows):
    return sum(b - a for a, b in windows) / 60
