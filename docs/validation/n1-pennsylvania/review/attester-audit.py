from pathlib import Path
import json,os,subprocess,tempfile,hashlib
repo=Path.cwd();pin='023e3b26babf7ffddf45f39293230b14cfe96993';default=Path('/var/tmp/oras-phase-c/sky-reconstruction/upstream')
with tempfile.TemporaryDirectory(prefix='n1-attestation-audit-') as name:
 t=Path(name);selected=t/'selected-source';selected.symlink_to(default,target_is_directory=True)
 assert subprocess.check_output(['/usr/bin/git','-C',str(selected),'rev-parse',pin],text=True).strip()==pin
 shim=t/'bin';shim.mkdir();record=t/'git-argv.json'
 (shim/'git').write_text('#!/usr/bin/python3\nimport json,sys\nfrom pathlib import Path\nPath('+repr(str(record))+').write_text(json.dumps(sys.argv[1:]))\nsys.exit(86)\n');(shim/'git').chmod(0o755)
 env={**os.environ,'ORAS_SKY_SOURCE_REPO':str(selected),'PATH':str(shim)+':'+os.environ['PATH']}
 result=subprocess.run(['python3','scripts/runtime/attest_sky_horizon.py','output/n1/native-horizon-build/upstream'],env=env,capture_output=True,text=True)
 args=json.loads(record.read_text());assert args==['-C',str(default),'archive',pin];assert args[1]!=str(selected)
 proof={'status':'REPRODUCED','evidenceClass':'actual attester command-routing audit; valid pinned source override verified with real git; git shim records archive request then intentionally aborts before compilation/attestation; not a full native rebuild','configuredSource':str(selected),'configuredPinVerified':pin,'actualGitArguments':args,'ignoredOverride':True,'controlledAbortExit':result.returncode,'sourceSha256':hashlib.sha256((repo/'scripts/runtime/attest_sky_horizon.py').read_bytes()).hexdigest(),'limitation':'Configured source is a valid alternate-path symlink to the same pinned checkout. This proves ignored routing, not differing native bytes.'}
 (repo/'output/n1/pennsylvania/p2-attester-reproduction.json').write_text(json.dumps(proof,indent=2)+'\n');print('P2 attester source override ignored: REPRODUCED; controlled command-routing audit only')
