import {installTouch} from './touch.js';
import {RAD,vector,projectView,spherical,wrap} from './geometry.js';
export class SkyEngine{
 async init(canvas){
  const base=new URL(import.meta.env.BASE_URL,location.href).href;
  this.stel=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('The planetarium took too long to load. Reload to try again.')),20000);
   window.StelWebEngine({canvas,wasmFile:base+'vendor/stellarium-web-engine.wasm',onAbort:()=>{clearTimeout(timeout);reject(new Error('WebGL could not start. Enable hardware acceleration and reload.'));},onReady:s=>{clearTimeout(timeout);resolve(s);}});
  });
  const s=this.stel,c=s.core;
  c.time_speed=0;c.projection=2;c.atmosphere.visible=false;c.landscapes.visible=false;c.dsos.visible=false;
  c.planets.scale_moon=false;c.planets.visible=false; // Our framing layer draws physical discs, without magnitude-dependent enlargement.
  c.stars.addDataSource({url:base+'skydata/stars'});
  c.skycultures.addDataSource({url:base+'skydata/skycultures/western',key:'western'});
  c.milkyway.addDataSource({url:base+'skydata/surveys/milkyway'});
  c.dss.addDataSource({url:'https://alasky.cds.unistra.fr/DSS/DSSColor'});
  c.constellations.lines_visible=true;c.lines.azimuthal.visible=false;
  await s.setFont('regular',base+'fonts/Roboto-Regular.ttf');
  this.zoom(90);this.direction(180,35);installTouch(canvas,this);
  // Capture before the vendored engine's cursor-anchored legacy wheel handlers.
  // Change only FOV: the observer's pointing must not move with the cursor.
  canvas.addEventListener('wheel',event=>{
   event.preventDefault();event.stopImmediatePropagation();
   const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
   const delta=event.deltaY*unit;
   if(Number.isFinite(delta))this.zoom(this.fov*Math.exp(Math.max(-1,Math.min(1,delta*.001))));
  },{capture:true,passive:false});
  // Some browsers also emit a legacy event for the same gesture. Suppress it
  // so zoom is applied once and never reaches the cursor-based engine path.
  for(const type of ['mousewheel','DOMMouseScroll'])canvas.addEventListener(type,event=>{
   event.preventDefault();event.stopImmediatePropagation();
  },{capture:true,passive:false});
 }
 setObserver(lat,lon,date){const o=this.stel.core.observer;o.latitude=lat*RAD;o.longitude=lon*RAD;o.utc=date.getTime()/86400000+40587;this.stel._observer_update(o.v,true);}
 matrix(frame){const s=this.stel;s._observer_update(s.core.observer.v,true);return [[1,0,0],[0,1,0],[0,0,1]].map(v=>s.convertFrame(s.core.observer,'ICRF',frame,v));}
 rotate(v,m){return [0,1,2].map(i=>v[0]*m[0][i]+v[1]*m[1][i]+v[2]*m[2][i]);}
 horizontal(v){const a=spherical(this.stel.convertFrame(this.stel.core.observer,'ICRF','OBSERVED_GEOM',v));return {az:wrap(a[0]),alt:a[1]};}
 project(v,w,h,matrix){
  const fov=this.fov;
  const approximate=matrix?projectView(this.rotate(v,matrix),w,h,fov):null;
  // Frame vertices need an exact inverse/forward transform. Also refine visible
  // objects at deep zoom: aberration makes the basis-vector shortcut nonlinear.
  if(!matrix||(fov<10&&approximate&&approximate[0]>-100&&approximate[0]<w+100&&approximate[1]>-100&&approximate[1]<h+100)){
   const s=this.stel;return projectView(s.convertFrame(s.core.observer,'ICRF','VIEW',v),w,h,fov);
  }
  return approximate;
 }

 center(o){const s=this.stel;s.lookAt(s.convertFrame(s.core.observer,'ICRF','OBSERVED',vector(o.ra,o.dec)),0);}
 direction(az,alt){this.stel.lookAt(vector(az,alt),0);}
 zoom(fov){this.stel.zoomTo(Math.max(.08,Math.min(175,fov))*RAD,0);}
 framing(mode='altaz'){
  const s=this.stel,obs=s.core.observer;s._observer_update(obs.v,true);
  const center=s.convertFrame(obs,'VIEW','ICRF',[0,0,-1]);
  const [ra,dec]=spherical(center);
  // Ideal level Alt-Az: image-up toward local zenith. Ideal EQ: toward the
  // celestial pole of date. Both presume zero fixed camera roll.
  const pole=s.convertFrame(obs,mode==='eq'?'JNOW':'OBSERVED','ICRF',[0,0,1]);
  const east=vector(ra+90,0),north=vector(ra,dec+90);
  const dot=(a,b)=>a.slice(0,3).reduce((v,x,i)=>v+x*b[i],0);
  let x=dot(pole,east),y=dot(pole,north);const singular=Math.hypot(x,y)<1e-6;
  if(singular){const up=s.convertFrame(obs,'VIEW','ICRF',[0,1,0]);x=dot(up,east);y=dot(up,north);}
  return {ra,dec,angle:Math.atan2(x,y)/RAD,singular};
 }
 solarSystem(){
  const names=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
  return names.map(name=>{
   const body=this.stel.getObj('NAME '+name.toLowerCase());
   const pos=body.getInfo('radec'),[ra,dec]=spherical(pos);
   const diameter=2*Math.asin(body.getInfo('radius'))/RAD*60;
   return {id:name,name,ngc:name,aliases:[],solar:true,type:name==='Sun'?'Sun':name==='Moon'?'Moon':'Planet',constellation:'Solar system',ra,dec,major:diameter,minor:diameter,pa:0,mag:body.getInfo('vmag'),band:'V',sb:null,phase:body.getInfo('phase')};
  });
 }
 get fov(){return this.stel.core.fov/RAD;}
 toggle(name,value){const c=this.stel.core;if(name==='grid')c.lines.azimuthal.visible=value;if(name==='lines')c.constellations.lines_visible=value;if(name==='survey')c.dss.visible=value;}
}
