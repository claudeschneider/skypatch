// An illustrative daylight tint, independent of star visibility and catalogue filtering.
const stops=[[-18,[0,0,0]],[-12,[5,10,27]],[-6,[20,40,76]],[0,[45,88,139]],[15,[76,135,187]],[40,[105,170,220]]];
export function skyLight(altitude){
 const altitudeClamped=Math.max(-18,Math.min(40,altitude));let i=1;while(i<stops.length-1&&altitudeClamped>stops[i][0])i++;
 const [a,low]=stops[i-1],[b,high]=stops[i];const t=(altitudeClamped-a)/(b-a),blend=t*t*(3-2*t);
 const rgb=low.map((v,j)=>Math.round(v+(high[j]-v)*blend));
 const phase=altitude>=0?'Daytime':altitude>=-6?'Civil twilight':altitude>=-12?'Nautical twilight':altitude>-18?'Astronomical twilight':'Astronomical night';
 return {rgb,phase};
}
