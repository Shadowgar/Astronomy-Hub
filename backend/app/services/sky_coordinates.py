"""Shared catalog sidereal geometry; unchanged Above Me calculation."""

import math
from datetime import datetime, timezone


def _julian_date(dt: datetime) -> float:
    return (dt.astimezone(timezone.utc).timestamp() / 86400.0) + 2440587.5


def _local_sidereal_time_hours(dt: datetime, longitude_deg: float) -> float:
    jd = _julian_date(dt)
    d = jd - 2451545.0
    gmst_hours = (18.697374558 + 24.06570982441908 * d) % 24.0
    return (gmst_hours + (longitude_deg / 15.0)) % 24.0


def ra_dec_to_alt_az(
    *,
    ra_hours: float,
    dec_deg: float,
    observer_lat_deg: float,
    observer_lon_deg: float,
    dt: datetime,
) -> tuple[float, float]:
    lst_hours = _local_sidereal_time_hours(dt, observer_lon_deg)
    hour_angle_deg = ((lst_hours - ra_hours) * 15.0 + 540.0) % 360.0 - 180.0

    lat_rad = math.radians(observer_lat_deg)
    dec_rad = math.radians(dec_deg)
    ha_rad = math.radians(hour_angle_deg)

    sin_alt = math.sin(dec_rad) * math.sin(lat_rad) + math.cos(dec_rad) * math.cos(
        lat_rad
    ) * math.cos(ha_rad)
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt_rad = math.asin(sin_alt)

    cos_az = (math.sin(dec_rad) - math.sin(alt_rad) * math.sin(lat_rad)) / (
        max(1e-9, math.cos(alt_rad) * math.cos(lat_rad))
    )
    cos_az = max(-1.0, min(1.0, cos_az))
    az_rad = math.acos(cos_az)
    if math.sin(ha_rad) > 0:
        az_rad = (2.0 * math.pi) - az_rad

    return math.degrees(alt_rad), math.degrees(az_rad)
