import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import original from '../../../runtimes/planet-runtime/vite.config.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const output=path.join(root,'output/playwright/owner-acceptance/solar2-terrain');
export default {...original,root:here,base:'/owner-review/solar2-terrain/',plugins:[...original.plugins,{name:'isolated-lola-source',generateBundle(){
 for(const file of ['ldem_4.img','ldem_4.lbl','manifest.json'])this.emitFile({type:'asset',fileName:'data/'+file,source:fs.readFileSync(path.join(root,'frontend/public/solar-assets/lunar-height-v1',file))});
}}],build:{...original.build,outDir:output,emptyOutDir:false}};
