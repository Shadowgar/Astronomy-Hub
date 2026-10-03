import test from 'node:test';import assert from 'node:assert/strict';
import {admitDisplayConfig} from '../../runtimes/earth-runtime/core/displayConfig.mjs';
test('configured assets require explicit provider qualification and browser-token attestation',()=>{
 const config={schema:1,qualified:true,publicToken:'publishable-scope-example',publicTokenAttested:true,terrainAsset:1};
 assert.equal(admitDisplayConfig(config),config);
 for(const update of [{qualified:false},{publicTokenAttested:false},{terrainAsset:-1},{serverSecret:'credential'},{providerUrl:'https://evil.example'}])assert.equal(admitDisplayConfig({...config,...update}),null);
 assert.equal(admitDisplayConfig({schema:1}),null);
});
