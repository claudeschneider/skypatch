// Updates are downloaded in the background, but activated only with consent.
export function installUpdates(registration, dialog, isDownloading){
 const section=document.createElement('section');
 section.innerHTML='<h3>App updates</h3><p id="appVersion">Installed build: checking…</p><p id="updateStatus" role="status">Updates are checked when you open the app online.</p><div class="offline-actions"><button id="checkUpdates">Check for updates</button><button id="applyUpdate" hidden>Update now</button></div><p class="hint">Updating reloads the app. Saved preferences and downloaded survey imagery are kept.</p>';
 dialog.querySelector('#coreStatus').after(section);
 const banner=document.createElement('aside');banner.className='update-banner';banner.hidden=true;banner.setAttribute('aria-label','App update');
 banner.innerHTML='<span role="status">New version available</span><button>Update now</button><button aria-label="Dismiss update notification">Later</button>';
 document.body.append(banner);
 const status=section.querySelector('#updateStatus'),apply=section.querySelector('#applyUpdate'),check=section.querySelector('#checkUpdates');
 let requested=false,changed=false,hadController=!!navigator.serviceWorker.controller;
 async function version(){
  const worker=navigator.serviceWorker.controller||registration.active;
  if(!worker)return;
  const channel=new MessageChannel();
  const timer=setTimeout(()=>{channel.port1.close();section.querySelector('#appVersion').textContent='Installed build: version unavailable';},3000);
  channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();section.querySelector('#appVersion').textContent='Installed build: '+e.data.version;};
  worker.postMessage({type:'GET_VERSION'},[channel.port2]);
 }
 function available(){if(!registration.waiting)return;apply.hidden=false;banner.hidden=false;status.textContent='New version downloaded and ready to install.';}
 function watch(worker){if(!worker)return;status.textContent='Downloading the latest app…';worker.addEventListener('statechange',()=>{
  if(worker.state==='installed'){if(registration.waiting)available();else status.textContent='App is up to date.';}
  if(worker.state==='redundant')status.textContent='Update could not be downloaded. Try again when connected.';
 });}
 registration.addEventListener('updatefound',()=>watch(registration.installing));
 watch(registration.installing);available();version();
 check.onclick=async()=>{check.disabled=true;status.textContent='Checking for updates…';try{
  if(!navigator.onLine)throw Error('Offline');
  await registration.update();
  if(registration.waiting)available();else if(registration.installing)status.textContent='Downloading the latest app…';else status.textContent='App is up to date.';
 }catch{status.textContent='Could not check for updates. Connect to the internet and try again.';}finally{check.disabled=false;}};
 function update(){
  if(isDownloading()){status.textContent='Finish or cancel the survey download before updating.';if(!dialog.open)dialog.showModal();return;}
  if(changed){location.reload();return;}
  if(!registration.waiting){status.textContent='No update is ready yet. Check for updates to try again.';return;}
  requested=true;apply.disabled=true;banner.querySelector('button').disabled=true;status.textContent='Installing update…';registration.waiting.postMessage({type:'SKIP_WAITING'});
 }
 apply.onclick=update;banner.querySelector('button').onclick=update;banner.querySelectorAll('button')[1].onclick=()=>banner.hidden=true;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(!hadController){hadController=true;version();return;}
  if(requested){location.reload();return;}
  // Another tab may have activated the update. Let this tab reload when convenient.
  changed=true;apply.hidden=false;banner.hidden=false;status.textContent='An update was installed. Reload to use the new version.';banner.querySelector('span').textContent='Update ready — reload to use it';
 });
}
