"""Ephemeral regional cache and one shared ADSB.lol dispatch per 30 seconds.

Redis is the existing canonical cache. Fail closed when it cannot enforce the
budget; process-local caches alone must not multiply upstream calls across workers.
"""
import asyncio
import json
import time
from email.utils import parsedate_to_datetime

from ..cache.init import get_redis_url

PREFIX = 'oras:earth:aircraft:b1:'
CLAIM = """
local cached = redis.call('GET', KEYS[1])
if cached then return {'cached', cached} end
local active = redis.call('GET', KEYS[2])
if active == KEYS[1] then return {'wait', ''} end
if active then return {'limited', ''} end
redis.call('SET', KEYS[2], KEYS[1], 'EX', 30)
return {'acquire', ''}
"""

class AircraftBudgetError(ValueError):
    pass

def client():
    import redis
    return redis.Redis.from_url(get_redis_url(), decode_responses=True,
                               socket_timeout=.5, socket_connect_timeout=.5)

async def claim(point):
    key = PREFIX + f'{point[0]:.1f}:{point[1]:.1f}'
    try:
        result = await asyncio.to_thread(client().eval, CLAIM, 2, key, PREFIX + 'dispatch')
        if result[0] == 'wait':
            # Same region, another worker: await its result without acquiring again.
            # read_and_cache owns the eight-second whole-call deadline, including
            # Redis I/O. Do not give its coalesced waiter a shorter deadline.
            while True:
                value = await asyncio.to_thread(client().get, key)
                if value is not None:
                    return json.loads(value)
                await asyncio.sleep(.05)
        if result[0] == 'limited':
            raise AircraftBudgetError('Shared regional acquisition budget exhausted')
        return json.loads(result[1]) if result[0] == 'cached' else None
    except AircraftBudgetError:
        raise
    except Exception:
        raise ValueError('Shared aircraft cache unavailable') from None

def retry_seconds(error):
    value = getattr(getattr(error, 'response', None), 'headers', {}).get('Retry-After')
    try:
        seconds = int(value) if value.strip().isdigit() else int(parsedate_to_datetime(value).timestamp()-time.time())
        return max(60, min(seconds, 2_147_483_647))
    except (ValueError, TypeError, AttributeError, OverflowError):
        return 60

async def retain(point, payload, retry_after=60):
    key = PREFIX + f'{point[0]:.1f}:{point[1]:.1f}'
    value = payload.dict() if payload is not None else {'unavailable': True}
    try:
        def store():
            cache = client()
            with cache.pipeline(transaction=True) as batch:
                batch.set(key, json.dumps(value, allow_nan=False), ex=30 if payload is not None else retry_after)
                if payload is None:
                    batch.expire(PREFIX+'dispatch',retry_after,gt=True)
                batch.execute()
        await asyncio.to_thread(store)
    except Exception:
        # Dispatch lease still prevents acquisition fanout. Report cache failure.
        raise ValueError('Shared aircraft cache unavailable') from None
