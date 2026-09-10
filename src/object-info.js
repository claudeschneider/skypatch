// Catalogue identifiers avoid ambiguous common-name matches.
export function referenceIdentity(o){
 const normalise=s=>String(s||'').replace(/^(NGC|IC|M)\s*0*(\d+)(.*)$/i,(_,cat,n,suffix)=>`${cat.toUpperCase()} ${Number(n)}${suffix}`);
 const id=normalise(o.id),ngc=normalise(o.ngc);
 const title=o.solar?(['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'].includes(o.name)?`${o.name} (planet)`:o.name):/^M \d+$/.test(id)?id.replace('M ','Messier '):ngc||id;
 return {title,identifier:ngc||id};
}
export function referenceSources(o){
 const {title,identifier}=referenceIdentity(o);
 const sources=[{label:'Wikipedia',description:'Read an overview here',url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),reader:true}];
 if(!o.solar)sources.push(
  {label:'SIMBAD',description:'Measurements, identifiers & papers ↗',url:'https://simbad.cds.unistra.fr/simbad/sim-id?'+new URLSearchParams({Ident:identifier})},
  {label:'ESA/Hubble',description:'Search images & captions ↗',url:'https://esahubble.org/images/?'+new URLSearchParams({search:identifier})}
 );
 return sources;
}
export function installObjectInfo(selection){
 const dialog=document.createElement('dialog');dialog.id='objectInfoDialog';dialog.className='object-info-dialog';dialog.setAttribute('aria-labelledby','objectInfoTitle');
 dialog.innerHTML=`<div class="info-heading"><div><span class="eyebrow">WIKIPEDIA · OVERVIEW</span><h2 id="objectInfoTitle"></h2></div><button type="button" class="info-close" aria-label="Close object information" autofocus>✕</button></div><p id="objectInfoStatus" role="status"></p><div id="objectInfoText"></div><div class="info-footer"><a id="objectInfoArticle" target="_blank" rel="noopener noreferrer">Read full article ↗</a><a id="objectInfoSearch" target="_blank" rel="noopener noreferrer">Search Wikipedia ↗</a><p class="hint">Text by Wikipedia contributors, under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. The full article includes references and edit history. External reference values may differ from the planning catalogue.</p></div>`;
 document.body.append(dialog);
 const title=dialog.querySelector('h2'),status=dialog.querySelector('#objectInfoStatus'),body=dialog.querySelector('#objectInfoText'),article=dialog.querySelector('#objectInfoArticle'),search=dialog.querySelector('#objectInfoSearch');
 let controller=null,request=0;
 dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{request++;controller?.abort();selection.querySelector('.object-info-menu summary')?.focus();});
 async function open(o){
  controller?.abort();controller=new AbortController();const signal=controller.signal,version=++request;
  const identity=referenceIdentity(o);title.textContent=o.name;body.replaceChildren();status.textContent='Loading Wikipedia…';body.setAttribute('aria-busy','true');
  article.href=referenceSources(o)[0].url;article.hidden=false;
  search.href='https://en.wikipedia.org/w/index.php?'+new URLSearchParams({search:identity.title});
  if(!dialog.open)dialog.showModal();
  const timeout=setTimeout(()=>controller?.signal===signal&&controller.abort(),12000);
  try{
   const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',origin:'*',redirects:'1',prop:'extracts|pageprops',exintro:'1',explaintext:'1',titles:identity.title});
   const response=await fetch('https://en.wikipedia.org/w/api.php?'+params,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
   if(!response.ok)throw new Error('Unavailable');
   const data=await response.json();if(version!==request||!dialog.open)return;
   const page=data.query?.pages?.[0];
   if(!page||page.missing||page.invalid||page.pageprops?.disambiguation!==undefined||!page.extract){
    status.textContent='No exact Wikipedia overview was found for this catalogue entry. Try the search link below or SIMBAD in the information menu.';article.hidden=true;return;
   }
   title.textContent=page.title;article.href='https://en.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_'));
   for(const text of page.extract.split(/\n\s*\n/)){const paragraph=document.createElement('p');paragraph.textContent=text;body.append(paragraph);}
   status.textContent='';
  }catch{
   if(version===request&&dialog.open)status.textContent='Wikipedia could not be loaded. You can still open the full article or search below.';
  }finally{clearTimeout(timeout);if(version===request)body.setAttribute('aria-busy','false');}
 }
 return function attach(o){
  const heading=selection.querySelector('h1');if(!heading)return;
  const row=document.createElement('div');row.className='object-title';heading.before(row);row.append(heading);
  const menu=document.createElement('details');menu.className='object-info-menu';
  const summary=document.createElement('summary');summary.setAttribute('aria-label','Object information sources');summary.title='Object information sources';summary.textContent='ⓘ';menu.append(summary);
  const links=document.createElement('div');links.className='object-info-links';
  for(const source of referenceSources(o)){
   const item=document.createElement(source.reader?'button':'a');
   if(source.reader){item.type='button';item.onclick=()=>{menu.open=false;open(o);};}
   else{item.href=source.url;item.target='_blank';item.rel='noopener noreferrer';item.onclick=()=>{menu.open=false;};}
   const label=document.createElement('strong'),description=document.createElement('small');label.textContent=source.label;description.textContent=source.description;item.append(label,description);links.append(item);
  }
  menu.append(links);row.append(menu);
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();menu.open=false;summary.focus();}});
 };
}
