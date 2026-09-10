import test from 'node:test';import assert from 'node:assert/strict';import {groundSpans} from '../src/ground.js';
const area=s=>s.reduce((a,r)=>a+r[2]*r[3],0);
test('Ground covers only the lower half when looking at the horizon',()=>{const s=groundSpans(800,600,90,[0,1,0]);assert.equal(area(s),800*300);assert.ok(s.every(r=>r[1]>=300));});
test('Zenith is clear and nadir fully covered at ordinary zoom',()=>{assert.equal(area(groundSpans(800,600,60,[0,0,-1])),0);assert.equal(area(groundSpans(800,600,60,[0,0,1])),480000);});
test('Wide-angle zenith has curved ground in the outer field',()=>{const a=area(groundSpans(800,600,170,[0,0,-1]));assert.ok(a>0&&a<480000);});
