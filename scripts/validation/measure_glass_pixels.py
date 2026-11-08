"""Read-only PNG raster comparison for labeled actual browser diagnostics."""
from pathlib import Path
import json,struct,zlib

def png(path):
 data=path.read_bytes();offset=8;encoded=b''
 while offset<len(data):
  size=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];chunk=data[offset+8:offset+8+size];offset+=size+12
  if kind==b'IHDR':w,h,depth,color,_,_,interlace=struct.unpack('>IIBBBBB',chunk);assert depth==8 and color in (2,6) and interlace==0
  if kind==b'IDAT':encoded+=chunk
 bpp=3 if color==2 else 4;stride=w*bpp;raw=zlib.decompress(encoded);previous=bytearray(stride);result=[]
 def paeth(a,b,c):
  p=a+b-c;d=[abs(p-a),abs(p-b),abs(p-c)];return [a,b,c][d.index(min(d))]
 for y in range(h):
  start=y*(stride+1);f=raw[start];row=bytearray(raw[start+1:start+1+stride])
  for x in range(stride):
   a=row[x-bpp] if x>=bpp else 0;b=previous[x];c=previous[x-bpp] if x>=bpp else 0
   row[x]=(row[x]+(0 if f==0 else a if f==1 else b if f==2 else (a+b)//2 if f==3 else paeth(a,b,c)))%256
  result.extend(row[x:x+3] for x in range(0,stride,bpp));previous=row
 return w,h,result
out=Path('output/cinematic-glass/compositing');w,h,a=png(out/'standard.png');report={}
for name in ['diagnostic-filter-disabled.png','diagnostic-opaque.png']:
 wb,hb,b=png(out/name);assert (w,h)==(wb,hb);diffs=[sum(abs(x-y) for x,y in zip(p,q)) for p,q in zip(a,b)];changed=sum(v>0 for v in diffs);assert changed>0
 report[name]={'changed_pixels':changed,'total_pixels':w*h,'mean_absolute_rgb_difference':sum(diffs)/(3*w*h)}
report['interpretation']='Actual raster changes with filter removed and with opaque surface. This is compositing evidence, not an aesthetic similarity score or owner acceptance.'
(out/'raster-evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
