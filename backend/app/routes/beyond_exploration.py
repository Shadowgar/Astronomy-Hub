from fastapi import APIRouter, HTTPException

from backend.app.schemas.beyond_exploration import BeyondContext, ObservationProduct
from backend.app.services.beyond_exploration import ObservationUnavailableError, beyond_context, observation_product

router = APIRouter()


@router.get('/solar/beyond/context', response_model=BeyondContext)
def get_beyond_context():
    return beyond_context()


@router.get('/solar/beyond/observations/{identity}', response_model=ObservationProduct)
def get_observation_product(identity: str):
    try:
        return observation_product(identity)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Unknown observation product.') from exc
    except ObservationUnavailableError as exc:
        raise HTTPException(status_code=503, detail='Local qualified observation source unavailable.') from exc
