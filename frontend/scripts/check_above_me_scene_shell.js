const fs = require('fs')
const path = require('path')

const root = process.cwd()
const appPath = path.join(root, 'frontend/src/App.jsx')
const scenePath = path.join(root, 'frontend/src/components/AboveMeScene.jsx')

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

if (!fs.existsSync(appPath)) fail('App.jsx not found')
if (!fs.existsSync(scenePath)) fail('AboveMeScene.jsx not found')

const appSrc = fs.readFileSync(appPath, 'utf8')
const sceneSrc = fs.readFileSync(scenePath, 'utf8')

if (!appSrc.includes('AboveMeScene')) fail('App.jsx does not reference AboveMeScene')
if (!appSrc.includes('<AboveMeScene')) fail('App.jsx does not render AboveMeScene')
if (!sceneSrc.includes('/api/scene/above-me')) fail('AboveMeScene does not fetch /api/scene/above-me')

console.log('OK: Above Me scene shell wiring present')
