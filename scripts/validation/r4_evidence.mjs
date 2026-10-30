import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function sourceIdentity(){
 const roots=['frontend/src/features/planet','runtimes/planet-runtime',
 'frontend/src/features/solar/SolarScene.ts','frontend/src/features/solar/SolarWorkspace.tsx','frontend/src/routes/AppRouter.tsx',
 'backend/app/main.py','backend/app/routes/planet_view.py','backend/app/schemas/planet_view.py','backend/app/services/planet_view.py'];
 const result={};
 async function visit(path){let children;try{children=await readdir(path)}catch{result[path]=createHash('sha256').update(await readFile(path)).digest('hex');return}for(const child of children.sort())await visit(path+'/'+child)}
 for(const root of roots)await visit(root);
 return result;
}
