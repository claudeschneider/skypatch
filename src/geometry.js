export const RAD=Math.PI/180;
export const wrap=x=>(x%360+360)%360;
export function vector(ra,dec){ra*=RAD;dec*=RAD;return [Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];}
export function spherical(v){return [wrap(Math.atan2(v[1],v[0])/RAD),Math.atan2(v[2],Math.hypot(v[0],v[1]))/RAD];}
export function normalize(v){const n=Math.hypot(...v);return v.map(x=>x/n);}
export function separation(a,b){return Math.acos(Math.max(-1,Math.min(1,a.reduce((s,x,i)=>s+x*b[i],0))))/RAD;}
// TAN image coordinates: x increases toward celestial west, y toward north.
// angle is the position angle of image-up, measured east of celestial north.
export function tangentPoint(ra,dec,x,y,angle=0){
 const c=vector(ra,dec),e=vector(ra+90,0),n=vector(ra,dec+90),t=angle*RAD;
 const east=-x*Math.cos(t)+y*Math.sin(t),north=x*Math.sin(t)+y*Math.cos(t);
 return normalize(c.map((v,i)=>v+e[i]*east+n[i]*north));
}
export function footprint(ra,dec,width,height,angle=0){
 const x=Math.tan(width*RAD/2),y=Math.tan(height*RAD/2),points=[];
 const corners=[[-x,-y],[x,-y],[x,y],[-x,y],[-x,-y]];
 for(let k=0;k<4;k++)for(let j=0;j<12;j++){let t=j/12;points.push(tangentPoint(ra,dec,corners[k][0]*(1-t)+corners[k+1][0]*t,corners[k][1]*(1-t)+corners[k+1][1]*t,angle));}
 points.push(points[0]);return points;
}
export function extent(o){
 if(o.outline?.length)return o.outline.map(p=>vector(...p)).concat([vector(...o.outline[0])]);
 if(!o.major)return [];
 return Array.from({length:49},(_,i)=>{const t=i/48*2*Math.PI;return tangentPoint(o.ra,o.dec,Math.tan((o.minor||o.major)/120*RAD)*Math.cos(t),Math.tan(o.major/120*RAD)*Math.sin(t),o.pa||0);});
}
// Same stereographic projection and smaller-dimension FOV convention as Stellarium.
export function projectView(v,width,height,fov){
 const d=Math.hypot(...v),den=d-v[2];if(den<1e-7)return null;
 const scale=Math.min(width,height)/(2*Math.tan(fov*RAD/4));
 return [width/2+v[0]/den*scale,height/2-v[1]/den*scale];
}
export function fitFov(o,frameW,frameH,angle=0){
 const center=vector(o.ra,o.dec);
 const points=[...extent(o),...footprint(o.ra,o.dec,frameW,frameH,angle)];
 return Math.max(.25,Math.min(175,2.5*Math.max(...points.map(v=>separation(center,v)))));
}
export function frameFill(o,width){return o.major==null?null:o.major/(width*60)*100;}
export function imageUrl(o,fov,width=480,height=300){
 const q=new URLSearchParams({hips:'CDS/P/DSS2/color',width:String(width),height:String(height),fov:String(fov),projection:'TAN',coordsys:'icrs',ra:String(o.ra),dec:String(o.dec),format:'jpg'});
 return 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?'+q;
}
