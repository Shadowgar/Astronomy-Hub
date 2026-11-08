import test from 'node:test';
import assert from 'node:assert/strict';
import {satellitePresentation} from '../../runtimes/sky-adapter/satellite-presentation.mjs';
const radians = degrees => degrees * Math.PI / 180;
const create = (visible = true, offset = 2) => {
  const satellites = {visible:true, hints_visible:visible, hints_mag_offset:offset};
  return {satellites, control:satellitePresentation({satellites})};
};
test('normal 120° Sky restores native indicators without touching native photometric point rendering', () => {
  const {satellites,control} = create();
  control.update(true,radians(120),false);
  assert.deepEqual(satellites,{visible:true,hints_visible:true,hints_mag_offset:2});
});
test('medium and wide view do not force hidden hints or selected-only suppression', () => {
  const {satellites,control} = create();
  for (const d of [120,50,20,10,8]) {
    control.update(true,radians(d),false);
    assert.equal(satellites.hints_visible,true);
    assert.equal(satellites.hints_mag_offset,2);
  }
  control.update(true,radians(120),true);
  assert.equal(satellites.hints_visible,true);
  assert.equal(satellites.hints_mag_offset,2);
});
test('close-view enhancement retains the 5° entry/7° exit offset hysteresis', () => {
  const {satellites,control} = create();
  for(const [degrees,expectedOffset] of [[120,2],[6,2],[5,4],[6,4],[6.9999999999,2],[4,4],[7,2]]) {
    control.update(true,radians(degrees),false);
    assert.equal(satellites.hints_visible,true,`visibility at ${degrees} degrees`);
    assert.equal(satellites.hints_mag_offset,expectedOffset,`offset at ${degrees} degrees`);
  }
});
test('native user disabled indicators remain disabled at all fields and after release', () => {
  const {satellites,control} = create(false);
  for (const d of [120,4,50]) {
    control.update(true,radians(d),false);
    assert.equal(satellites.hints_visible,false);
    assert.equal(satellites.hints_mag_offset,2);
  }
  control.release();
  assert.deepEqual(satellites,{visible:true,hints_visible:false,hints_mag_offset:2});
});
test('external native hint preference change is respected, including during close view', () => {
  const {satellites,control} = create();
  control.update(true,radians(120),false);
  satellites.hints_visible=false;
  control.update(true,radians(120),false);
  control.update(true,radians(4),false);
  assert.equal(satellites.hints_visible,false);
  assert.equal(satellites.hints_mag_offset,2);
  control.release();
  assert.equal(satellites.hints_visible,false);
});
test('external magnitude preference changes are retained after close view and exit', () => {
  const {satellites,control} = create(true,1);
  control.update(true,radians(4),false);
  assert.equal(satellites.hints_mag_offset,4);
  satellites.hints_mag_offset=7;
  control.update(true,radians(4),false);
  assert.equal(satellites.hints_mag_offset,7);
  control.update(true,radians(120),false);
  assert.equal(satellites.hints_mag_offset,7);
  control.release();
  assert.equal(satellites.hints_mag_offset,7);
});
test('returning to standalone restores original offset, native hints and unmodified visible flag', () => {
  const {satellites,control} = create(true,2);
  control.update(true,radians(4),true);
  assert.equal(satellites.hints_mag_offset,4);
  control.update(false,radians(4),false);
  assert.deepEqual(satellites,{visible:true,hints_visible:true,hints_mag_offset:2});
});
