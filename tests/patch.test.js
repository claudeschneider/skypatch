import test from 'node:test';
import assert from 'node:assert/strict';
import {preparePatch} from '../src/patch.js';
import {vector} from '../src/geometry.js';
test('Patch crosses north without selecting the opposite sky and includes its edges',()=>{
 const contains=preparePatch([[350,10],[10,10],[10,60],[350,60]].map(p=>vector(...p)));
 assert.ok(contains(vector(0,30)));assert.ok(contains(vector(350,10)));assert.ok(!contains(vector(180,30)));assert.ok(!contains(vector(0,0)));
});
test('Patch accepts concave regions and either drawing direction',()=>{
 const vertices=[[0,10],[30,10],[30,50],[15,30],[0,50]].map(p=>vector(...p));
 for(const v of [vertices,[...vertices].reverse()]){const contains=preparePatch(v);assert.ok(contains(vector(15,20)));assert.ok(!contains(vector(15,45)));}
});
test('Patch rejects crossed edges and degenerate regions',()=>{
 assert.throws(()=>preparePatch([[0,10],[30,50],[30,10],[0,50]].map(p=>vector(...p))),/cross/);
 assert.throws(()=>preparePatch([vector(0,0),vector(10,0),vector(20,0)]),/area/);
});
