/** Fresh execution of the existing source-matched Earth/native-Moon journey.
 * Prior evidence is a reference only; this wrapper never copies prior PASS logs.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
const repo=process.env.PS_REPO||process.cwd();
const base=process.env.PS_URL||'http://127.0.0.1:4224',out=process.env.PS_OUT||'output/planetary-systems/ps3/earth-native';await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex');
const script='scripts/validation/verify_planetary_systems.mjs';
async function served(path){const url=new URL(path,base),html=await(await fetch(url)).text();return{url:url.href,index_sha256:hash(html),assets:await Promise.all([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(async m=>{const asset=new URL(m[1],url);return{url:asset.href,sha256:hash(Buffer.from(await(await fetch(asset)).arrayBuffer()))}}))}}
const before={script_sha256:hash(await readFile(join(repo,script))),main:await served('/'),moon:await served('/planet-runtime/')};
const receipt={status:'RUNNING',base,repo,before,command:['node',script],viewport:process.env.PS_VIEWPORT||'1440x900',started_utc:new Date().toISOString(),limits:['Fresh existing journey execution; no old proof is relabeled as new.','Actual software Chromium; no physical GPU or owner acceptance.']};
const child=spawn(process.execPath,[join(repo,script)],{cwd:repo,env:{...process.env,PS_URL:base,PS_OUT:join(out,'journey'),PS_VIEWPORT:receipt.viewport},stdio:['ignore','pipe','pipe']});let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log+=data;process.stdout.write(data)});
receipt.exit_code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});await writeFile(join(out,'execution.log'),log);
receipt.after={script_sha256:hash(await readFile(join(repo,script))),main:await served('/'),moon:await served('/planet-runtime/')};receipt.served_and_script_unchanged=JSON.stringify(before)===JSON.stringify(receipt.after);
try{receipt.journey=JSON.parse(await readFile(join(out,'journey/proof.json'),'utf8'));}catch(e){receipt.proof_error=String(e)}
receipt.status=receipt.exit_code===0&&receipt.served_and_script_unchanged&&receipt.journey?.status==='PASS'&&receipt.journey?.source_unchanged?'PASS':'FAIL';receipt.finished_utc=new Date().toISOString();await writeFile(join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log('EARTH_NATIVE_RECEIPT',join(out,'receipt.json'),receipt.status);if(receipt.status!=='PASS')process.exitCode=1;
