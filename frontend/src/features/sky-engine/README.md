# ORAS Sky-Engine Boundary

This folder is the official clean `/sky-engine` boundary for ORAS Sky-Engine.

- It owns the React route wrapper and runtime bridge only.
- It does not recreate the deleted custom renderer.
- It does not depend on Babylon packages or the removed owner or harness code.
- It mounts the vendored ORAS Sky-Engine runtime from `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine` through a thin host surface.

## Sky Over ORAS Now Launch Path

Use either route for account-page launch buttons:

- `/sky-over-oras-now`
- `/sky-engine/oras-now`

Each route redirects to `/sky-engine` with query params for:

- current UTC time (`date`)
- ORAS observatory coordinates (`lat`, `lng`)
- ORAS elevation in meters (`elev`)
- default field of view (`fov=120`)

Example account-page button:

```html
<a href="https://oras.org/sky-over-oras-now">Sky over ORAS now</a>
```