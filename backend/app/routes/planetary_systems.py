from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.planetary_systems import SystemCatalog, SystemSnapshot
from backend.app.services.planetary_systems import system_catalog, system_snapshot
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

router = APIRouter()


@router.get('/planetary-systems', response_model=SystemCatalog)
def get_system_catalog():
    return system_catalog()


@router.get('/planetary-systems/{system_id}', response_model=SystemSnapshot)
def get_planetary_system(system_id: str, epoch: str = Query(..., min_length=20, max_length=40)):
    try:
        instant = datetime.fromisoformat(epoch.replace('Z','+00:00'))
        return system_snapshot(system_id, instant)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Unknown planetary system.') from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail='Use a timezone-aware epoch within this system’s qualified source coverage.') from exc
    except EphemerisUnavailableError as exc:
        raise HTTPException(status_code=503, detail='Qualified planet-center and satellite sources are unavailable.') from exc
