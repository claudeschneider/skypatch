import {test} from 'node:test';import assert from 'node:assert/strict';import {visibility,intervals,observingWindow} from '../src/visibility.js';import {vector} from '../src/geometry.js';
test('Visibility intervals preserve separate crossings and clipped endpoints',()=>{
 const samples=[0,1,2,3,4,5].map(time=>({time,on:[true,true,false,true,false,false][time]}));assert.deepEqual(intervals(samples,s=>s.on),[[0,1.5],[2.5,3.5]]);
});
test('Horizon visibility handles circumpolar and never-rising targets',()=>{
 const date=new Date('2026-09-10T05:00Z'),up=visibility({ra:0,dec:89},49,-123,date),down=visibility({ra:0,dec:-89},49,-123,date);
 assert.equal(up.above.length,1);assert.deepEqual(up.above[0],[up.start,up.end]);assert.equal(down.above.length,0);assert.equal(up.patch,null);assert.ok(+date>=up.start&&+date<up.end);
});
test('Patch windows are bounded by horizon windows and follow horizontal coordinates',()=>{
 const data=visibility({ra:20,dec:30},49,-123,new Date('2026-09-10T05:00Z'),[[90,10],[270,10],[180,80]].map(([az,alt])=>vector(az,alt)));
 assert.ok(data.patch.length>0);for(const [a,b]of data.patch)assert.ok(data.above.some(([c,d])=>a>=c&&b<=d));
 assert.equal(observingWindow(new Date())[1]>observingWindow(new Date())[0],true);
});
