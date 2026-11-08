from pathlib import Path
import shutil,subprocess,sys
root=Path.cwd();source=Path('/var/tmp/oras-cesium/gods-eye');out=Path(sys.argv[1])
shutil.copyfile(root/'runtimes/earth-runtime/display-config.json',out/'display-config.json')
(out/'cesium').mkdir(exist_ok=True)
for name in ['Assets','ThirdParty','Workers','Widgets']:shutil.copytree(source/'node_modules/cesium/Build/Cesium'/name,out/'cesium'/name,dirs_exist_ok=True)
shutil.copyfile(source/'LICENSE',out/'LICENSE-gods-eye.txt');(out/'health').write_text('ORAS Earth runtime ready\n')
subprocess.run(['python3','scripts/runtime/copy_dependency_licenses.py',str(source),str(out)],check=True)
subprocess.run(['python3','scripts/runtime/record_owned_earth.py',str(source),str(out)],check=True)
