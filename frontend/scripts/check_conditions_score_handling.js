const fs = require('fs')
const path = require('path')

const root = process.cwd()
const pdpPath = path.join(root, 'frontend/src/components/PrimaryDecisionPanel.jsx')
const condPath = path.join(root, 'frontend/src/components/Conditions.jsx')

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

const pdp = fs.readFileSync(pdpPath, 'utf8')
const cond = fs.readFileSync(condPath, 'utf8')

if (!pdp.includes("typeof score === 'string'")) fail('PrimaryDecisionPanel does not handle string observing scores')
if (!cond.includes("typeof data?.observing_score === 'string'")) fail('Conditions does not render string observing scores')

console.log('OK: string observing score handling present')
