const angle=x=>2*Math.atan(x)*180/Math.PI;
export function diagonalFrame(diagonal,x,y){const t=Math.tan(diagonal*Math.PI/360)/Math.hypot(x,y);return {width:angle(t*x),height:angle(t*y)};}
export function lensFrame(focalLength){return {width:angle(36/(2*focalLength)),height:angle(24/(2*focalLength))};}
const dwarf='https://www.dwarflab.com/us/pages/draco-smart-telescope';
const preset=(id,name,width,height,pixels,source,note='Native frame; actual image crops may differ.')=>({id,name,width,height,pixels,source,note});
const diag=(id,name,d,x,y,pixels,source)=>({...preset(id,name,0,0,pixels,source,'Rectangular field calculated from the published diagonal and aspect ratio.'),...diagonalFrame(d,x,y)});
export const equipmentPresets=[
 preset('mini','DWARF Mini',2.14,1.2,1920,dwarf),
 diag('dwarf2','DWARF II',3.72,16,9,3840,dwarf),diag('dwarf3','DWARF 3',3.38,16,9,3840,dwarf),diag('draco','DWARFLAB Draco · deep sky',2.059,4,3,null,dwarf),
 diag('s30','Seestar S30',2.46,9,16,1080,'https://www.seestar.com/products/seestar-s30-all-in-one-smart-telescope'),
 diag('s30pro','Seestar S30 Pro',4.6,9,16,2160,'https://us.seestar.com/products/seestar-s30-pro'),
 preset('s50','Seestar S50',angle(1080*.0029/500),angle(1920*.0029/500),1080,'https://i.seestar.com/owe__prod/static/manuals/SeestarManualEN.pdf','Calculated from 250 mm focal length and 2.9 μm pixels; portrait sensor.'),
 diag('s50pro','Seestar S50 Pro',2.8,9,16,2160,'https://us.zwoastro.com/products/seestar-s50-pro'),
 preset('vespera','Vespera Classic',1.6,.9,1920,'https://vaonis.com/blogs/travel-journal/vespera-vaonis-newborn-star'),
 preset('passengers','Vespera Passengers',2.4,1.8,null,'https://vaonis.com/pages/vespera-passengers'),
 preset('vespera2','Vespera II',2.5,1.4,3840,'https://vaonis.com/products/vespera-2'),
 preset('vesperapro','Vespera Pro',1.6,1.6,3536,'https://vaonis.com/products/vespera-pro'),
 preset('vesperapro2','Vespera Pro II',1.6,1.6,3536,'https://vaonis.com/products/vespera-pro2'),
 ...[24,28,35,50,70,85,100,200,400].map(f=>({...preset('ff'+f,`Full-frame DSLR · ${f} mm`,0,0,6000,null,'36 × 24 mm sensor, rectilinear lens, landscape. Sampling assumes a 24 MP / 6000 × 4000 camera.'),...lensFrame(f)}))
];
export function selectedEquipment(e){return equipmentPresets.find(p=>p.id===e.preset);}
