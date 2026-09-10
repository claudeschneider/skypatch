import {test} from 'node:test';import assert from 'node:assert/strict';import {skyLight} from '../src/sky-light.js';
test('Sky tint progresses through twilight without abrupt colour jumps',()=>{
 assert.deepEqual(skyLight(-30).rgb,[0,0,0]);assert.equal(skyLight(-15).phase,'Astronomical twilight');assert.equal(skyLight(-9).phase,'Nautical twilight');assert.equal(skyLight(-3).phase,'Civil twilight');assert.equal(skyLight(10).phase,'Daytime');
 let previous=0;for(let alt=-30;alt<=90;alt+=.1){const rgb=skyLight(alt).rgb,sum=rgb.reduce((a,b)=>a+b);assert.ok(sum>=previous);assert.ok(sum-previous<10);previous=sum;}
});
