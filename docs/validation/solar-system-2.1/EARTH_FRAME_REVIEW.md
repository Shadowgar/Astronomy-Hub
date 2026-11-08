# Independent Earth-frame review

Reviewed on 2026-10-28 by the lunar-source implementer, who did not author the
Earth orientation implementation. No implementation changes were made by this
review. Scope: `solar_earth_frame.py`, `solar_motion.py`, the solar API schema,
`solarEarthFrame.ts`, motion interpolation and the NASA Earth image UV mapping.

**Result: PASS within the disclosed model; no actionable frame defect found.**

The reproducible Docker check is:

```sh
docker exec -i pr107-owner-backend python < scripts/validation/validate_solar21_earth_frame.py > docs/validation/solar-system-2.1/earth-frame-independent-review.json
```

It independently reconstructs rotation matrices from the emitted xyzw
quaternions and compares them with installed Skyfield 1.55 `itrs.rotation_at`.
The receipt records the three backend source hashes, 1,736 rotations across
seven windows, both coverage boundaries and historical leap-second boundaries.
Maximum matrix error is `6.169269603636604e-15`; determinant error is
`1.3322676295501878e-15`; quaternion norm error is `1.1102230246251565e-16`.
The largest reported sampled interpolation error is `0.011281386888938566`
arcseconds, below the API's 0.05 arcsecond interpolation threshold. This last
number checks interpolation against the same installed model, not its absolute
terrestrial accuracy.

The ICRF-to-ITRS matrix convention, shortest-path quaternion interpolation and
inverse rotation for the Earth mesh are consistent. The inspected historical
NASA equirectangular image has Greenwich at `u=0.5`; the Three sphere's local
`+X / -Z / +Y` axes map to longitude zero / 90 degrees east / north through the
explicit `Rx(+90 degrees)` mapping and inverse ITRS rotation. Clouds use the
same mesh rotation. Frontend frame/motion tests passed 9/9; a later combined
frame/motion/approach/atmosphere run passed 18/18:

```sh
cd frontend
npm test -- --run tests/solarEarthFrame.test.ts tests/solarMotion.test.ts tests/solarEarthApproach.test.ts tests/solarTakram.test.ts
```

Official references checked: [Skyfield terrestrial frames](https://rhodesmill.org/skyfield/api-framelib.html)
and [Skyfield time scales](https://rhodesmill.org/skyfield/time.html). Skyfield's
ITRS rotation includes precession, nutation and Earth rotation; polar motion
requires an installed table. This container uses the bundled time scale and
has no polar-motion table. Installed UT1 estimates, future leap-second
uncertainty and omitted observed EOP limit the physical interpretation. The UI
and contract disclose this; these checks do not establish geodetic accuracy.

No browser/device/owner-acceptance claim is made by this numerical review.
Root's separate application/browser qualification remains required.
