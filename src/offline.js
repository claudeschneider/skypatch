import {installMobilePrompt} from './mobile-controls.js';
import {installUpdates} from './updates.js';
const SURVEY='https://alasky.cds.unistra.fr/DSS/DSSColor/';
const LIMIT=80*1024*1024;
export async function installOffline(){
 const base=new URL(import.meta.env.BASE_URL,location.href),surveyCache='skypatch-survey-v1-'+base.pathname;
 const button=document.createElement('button');button.className='offline-entry';button.textContent='Install / Offline';document.querySelector('.side-footer').prepend(button);
 const dialog=document.createElement('dialog');dialog.className='offline-dialog';dialog.setAttribute('aria-labelledby','offlineTitle');
 dialog.innerHTML=`<h2 id="offlineTitle">Take Sky Patch offline</h2><p id="coreStatus" role="status">Preparing the core planetarium…</p><button id="installApp" hidden>Install Sky Patch</button><p class="hint">On iPhone or iPad: open in Safari, choose Share → Add to Home Screen. On Android or desktop Chrome/Edge: use Install app in your browser menu. On recent Mac Safari: File → Add to Dock. Offline caching also works without installing.</p><h3>Install first on iPhone / iPad</h3><p>1. Add Sky Patch to your Home Screen. 2. Open it from that new icon while online. 3. Wait for Core ready offline, then download the survey here. Safari downloads are not copied into the installed app; downloading before installation means downloading again.</p><h3>Optional survey imagery</h3><p>Keep the stars and catalogue only, or download a low-resolution photographic overview of the entire sky. Online viewing still loads finer detail.</p><p class="hint">Up to 80 MB · about 1 arcminute per pixel (HiPS order 3). Suitable for large-scale context; small targets will look blurry. Object preview photos and Wikipedia still need a connection. Imagery: DSS / STScI / NASA / CDS.</p><p id="surveyStatus" role="status"></p><progress id="surveyProgress" max="100" value="0" hidden></progress><div class="offline-actions"><button id="downloadSurvey" disabled>Download survey overview</button><button id="cancelSurvey" hidden>Cancel download</button><button id="removeSurvey" disabled>Remove imagery</button></div><p class="hint">Keep this window open while downloading. Your browser may clear offline data when storage is low; reopen this panel to check readiness before heading out.</p><div class="dialog-actions"><button id="closeOffline">Close</button></div>`;
 document.body.append(dialog);if(new URLSearchParams(location.search).has('install'))dialog.showModal();const $=s=>dialog.querySelector(s);button.onclick=()=>{dialog.showModal();refresh();};$('#closeOffline').onclick=()=>dialog.close();
 installMobilePrompt(()=>button.onclick());
 let registration=null,installPrompt=null,controller=null;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installApp').hidden=false;});
 $('#installApp').onclick=async()=>{await installPrompt?.prompt();installPrompt=null;$('#installApp').hidden=true;};
 async function refresh(){
  if(controller||!('caches' in window))return;
  const cache=await caches.open(surveyCache),keys=await cache.keys(),complete=await cache.match(new URL('survey-complete',base).href);
  $('#surveyStatus').textContent=complete?'Survey overview saved for offline use.':keys.length?'Partial download saved. Download again to resume.':'No survey imagery downloaded. The core works without it.';
  $('#removeSurvey').disabled=!keys.length;$('#downloadSurvey').disabled=!registration;
 }
 $('#cancelSurvey').onclick=()=>controller?.abort();
 $('#removeSurvey').onclick=async()=>{await caches.delete(surveyCache);await refresh();};
 $('#downloadSurvey').onclick=async()=>{
  controller=new AbortController();const signal=controller.signal;$('#downloadSurvey').disabled=true;$('#removeSurvey').disabled=true;$('#cancelSurvey').hidden=false;$('#surveyProgress').hidden=false;
  const paths=['properties','Norder3/Allsky.jpg'];for(let order=0;order<=3;order++)for(let i=0;i<12*4**order;i++)paths.push(`Norder${order}/Dir${Math.floor(i/10000)*10000}/Npix${i}.jpg`);
  let done=0,bytes=0,index=0;const cache=await caches.open(surveyCache);
  try{
   for(const request of await cache.keys()){const response=await cache.match(request);bytes+=(await response.arrayBuffer()).byteLength;}
   await navigator.storage?.persist?.();
   const results=await Promise.allSettled(Array.from({length:4},async()=>{try{while(index<paths.length){signal.throwIfAborted();const url=SURVEY+paths[index++];if(!await cache.match(url)){
    const response=await fetch(url,{signal,mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('A survey tile could not be downloaded. Try again to resume.');
    const data=await response.arrayBuffer();signal.throwIfAborted();if(bytes+data.byteLength>LIMIT)throw Error('Reached the 80 MB limit. Partial imagery is retained; core offline mode is ready.');bytes+=data.byteLength;
    await cache.put(url,new Response(data,{headers:{'Content-Type':response.headers.get('Content-Type')||'image/jpeg'}}));
   }done++;$('#surveyProgress').value=done/paths.length*100;$('#surveyStatus').textContent=`Saving imagery: ${done}/${paths.length} files · ${(bytes/1048576).toFixed(1)} MB`;}}catch(error){controller.abort();throw error;}}));
   const failure=results.find(r=>r.status==='rejected'&&r.reason.name!=='AbortError')||results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
   await cache.put(new URL('survey-complete',base).href,new Response('complete'));$('#surveyStatus').textContent=`Survey overview ready offline · ${(bytes/1048576).toFixed(1)} MB`;
  }catch(error){controller.abort();$('#surveyStatus').textContent=error.name==='AbortError'?'Download paused. Saved tiles are retained; download again to resume.':error.message;}
  finally{controller=null;$('#downloadSurvey').disabled=false;$('#removeSurvey').disabled=false;$('#cancelSurvey').hidden=true;}
 };
 if(!('serviceWorker' in navigator)||!('caches' in window)){$('#coreStatus').textContent='Offline installation is unavailable in this browser.';return;}
 if(import.meta.env.DEV){$('#coreStatus').textContent='Offline saving is available in the production preview or published HTTPS site. This development page has live updates.';return;}
 try{
  registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname});
  await navigator.serviceWorker.ready;
  installUpdates(registration,dialog,()=>!!controller);
  $('#coreStatus').textContent='Core ready offline: planetarium, bundled stars, DSO catalogue and framing tools.';
  await refresh();
 }catch{registration=null;$('#coreStatus').textContent='Core download failed. Reconnect and reload to retry before going offline.';}
}
