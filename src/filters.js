import {frameFill} from './geometry.js';
export const defaults={types:[],above:true,altMin:0,altMax:90,sizeMin:3,sizeMax:null,magMin:null,magMax:12,sbMin:null,sbMax:null,fillMin:null,fillMax:null,unknown:true};
export function exclusions(o,f,alt,width=2.14){
 const reasons=[];
 if(f.enabled===false)return reasons;
 if(f.typesEnabled!==false&&(f.typesNone||(f.types.length&&!f.types.includes(o.type))))reasons.push('Object type');
 if(f.altEnabled!==false&&f.above&&alt<0)reasons.push('Below horizon');
 if(f.altEnabled!==false&&(alt<f.altMin||alt>f.altMax))reasons.push('Altitude');
 for(const [key,value,min,max,label] of [['size',o.major,f.sizeMin,f.sizeMax,'Angular size'],['mag',o.mag,f.magMin,f.magMax,'Magnitude'],['sb',o.sb,f.sbMin,f.sbMax,'Surface brightness'],['fill',frameFill(o,width),f.fillMin,f.fillMax,'Frame fill']]){
  if(f[key+'Enabled']===false)continue;
  if(min==null&&max==null)continue;
  if(value==null){if(!f.unknown)reasons.push(label+' unknown');}
  else if((min!=null&&value<min)||(max!=null&&value>max))reasons.push(label);
 }
 return reasons;
}
export function searchMatches(o,q){const clean=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');return clean([o.id,o.ngc,o.name,...o.aliases].join(' ')).includes(clean(q));}
export function validateRange(min,max){return min==null||max==null||min<=max;}
