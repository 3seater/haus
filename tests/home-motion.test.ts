import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyPosition} from '../lib/home-motion';
test('walkthrough starts before pinning, reaches all four steps and clamps after release',()=>{
 const height=3800,viewport=1000,header=86,travel=height-(viewport-header);
 assert.deepEqual(journeyPosition(1000,height,viewport,header),{progress:0,step:0});
 for(const [progress,step] of [[0,0],[.249,0],[.25,1],[.5,2],[.75,3],[1,3],[1.2,3]]){
  const value=journeyPosition(header-progress*travel,height,viewport,header);
  assert.equal(value.step,step);assert.ok(value.progress>=0&&value.progress<=1);
 }
});
test('scrolling back reverses the walkthrough and mobile header height is accounted for',()=>{
 const steps=[.9,.6,.3,0].map(p=>journeyPosition(72-p*(3200-(800-72)),3200,800,72).step);
 assert.deepEqual(steps,[3,2,1,0]);
 assert.ok(Number.isFinite(journeyPosition(-100,300,800,72).progress));
});
