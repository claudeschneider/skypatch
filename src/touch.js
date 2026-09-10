// Own touch gestures so native mouse emulation cannot double-pan or select after a pinch.
export function installTouch(canvas,engine){
 let previous=null,moved=false,start=null;
 const sample=touches=>{const a=touches[0],b=touches[1];return {x:b?(a.clientX+b.clientX)/2:a.clientX,y:b?(a.clientY+b.clientY)/2:a.clientY,d:b?Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY):0,n:touches.length};};
 canvas.addEventListener('touchstart',e=>{e.preventDefault();e.stopImmediatePropagation();previous=sample(e.touches);if(!start){start=previous;moved=false;}if(e.touches.length>1)moved=true;},{capture:true,passive:false});
 canvas.addEventListener('touchmove',e=>{
  e.preventDefault();e.stopImmediatePropagation();const next=sample(e.touches);
  if(previous&&next.n===previous.n){
   if(next.n>1&&previous.d>0&&next.d>0){engine.zoom(engine.fov*previous.d/next.d);moved=true;}
   else{const dx=next.x-previous.x,dy=next.y-previous.y,o=engine.stel.core.observer,scale=engine.fov/Math.min(canvas.clientWidth,canvas.clientHeight);engine.direction(o.yaw*180/Math.PI-dx*scale/Math.max(.2,Math.cos(o.pitch)),Math.max(-89.9,Math.min(89.9,o.pitch*180/Math.PI+dy*scale)));}
   if(start&&Math.hypot(next.x-start.x,next.y-start.y)>6)moved=true;
  }previous=next;
 },{capture:true,passive:false});
 const finish=e=>{e.preventDefault();e.stopImmediatePropagation();if(e.touches.length){previous=sample(e.touches);return;}if(!moved&&start&&e.type==='touchend')canvas.dispatchEvent(new CustomEvent('sky-tap',{detail:{clientX:start.x,clientY:start.y}}));previous=null;start=null;};
 for(const name of ['touchend','touchcancel'])canvas.addEventListener(name,finish,{capture:true,passive:false});
}
