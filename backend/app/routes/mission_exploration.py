from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.mission_exploration import MissionCatalog, MissionState, MissionTrajectory
from backend.app.services.mission_exploration import mission_catalog, mission_state, trajectory
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

router=APIRouter()


def _call(function,*args,**kwargs):
    try:
        return function(*args,**kwargs)
    except KeyError as exc:
        raise HTTPException(status_code=404,detail='Unknown mission.') from exc
    except ValueError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc
    except EphemerisUnavailableError as exc:
        raise HTTPException(status_code=503,detail='Local qualified mission source unavailable.') from exc


@router.get('/solar/missions',response_model=MissionCatalog)
def get_mission_catalog():
    return _call(mission_catalog)


@router.get('/solar/missions/{identity}/trajectory',response_model=MissionTrajectory)
def get_mission_trajectory(identity:str,start:str|None=Query(None,max_length=40),end:str|None=Query(None,max_length=40),max_points:int=Query(4096,ge=32,le=8192)):
    return _call(trajectory,identity,start,end,max_points)


@router.get('/solar/missions/{identity}',response_model=MissionState)
def get_mission_state(identity:str,epoch:str=Query(...,min_length=20,max_length=40),start:str|None=Query(None,max_length=40),end:str|None=Query(None,max_length=40)):
    return _call(mission_state,identity,epoch,start,end)
