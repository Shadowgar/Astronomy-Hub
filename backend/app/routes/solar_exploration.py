from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.solar_exploration import SolarSnapshot, SolarMotion
from backend.app.services.solar_motion import solar_motion
from backend.app.services.solar_small_bodies import small_body_pack
from fastapi.responses import JSONResponse
from backend.app.services.solar_exploration import solar_snapshot
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

router = APIRouter()

@router.get('/solar-system/small-bodies')
def get_small_bodies():
    try:
        pack,digest=small_body_pack()
        return JSONResponse(pack,headers={'ETag':'"'+digest+'"','Cache-Control':'public, max-age=86400'})
    except (OSError,ValueError,KeyError) as exc:
        raise HTTPException(status_code=503,detail='Local small-body source unavailable.') from exc

@router.get('/solar-system/motion', response_model=SolarMotion)
def get_solar_motion(epoch: str = Query(..., min_length=20, max_length=40)):
    try:
        return solar_motion(datetime.fromisoformat(epoch.replace('Z','+00:00')))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail='Use an explicit millisecond UTC epoch within local DE442s coverage.') from exc
    except EphemerisUnavailableError as exc:
        raise HTTPException(status_code=503, detail='Local Solar motion source unavailable.') from exc

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
