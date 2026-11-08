from fastapi import APIRouter, HTTPException, Response
from backend.app.schemas.solar_populations import PopulationPack
from backend.app.services.solar_populations import PopulationUnavailable, population_response

router=APIRouter()


@router.get('/solar-populations',response_model=PopulationPack)
def get_solar_populations():
    try:
        # The immutable bytes were fully admitted by the Pydantic response model
        # on source load. Avoid revalidating/serializing 20k rows on every request.
        body,sha256=population_response()
        return Response(content=body,media_type='application/json',headers={'ETag':'"'+sha256+'"','Cache-Control':'private, max-age=300'})
    except PopulationUnavailable as exc:
        raise HTTPException(status_code=503,detail='Qualified local Solar population source is unavailable.') from exc
