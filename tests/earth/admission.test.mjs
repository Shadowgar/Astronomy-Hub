import test from 'node:test';import assert from 'node:assert/strict';
import {admitAircraft,weatherPayloadValid,validTleLine,tleRecords} from '../../runtimes/earth-runtime/layers/data.mjs';
test('unknown altitude, invalid coords/identity and stale source epoch are not displayed as flights',()=>{
 const now=Date.now(),row=['abc123','CALL',null,now/1000,now/1000,-79,41,1000,false,null,null,null,null,3000];
 assert.equal(admitAircraft({time:now/1000,states:[row]}).length,1);
 for(const [index,value] of [[13,null],[6,91],[0,'invalid']]){const r=[...row];r[index]=value;assert.equal(admitAircraft({time:now/1000,states:[r]}).length,0)}
 assert.throws(()=>admitAircraft({time:(now-200000)/1000,states:[row]}));
});
test('upstream Number(null) coercion cannot manufacture weather temperature or epoch',()=>{
 assert.equal(weatherPayloadValid({current:{temperature_2m:null,time:'2026-10-02T12:00'}}),false);
 assert.equal(weatherPayloadValid({current:{temperature_2m:12,time:'bad'}}),false);
 assert.equal(weatherPayloadValid({current:{temperature_2m:12,time:'2026-02-30T12:00'}}),false);
 assert.equal(weatherPayloadValid({current:{temperature_2m:12,time:'2026-10-02T12:00'}}),true);
});
test('TLE catalog rejects checksum corruption and cross-object line pairs',()=>{
 const line=(s)=>s.padEnd(68,' ')+[...s.padEnd(68,' ')].reduce((v,c)=>v+(/\d/.test(c)?Number(c):c==='-'?1:0),0)%10;
 const a=line('1 25544U 98067A   26275.50000000  .00016717  00000-0  30122-3 0  999'),b=line('2 25544  51.6434 208.5775 0007417  88.2575  28.5079 15.5038153244978');
 assert.equal(validTleLine(a,'1'),true);assert.equal(tleRecords('ISS\n'+a+'\n'+b).length,1);
 assert.equal(tleRecords('ISS\n'+a.slice(0,68)+'x\n'+b).length,0);assert.equal(tleRecords('ISS\n'+a+'\n'+b.replace('25544','99999')).length,0);
});
