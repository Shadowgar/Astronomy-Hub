from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.solar_exploration import SolarSnapshot
from backend.app.services.solar_exploration import solar_snapshot
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

router = APIRouter()

@router.get('/solar-system', response_model=SolarSnapshot)
def get_solar_system(epoch: str = Query(..., min_length=20, max_length=40)):
    try:
        instant = datetime.fromisoformat(epoch.replace('Z','+00:00'))
        if instant.tzinfo is None:
            raise ValueError('epoch requires timezone')
        return solar_snapshot(instant)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail='Use an explicit UTC epoch within local DE442s coverage.') from exc
    except EphemerisUnavailableError as exc:
        raise HTTPException(status_code=503, detail='Local Solar ephemeris unavailable.') from exc
