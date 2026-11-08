// Regression against captured real WebGL programs, not a source-text assertion.
import {readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const file=process.argv[2]
assert.ok(file,'Usage: node verify_solar26_prepared_programs.mjs cold.json')
const report=JSON.parse(await readFile(file,'utf8'))
assert.equal(report.status,'PASS')
assert.equal(report.mode,'trace')
const ready=report.cold.milestones.find(m=>m.name==='ready-observed').time
const unprepared=report.cold.programs.filter(p=>p.firstUseAt!==undefined&&p.firstUseAt<ready&&!p.polls.some(p=>p.ready))
console.log(JSON.stringify({unpreparedBeforeFirstReady:unprepared.map(p=>({id:p.id,linkedAt:p.linkedAt,firstUseAt:p.firstUseAt,names:p.shaders.flat().filter(d=>d.startsWith('#define SHADER_NAME'))}))}))
assert.deepEqual(unprepared,[],'The initial scene must render the shader variants that parallel preparation actually admitted')
