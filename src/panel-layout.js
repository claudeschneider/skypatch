// Give each planning task a dedicated panel; keep existing controls and listeners.
export const panelModes=['explore','filters','info','framing','patch'];
export function arrangePanels(){
 const $=s=>document.querySelector(s),sidebar=$('#sidebar'),tabs=$('.tabs');
 tabs.innerHTML='<button id="exploreTab" class="active">Find</button><button id="filtersTab">Filters</button><button id="infoTab">Info</button><button id="framingTab">Frame</button><button id="patchTab">My sky</button>';
 const explore=$('#explorePanel'),filters=document.createElement('div');filters.id='filtersPanel';filters.hidden=true;
 while(explore.firstElementChild&&!explore.firstElementChild.classList.contains('result-heading'))filters.append(explore.firstElementChild);
 sidebar.insertBefore(filters,explore);
 explore.prepend($('.search-wrap'));
 const info=document.createElement('div');info.id='infoPanel';info.hidden=true;info.append($('#selection'));sidebar.insertBefore(info,$('#framingPanel'));
 const patch=$('.patch-controls');patch.id='patchPanel';patch.hidden=true;
 tabs.after(patch);tabs.after(explore);
}
