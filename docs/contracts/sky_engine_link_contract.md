# Sky Engine Link Contract

## Purpose

This contract defines the stable object URL shape used when Astronomy Hub, a
future WordPress shortcode, or any other surface opens ORAS Sky Engine directly
on a specific object.

## Canonical URL

```text
/oras-sky-engine/skysource/<slug>?catalog=<catalog>&source_id=<id>&model=<model>&ra=<ra>&dec=<dec>&date=<time>&fov=<fov>&lat=<lat>&lng=<lng>&elev=<elev>
```

## Required Identity Fields

| Field | Required | Rule |
| --- | --- | --- |
| `catalog` | yes | Authoritative source namespace, for example `Messier (local)` or `Gaia DR2`. |
| `source_id` | yes | Authoritative catalog identifier. Treat as a string. Never coerce Gaia IDs to JavaScript numbers. |
| `model` | yes | Sky Engine object model, for example `star` or `dso`. |
| `ra` | yes | Right ascension in decimal degrees. Used for validation and fallback centering. |
| `dec` | yes | Declination in decimal degrees. Used for validation and fallback centering. |

## Optional View Fields

| Field | Rule |
| --- | --- |
| `slug` | Cosmetic only. It must not drive selection. |
| `date` | ISO-8601 UTC time. Named `date` for current Sky Engine runtime compatibility. |
| `fov` | Requested field of view in degrees. |
| `lat` | Observer latitude in degrees. |
| `lng` | Observer longitude in degrees. |
| `elev` | Observer elevation in meters unless a caller-specific contract states otherwise. |

## Selection Rule

Sky Engine selection must resolve by:

```text
catalog + source_id + model
```

The slug exists for human-readable URLs only. It is not authoritative and may be
changed without changing the target object.

## Data-Scale Rule

Do not solve object linking by hand-registering individual stars or DSOs.
Catalog-backed links must be generated from normalized object records. Test
fixtures may use small named objects, but production behavior must be
data-driven.

## Gaia ID Rule

Gaia IDs exceed JavaScript safe integer limits. Every API and frontend caller
must preserve `source_id` as a string when building or parsing Sky Engine links.
