import {test} from 'node:test';
import assert from 'node:assert/strict';
import {money,curveProgress,launchAge} from '../lib/token-display';
test('Market caps preserve zero, unavailable and K/M/B magnitudes',()=>{
 assert.equal(money(null),'—');assert.equal(money(NaN),'—');assert.equal(money(0),'$0');assert.equal(money(950),'$950');assert.equal(money(3294.97),'$3.3K');assert.equal(money(62671624),'$62.7M');assert.equal(money(1e9),'$1B');
});
test('Missing curve data is not presented as zero and progress stays bounded',()=>{
 assert.equal(curveProgress(null),null);assert.equal(curveProgress(NaN),null);assert.equal(curveProgress(-1),0);assert.equal(curveProgress(101),100);assert.equal(curveProgress(3.525),3.525);
});
test('Age uses creation time rather than the migrated pool creation date',()=>{
 assert.equal(launchAge('2026-07-26T16:24:38Z','2026-09-30T22:00:00Z'),'66d ago');assert.equal(launchAge('invalid','2026-09-30T22:00:00Z'),'—');
});
