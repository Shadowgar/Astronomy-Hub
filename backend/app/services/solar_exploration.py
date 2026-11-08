"""Geometric heliocentric ICRF vectors from the existing qualified DE442s pack.

Observer apparent RA/Dec contracts remain unchanged. No network or synthetic orbit.
"""
from datetime import datetime, timedelta, timezone
import math
from backend.app.services import planetary_ephemeris_service as ephemeris

# Reference mean radii: NASA/NSSDC; Sun: IAU2015 nominal. Not display glyph sizes.
BODIES = (
    ('sun', 'Sun', 'sun', 10, 'Sun center', 695700.0, 0),
    ('mercury', 'Mercury', 'planet', 199, 'Mercury center', 2439.7, 87.969),
    ('venus', 'Venus', 'planet', 299, 'Venus center', 6051.8, 224.701),
    ('earth', 'Earth', 'planet', 399, 'Earth center', 6371.0, 365.25),
    ('mars', 'Mars', 'planet', 4, 'Mars system barycenter (not body center)', 3389.5, 687.0),
    ('jupiter', 'Jupiter', 'planet', 5, 'Jupiter system barycenter (not body center)', 69911.0, 4332.59),
    ('saturn', 'Saturn', 'planet', 6, 'Saturn system barycenter (not body center)', 58232.0, 10759.22),
    ('uranus', 'Uranus', 'planet', 7, 'Uranus system barycenter (not body center)', 25362.0, 30688.5),
    ('neptune', 'Neptune', 'planet', 8, 'Neptune system barycenter (not body center)', 24622.0, 60182.0),
)


def solar_snapshot(epoch: datetime) -> dict:
    if epoch.tzinfo is None:
        raise ValueError('epoch must include timezone')
    epoch = epoch.astimezone(timezone.utc)
    runtime = ephemeris._load_runtime(ephemeris._release_dir())
    start = ephemeris._parse_utc(runtime.manifest['coverage_start'])
    end = ephemeris._parse_utc(runtime.manifest['coverage_end'])
    if not start <= epoch <= end:
        raise ValueError('epoch outside local DE442s coverage')
    time = runtime.timescale.from_datetime(epoch)
    bodies = []
    for source_id, name, model, target, reference, radius, days in BODIES:
        vector = runtime.kernel[target] - runtime.kernel[10]
        position = [float(x) for x in vector.at(time).position.au] if target != 10 else [0.0, 0.0, 0.0]
        # Open sampled path ending exactly at epoch; never close a fictitious ellipse.
        stamps = [] if not days else [epoch-timedelta(days=min(days, (epoch-start).total_seconds()/86400)*(128-i)/128) for i in range(129)]
        if stamps:
            xyz = vector.at(runtime.timescale.from_datetimes(stamps)).position.au
            trajectory = [{'epoch':s.isoformat().replace('+00:00', 'Z'), 'position_au':[float(xyz[j,i]) for j in range(3)]} for i,s in enumerate(stamps)]
        else:
            trajectory = []
        if not all(math.isfinite(x) for x in position):
            raise ephemeris.EphemerisUnavailableError('Non-finite kernel position')
        bodies.append(dict(catalog='Solar System (JPL)', source_id=source_id, model=model, name=name,
            ephemeris_target=str(target), position_reference=reference, position_au=position,
            trajectory=trajectory, body_fixed_frame=None,
            shape=dict(model='reference mean sphere; not a qualified surface ellipsoid', mean_radius_km=radius, units='km',
                source='IAU 2015 nominal solar radius' if source_id=='sun' else 'NASA/NSSDC planetary fact sheet mean radius'),
            orientation=dict(status='unavailable', source=None),
            surface=dict(available=False, reason='R4 body/frame/source qualification not implemented; Sun is not a solid surface.' if source_id=='sun' else 'R4 body/frame/source qualification not implemented.')))
    return dict(schema='oras.solar.v1', epoch=epoch.isoformat().replace('+00:00','Z'), time_scale='UTC input; Skyfield converts to TDB for kernel evaluation',
        origin='Sun center (10)', frame='ICRF', units='AU', km_per_au=149597870.7,
        corrections='geometric; no light-time or aberration',
        source=dict(id=ephemeris.SOURCE_KEY, release=runtime.manifest['release_version'], sha256=runtime.manifest['sha256']),
        trajectory_model='Open DE442s sampled prior paths over nominal sidereal periods for each planet (129 samples); clipped at kernel coverage. Not osculating elements or closed ellipses.', bodies=bodies)
