import {visibility} from './visibility.js';
const time=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const date=t=>new Date(t).toLocaleDateString([],{day:'numeric',month:'short'});
export function showVisibility(container,object,state,setTime){
 const data=visibility(object,state.lat,state.lon,state.date,state.patch.vertices),section=document.createElement('section');section.className='visibility-panel';
 const x=t=>40+(t-data.start)/(data.end-data.start)*320,y=a=>16+(90-a)/180*150;
 let svg='';
 for(let i=0;i<data.samples.length-1;i++){const s=data.samples[i];if(s.sunAlt>-18)svg+=`<rect x="${x(s.time)}" y="16" width="${x(data.samples[i+1].time)-x(s.time)+.1}" height="150" fill="${s.sunAlt>=0?'#466b8b':'#283b58'}"/>`;}
 for(const [a,b]of data.patch||[])svg+=`<rect x="${x(a)}" y="16" width="${x(b)-x(a)}" height="150" fill="#69dac3" opacity=".18"/>`;
 for(const alt of [-90,-45,0,45,90])svg+=`<line x1="40" x2="360" y1="${y(alt)}" y2="${y(alt)}" stroke="${alt===0?'#bdc9dc':'#344052'}" stroke-dasharray="3 3"/><text x="35" y="${y(alt)+4}" text-anchor="end">${alt}°</text>`;
 svg+=`<polyline points="${data.samples.map(s=>`${x(s.time)},${y(s.alt)}`).join(' ')}" fill="none" stroke="#b1a5ff" stroke-width="2.5"/><line x1="${x(+state.date)}" x2="${x(+state.date)}" y1="16" y2="166" stroke="#ffc76e" stroke-width="2"/>`;
 for(let i=0;i<=4;i++){const t=data.start+(data.end-data.start)*i/4;svg+=`<text x="${x(t)}" y="185" text-anchor="${i===0?'start':i===4?'end':'middle'}">${time(t)}</text>`;}
 const windows=list=>list.length?list.map(([a,b])=>`${a===data.start?'Already visible at ':''}${date(a)} ${time(a)} – ${date(b)} ${time(b)} · ${Math.floor(Math.round((b-a)/60000)/60)}h ${Math.round((b-a)/60000)%60}m${b===data.end?' (continues)':''}`).join('<br>'):'No visibility in this period.';
 section.innerHTML=`<h2>When to observe</h2><p class="hint">${date(data.start)} noon – ${date(data.end)} noon · <span class="visibility-zone"></span></p><svg viewBox="0 0 380 196" role="img" aria-label="Altitude over the observing day. Purple shows altitude, gold marks planning time, green shows visibility inside your patch.">${svg}</svg><p class="hint">Purple: altitude · Gold: planning time<br>Blue background: daylight / twilight · Green: in your patch above the horizon</p><h3>Above horizon</h3><p class="horizon-windows">${windows(data.above)}</p><h3>Within My Sky${state.patch.enabled||!data.patch?'':' (patch filter off)'}</h3><p class="patch-windows">${data.patch?windows(data.patch):'Draw a patch in My Sky to see your viewing windows.'}</p><p>Highest: ${Math.round(data.peak.alt)}° at ${time(data.peak.time)}</p><label>Preview time <output>${time(+state.date)}</output><input class="visibility-time" type="range" min="${data.start}" max="${data.end-1}" step="60000" value="${+state.date}" aria-label="Preview object visibility time"></label><p class="hint">Approximate times, sampled every minute. Object centre, geometric horizon; catalogue filters are not applied. Daylight windows are included.</p>`;
 section.querySelector('.visibility-zone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const slider=section.querySelector('input');slider.oninput=()=>section.querySelector('output').textContent=time(+slider.value);slider.onchange=()=>setTime(new Date(+slider.value),true);
 container.querySelector('.object-description')?.after(section);if(!section.parentNode)container.querySelector('h1').after(section);
}
