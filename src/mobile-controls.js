export function installTimeToggle(){
 const button=document.createElement('button');button.id='timeToggle';button.setAttribute('aria-controls','planningTime');
 document.querySelector('.map').append(button);
 let hidden=false;try{hidden=localStorage.getItem('skypatch-time-hidden')==='true';}catch{}
 const render=()=>{document.body.classList.toggle('mobile-time-hidden',hidden);button.textContent=hidden?'Show time':'Hide time';button.setAttribute('aria-expanded',String(!hidden));};
 button.onclick=()=>{hidden=!hidden;try{localStorage.setItem('skypatch-time-hidden',String(hidden));}catch{}render();};render();
}
export function installMobilePrompt(open){
 const mobile=matchMedia('(max-width:650px)'),standalone=matchMedia('(display-mode: standalone)'),fullscreen=matchMedia('(display-mode: fullscreen)');
 let installed=!!navigator.standalone||standalone.matches||fullscreen.matches;
 const button=document.createElement('button');button.id='mobileInstall';button.textContent='Install';document.querySelector('.header-actions').prepend(button);
 const prompt=document.createElement('aside');prompt.className='install-nudge';prompt.hidden=true;prompt.setAttribute('aria-label','Install Sky Patch');
 prompt.innerHTML='<p><strong>Take Sky Patch offline</strong><br>Add it to your home screen for observing away from a connection.</p><div><button class="install-start">Install / offline setup</button><button class="install-dismiss">Not now</button></div>';
 document.body.append(prompt);
 const dismiss=()=>{prompt.hidden=true;try{localStorage.setItem('skypatch-install-prompt-seen','true');}catch{}};
 button.onclick=()=>{dismiss();open();};prompt.querySelector('.install-start').onclick=button.onclick;prompt.querySelector('.install-dismiss').onclick=dismiss;
 const sync=()=>{installed=installed||!!navigator.standalone||standalone.matches||fullscreen.matches;button.hidden=installed;if(installed||!mobile.matches)prompt.hidden=true;};
 for(const query of [mobile,standalone,fullscreen])query.addEventListener('change',sync);
 window.addEventListener('appinstalled',()=>{installed=true;sync();dismiss();});sync();
 if(!import.meta.env.DEV)setTimeout(()=>{
  let seen=false;try{seen=localStorage.getItem('skypatch-install-prompt-seen')==='true';}catch{}
  if(!installed&&mobile.matches&&!seen&&!document.querySelector('dialog[open]')){prompt.hidden=false;try{localStorage.setItem('skypatch-install-prompt-seen','true');}catch{}}
 },4000);
}
