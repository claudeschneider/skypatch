// DOM handles give saved corners a full touch target without enlarging the sky outline.
export function createPatchHandles(count,move){
 const handles=[];
 for(let i=0;i<count;i++){
  const handle=document.createElement('button');handle.className='patch-handle';handle.hidden=true;handle.setAttribute('aria-label',`Move sky patch corner ${i+1}`);handle.title=`Drag corner ${i+1}`;
  let pointer=null;
  handle.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();e.stopPropagation();pointer=e.pointerId;handle.setPointerCapture(pointer);});
  handle.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(i,e);}});
  const stop=e=>{if(e.pointerId===pointer)pointer=null;};for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,stop);
  handle.addEventListener('keydown',e=>{const d={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]}[e.key];if(!d)return;e.preventDefault();const r=handle.getBoundingClientRect();move(i,{clientX:r.x+r.width/2+d[0],clientY:r.y+r.height/2+d[1]});});
  document.querySelector('.map').append(handle);handles.push(handle);
 }
 return handles;
}
