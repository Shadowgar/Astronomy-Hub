// Independent read-only fixture for the installed, unchanged NASA0.5.3 failure.
// This never mounts a renderer, fetches a tile or changes package/application files.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'

const base=new URL('../../../../frontend/graphics/node_modules/3d-tiles-renderer/',import.meta.url)
const packageInfo=JSON.parse(await readFile(new URL('package.json',base),'utf8'))
assert.equal(packageInfo.version,'0.5.3')
const sourceUrl=new URL('src/core/renderer/tiles/TilesRendererBase.js',base)
const {TilesRendererBase}=await import(sourceUrl.href)
const tiles=new TilesRendererBase()
// A processed failed root with a deferred/unprocessed child: no browser/network.
tiles.rootTileset={root:{internal:{loadingState:-1},children:[{children:[]}]}}
tiles.stats.failed=1
let observed
try{tiles.resetFailedTiles()}catch(error){observed=String(error)}
assert.match(observed??'',/TypeError: Cannot read properties of undefined \(reading 'loadingState'\)/)
console.log(JSON.stringify({
 status:'REPRODUCED_UNCHANGED_UPSTREAM_FAILURE',
 package:packageInfo.name,version:packageInfo.version,
 sourceSha256:createHash('sha256').update(await readFile(sourceUrl)).digest('hex'),
 fixture:'processed failed root; deferred child has no internal object',
 observed,
 limitation:'Original-library fixture only; corrected application recovery requires actual browser evidence.',
},null,2))
