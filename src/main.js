import {showVisibility} from './visibility-panel.js';
import {skyLight} from './sky-light.js';
import {createPatchHandles} from './patch-handles.js';
import {arrangePanels,panelModes} from './panel-layout.js';
import {installTimeToggle} from './mobile-controls.js';
import {installPatchInput} from './patch-input.js';
import {equipmentPresets,selectedEquipment} from './equipment.js';
import {objectNames,catalogueDescription} from './descriptions.js';
import {installOffline} from './offline.js';
import {preparePatch,patchEdges} from './patch.js';
import {installObjectInfo} from './object-info.js';
import './style.css';
import {groundSpans,belowGround} from './ground.js';
import {SkyEngine} from './engine.js';
import {RAD,vector,spherical,extent,footprint,fitFov,frameFill,imageUrl,wrap,projectView} from './geometry.js';
import {defaults,exclusions,searchMatches,validateRange} from './filters.js';
import * as Astronomy from 'astronomy-engine';

const $=s=>document.querySelector(s);
const fmt=(x,n=1)=>x==null?'Unknown':Number(x).toFixed(n);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={'Galaxy':'#a5baff','Galaxy group':'#a5baff','Emission nebula':'#f0aece','Nebula':'#f0aece','Cluster + nebula':'#f0aece','Reflection nebula':'#8ad9ed','Planetary nebula':'#bdacf4','Supernova remnant':'#f9bc90','Open cluster':'#f3da9a','Globular cluster':'#f3da9a','Dark nebula':'#c6b5ab','Star association':'#f3da9a'};
let saved={};try{saved=JSON.parse(localStorage.getItem('skypatch-v1')||'{}');}catch{}
const state={lat:49.28,lon:-123.12,site:'Vancouver example',...saved,filters:{...defaults,...saved.filters},equipment:{width:2.14,height:1.2,mx:1,my:1,preset:'mini',pixels:1920,...saved.equipment},mountMode:saved.mountMode==='eq'?'eq':'altaz',showOutlines:saved.showOutlines!==false,showSolar:saved.showSolar!==false,ground:saved.ground!==false,date:new Date(),mode:'outlines',selected:null,tab:'explore',search:'',grid:false,lines:['off','focus','full'].includes(saved.lines)?saved.lines:'focus',survey:true};
// Validate persisted input before passing it into the native astronomy engine.
if(!Number.isFinite(state.lat)||Math.abs(state.lat)>90)state.lat=49.28;
if(!Number.isFinite(state.lon)||Math.abs(state.lon)>180)state.lon=-123.12;
if(!Array.isArray(state.filters.types))state.filters.types=[];
for(const key of ['width','height'])if(!Number.isFinite(state.equipment[key])||state.equipment[key]<=0||state.equipment[key]>120)state.equipment[key]=key==='width'?2.14:1.2;
const engine=new SkyEngine();let objects=[],filtered=[],visible=[],hitTargets=[],lastRender=0,limit=60,ready=false;
delete state.equipment.angle;
if(saved.equipment&&!saved.equipment.preset&&(state.equipment.width!==2.14||state.equipment.height!==1.2)){state.equipment.preset='custom';state.equipment.pixels=null;}
let objectDescriptions={};
let patchContains=null,drawingPatch=false,editingPatch=false,draftPatch=[],patchHandles=[];
state.patch={vertices:[],enabled:false,...saved.patch};
try{if(!Array.isArray(state.patch.vertices)||state.patch.vertices.some(v=>!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x))))throw Error();if(state.patch.vertices.length)patchContains=preparePatch(state.patch.vertices);}catch{state.patch={vertices:[],enabled:false};}

let timelineBase=new Date();
let groundCache={key:'',path:null};
const images=new Map();let imageInFlight=0;const imageQueue=[];
function persist(){try{localStorage.setItem('skypatch-v1',JSON.stringify({lat:state.lat,lon:state.lon,site:state.site,patch:state.patch,filters:state.filters,equipment:state.equipment,mountMode:state.mountMode,lines:state.lines,showOutlines:state.showOutlines,showSolar:state.showSolar,ground:state.ground}));}catch{}}
function thumbnail(o){
 if(images.has(o.id))return images.get(o.id);
 if(images.size>=128){const oldest=[...images.entries()].find(([,v])=>v.state==='ready'||v.state==='error');if(oldest)images.delete(oldest[0]);}const entry={image:null,state:'queued'};images.set(o.id,entry);imageQueue.push([o,entry]);pumpImages();return entry;
}
function pumpImages(){while(imageInFlight<4&&imageQueue.length){const [o,e]=imageQueue.shift();imageInFlight++;const im=new Image();e.state='loading';im.onload=()=>{e.image=im;e.state='ready';imageInFlight--;pumpImages();};im.onerror=()=>{e.state='error';imageInFlight--;pumpImages();};im.src=imageUrl(o,state.equipment.width,160,Math.round(160*state.equipment.height/state.equipment.width));}}

