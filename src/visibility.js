import * as A from 'astronomy-engine';
import {preparePatch} from './patch.js';
import {vector} from './geometry.js';
// Noon-to-noon in the device timezone, including 23/25-hour DST days.
export function observingWindow(date){const start=new Date(date);start.setHours(12,0,0,0);if(start>date)start.setDate(start.getDate()-1);const end=new Date(start);end.setDate(end.getDate()+1);return [+start,+end];}
export function intervals(samples,predicate){
 const result=[];let start=null;
 for(let i=0;i<samples.length;i++){
  const yes=predicate(samples[i]);
  if(yes&&start===null)start=i? (samples[i-1].time+samples[i].time)/2:samples[i].time;
  if(!yes&&start!==null){result.push([start,(samples[i-1].time+samples[i].time)/2]);start=null;}
 }
 if(start!==null)result.push([start,samples.at(-1).time]);return result;
}
export function visibility(object,lat,lon,date,vertices=[]){
 const [start,end]=observingWindow(date),observer=new A.Observer(lat,lon,0),contains=vertices.length>=3?preparePatch(vertices):null;
 const fixed=new A.Vector(...vector(object.ra,object.dec),date),samples=[];
 for(let time=start;time<=end;time=Math.min(end,time+60000)){
  const when=new Date(time),eq=object.solar?A.Equator(object.id,when,observer,true,true):A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(when),fixed));
  const h=A.Horizon(when,observer,eq.ra,eq.dec),sun=A.Equator('Sun',when,observer,true,true),sunAlt=A.Horizon(when,observer,sun.ra,sun.dec).altitude;
  samples.push({time,alt:h.altitude,az:h.azimuth,sunAlt,inPatch:!!contains&&contains(vector(h.azimuth,h.altitude))});if(time===end)break;
 }
 return {start,end,samples,above:intervals(samples,s=>s.alt>=0),patch:contains?intervals(samples,s=>s.alt>=0&&s.inPatch):null,peak:samples.reduce((a,b)=>b.alt>a.alt?b:a)};
}
