import functools,http.server,pathlib,shutil,subprocess,threading,json
R=pathlib.Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026')
O=pathlib.Path('/tmp/pr107-integration-review/prototype')
O.mkdir(exist_ok=True)
names=['explorer.html','reference.css','reference.js','index.html','gallery.css','system.html','review.html','verify.mjs']
for name in names: shutil.copyfile(R/'docs/design/adaptive-explorer-r1a'/name,O/name)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(O)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 env=__import__('os').environ.copy();env['DESIGN_PREVIEW_URL']=f'http://127.0.0.1:{server.server_port}';env['PLAYWRIGHT_MODULE']=str(R/'node_modules/playwright/index.mjs')
 with (O.parent/'prototype-review.log').open('w') as out:p=subprocess.run(['node',str(O/'verify.mjs')],env=env,stdout=out,stderr=subprocess.STDOUT,timeout=90)
 print((O.parent/'prototype-review.log').read_text()[-2200:]);raise SystemExit(p.returncode)
finally:server.shutdown()
