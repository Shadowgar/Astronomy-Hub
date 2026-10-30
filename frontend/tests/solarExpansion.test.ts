import {radii} from './fixtures/solarRadii'
import {it,expect} from 'vitest'
import {focusPose} from '../src/features/solar/solarPresentation'
import {aggregateBelt} from '../src/features/solar/solarBelt'
it('can focus all eight planets without changing their source vectors',()=>{
 for(const id of ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'] as const){const p:[number,number,number]=[27,1,2];expect(radii[id]).toBeGreaterThan(0);expect(focusPose(radii,id,p,.44).target).toEqual(p)}
})
it('bounds deterministic non-identifiable belt context in the ecliptic and clamps LOD',()=>{
 const points=aggregateBelt(2000);expect(points.length).toBe(6000);expect(aggregateBelt(2000)).toEqual(points)
 for(let i=0;i<points.length;i+=3){expect(Math.hypot(...points.slice(i,i+3))).toBeGreaterThanOrEqual(2.1);expect(Math.hypot(...points.slice(i,i+3))).toBeLessThanOrEqual(3.3)}
 expect(aggregateBelt(1e6).length).toBe(18000)
})

import * as T from 'three'
import {overviewPose,overviewUp} from '../src/features/solar/solarPresentation'
import reference from '../../tests/fixtures/solar/r3b-reference.json'
it('fits all nine real known-epoch anchors inside the expanded camera volume',()=>{
 const ids:Record<string,string>={'199':'mercury','299':'venus','399':'earth','4':'mars','5':'jupiter','6':'saturn','7':'uranus','8':'neptune'}
 const bodies=[{source_id:'sun',position_au:[0,0,0]},...reference.rows.filter(r=>r.jdUtc===2461099.5).map(r=>({source_id:ids[r.target],position_au:r.positionAu}))] as any
 for(const aspect of [1.6,.433,2.3]){const pose=overviewPose(radii,bodies,aspect),camera=new T.PerspectiveCamera(42,aspect,.001,500);camera.up.fromArray(overviewUp(aspect));camera.position.fromArray(pose.position);camera.lookAt(new T.Vector3(...pose.target));camera.updateMatrixWorld();expect(camera.position.distanceTo(new T.Vector3(...pose.target))).toBeLessThan(180)
  for(const b of bodies){const v=new T.Vector3(...b.position_au).project(camera);expect(Math.abs(v.x)).toBeLessThan(.88);expect(Math.abs(v.y)).toBeLessThan(.78);expect(v.z).toBeLessThan(1);expect(v.z).toBeGreaterThan(-1)}
 }
})
it('keeps the Sun and Mercury glyphs separate even at Mercury perihelion',()=>{expect(radii.sun+radii.mercury).toBeLessThan(.307)})
