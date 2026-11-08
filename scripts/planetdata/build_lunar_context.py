"""Reproject the existing qualified WAC raster to a small, static near-side locator.

This is a cartographic context image, not terrain or an epoch-lit Moon. No fetch,
source mutation, elevation synthesis or frame-realization alignment is performed.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image

SOURCE_SHA256 = '218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8'

def source_pixel(x, y, width, height):
    """Orthographic near side: center 0N/0E; x east/right, y north/up."""
    q = x*x + y*y
    if q > 1:
        return None
    latitude = math.asin(y)
    longitude = math.atan2(x, math.sqrt(max(0, 1-q)))
    return ((longitude/(2*math.pi)+.5)*width-.5,
            (.5-latitude/math.pi)*height-.5)

def build(source, output):
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise ValueError('Unqualified Moon WAC source')
    src = Image.open(source).convert('RGBA')
    if src.size != (2880,1440):
        raise ValueError('Unexpected WAC dimensions')
    size = 384
    dst = Image.new('RGBA',(size,size))
    pix, target = src.load(), dst.load()
    for j in range(size):
        for i in range(size):
            uv = source_pixel((i+.5-size/2)/(size/2), (size/2-j-.5)/(size/2), *src.size)
            if uv is None:
                continue
            x,y = uv
            x0,y0 = math.floor(x), math.floor(y)
            fx,fy = x-x0,y-y0
            def sample(a,b): return pix[a%src.width,max(0,min(src.height-1,b))]
            corners = [sample(x0,y0),sample(x0+1,y0),sample(x0,y0+1),sample(x0+1,y0+1)]
            target[i,j] = tuple(round((c[0]*(1-fx)+c[1]*fx)*(1-fy)+(c[2]*(1-fx)+c[3]*fx)*fy) for c in zip(*corners))
    output.parent.mkdir(parents=True,exist_ok=True)
    dst.save(output,compress_level=9)
    return {'source':'existing /planet-data/moon-wac.png','sourceSha256':SOURCE_SHA256,'sourceDimensions':[2880,1440],
            'sourceSampling':'8 pixels/degree; approximately 3.79 km/pixel at equator',
            'projection':'orthographic, center 0N 0E, north up, east right; static morphology',
            'dimensions':[size,size],'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),
            'sourceAuthority':'runtimes/planet-runtime/moon-source-manifest.json',
            'limitation':'Location context only; no precise NAC-to-ME421 registration or selected-epoch illumination.'}

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--receipt',type=Path)
    args=parser.parse_args();receipt=build(args.source,args.output)
    if args.receipt: args.receipt.write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt,indent=2))
