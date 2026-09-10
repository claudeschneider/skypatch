import {installTouch,panSky} from './touch.js';
export function installPatchInput(overlay,canvas,engine,active,add){
 let space=false,drag=null;
 const reset=()=>{space=false;drag=null;overlay.style.cursor='';};
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&active()&&!e.target.closest('input,textarea,select,button,[contenteditable]')){e.preventDefault();space=true;overlay.style.cursor='grab';}});
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;overlay.style.cursor='';}});
 window.addEventListener('blur',reset);
 overlay.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,pan:space,moved:false};overlay.setPointerCapture(e.pointerId);});
 overlay.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6;if(drag.pan&&active())panSky(overlay,engine,dx,dy);drag.x=e.clientX;drag.y=e.clientY;});
 overlay.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||!drag)return;const tap=!drag.pan&&!drag.moved;drag=null;if(tap&&active())add(e);});
 overlay.addEventListener('pointercancel',()=>drag=null);
 overlay.addEventListener('lostpointercapture',()=>drag=null);
 overlay.addEventListener('wheel',e=>{e.preventDefault();canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:e.deltaY,deltaMode:e.deltaMode}));},{passive:false});
 installTouch(overlay,engine,{drawing:true});
 overlay.addEventListener('sky-tap',e=>{if(active())add(e.detail);});
 return reset;
}