$('#app').innerHTML=`
<header><div class="brand"><span class="brandmark">✦</span><strong>Sky Patch</strong><span class="phase">OBSERVING PLANNER</span></div><div class="header-actions"><button id="siteButton" title="Set observing location">⌖ <span id="siteName"></span></button></div></header>
<div class="workspace"><aside id="sidebar"><button id="drawerHandle" aria-label="Close planning drawer">Planning panel <span>⌄</span></button><div class="search-wrap"><label for="search">Find an object</label><input id="search" type="search" placeholder="M57, Crescent, NGC 7000…" autocomplete="off"><p class="hint">Search includes objects hidden by filters.</p></div>
<nav class="tabs" aria-label="Planning panels"><button id="exploreTab" class="active">Explore</button><button id="framingTab">Framing</button></nav>
<section class="patch-controls"><h2>My visible sky</h2><label class="check"><input type="checkbox" id="patchEnabled"> Filter to my sky patch</label><div class="patch-actions"><button id="editPatch">Edit points</button><button id="drawPatch">Draw patch</button><button id="clearPatch">Clear</button></div><p id="patchStatus" class="hint" role="status"></p></section><div id="explorePanel"><details open class="solar-panel"><summary>Solar system</summary><label class="check"><input type="checkbox" id="showSolar" checked> Show true-size discs</label><p class="hint">Independent of deep-sky size and brightness filters. Horizon and altitude filters still apply.</p><div id="solarShortcuts" class="solar-shortcuts"></div></details><label class="check filter-master"><input id="filtersEnabled" type="checkbox" checked> All filters</label><p id="filterToggleStatus" class="hint"></p><details class="filter-details" open><summary>Filter deep-sky objects <button id="resetFilters" class="text-button">Reset</button></summary>
<div id="type"><details><summary id="typeSummary">All object types</summary><div class="type-actions"><button id="allTypes">All</button><button id="noTypes">None</button></div><div id="typeChoices"></div></details></div>
<label class="check"><input id="above" type="checkbox" checked> Above the horizon</label>
<div class="range-pair"><label>Min altitude °<input id="altMin" type="number" min="-90" max="90" value="0"></label><label>Max altitude °<input id="altMax" type="number" min="-90" max="90" value="90"></label></div>
<div class="range-pair"><label>Min size ′<input id="sizeMin" type="number" min="0" placeholder="Any"></label><label>Max size ′<input id="sizeMax" type="number" min="0" placeholder="Any"></label></div>
<details><summary>Brightness & frame fill</summary><div class="range-pair"><label>Min magnitude<input id="magMin" type="number" step=".1" placeholder="Any"></label><label>Max magnitude<input id="magMax" type="number" step=".1" placeholder="Any"></label></div><p class="hint">Lower is brighter. V band, or B when V is unavailable.</p>
<div class="range-pair"><label>Min surface brightness<input id="sbMin" type="number" step=".1" placeholder="Any"></label><label>Max surface brightness<input id="sbMax" type="number" step=".1" placeholder="Any"></label></div><p class="hint">B-band mag/arcsec². Often unknown for nebulae.</p>
<div class="range-pair"><label>Min frame fill %<input id="fillMin" type="number" min="0" placeholder="Any"></label><label>Max frame fill %<input id="fillMax" type="number" min="0" placeholder="Any"></label></div><p class="hint">Object’s long axis ÷ single-frame width.</p></details>
<label class="check"><input id="unknown" type="checkbox" checked> Include unknown measurements</label><p id="filterError" class="error" role="alert"></p></details>
<div class="result-heading"><h2 id="resultTitle">Objects in this view</h2><span id="resultCount"></span></div><div id="results"></div><button id="more" class="wide secondary" hidden>Show more objects</button></div>
<div id="framingPanel" hidden><div id="selection"><div class="empty">Choose an object on the map to explore its framing.</div></div>
<details open class="equipment"><summary>Telescope / camera framing</summary><label>Equipment preset<select id="equipmentPreset"><option value="custom">Custom field of view</option></select></label><p id="presetNote" class="hint"></p><div class="range-pair"><label>Frame width °<input id="width" type="number" min=".05" max="120" step=".01"></label><label>Frame height °<input id="height" type="number" min=".05" max="120" step=".01"></label></div>
<div class="range-pair"><label>Mosaic width<select id="mx"><option value="1">1× · single</option><option value="1.4">1.4×</option><option value="1.8">1.8× · maximum</option></select></label><label>Mosaic height<select id="my"><option value="1">1× · single</option><option value="1.4">1.4×</option><option value="1.8">1.8× · maximum</option></select></label></div>
<label>Mount mode</label><div class="segmented" aria-label="Mount mode"><button id="altazMode" type="button">Alt-Az</button><button id="eqMode" type="button">EQ</button></div><p id="orientationReadout" class="hint"></p><p class="hint">Alt-Az follows the local horizon; EQ follows celestial north. Ideal alignment with zero camera roll; actual sensor orientation may have a fixed offset.</p><p id="equipmentError" role="alert" class="error"></p><button id="resetEquipment" class="secondary wide">Reset Mini preset</button></details></div>
<footer class="side-footer"><a href="./credits.html" target="_blank" rel="noopener">Sources & open-source credits ↗</a><span>Manual visible-sky patch</span></footer></aside>
<section class="map" aria-label="Interactive sky map"><canvas id="sky" tabindex="0" aria-label="Sky map. Drag to pan, scroll to zoom. Arrow keys pan, plus and minus zoom. Search or the object list provides keyboard object selection."></canvas><div id="skyLight" aria-hidden="true"></div><canvas id="overlay" aria-hidden="true"></canvas>
<button id="sidebarToggle" aria-expanded="false" aria-label="Open planning drawer">Plan</button><button id="viewMenu" aria-expanded="false">View ▾</button><div class="map-toolbar"><div class="segmented" aria-label="Object display"><button id="outlines" class="active" aria-pressed="true">Dots</button><button id="thumbnails" aria-pressed="false">Thumbnails</button></div><button id="outlineToggle" aria-pressed="true">Object outlines</button><button id="grid" aria-pressed="false">Grid</button><button id="ground" class="active" aria-pressed="true">Ground</button><div class="constellation-controls"><span>Constellations</span><div class="segmented"><button data-constellations="off">Off</button><button data-constellations="focus">Focus</button><button data-constellations="full">Full</button></div></div><button id="survey" class="active" aria-pressed="true">Survey</button></div>
<div id="patchDrawing" class="patch-drawing" hidden><span id="patchDrawHint">Tap corners, then Finish. Desktop: hold Space and drag to pan; scroll to zoom. Mobile: use two fingers to pan and pinch.</span><button id="undoPatch">Undo</button><button id="finishPatch">Finish</button><button id="cancelPatch">Cancel</button></div><div id="skyContext" class="sky-context"></div><div id="message" role="status" class="map-message">Loading the planetarium…</div>
<div class="map-navigation"><button id="zoomIn" aria-label="Zoom in">+</button><button id="zoomOut" aria-label="Zoom out">−</button><button id="wideView" title="Return to a wide sky view">Wide</button><button id="frameTarget" disabled>Frame target</button></div>
<div class="map-bottom"><span id="mapReadout">Drag to explore · scroll to zoom</span><span class="legend"><i></i> Camera frame <i class="mosaic"></i> Mosaic</span></div></section></div>
<section id="planningTime" class="timeline" aria-label="Planning time"><label>Planning time <input id="date" type="datetime-local" step="60"></label><span class="timezone" id="timezone"></span><button id="now">Now</button><button id="backHour" aria-label="One hour earlier">−1 h</button><input id="timeSlider" type="range" min="-720" max="720" step="5" value="0" aria-label="Time offset in minutes"><button id="forwardHour" aria-label="One hour later">+1 h</button><output id="timeOffset">±12 hours</output></section>
<dialog id="siteDialog"><form id="siteForm"><h2>Observing location</h2><p>The sky is calculated for this location. Saved only in this browser.</p><label>Location name<input id="locationName" maxlength="80"></label><div class="range-pair"><label>Latitude °<input id="latitude" type="number" min="-90" max="90" step="any" required></label><label>Longitude °<input id="longitude" type="number" min="-180" max="180" step="any" required></label></div><p class="hint">North / east positive, south / west negative.</p><button id="geolocate" type="button" class="secondary wide">Use my current location</button><p id="locationStatus" role="status"></p><div class="dialog-actions"><button type="button" id="cancelSite">Cancel</button><button type="submit" class="primary">Save location</button></div></form></dialog>`;

