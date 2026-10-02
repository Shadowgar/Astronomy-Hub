import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

function preflight(remote,artifact){
 const dir=mkdtempSync(join(tmpdir(),'earth-deploy-preflight-')),marker=join(dir,'ssh-called');
 try{
  // All remote access is stubbed, and the first SSH preflight stops execution.
  writeFileSync(join(dir,'ssh'),'#!/bin/sh\n: > "$PREFLIGHT_SSH_MARKER"\nexit 90\n',{mode:0o755});
  writeFileSync(join(dir,'rsync'),'#!/bin/sh\nexit 91\n',{mode:0o755});
  const result=spawnSync('bash',['scripts/deploy-remote-prod.sh'],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,REMOTE_USER:'qualification',REMOTE_DIR:remote,ORAS_EARTH_ARTIFACT_DIR:artifact,START_PAGE_ONLY:'0',PREFLIGHT_SSH_MARKER:marker}});
  return {...result,ssh:existsSync(marker)};
 }finally{rmSync(dir,{recursive:true,force:true})}
}
for(const [name,remote,artifact] of [
 ['equal','/home/rocco/astronomy-hub','/home/rocco/astronomy-hub'],
 ['child','/home/rocco/astronomy-hub','/home/rocco/astronomy-hub/data/runtime-artifacts/earth'],
 ['trailing slashes','/home/rocco/astronomy-hub/','/home/rocco/astronomy-hub///'],
 ['dot and dot-dot','/home/rocco/./astronomy-hub/','/home/rocco/astronomy-hub-artifacts/../astronomy-hub/data/./earth'],
 ['normalized destination','/home/rocco/other/../astronomy-hub/','/home/rocco/astronomy-hub/earth'],
])test(`artifact ${name} is rejected before SSH`,()=>{
 const result=preflight(remote,artifact);assert.equal(result.status,1);assert.match(result.stderr,/outside REMOTE_DIR/);assert.equal(result.ssh,false);
});
for(const artifact of ['/home/rocco/astronomy-hub-artifacts/earth','/home/rocco/astronomy-hub-artifacts/./data/../earth/'])test(`sibling ${artifact} passes containment guard`,()=>{
 const result=preflight('/home/rocco/astronomy-hub/',artifact);assert.equal(result.ssh,true);assert.doesNotMatch(result.stderr,/outside REMOTE_DIR/);assert.equal(result.status,1); // Stopped by the fake SSH, no deployment.
});
