const fs = require('fs')
const path = require('path')

const root = process.cwd()
const scenePath = path.join(root, 'frontend/src/components/AboveMeScene.jsx')

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

if (!fs.existsSync(scenePath)) fail('AboveMeScene.jsx not found')

const src = fs.readFileSync(scenePath, 'utf8')

if (!src.includes("import ObjectDetail from './ObjectDetail'")) fail('AboveMeScene is not wired to ObjectDetail')
if (!src.includes('selectedObjectId')) fail('AboveMeScene does not track selected scene object')
if (!src.includes('onClick')) fail('AboveMeScene objects are not clickable')
if (!src.includes('<ObjectDetail')) fail('AboveMeScene does not render ObjectDetail')

console.log('OK: scene interaction flow wiring present')
