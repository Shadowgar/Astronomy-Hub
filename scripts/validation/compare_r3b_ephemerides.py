"""Emit honest DE442s/independent Horizons DE441 residuals; no source fitting."""
from pathlib import Path
from datetime import datetime,timezone
import json, math
from backend.app.services.solar_exploration import solar_snapshot
root=Path(__file__).resolve().parents[2]
reference=json.loads((root/'tests/fixtures/solar/r3b-reference.json').read_text())
rows=[]
for row in reference['rows']:
    snapshot=solar_snapshot(datetime.fromtimestamp((row['jdUtc']-2440587.5)*86400,timezone.utc))
    body=next(b for b in snapshot['bodies'] if b['ephemeris_target']==row['target'])
    delta=[(a-b)*149597870.7 for a,b in zip(body['position_au'],row['positionAu'])]
    rows.append(dict(target=row['target'],jdUtc=row['jdUtc'],deltaKm=delta,normKm=math.hypot(*delta),inherited50kmPass=math.hypot(*delta)<50,comparisonEnvelopeKm=1500 if row['target'] in ['7','8'] else 50))
print(json.dumps(dict(comparisonOnly=True,accuracyCertified=False,localSource=snapshot['source'],independentSource='Horizons DE441; see raw responses',rows=rows),indent=2))
