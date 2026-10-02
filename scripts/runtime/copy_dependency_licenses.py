#!/usr/bin/env python3
"""Keep dependency license/notice texts with the independently built artifact."""
from pathlib import Path
import re,shutil,sys,json
source,out=map(Path,sys.argv[1:]);destination=out/'third-party-licenses';destination.mkdir(exist_ok=True)
modules=source/'node_modules';packages=[]
for folder in modules.iterdir():
 if folder.name.startswith('@'):packages.extend(p for p in folder.iterdir() if p.is_dir())
 elif folder.is_dir() and not folder.name.startswith('.'):packages.append(folder)
records=[]
for package in sorted(packages):
 for file in package.iterdir():
  if file.is_file() and re.fullmatch(r'(?:licen[cs]e|notice|third[_-]party[_-]licenses)(?:\.(?:txt|md))?',file.name,re.I):
   name=str(package.relative_to(modules)).replace('/','__')+'__'+file.name
   shutil.copy2(file,destination/name);records.append({'package':str(package.relative_to(modules)),'file':name})
(destination/'inventory.json').write_text(json.dumps(records,indent=2)+'\n')
print('DEPENDENCY LICENSES:',len(records))