// Group switches preserve values and the user's individual enabled choices.
for(const [key,label,ids] of [
 ['types','Object type',['type']],['alt','Altitude',['above','altMin','altMax']],
 ['size','Angular size',['sizeMin','sizeMax']],['mag','Magnitude',['magMin','magMax']],
 ['sb','Surface brightness',['sbMin','sbMax']],['fill','Frame fill',['fillMin','fillMax']]
]){
 const first=key==='types'?$('#type'):$('#'+ids[0]).closest(key==='alt'?'label':'.range-pair');
 const toggle=document.createElement('label');toggle.className='check filter-switch';
 toggle.innerHTML=`<input type="checkbox" id="${key}Enabled"> ${label}`;
 const fieldset=document.createElement('fieldset');fieldset.className='filter-group';fieldset.dataset.filter=key;fieldset.setAttribute('aria-label',label+' settings');
 first.before(toggle,fieldset);fieldset.append(first);
 if(key==='alt')fieldset.append($('#altMin').closest('.range-pair'));
 $('#'+key+'Enabled').onchange=event=>{state.filters[key+'Enabled']=event.target.checked;syncFilterSwitches();recompute();};
}
function syncFilterSwitches(){
 const enabled=state.filters.enabled!==false;$('#filtersEnabled').checked=enabled;
 for(const fieldset of document.querySelectorAll('[data-filter]')){
  const input=$('#'+fieldset.dataset.filter+'Enabled');input.checked=state.filters[fieldset.dataset.filter+'Enabled']!==false;
  input.disabled=!enabled;fieldset.disabled=!enabled||!input.checked;
 }
 $('#unknown').disabled=!enabled;
 $('#filterToggleStatus').textContent=enabled?'Switch filters off without losing their values.':'Filters paused · your settings are saved. Your sky patch remains active if enabled. Ground still hides the sky below the horizon.';
}
$('#filtersEnabled').onchange=event=>{state.filters.enabled=event.target.checked;syncFilterSwitches();recompute();};
arrangePanels();
function syncPatchControls(){
 $('#patchEnabled').checked=state.patch.enabled;$('#patchEnabled').disabled=!patchContains||drawingPatch;
 $('#editPatch').disabled=!patchContains||drawingPatch;$('#drawPatch').textContent=patchContains?'Redraw from scratch':'Draw patch';$('#drawPatch').disabled=drawingPatch;$('#clearPatch').disabled=!patchContains||drawingPatch;
 $('#patchStatus').textContent=drawingPatch?'Your existing patch is kept until you finish.':!patchContains?'Mark your view with a polygon. Saved in this browser.':state.patch.enabled?'Filtering by object centre. Boundary stays fixed to your local horizon.':'Patch off · saved boundary retained.';
}
function endPatchDrawing(){resetPatchInput();for(const h of patchHandles)h.remove();patchHandles=[];editingPatch=false;drawingPatch=false;draftPatch=[];$('#patchDrawing').hidden=true;$('#overlay').style.pointerEvents='none';syncPatchControls();}
$('#drawPatch').onclick=()=>{if(!ready)return;drawingPatch=true;editingPatch=false;draftPatch=[];$('#undoPatch').hidden=false;$('#finishPatch').textContent='Finish';$('#sky').focus({preventScroll:true});if(matchMedia('(max-width:650px)').matches&&!$('.workspace').classList.contains('panel-hidden'))$('#sidebarToggle').click();$('#patchDrawHint').textContent='Tap corners, then Finish. Desktop: hold Space and drag to pan; scroll to zoom. Mobile: use two fingers to pan and pinch.';$('#patchDrawing').hidden=false;$('#overlay').style.pointerEvents='auto';$('#finishPatch').disabled=true;$('#undoPatch').disabled=true;syncPatchControls();};
$('#editPatch').onclick=()=>{
 if(!ready||!patchContains)return;
 $('#drawPatch').onclick();editingPatch=true;draftPatch=state.patch.vertices.map(v=>[...v]);
 $('#undoPatch').hidden=true;$('#finishPatch').disabled=false;$('#finishPatch').textContent='Save changes';
 $('#patchDrawHint').textContent='Drag any corner to adjust it. Space-drag or two fingers moves the sky. Save changes when ready; Cancel keeps your original patch.';
 patchHandles=createPatchHandles(draftPatch.length,(i,event)=>{draftPatch[i]=patchRay(event);});
};
$('#cancelPatch').onclick=endPatchDrawing;
$('#undoPatch').onclick=()=>{draftPatch.pop();$('#finishPatch').disabled=draftPatch.length<3;$('#undoPatch').disabled=!draftPatch.length;syncPatchControls();};
$('#finishPatch').onclick=()=>{try{const contains=preparePatch(draftPatch);state.patch={vertices:draftPatch.map(v=>[...v]),enabled:editingPatch?state.patch.enabled:true};patchContains=contains;endPatchDrawing();recompute();}catch(error){$('#patchStatus').textContent=error.message;$('#patchDrawHint').textContent=error.message;}};
$('#clearPatch').onclick=()=>{state.patch={vertices:[],enabled:false};patchContains=null;recompute();};
$('#patchEnabled').onchange=event=>{state.patch.enabled=event.target.checked;recompute();};
document.addEventListener('keydown',event=>{if(drawingPatch&&event.key==='Escape'){event.preventDefault();endPatchDrawing();}});
installTimeToggle();
const offlineReady=installOffline();
const connection=document.createElement('span');connection.className='network-state';document.querySelector('.side-footer').prepend(connection);
function updateConnection(){connection.textContent=navigator.onLine?'':'Offline · survey detail and articles may be unavailable';}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
$('#viewMenu').onclick=()=>{const expanded=$('.map-toolbar').classList.toggle('mobile-open');$('#viewMenu').setAttribute('aria-expanded',expanded);};
$('#drawerHandle').onclick=()=>$('#sidebarToggle').click();
let drawerStart=null;
$('#drawerHandle').addEventListener('touchstart',e=>{drawerStart=e.touches[0].clientY;},{passive:true});
$('#drawerHandle').addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
$('#drawerHandle').addEventListener('touchend',e=>{if(drawerStart==null)return;const dy=e.changedTouches[0].clientY-drawerStart;drawerStart=null;if(Math.abs(dy)>25){e.preventDefault();if(dy<0)$('#sidebar').classList.add('expanded');else if($('#sidebar').classList.contains('expanded'))$('#sidebar').classList.remove('expanded');else $('#sidebarToggle').click();}},{passive:false});
const attachObjectInfo=installObjectInfo($('#selection'));
const canvas=$('#sky'),overlay=$('#overlay'),ctx=overlay.getContext('2d');
function patchRay(event){
 const r=overlay.getBoundingClientRect(),scale=Math.min(r.width,r.height)/(2*Math.tan(engine.fov*RAD/4));
 const u=(event.clientX-r.left-r.width/2)/scale,v=(r.height/2-event.clientY+r.top)/scale,d=1+u*u+v*v;
 const ray=[2*u/d,2*v/d,(u*u+v*v-1)/d],st=engine.stel;
 return st.convertFrame(st.core.observer,'VIEW','OBSERVED_GEOM',ray).slice(0,3);
}
const resetPatchInput=installPatchInput(overlay,canvas,engine,()=>drawingPatch,event=>{
 if(!drawingPatch||editingPatch)return;draftPatch.push(patchRay(event));
 $('#finishPatch').disabled=draftPatch.length<3;$('#undoPatch').disabled=false;syncPatchControls();
});
function syncInputs(){syncPatchControls();syncFilterSwitches();$('#ground').classList.toggle('active',state.ground);$('#ground').setAttribute('aria-pressed',state.ground);$('#showSolar').checked=state.showSolar;for(const [k,v]of Object.entries(state.filters)){const el=$('#'+k);if(el)el.type==='checkbox'?el.checked=v:el.value=v??'';}syncTypes();syncEquipment();syncConstellations();for(const [k,v]of Object.entries(state.equipment))if($('#'+k))$('#'+k).value=v;syncMountMode();$('#outlineToggle').classList.toggle('active',state.showOutlines);$('#outlineToggle').setAttribute('aria-pressed',state.showOutlines);$('#siteName').textContent=state.site;}
function syncDate(){const d=state.date;const p=n=>String(n).padStart(2,'0');$('#date').value=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;$('#timezone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone+' (device time)';}
function recompute(){
 if(!ready)return;
 engine.setObserver(state.lat,state.lon,state.date);
 for(const record of engine.solarSystem()){const existing=objects.find(o=>o.solar&&o.id===record.id);if(existing)Object.assign(existing,record,{v:vector(record.ra,record.dec),extent:extent(record)});}
 const m=engine.matrix('OBSERVED_GEOM');
 for(const o of objects){const v=engine.rotate(o.v,m);o.alt=spherical(v)[1];o.reasons=o.solar?[...(!state.showSolar?['Solar system hidden']:[]),...(state.filters.enabled!==false&&state.filters.altEnabled!==false&&state.filters.above&&o.alt<0?['Below horizon']:[]),...(state.filters.enabled!==false&&state.filters.altEnabled!==false&&(o.alt<state.filters.altMin||o.alt>state.filters.altMax)?['Altitude']:[])]:exclusions(o,state.filters,o.alt,state.equipment.width);}
 if(state.patch.enabled&&patchContains)for(const o of objects){if(!patchContains(engine.rotate(o.v,m)))o.reasons.push('Outside sky patch');}
 filtered=objects.filter(o=>!o.reasons.length);
 limit=60;syncPatchControls();updateContext();renderSelection();renderResults(true);persist();
}
function updateContext(){
 const obs=new Astronomy.Observer(state.lat,state.lon,0),sun=Astronomy.Equator('Sun',state.date,obs,true,true),h=Astronomy.Horizon(state.date,obs,sun.ra,sun.dec);
 const light=skyLight(h.altitude);$('#skyLight').style.backgroundColor=`rgb(${light.rgb.join(',')})`;
 $('#skyContext').textContent=light.phase+(h.altitude>-18?' · stars and objects kept visible':'');
}
function setTime(date,reset=false){if(Number.isNaN(date.getTime()))return;state.date=date;if(reset){timelineBase=new Date(date);$('#timeSlider').value=0;$('#timeOffset').textContent='±12 hours';}syncDate();recompute();}
function switchTab(tab){state.tab=tab;for(const mode of panelModes){$('#'+mode+'Panel').hidden=mode!==tab;$('#'+mode+'Tab').classList.toggle('active',mode===tab);$('#'+mode+'Tab').setAttribute('aria-pressed',String(mode===tab));}$('#sidebar').scrollTop=0;}
function select(o,frame=false){if(matchMedia('(max-width:650px)').matches&&$('.workspace').classList.contains('panel-hidden'))$('#sidebarToggle').click();state.selected=o;$('#frameTarget').disabled=false;engine.center(o);switchTab('info');renderSelection();$('#sidebar').scrollTop=0;if(frame)frameTarget();}
function frameTarget(){if(!state.selected)return;const e=state.equipment;engine.center(state.selected);engine.zoom(fitFov(state.selected,e.width*e.mx,e.height*e.my,engine.framing(state.mountMode).angle));}
function renderSelection(){
 const o=state.selected;if(!o)return;if(o.solar){renderSolarSelection(o);return;}
 const e=state.equipment,fill=frameFill(o,e.width),h=engine.horizontal(o.v),fov=Math.min(160,fitFov(o,e.width*e.mx,e.height*e.my,engine.framing(state.mountMode).angle)*1.6);
 $('#selection').innerHTML=`<p class="eyebrow" style="color:${colors[o.type]||'#a5baff'}">${escape(o.type)} · ${escape(o.constellation)}</p><h1>${escape(o.name)}</h1><p class="aliases">${escape(objectNames(o).slice(0,3).join(' · '))}</p><details class="all-names"><summary>All names & identifiers (${objectNames(o).length})</summary><p class="aliases">${escape(objectNames(o).join(' · '))}</p></details>
 ${o.reasons.length?`<p class="excluded">Excluded by: ${escape(o.reasons.join(', '))}. Shown for inspection.</p>`:''}
 <div class="photo-preview"><img id="targetPhoto" alt="DSS survey around ${escape(o.name)}; ${fmt(fov,2)}° wide" src="${imageUrl(o,fov)}"><span class="photo-state" id="photoState">Loading survey…</span></div><p class="object-description">${escape(objectDescriptions[o.id]?.text||catalogueDescription(o))}</p><p class="hint">${objectDescriptions[o.id]?`<a href="${escape(objectDescriptions[o.id].url)}" target="_blank" rel="noopener">Wikipedia contributors</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> · saved offline`:'Catalogue overview · OpenNGC · saved offline'}</p>
 <button id="inspectFrame" class="primary wide">Frame target on the sky</button>
 <dl><div><dt>Altitude / azimuth</dt><dd>${fmt(h.alt)}° / ${fmt(h.az)}°</dd></div><div><dt>Magnitude ${o.band||''}</dt><dd>${fmt(o.mag,2)}</dd></div><div><dt>Angular extent</dt><dd>${fmt(o.major,2)}′ ${o.minor?'× '+fmt(o.minor,2)+'′':''}</dd></div><div><dt>Frame width filled</dt><dd>${fill==null?'Unknown':fmt(fill,0)+'%'}</dd></div><div><dt>Long-axis sampling</dt><dd>${o.major==null?'Unknown':'≈ '+(e.pixels?Math.round(o.major/60/e.width*e.pixels)+' pixels':'Unknown sensor sampling')}</dd></div><div><dt>Surface brightness B</dt><dd>${o.sb==null?'Unknown':fmt(o.sb,2)+' mag/arcsec²'}</dd></div><div><dt>Composition</dt><dd>${fmt(e.width*e.mx,3)}° × ${fmt(e.height*e.my,3)}°</dd></div></dl><p class="hint">${o.outline?'Sourced OpenNGC contour.':o.major?'Catalogue ellipse; '+(o.pa==null?'position angle unknown.':'position angle '+o.pa+'°.'):'Angular extent unknown; shown as a discovery dot.'} ${o.minor==null&&o.major?'Minor axis unknown; circular approximation.':''} Size describes extent, not resolved detail.</p>`;
 if($('#selection .object-description'))$('#selection .photo-preview').before($('#selection .object-description'));
 showVisibility($('#selection'),o,state,setTime);
 attachObjectInfo(o);
 $('#inspectFrame').onclick=frameTarget;
 $('#targetPhoto').onload=()=>{$('#photoState').hidden=true;};
 $('#targetPhoto').onerror=()=>{$('#photoState').textContent='Survey unavailable · frame scale retained';};
}
function renderSolarSelection(o){
 const e=state.equipment,h=engine.horizontal(o.v),pixels=e.pixels?o.major/60/e.width*e.pixels:null;
 $('#selection').innerHTML=`<p class="eyebrow">Solar system · ${escape(o.type)}</p><h1>${escape(o.name)}</h1>
 ${o.reasons.length?`<p class="excluded">Excluded by: ${escape(o.reasons.join(', '))}. Shown for inspection.</p>`:''}
 ${o.id==='Sun'?'<p class="solar-notice">Use the correct solar filter on the telescope before pointing at the Sun.</p>':''}
 <p class="hint">True-size disc footprint, calculated for your location and planning time. No photographic surface detail or illumination is simulated.</p>
 <button id="inspectFrame" class="primary wide">Frame ${escape(o.name)} on the sky</button>
 <dl><div><dt>Disc diameter</dt><dd>${fmt(o.major,2)}′ / ${fmt(o.major*60,1)}″</dd></div><div><dt>Sampling across disc</dt><dd>${pixels==null?'Unknown':('≈ '+fmt(pixels,1)+' pixels')}</dd></div><div><dt>Single-frame width filled</dt><dd>${fmt(frameFill(o,e.width),2)}%</dd></div><div><dt>Altitude / azimuth</dt><dd>${fmt(h.alt)}° / ${fmt(h.az)}°</dd></div>${o.phase==null?'':`<div><dt>Illuminated fraction</dt><dd>${fmt(o.phase*100,1)}%</dd></div>`}<div><dt>Magnitude V</dt><dd>${fmt(o.mag,2)}</dd></div><div><dt>Composition</dt><dd>${fmt(e.width*e.mx,3)}° × ${fmt(e.height*e.my,3)}°</dd></div></dl>
 <p class="hint">${o.id==='Saturn'?'Globe diameter only; rings are not included. ':''}A tiny cross marks an unresolved disc at wide zoom; it is not an enlarged planet. Sampling does not imply resolved detail.</p>`;
 if($('#selection .object-description'))$('#selection .photo-preview').before($('#selection .object-description'));
 showVisibility($('#selection'),o,state,setTime);
 attachObjectInfo(o);
 $('#inspectFrame').onclick=frameTarget;
}
let lastResultKey='';
function renderResults(force=false){
 if(state.tab!=='explore'&&!force)return;
 let list=state.search?objects.filter(o=>searchMatches(o,state.search)):visible.map(p=>p.o).filter(o=>!o.reasons.length);
 list.sort((a,b)=>(a.reasons.length>0)-(b.reasons.length>0)||(b.major||0)-(a.major||0));
 const key=state.search+'|'+list.map(o=>o.id).join(',')+'|'+limit;
 if(key===lastResultKey&&!force)return;lastResultKey=key;
 $('#resultTitle').textContent=state.search?'Search results':'Objects in this view';$('#resultCount').textContent=list.length;
 const reasonCounts={};if(!filtered.length)for(const o of objects)for(const r of o.reasons)reasonCounts[r]=(reasonCounts[r]||0)+1;
 $('#results').innerHTML=list.length?list.slice(0,limit).map(o=>`<button class="object-row" data-object="${escape(o.id)}"><span class="object-dot" style="background:${colors[o.type]||'#a5baff'}"></span><span><strong>${escape(o.name)}</strong><small>${escape(objectNames(o).filter(n=>n!==o.name).slice(0,2).join(' · '))} · ${escape(o.type)}${o.reasons.length?' · '+escape(o.reasons.join(', ')):''}</small></span><span class="object-size">${o.major==null?'—':fmt(o.major,0)+'′'}<small>${fmt(o.alt,0)}° alt</small></span></button>`).join(''):`<div class="empty">${state.search?'No matching object. Try a catalogue number or common name.':filtered.length?`${filtered.length} objects pass your filters elsewhere in the sky. Pan around or use Wide.`:'No objects pass these filters.'}${!filtered.length?`<p>${Object.entries(reasonCounts).map(([r,n])=>escape(r)+': '+n).join('<br>')}</p><button id="relax" class="secondary">Clear numerical filters</button>`:''}</div>`;
 $('#more').hidden=list.length<=limit;
 for(const b of document.querySelectorAll('[data-object]'))b.onclick=()=>select(objects.find(o=>o.id===b.dataset.object));
 if($('#relax'))$('#relax').onclick=()=>{state.filters={...defaults,types:[],above:false,altMin:-90,sizeMin:null,magMax:null};syncInputs();recompute();};
}
function drawPath(points,m,w,h,color,dash=[],width=1,exact=false,fill=null){
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();let prev=null;
 for(const v of points){const p=engine.project(v,w,h,exact?null:m);if(!p||Math.abs(p[0])>w*5||Math.abs(p[1])>h*5){prev=null;continue;}if(prev&&Math.hypot(p[0]-prev[0],p[1]-prev[1])<Math.max(w,h))ctx.lineTo(...p);else ctx.moveTo(...p);prev=p;}if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();ctx.setLineDash([]);
}
function draw(timestamp){
 requestAnimationFrame(draw);if(!ready||timestamp-lastRender<33)return;lastRender=timestamp;
 const {width:w,height:h}=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;if(!w||!h)return;
 if(overlay.width!==Math.round(w*dpr)||overlay.height!==Math.round(h*dpr)){overlay.width=Math.round(w*dpr);overlay.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const m=engine.matrix('VIEW');visible=[];hitTargets=[];
 // Natural horizon only. Local obstacles are intentionally outside phase one.
 if(state.grid)drawPath(Array.from({length:181},(_,i)=>engine.stel.convertFrame(engine.stel.core.observer,'OBSERVED_GEOM','ICRF',vector(i*2,0))),m,w,h,'#a6b3c5',[],1.4);
 const candidates=state.selected?.reasons.length&&(!state.selected.solar||state.showSolar)?[...filtered,state.selected]:filtered;
 for(const o of candidates){if(state.ground&&o.alt<0)continue;const p=engine.project(o.v,w,h,m);if(!p||p[0]<-100||p[0]>w+100||p[1]<-100||p[1]>h+100)continue;
  if(!o.reasons.length&&p[0]>=0&&p[0]<=w&&p[1]>=0&&p[1]<=h)visible.push({o,p});const color=o.solar?({Sun:'#ffd587',Moon:'#d5e2f2',Mars:'#f3ae8c',Jupiter:'#e9c8a8'}[o.id]||'#d5c4ad'):colors[o.type]||'#bbc8ec';
  if(o.solar){
   drawPath(o.extent,m,w,h,color,[],1,true,color+'38');
   const radius=o.major/60/engine.fov*Math.min(w,h)/2;
   if(radius<3){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(p[0]-4,p[1]);ctx.lineTo(p[0]+4,p[1]);ctx.moveTo(p[0],p[1]-4);ctx.lineTo(p[0],p[1]+4);ctx.stroke();}
   if(radius>=3)hitTargets.push({o,p,box:[p[0]-radius,p[1]-radius,2*radius,2*radius]});
  }
  if(!o.solar&&state.showOutlines&&o.major&&((o.major/60)/engine.fov*Math.min(w,h)>6||o===state.selected))drawPath(o.extent,m,w,h,color,[],o===state.selected?2:1);
  if(!o.solar&&(!state.showOutlines||!o.major||o.major/60/engine.fov*Math.min(w,h)<8)){ctx.beginPath();ctx.arc(...p,2.6,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  if(p[0]>=0&&p[0]<=w&&p[1]>=0&&p[1]<=h)hitTargets.push({o,p});
 }
 const occupied=[];let thumbs=0;
 const ranked=[...visible].sort((a,b)=>(b.o===state.selected)-(a.o===state.selected)||(b.o.major||0)-(a.o.major||0));
 ctx.font='13px system-ui';
 for(const {o,p} of ranked){
  if(p[0]<10||p[0]>w-110||p[1]<60||p[1]>h-55)continue;
  const thumb=!o.solar&&state.mode==='thumbnails'&&thumbs<12;
  const tw=thumb?92:Math.min(185,ctx.measureText(o.name).width+15),th=thumb?72:23;
  const box=[p[0]+9+(o.solar?o.major/60/engine.fov*Math.min(w,h)/2:0),p[1]-th/2,tw,th];
  if(occupied.some(b=>box[0]<b[0]+b[2]+8&&box[0]+tw>b[0]-8&&box[1]<b[1]+b[3]+5&&box[1]+th>b[1]-5))continue;
  occupied.push(box);
  ctx.strokeStyle=colors[o.type]||'#a5baff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0]+(o.solar?o.major/60/engine.fov*Math.min(w,h)/2:0),p[1]);ctx.lineTo(box[0],box[1]+th/2);ctx.stroke();ctx.fillStyle='rgba(8,15,27,.84)';ctx.fillRect(...box);
  if(thumb){const entry=thumbnail(o);const iw=Math.min(90,50.625*state.equipment.width/state.equipment.height),ih=iw*state.equipment.height/state.equipment.width,ix=box[0]+1+(90-iw)/2,iy=box[1]+1+(50.625-ih)/2;if(entry.image)ctx.drawImage(entry.image,ix,iy,iw,ih);else{ctx.fillStyle='#9aaac2';ctx.fillText(entry.state==='error'?'No survey':'Loading…',box[0]+7,box[1]+28);}ctx.strokeStyle='#9cdec9';ctx.strokeRect(ix,iy,iw,ih);thumbs++;}
  ctx.fillStyle=o===state.selected?'#fff':'#d8e1f0';ctx.fillText(o.name,box[0]+6,box[1]+th-7,tw-10);
  hitTargets.push({o,p:[box[0]+tw/2,box[1]+th/2],box});
 }
 if(state.ground){
  const s=engine.stel,zenith=s.convertFrame(s.core.observer,'OBSERVED_GEOM','VIEW',[0,0,1]);
  const key=[w,h,engine.fov,...zenith].join(',');
  if(groundCache.key!==key){const path=new Path2D();for(const span of groundSpans(w,h,engine.fov,zenith))path.rect(...span);groundCache={key,path};}
  ctx.fillStyle='#101b20';ctx.fill(groundCache.path);
 }
 {const e=state.equipment,o=engine.framing(state.mountMode);drawPath(footprint(o.ra,o.dec,e.width,e.height,o.angle),m,w,h,'#a2f0d4',[],2,true);if(e.mx>1||e.my>1)drawPath(footprint(o.ra,o.dec,e.width*e.mx,e.height*e.my,o.angle),m,w,h,'#f7d393',[7,5],2,true);}
 // Draw compass directions after the opaque ground and camera overlays.
 // These labels belong to Ground, so they do not depend on the grid switch.
 if(state.ground){
  const s=engine.stel;ctx.save();ctx.font='600 17px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#101b20';
  for(const [label,az] of [['N',0],['E',90],['S',180],['W',270]]){
   const ray=s.convertFrame(s.core.observer,'OBSERVED_GEOM','VIEW',vector(az,0));
   const p=projectView(ray,w,h,engine.fov);
   if(!p||p[0]<14||p[0]>w-14||p[1]<0||p[1]>h-38)continue;
   const y=p[1]+18<h-30?p[1]+18:p[1]-18;
   ctx.fillStyle=label==='N'?'#f5aaa5':'#d3e1ee';ctx.strokeText(label,p[0],y);ctx.fillText(label,p[0],y);
  }
  ctx.restore();
 }
 if(drawingPatch||(state.patch.enabled&&patchContains)){
  const vertices=drawingPatch?draftPatch:state.patch.vertices,st=engine.stel;
  const icrf=v=>st.convertFrame(st.core.observer,'OBSERVED_GEOM','ICRF',v);
  drawPath(patchEdges(vertices,!drawingPatch||editingPatch).map(icrf),m,w,h,'#73dcef',[6,4],2,true);
  for(let i=0;i<patchHandles.length;i++){const p=engine.project(icrf(vertices[i]),w,h,null),handle=patchHandles[i];handle.hidden=!p||p[0]<0||p[0]>w||p[1]<0||p[1]>h;if(!handle.hidden){handle.style.left=p[0]+'px';handle.style.top=p[1]+'px';}}
  ctx.fillStyle='#73dcef';
  for(const v of vertices){const p=engine.project(icrf(v),w,h,null);if(p&&p[0]>=0&&p[0]<=w&&p[1]>=0&&p[1]<=h){ctx.beginPath();ctx.arc(...p,4,0,Math.PI*2);ctx.fill();}}
 }
 const framing=engine.framing(state.mountMode);$('#orientationReadout').textContent=framing.singular?'At the alignment pole: orientation is undefined.':`${state.mountMode==='eq'?'EQ':'Alt-Az'} · position angle ${fmt(wrap(framing.angle)%180,1)}° · frame stays in the centre`;
 const obs=engine.stel.core.observer;$('#mapReadout').textContent=`Az ${fmt(wrap(obs.yaw/RAD),0)}° · Alt ${fmt(obs.pitch/RAD,0)}° · View ${fmt(engine.fov,engine.fov<10?2:0)}° · ${visible.length} objects`;
 if(timestamp%600<40)renderResults();
}

for(const id of panelModes)$('#'+id+'Tab').onclick=()=>{switchTab(id);renderResults(true);};
$('#showSolar').onchange=e=>{state.showSolar=e.target.checked;recompute();};
$('#search').oninput=e=>{state.search=e.target.value;limit=60;switchTab('explore');renderResults(true);};
$('#more').onclick=()=>{limit+=60;renderResults(true);};
$('#resetFilters').onclick=e=>{e.preventDefault();state.filters={...defaults,types:[]};$('#filterError').textContent='';syncInputs();recompute();};
function syncTypes(){for(const input of document.querySelectorAll('[data-type]'))input.checked=!state.filters.typesNone&&(!state.filters.types.length||state.filters.types.includes(input.dataset.type));$('#typeSummary').textContent=state.filters.typesNone?'No object types':state.filters.types.length?state.filters.types.length+' object types':'All object types';}
$('#allTypes').onclick=()=>{state.filters.types=[];state.filters.typesNone=false;syncTypes();recompute();};
$('#noTypes').onclick=()=>{state.filters.types=[];state.filters.typesNone=true;syncTypes();recompute();};
for(const preset of equipmentPresets)$('#equipmentPreset').add(new Option(preset.name,preset.id));
function syncEquipment(){const e=state.equipment,p=selectedEquipment(e);$('#equipmentPreset').value=p?.id||'custom';$('#presetNote').innerHTML=p?escape(p.note)+(p.source?` <a href="${escape(p.source)}" target="_blank" rel="noopener">Specifications ↗</a>`:''):'Custom angular dimensions. Pixel sampling is unknown.';}
$('#equipmentPreset').onchange=event=>{const p=equipmentPresets.find(p=>p.id===event.target.value);if(p){state.equipment={width:p.width,height:p.height,pixels:p.pixels,preset:p.id,mx:1,my:1};images.clear();imageQueue.length=0;}else{state.equipment.preset='custom';state.equipment.pixels=null;}syncInputs();recompute();};
function syncConstellations(){for(const b of document.querySelectorAll('[data-constellations]'))b.setAttribute('aria-pressed',b.dataset.constellations===state.lines);if(ready)engine.constellations(state.lines);}
for(const b of document.querySelectorAll('[data-constellations]'))b.onclick=()=>{state.lines=b.dataset.constellations;syncConstellations();persist();};
for(const id of ['above','unknown'])$('#'+id).onchange=e=>{state.filters[id]=e.target.checked;if(id==='above'){state.filters.altMin=e.target.checked?Math.max(0,state.filters.altMin):-90;$('#altMin').value=state.filters.altMin;}recompute();};
for(const prefix of ['alt','size','mag','sb','fill'])for(const end of ['Min','Max']){
 const id=prefix+end;$('#'+id).value=state.filters[id]??'';$('#'+id).onchange=e=>{
  const next={...state.filters,[id]:e.target.value===''?null:Number(e.target.value)};
  if(!e.target.checkValidity()||!validateRange(next[prefix+'Min'],next[prefix+'Max'])||(prefix==='alt'&&next[id]==null)){$('#filterError').textContent='Enter a valid range; minimum must not exceed maximum.';return;}
  $('#filterError').textContent='';state.filters=next;recompute();
 };
}
for(const k of ['width','height','mx','my'])$('#'+k).oninput=e=>{
 const v=Number(e.target.value);if(!e.target.checkValidity()||!Number.isFinite(v)||(['width','height'].includes(k)&&v<=0)){$('#equipmentError').textContent='Enter a frame size between 0.05° and 120°.';return;}
 $('#equipmentError').textContent='';state.equipment[k]=v;if(['width','height'].includes(k)){state.equipment.preset='custom';state.equipment.pixels=null;syncEquipment();}images.clear();imageQueue.length=0;recompute();
};
$('#resetEquipment').onclick=()=>{state.equipment={width:2.14,height:1.2,mx:1,my:1,preset:'mini',pixels:1920};syncInputs();recompute();};
function syncMountMode(){for(const mode of ['altaz','eq']){$('#'+mode+'Mode').classList.toggle('active',state.mountMode===mode);$('#'+mode+'Mode').setAttribute('aria-pressed',state.mountMode===mode);}}
for(const mode of ['altaz','eq'])$('#'+mode+'Mode').onclick=()=>{state.mountMode=mode;syncMountMode();persist();};
$('#outlineToggle').onclick=()=>{state.showOutlines=!state.showOutlines;$('#outlineToggle').classList.toggle('active',state.showOutlines);$('#outlineToggle').setAttribute('aria-pressed',state.showOutlines);persist();};
for(const id of ['outlines','thumbnails'])$('#'+id).onclick=()=>{state.mode=id;for(const mode of ['outlines','thumbnails']){$('#'+mode).classList.toggle('active',mode===id);$('#'+mode).setAttribute('aria-pressed',mode===id);}};
$('#ground').onclick=()=>{state.ground=!state.ground;$('#ground').classList.toggle('active',state.ground);$('#ground').setAttribute('aria-pressed',state.ground);lastResultKey='';persist();};
for(const id of ['grid','survey'])$('#'+id).onclick=()=>{if(!ready)return;state[id]=!state[id];$('#'+id).classList.toggle('active',state[id]);$('#'+id).setAttribute('aria-pressed',state[id]);engine.toggle(id,state[id]);};
$('#zoomIn').onclick=()=>{if(ready)engine.zoom(engine.fov/1.5);};$('#zoomOut').onclick=()=>{if(ready)engine.zoom(engine.fov*1.5);};
$('#wideView').onclick=()=>{if(ready){engine.zoom(100);}};$('#frameTarget').onclick=frameTarget;
$('#sidebarToggle').onclick=()=>{const hidden=$('.workspace').classList.toggle('panel-hidden');$('#sidebarToggle').setAttribute('aria-expanded',!hidden);};
let down=null;
canvas.addEventListener('sky-tap',e=>{down=[e.detail.clientX,e.detail.clientY];canvas.dispatchEvent(new PointerEvent('pointerup',{...e.detail,pointerType:'mouse'}));});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=[e.clientX,e.clientY];});
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(moved>6){return;}const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if(state.ground){const s=engine.stel,zenith=s.convertFrame(s.core.observer,'OBSERVED_GEOM','VIEW',[0,0,1]);if(belowGround(x,y,r.width,r.height,engine.fov,zenith))return;}
 const matches=hitTargets.filter(t=>t.box?(x>=t.box[0]&&x<=t.box[0]+t.box[2]&&y>=t.box[1]&&y<=t.box[1]+t.box[3]):Math.hypot(t.p[0]-x,t.p[1]-y)<13).sort((a,b)=>Math.hypot(a.p[0]-x,a.p[1]-y)-Math.hypot(b.p[0]-x,b.p[1]-y));
 if(matches.length)select(matches[0].o);
});
canvas.onkeydown=e=>{if(!ready)return;const o=engine.stel.core.observer,az=o.yaw/RAD,alt=o.pitch/RAD,step=engine.fov/12;let handled=true;if(e.key==='ArrowLeft')engine.direction(az-step,alt);else if(e.key==='ArrowRight')engine.direction(az+step,alt);else if(e.key==='ArrowUp')engine.direction(az,Math.min(89.9,alt+step));else if(e.key==='ArrowDown')engine.direction(az,Math.max(-89.9,alt-step));else if(e.key==='+'||e.key==='=')engine.zoom(engine.fov/1.5);else if(e.key==='-')engine.zoom(engine.fov*1.5);else handled=false;if(handled){e.preventDefault();}};
$('#date').onchange=e=>setTime(new Date(e.target.value),true);
$('#now').onclick=()=>setTime(new Date(),true);
$('#backHour').onclick=()=>setTime(new Date(+state.date-3600000),true);$('#forwardHour').onclick=()=>setTime(new Date(+state.date+3600000),true);
$('#timeSlider').oninput=e=>{$('#timeOffset').textContent=(Number(e.target.value)>0?'+':'')+e.target.value+' min';setTime(new Date(+timelineBase+Number(e.target.value)*60000));};
$('#siteButton').onclick=()=>{$('#locationName').value=state.site;$('#latitude').value=state.lat;$('#longitude').value=state.lon;$('#siteDialog').showModal();};
$('#cancelSite').onclick=()=>$('#siteDialog').close();
$('#siteForm').onsubmit=e=>{e.preventDefault();state.lat=Number($('#latitude').value);state.lon=Number($('#longitude').value);state.site=$('#locationName').value.trim()||'My observing location';$('#siteDialog').close();syncInputs();recompute();};
$('#geolocate').onclick=()=>{if(!navigator.geolocation){$('#locationStatus').textContent='Location is unavailable. Enter coordinates manually.';return;}$('#locationStatus').textContent='Waiting for location permission…';navigator.geolocation.getCurrentPosition(p=>{$('#latitude').value=p.coords.latitude;$('#longitude').value=p.coords.longitude;$('#locationName').value='Current location';$('#locationStatus').textContent='Location found. Save to use it.';},()=>{$('#locationStatus').textContent='Location unavailable or permission declined. Enter coordinates manually.';},{timeout:10000});};
syncInputs();syncDate();
if(matchMedia('(max-width:650px)').matches)$('#sidebarToggle').click();
async function start(){
try{
 await offlineReady;
 objectDescriptions=await fetch(new URL('data/descriptions.json',new URL(import.meta.env.BASE_URL,location.href))).then(r=>r.ok?r.json():{}).catch(()=>({}));
 const [,catalogue]=await Promise.all([engine.init(canvas),fetch(new URL('data/catalogue.json',new URL(import.meta.env.BASE_URL,location.href))).then(r=>{if(!r.ok)throw new Error('Catalogue could not load.');return r.json();})]);
 objects=[...catalogue,...engine.solarSystem()].map(o=>({...o,v:vector(o.ra,o.dec),extent:extent(o),reasons:[]}));
 for(const type of [...new Set(objects.filter(o=>!o.solar).map(o=>o.type))].sort()){const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.dataset.type=type;input.onchange=()=>{state.filters.types=[...document.querySelectorAll('[data-type]:checked')].map(i=>i.dataset.type);state.filters.typesNone=!state.filters.types.length;syncTypes();recompute();};label.append(input,document.createTextNode(type));$('#typeChoices').append(label);}ready=true;syncInputs();recompute();
 for(const o of objects.filter(o=>o.solar)){const button=document.createElement('button');button.textContent=o.name;button.onclick=()=>select(o,true);$('#solarShortcuts').append(button);}
 $('#message').hidden=true;requestAnimationFrame(draw);
 // Small, read-only diagnostics surface for reproducible integration checks.
 window.skyPatch={get state(){return state;},engine,get objects(){return objects;},get visible(){return visible;},get filtered(){return filtered;},select,setTime,frameTarget,recompute};
}catch(e){$('#message').textContent=e.message+' Refresh to retry.';$('#message').classList.add('error');console.error(e);}

}
start();
