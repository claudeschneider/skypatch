import test from 'node:test';import assert from 'node:assert/strict';
import {equipmentPresets,lensFrame,diagonalFrame} from '../src/equipment.js';
import {objectNames,catalogueDescription} from '../src/descriptions.js';
import {exclusions,defaults} from '../src/filters.js';
import {readFileSync} from 'node:fs';
test('Equipment presets correctly distinguish diagonal FOV, portrait sensors and wide lenses',()=>{
 const f=lensFrame(24);assert.ok(Math.abs(f.width-73.739795)<.00001);assert.ok(Math.abs(f.height-53.130102)<.00001);
 const s=equipmentPresets.find(p=>p.id==='s30pro');assert.ok(s.width<s.height);const diagonal=2*Math.atan(Math.hypot(Math.tan(s.width*Math.PI/360),Math.tan(s.height*Math.PI/360)))*180/Math.PI;assert.ok(Math.abs(diagonal-4.6)<1e-8);
 assert.equal(equipmentPresets.filter(p=>p.id.startsWith('ff')).length,9);
});
test('All catalogue entries have an offline overview and names; type filtering supports unions and none',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/data/catalogue.json',import.meta.url)));for(const o of data)assert.ok(catalogueDescription(o).length>100);
 const m=data.find(o=>o.id==='M33');assert.ok(objectNames(m).includes('NGC 598'));assert.ok(objectNames(m).includes('M 33'));
 assert.deepEqual(exclusions({type:'Galaxy',major:10,mag:2},{...defaults,types:['Galaxy','Nebula']},40),[]);
 assert.ok(exclusions({type:'Galaxy'},{...defaults,typesNone:true},40).includes('Object type'));
});
