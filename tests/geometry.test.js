import test from 'node:test';import assert from 'node:assert/strict';
import {vector,spherical,footprint,separation,projectView,fitFov,tangentPoint,frameFill} from '../src/geometry.js';
import {defaults,exclusions,searchMatches} from '../src/filters.js';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../public/data/catalogue.json',import.meta.url)));
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);
test('Coordinate round trips across north and near both poles',()=>{for(const [ra,dec]of [[0,0],[359.99,45],[.001,-89.9],[210,89.99]]){let p=spherical(vector(ra,dec));near(p[0],ra);near(p[1],dec);}});
test('Mini tangent footprint has the requested true angular dimensions',()=>{const a=spherical(tangentPoint(0,0,-Math.tan(2.14*Math.PI/360),0)),b=spherical(tangentPoint(0,0,Math.tan(2.14*Math.PI/360),0));near(separation(vector(...a),vector(...b)),2.14);const c=footprint(359.9,89,2.14,1.2,137);assert.equal(c.length,49);for(const v of c)near(Math.hypot(...v),1);});
test('M57 sampling is about 19 output pixels, not a frame-filling image',()=>{const o=data.find(o=>o.id==='M57');near(frameFill(o,2.14)/100*1920,18.990654205607477);});
test('Frame target includes the whole North America contour and mosaic',()=>{const o=data.find(o=>o.id==='NGC7000');assert.ok(o.outline.length>4);const f=fitFov(o,3.852,2.16,47);for(const v of [...footprint(o.ra,o.dec,3.852,2.16,47),...o.outline.map(p=>vector(...p))])assert.ok(separation(vector(o.ra,o.dec),v)<f/2);});
test('Stereographic projection uses the smaller viewport dimension',()=>{const fov=90,t=45*Math.PI/180;for(const [w,h]of [[1200,600],[600,1200]]){const p=projectView([Math.sin(t),0,-Math.cos(t)],w,h,fov);near(p[0]-w/2,Math.min(w,h)/2);near(p[1],h/2);}});
test('Missing brightness is retained explicitly; numerical constraints can exclude unknowns',()=>{const o={type:'Nebula',major:30,mag:null,sb:null};assert.deepEqual(exclusions(o,defaults,45),[]);assert.ok(exclusions(o,{...defaults,unknown:false},45).includes('Magnitude unknown'));assert.ok(exclusions(o,{...defaults,sbMax:20,unknown:false},45).includes('Surface brightness unknown'));});
test('Below-horizon filter is reversible without changing the catalogue',()=>{const o=data.find(o=>o.id==='M31');assert.ok(exclusions(o,defaults,-20).includes('Below horizon'));assert.deepEqual(exclusions(o,{...defaults,above:false,altMin:-90},-20),[]);assert.ok(data.length>12000);});
test('Search finds aliases, space-separated identifiers and excluded tiny targets',()=>{assert.ok(searchMatches(data.find(o=>o.id==='M57'),'NGC 6720'));assert.ok(searchMatches(data.find(o=>o.id==='NGC6888'),'C27'));assert.ok(searchMatches(data.find(o=>o.id==='NGC7000'),'north america'));});
test('Individual filter bypass and master pause preserve configured constraints',()=>{
 const o={type:'Galaxy',major:1,mag:15,sb:25};
 const f={...defaults,types:['Nebula'],altMin:30,sizeMin:10,magMax:10,sbMax:20,fillMin:20,unknown:false};
 const all=exclusions(o,f,-10);
 for(const [key,labels] of [['types',['Object type']],['alt',['Altitude','Below horizon']],['size',['Angular size']],['mag',['Magnitude']],['sb',['Surface brightness']],['fill',['Frame fill']]]){
  assert.deepEqual(exclusions(o,{...f,[key+'Enabled']:false},-10),all.filter(r=>!labels.includes(r)));
 }
 assert.deepEqual(exclusions(o,{...f,enabled:false},-10),[]);
 assert.deepEqual(exclusions({...o,mag:null},{...f,magEnabled:false},-10),all.filter(r=>r!=='Magnitude'));
 assert.deepEqual(exclusions(o,{...f,enabled:true},-10),all);
});
