import {normalize} from './geometry.js';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function preparePatch(vertices){
 if(vertices.length<3)throw new Error('Add at least three corners.');
 const center=normalize(vertices.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]));
 if(!center.every(Number.isFinite)||vertices.some(v=>dot(v,center)<.05))throw new Error('Draw a smaller patch, spanning less than half the sky.');
 const east=normalize(cross(Math.abs(center[2])<.9?[0,0,1]:[1,0,0],center)),north=cross(center,east);
 const project=v=>{const d=dot(v,center);return d>0?[dot(v,east)/d,dot(v,north)/d]:null;};
 const points=vertices.map(project),orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const on=(a,b,c)=>Math.abs(orient(a,b,c))<1e-10&&c[0]>=Math.min(a[0],b[0])-1e-10&&c[0]<=Math.max(a[0],b[0])+1e-10&&c[1]>=Math.min(a[1],b[1])-1e-10&&c[1]<=Math.max(a[1],b[1])+1e-10;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-6)throw new Error('Corners are too close together. Undo the last point.');
  for(let j=i+2;j<points.length;j++){
   if((j+1)%points.length===i)continue;const c=points[j],d=points[(j+1)%points.length];
   if((orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))throw new Error('Boundary lines cross. Undo a point or redraw the patch.');
  }
 }
 if(Math.abs(points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0))<1e-8)throw new Error('Draw a patch with some area.');
 return v=>{
  const q=project(v);if(!q)return false;let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j];if(on(a,b,q))return true;
   if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 };
}
export function patchEdges(vertices,closed=true){
 const points=[];for(let i=0;i<vertices.length-(closed?0:1);i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length];
  for(let j=0;j<32;j++)points.push(normalize(a.map((v,k)=>v*(1-j/32)+b[k]*j/32)));
 }if(vertices.length)points.push(closed?vertices[0]:vertices.at(-1));return points;
}
