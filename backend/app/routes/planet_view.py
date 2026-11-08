from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.planet_view import PlanetSnapshot
from backend.app.services.planet_view import planet_snapshot
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

router = APIRouter()


@router.get('/planet-view/{body}', response_model=PlanetSnapshot)
def get_planet_view(body: str, time: str = Query(..., min_length=20, max_length=40)):
    if body != 'moon':
        raise HTTPException(status_code=404, detail='This body has no qualified Planet View.')
    try:
        instant = datetime.fromisoformat(time.replace('Z', '+00:00'))
        return planet_snapshot(instant)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail='Use a timezone-aware time within qualified lunar coverage (1900–2051).') from exc
    except EphemerisUnavailableError as exc:
        raise HTTPException(status_code=503, detail='Qualified local lunar science sources are unavailable.') from exc
