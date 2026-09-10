import {RAD} from './geometry.js';
// Inverse stereographic rays dotted with the local zenith. Solve each scanline
// analytically, so the mask also works across north, at zenith, and at nadir.
export function groundSpans(width,height,fov,zenith){
 const scale=Math.min(width,height)/(2*Math.tan(fov*RAD/4));
 const [nx,ny,nz]=zenith,spans=[];
 for(let y=0;y<height;y++){
  const v=(height/2-y-.5)/scale,a=nz,b=2*nx,c=nz*(v*v-1)+2*ny*v;
  const edges=[0,width];
  if(Math.abs(a)<1e-12){if(Math.abs(b)>1e-12)edges.push(width/2+scale*(-c/b));}
  else {const d=b*b-4*a*c;if(d>=0){const root=Math.sqrt(d);edges.push(width/2+scale*(-b-root)/(2*a),width/2+scale*(-b+root)/(2*a));}}
  const cuts=edges.filter(x=>x>=0&&x<=width).sort((x,y)=>x-y);
  for(let i=1;i<cuts.length;i++){const x1=cuts[i-1],x2=cuts[i],u=((x1+x2)/2-width/2)/scale;if(a*u*u+b*u+c<0)spans.push([x1,y,x2-x1,1]);}
 }
 return spans;
}

export function belowGround(x,y,width,height,fov,[nx,ny,nz]){
 const scale=Math.min(width,height)/(2*Math.tan(fov*RAD/4));
 const u=(x-width/2)/scale,v=(height/2-y)/scale;
 return nz*(u*u+v*v-1)+2*nx*u+2*ny*v<0;
}
