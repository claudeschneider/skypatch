import {test,expect} from '@playwright/test';
const start=async page=>{await page.goto('/');await page.waitForFunction(()=>!!window.skyPatch);await page.evaluate(()=>skyPatch.setTime(new Date('2026-09-10T05:00Z'),true));};
test('Engine integration: arbitrary dates, locations, pan and zoom, projected target registration',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 expect(await page.evaluate(()=>skyPatch.objects.length)).toBeGreaterThan(12000);
 const check=await page.evaluate(()=>{const s=skyPatch,o=s.objects.find(o=>o.id==='M57');s.select(o,true);const r=document.querySelector('#sky').getBoundingClientRect(),p=s.engine.project(o.v,r.width,r.height,s.engine.matrix('VIEW'));return {p,w:r.width,h:r.height,fov:s.engine.fov};});
 expect(Math.abs(check.p[0]-check.w/2)).toBeLessThan(.1);expect(Math.abs(check.p[1]-check.h/2)).toBeLessThan(.1);expect(check.fov).toBeLessThan(4);
 await page.locator('#sky').focus();await page.keyboard.press('ArrowRight');const az1=await page.evaluate(()=>skyPatch.engine.stel.core.observer.yaw);await page.keyboard.press('ArrowRight');expect(await page.evaluate(()=>skyPatch.engine.stel.core.observer.yaw)).not.toBe(az1);
 await page.locator('#siteButton').click();await page.locator('#latitude').fill('-33.86');await page.locator('#longitude').fill('151.21');await page.locator('#locationName').fill('Sydney test');await page.getByRole('button',{name:'Save location'}).click();expect(await page.evaluate(()=>skyPatch.state.lat)).toBe(-33.86);
 await page.locator('#date').fill('2027-01-12T21:00');await page.locator('#date').blur();expect(await page.evaluate(()=>skyPatch.state.date.getFullYear())).toBe(2027);expect(errors).toEqual([]);
});
test('Filters, excluded search, mosaic preview and full-object bounds',async({page})=>{
 await start(page);await page.locator('#search').fill('M57');await page.locator('[data-object="M57"]').click();await expect(page.locator('#selection')).toContainText('19 pixels');await expect(page.locator('#selection')).toContainText('Excluded by: Angular size');await page.locator('#inspectFrame').click();
 await page.locator('#mx').selectOption('1.8');await page.locator('#my').selectOption('1.8');await expect(page.locator('#selection')).toContainText('3.852° × 2.160°');
 await page.locator('#search').fill('north america');await page.locator('[data-object="NGC7000"]').click();await page.locator('#inspectFrame').click();
 const bounds=await page.evaluate(()=>{const s=skyPatch,r=document.querySelector('#sky').getBoundingClientRect(),m=s.engine.matrix('VIEW');return s.state.selected.extent.map(v=>s.engine.project(v,r.width,r.height,m)).every(p=>p&&p[0]>=0&&p[0]<=r.width&&p[1]>=0&&p[1]<=r.height);});expect(bounds).toBe(true);
 await page.locator('#search').fill('');await page.locator('#sizeMin').fill('99999');await page.locator('#sizeMin').blur();await page.locator('#unknown').uncheck();await page.locator('#showSolar').uncheck();await expect(page.locator('#results')).toContainText('No objects pass');await page.locator('#relax').click();expect(await page.evaluate(()=>skyPatch.filtered.length)).toBeGreaterThan(1000);
});
test('Location and equipment persist, mobile map remains accessible',async({page})=>{
 await start(page);await page.locator('#framingTab').click();await page.locator('#mx').selectOption('1.8');await page.reload();await page.waitForFunction(()=>!!window.skyPatch);expect(await page.evaluate(()=>skyPatch.state.equipment.mx)).toBe(1.8);
 await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForFunction(()=>!!window.skyPatch);await expect(page.locator('#sidebar')).not.toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.locator('#sidebarToggle').click();await expect(page.locator('#search')).toBeVisible();
});
test('Survey failure is explicit and does not break framing',async({page})=>{
 await page.route('**/hips2fits?**',route=>route.abort());await start(page);await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M51'),true));await expect(page.locator('#photoState')).toContainText('Survey unavailable');expect(await page.evaluate(()=>skyPatch.engine.fov)).toBeLessThan(4);
});
test('Horizontal positions agree with independent astronomy calculations across sites and epochs',async({page})=>{
 const A=await import('astronomy-engine');await start(page);
 for(const scenario of [{lat:49.28,lon:-123.12,date:'2026-09-10T05:00Z'},{lat:-33.86,lon:151.21,date:'2027-01-12T10:00Z'},{lat:64,lon:-21,date:'2028-06-21T00:00Z'}]){
  const rows=await page.evaluate(s=>{const a=skyPatch;a.state.lat=s.lat;a.state.lon=s.lon;a.setTime(new Date(s.date),true);return ['M57','M51','M101','NGC7000','NGC6888'].map(id=>{const o=a.objects.find(o=>o.id===id);return {v:o.v,...a.engine.horizontal(o.v)};});},scenario);
  const d=new Date(scenario.date),r=A.Rotation_EQJ_HOR(d,new A.Observer(scenario.lat,scenario.lon,0));
  for(const row of rows){const h=A.HorizonFromVector(A.RotateVector(r,new A.Vector(...row.v,d)),'');expect(Math.abs(row.alt-h.lat)).toBeLessThan(.02);expect(Math.abs(((row.az-h.lon+540)%360)-180)).toBeLessThan(.05);}
 }
});
test('Centred frame follows panning; Alt-Az stays level and EQ follows celestial north',async({page})=>{
 await start(page);
 const result=await page.evaluate(async()=>{
  const G=await import('/src/geometry.js'),s=skyPatch,e=s.engine;
  const measure=mode=>{const f=e.framing(mode),r=document.querySelector('#sky').getBoundingClientRect(),m=e.matrix('VIEW'),pts=G.footprint(f.ra,f.dec,2.14,1.2,f.angle).map(v=>e.project(v,r.width,r.height,null));const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return {ra:f.ra,dec:f.dec,angle:f.angle,cx:(Math.max(...xs)+Math.min(...xs))/2-r.width/2,cy:(Math.max(...ys)+Math.min(...ys))/2-r.height/2,edge:Math.abs(pts[0][1]-pts[12][1])};};
  e.zoom(5);e.direction(120,45);const first=measure('altaz');e.direction(125,47);const second=measure('altaz'),eq=measure('eq');return {first,second,eq};
 });
 expect(Math.abs(result.first.cx)).toBeLessThan(.1);expect(Math.abs(result.first.cy)).toBeLessThan(.1);expect(Math.abs(result.second.cx)).toBeLessThan(.1);expect(result.first.edge).toBeLessThan(.1);expect(result.second.edge).toBeLessThan(.1);expect(result.eq.edge).toBeGreaterThan(5);expect(result.first.ra).not.toBe(result.second.ra);
 await page.locator('#framingTab').click();await page.locator('#eqMode').click();await expect(page.locator('#eqMode')).toHaveAttribute('aria-pressed','true');
 const before=await page.evaluate(()=>skyPatch.engine.framing('eq'));await page.locator('#mx').selectOption('1.8');const after=await page.evaluate(()=>skyPatch.engine.framing('eq'));expect(after.ra).toBeCloseTo(before.ra,6);expect(after.dec).toBeCloseTo(before.dec,6);
 await page.reload();await page.waitForFunction(()=>!!window.skyPatch);expect(await page.evaluate(()=>skyPatch.state.mountMode)).toBe('eq');
});
test('Outlines toggle independently from discovery markers and camera footprints',async({page})=>{
 await start(page);await page.evaluate(()=>{skyPatch.select(skyPatch.objects.find(o=>o.id==='NGC7000'),true);const ctx=document.querySelector('#overlay').getContext('2d');const begin=ctx.beginPath.bind(ctx),line=ctx.lineTo.bind(ctx),stroke=ctx.stroke.bind(ctx);let count=0;window.recordedStrokes=[];ctx.beginPath=()=>{count=0;begin();};ctx.lineTo=(...a)=>{count++;line(...a);};ctx.stroke=(...a)=>{if(count>10)window.recordedStrokes.push(ctx.strokeStyle);stroke(...a);};});
 await expect.poll(()=>page.evaluate(()=>window.recordedStrokes.includes('#f0aece'))).toBe(true);
 await page.locator('#outlineToggle').click();await page.evaluate(()=>window.recordedStrokes=[]);await expect.poll(()=>page.evaluate(()=>window.recordedStrokes.includes('#a2f0d4'))).toBe(true);expect(await page.evaluate(()=>window.recordedStrokes.includes('#f0aece'))).toBe(false);
 await page.locator('#thumbnails').click();expect(await page.evaluate(()=>skyPatch.state.showOutlines)).toBe(false);await page.reload();await page.waitForFunction(()=>!!window.skyPatch);await expect(page.locator('#outlineToggle')).toHaveAttribute('aria-pressed','false');
});
test('Solar bodies have physical disc sizes and update with observer time',async({page})=>{
 await start(page);
 const initial=await page.evaluate(()=>Object.fromEntries(skyPatch.objects.filter(o=>o.solar).map(o=>[o.id,{ra:o.ra,diam:o.major,pixels:o.major/60/2.14*1920}])));
 expect(Object.keys(initial)).toHaveLength(9);expect(initial.Sun.diam).toBeGreaterThan(30);expect(initial.Sun.diam).toBeLessThan(33);expect(initial.Moon.diam).toBeGreaterThan(28);expect(initial.Moon.diam).toBeLessThan(35);expect(initial.Jupiter.pixels).toBeLessThan(14);expect(initial.Mars.pixels).toBeLessThan(7);
 await page.locator('#solarShortcuts').getByRole('button',{name:'Moon',exact:true}).click();await expect(page.locator('#selection')).toContainText('Disc diameter');await expect(page.locator('#targetPhoto')).toHaveCount(0);
 const measurement=await page.evaluate(async()=>{const G=await import('/src/geometry.js'),s=skyPatch,o=s.state.selected,e=s.engine,r=document.querySelector('#sky').getBoundingClientRect(),m=e.matrix('VIEW');const xy=o.extent.map(v=>e.project(v,r.width,r.height,null));return {diameter:2*Math.max(...o.extent.map(v=>G.separation(o.v,v)))*60,expected:o.major,finite:xy.every(p=>p&&p.every(Number.isFinite))};});expect(measurement.finite).toBe(true);expect(measurement.diameter).toBeCloseTo(measurement.expected,4);
 await page.evaluate(()=>skyPatch.setTime(new Date('2026-09-24T05:00Z'),true));expect(await page.evaluate(()=>skyPatch.state.selected.ra)).not.toBe(initial.Moon.ra);expect(await page.evaluate(()=>skyPatch.state.selected.major)).not.toBe(initial.Moon.diam);
 await page.locator('#search').fill('Sun');await page.locator('[data-object="Sun"]').click();await expect(page.locator('#selection')).toContainText('solar filter');
});
test('Solar layer is independent of DSO size filters but respects horizon and visibility toggle',async({page})=>{
 await start(page);await page.evaluate(()=>{skyPatch.state.filters={...skyPatch.state.filters,above:false,altMin:-90,sizeMin:99999,unknown:false};skyPatch.recompute();});expect(await page.evaluate(()=>skyPatch.filtered.filter(o=>o.solar).length)).toBe(9);
 await page.locator('#showSolar').uncheck();expect(await page.evaluate(()=>skyPatch.filtered.filter(o=>o.solar).length)).toBe(0);
 await page.reload();await page.waitForFunction(()=>window.skyPatch);await expect(page.locator('#showSolar')).not.toBeChecked();
});

test('Wheel and trackpad zoom preserve the centred target with an off-centre cursor',async({page})=>{
 await start(page);await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M57'),true));
 const before=await page.evaluate(()=>({fov:skyPatch.engine.fov,yaw:skyPatch.engine.stel.core.observer.yaw,pitch:skyPatch.engine.stel.core.observer.pitch}));
 const rect=await page.locator('#sky').boundingBox();await page.mouse.move(rect.x+rect.width*.85,rect.y+rect.height*.25);
 await page.mouse.wheel(0,-240);await expect.poll(()=>page.evaluate(()=>skyPatch.engine.fov)).toBeLessThan(before.fov);
 await page.mouse.wheel(0,480);await expect.poll(()=>page.evaluate(()=>skyPatch.engine.fov)).toBeGreaterThan(before.fov);
 const after=await page.evaluate(()=>{const e=skyPatch.engine,r=document.querySelector('#sky').getBoundingClientRect(),p=e.project(skyPatch.state.selected.v,r.width,r.height,null);return {yaw:e.stel.core.observer.yaw,pitch:e.stel.core.observer.pitch,dx:p[0]-r.width/2,dy:p[1]-r.height/2};});
 expect(after.yaw).toBeCloseTo(before.yaw,10);expect(after.pitch).toBeCloseTo(before.pitch,10);expect(Math.abs(after.dx)).toBeLessThan(.1);expect(Math.abs(after.dy)).toBeLessThan(.1);
 const legacy=await page.evaluate(()=>{const e=skyPatch.engine,fov=e.fov;document.querySelector('#sky').dispatchEvent(new WheelEvent('mousewheel',{bubbles:true,cancelable:true,deltaY:-120}));return {before:fov,after:e.fov};});expect(legacy.after).toBe(legacy.before);
});
test('Ground is opaque below the horizon, independent of the grid, and persists',async({page})=>{
 await start(page);await expect(page.locator('#ground')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{skyPatch.engine.direction(180,0);skyPatch.engine.zoom(60);});
 const pixel=()=>page.evaluate(()=>{const c=document.querySelector('#overlay'),r=c.getBoundingClientRect(),d=c.width/r.width;return [...c.getContext('2d').getImageData(Math.floor(r.width*.2*d),Math.floor(r.height*.85*d),1,1).data];});
 await expect.poll(pixel).toEqual([16,27,32,255]);
 await page.locator('#grid').click();await expect.poll(pixel).toEqual([16,27,32,255]);
 await page.locator('#ground').click();await expect(page.locator('#ground')).toHaveAttribute('aria-pressed','false');await expect.poll(pixel).not.toEqual([16,27,32,255]);
 await page.reload();await page.waitForFunction(()=>window.skyPatch);await expect(page.locator('#ground')).toHaveAttribute('aria-pressed','false');
});
test('Ground draws cardinal letters after its mask with grid both off and on',async({page})=>{
 await start(page);
 await page.evaluate(()=>{const s=skyPatch;s.engine.direction(180,0);s.engine.zoom(60);const ctx=document.querySelector('#overlay').getContext('2d'),fill=ctx.fill.bind(ctx),text=ctx.fillText.bind(ctx);window.compassDraws=[];let groundDrawn=false;ctx.fill=(...args)=>{if(ctx.fillStyle==='#101b20')groundDrawn=true;fill(...args);};ctx.fillText=(label,...args)=>{if(label==='S')window.compassDraws.push({groundDrawn,grid:skyPatch.state.grid});text(label,...args);};});
 await expect.poll(()=>page.evaluate(()=>window.compassDraws.some(d=>d.groundDrawn&&!d.grid))).toBe(true);
 await page.locator('#grid').click();await expect.poll(()=>page.evaluate(()=>window.compassDraws.some(d=>d.groundDrawn&&d.grid))).toBe(true);
});

test('Object information resolves Wikipedia redirects safely and offers catalogue references',async({page})=>{
 await page.route('https://en.wikipedia.org/w/api.php?**',route=>route.fulfill({json:{query:{pages:[{title:'Ring Nebula',extract:'The Ring Nebula is a planetary nebula.\n\n<img src=x onerror=alert(1)>',pageprops:{}}]}}}));
 await start(page);await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M57')));
 await page.getByLabel('Object information sources').click();
 await expect(page.getByRole('link',{name:'SIMBAD'})).toHaveAttribute('href',/Ident=NGC\+6720/);
 await expect(page.getByRole('link',{name:'ESA/Hubble'})).toHaveAttribute('href',/search=NGC\+6720/);
 await page.getByRole('button',{name:'Wikipedia'}).click();
 await expect(page.locator('#objectInfoDialog')).toBeVisible();await expect(page.locator('#objectInfoTitle')).toHaveText('Ring Nebula');
 await expect(page.locator('#objectInfoText img')).toHaveCount(0);await expect(page.locator('#objectInfoText')).toContainText('<img');
 await expect(page.locator('#objectInfoArticle')).toHaveAttribute('href','https://en.wikipedia.org/wiki/Ring_Nebula');
 await page.keyboard.press('Escape');await expect(page.locator('#objectInfoDialog')).not.toBeVisible();await expect(page.getByLabel('Object information sources')).toBeFocused();
 await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='Mars')));await page.getByLabel('Object information sources').click();await expect(page.getByRole('link',{name:'SIMBAD'})).toHaveCount(0);
});
test('Object information handles missing articles and network errors on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('https://en.wikipedia.org/w/api.php?**',route=>route.fulfill({json:{query:{pages:[{title:'Missing',missing:true}]}}}));
 await start(page);await page.locator('#sidebarToggle').click();await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='NGC7000')));
 await page.getByLabel('Object information sources').click();await page.getByRole('button',{name:'Wikipedia'}).click();
 await expect(page.locator('#objectInfoStatus')).toContainText('No exact Wikipedia');await expect(page.locator('#objectInfoArticle')).toBeHidden();
 expect(await page.locator('#objectInfoDialog').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.getByLabel('Close object information').click();await page.unroute('https://en.wikipedia.org/w/api.php?**');await page.route('https://en.wikipedia.org/w/api.php?**',route=>route.abort());
 await page.getByLabel('Object information sources').click();await page.getByRole('button',{name:'Wikipedia'}).click();await expect(page.locator('#objectInfoStatus')).toContainText('could not be loaded');await expect(page.locator('#objectInfoArticle')).toBeVisible();
});
test('Filter switches pause and restore values, individual choices and solar altitude filtering',async({page})=>{
 await start(page);
 await page.locator('#sizeMin').fill('30');await page.locator('#sizeMin').blur();
 await page.locator('#sizeEnabled').uncheck();await expect(page.locator('#sizeMin')).toBeDisabled();
 const prior=await page.evaluate(()=>skyPatch.filtered.map(o=>o.id));
 await page.locator('#filtersEnabled').uncheck();
 expect(await page.evaluate(()=>skyPatch.filtered.length===skyPatch.objects.length)).toBe(true);
 await expect(page.locator('#altMin')).toBeDisabled();await expect(page.locator('#sizeMin')).toHaveValue('30');
 await page.locator('#filtersEnabled').check();await expect(page.locator('#sizeEnabled')).not.toBeChecked();await expect(page.locator('#altMin')).toBeEnabled();
 expect(await page.evaluate(()=>skyPatch.filtered.map(o=>o.id))).toEqual(prior);
 await page.locator('#sizeEnabled').check();await expect(page.locator('#sizeMin')).toHaveValue('30');
 await page.locator('#altEnabled').uncheck();expect(await page.evaluate(()=>skyPatch.filtered.filter(o=>o.solar).length)).toBe(9);
 await page.locator('#filtersEnabled').uncheck();await page.reload();await page.waitForFunction(()=>!!window.skyPatch);
 await expect(page.locator('#filtersEnabled')).not.toBeChecked();await expect(page.locator('#altEnabled')).not.toBeChecked();await expect(page.locator('#sizeMin')).toHaveValue('30');
 await page.locator('#filtersEnabled').check();await expect(page.locator('#altMin')).toBeDisabled();await expect(page.locator('#sizeMin')).toBeEnabled();
});

test('Visible sky polygon drawing, horizon anchoring, pause and persistence',async({page})=>{
 await start(page);await page.locator('#drawPatch').click();const r=await page.locator('#overlay').boundingBox();
 for(const [x,y] of [[.3,.3],[.7,.3],[.7,.6],[.3,.6]])await page.mouse.click(r.x+r.width*x,r.y+r.height*y);
 await page.locator('#finishPatch').click();await expect(page.locator('#patchEnabled')).toBeChecked();
 const vertices=await page.evaluate(()=>skyPatch.state.patch.vertices);
 const before=await page.evaluate(()=>skyPatch.objects.filter(o=>o.reasons.includes('Outside sky patch')).map(o=>o.id));expect(before.length).toBeGreaterThan(0);expect(before.length).toBeLessThan(12000);
 await page.evaluate(()=>skyPatch.setTime(new Date(+skyPatch.state.date+6*3600000),true));
 expect(await page.evaluate(()=>skyPatch.state.patch.vertices)).toEqual(vertices);
 expect(await page.evaluate(()=>skyPatch.objects.filter(o=>o.reasons.includes('Outside sky patch')).map(o=>o.id))).not.toEqual(before);
 await page.locator('#patchEnabled').uncheck();expect(await page.evaluate(()=>skyPatch.objects.some(o=>o.reasons.includes('Outside sky patch')))).toBe(false);
 await page.locator('#patchEnabled').check();await page.locator('#filtersEnabled').uncheck();expect(await page.evaluate(()=>skyPatch.objects.some(o=>o.reasons.includes('Outside sky patch')))).toBe(false);
 await page.locator('#filtersEnabled').check();await page.locator('#drawPatch').click();await page.locator('#cancelPatch').click();expect(await page.evaluate(()=>skyPatch.state.patch.vertices)).toEqual(vertices);
 await page.reload();await page.waitForFunction(()=>!!window.skyPatch);await expect(page.locator('#patchEnabled')).toBeChecked();expect(await page.evaluate(()=>skyPatch.state.patch.vertices)).toEqual(vertices);
 await page.locator('#clearPatch').click();await expect(page.locator('#patchEnabled')).toBeDisabled();
});

test('Mobile bottom drawer, compact toolbar and centred touch pinch',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await start(page);
 await expect(page.locator('.map-toolbar')).not.toBeVisible();await page.locator('#viewMenu').tap();await expect(page.locator('#grid')).toBeVisible();await page.locator('#viewMenu').tap();
 const client=await context.newCDPSession(page),touch=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
 const before=await page.evaluate(()=>({fov:skyPatch.engine.fov,yaw:skyPatch.engine.stel.core.observer.yaw}));
 await touch('touchStart',[[100,260],[250,260]]);await touch('touchMove',[[60,260],[290,260]]);await touch('touchEnd',[]);
 expect(await page.evaluate(()=>skyPatch.engine.fov)).toBeLessThan(before.fov);expect(await page.evaluate(()=>skyPatch.engine.stel.core.observer.yaw)).toBeCloseTo(before.yaw,8);
 await touch('touchStart',[[120,280]]);await touch('touchMove',[[200,290]]);await touch('touchEnd',[]);expect(await page.evaluate(()=>skyPatch.engine.stel.core.observer.yaw)).not.toBe(before.yaw);
 await page.locator('#sidebarToggle').tap();const box=await page.locator('#sidebar').boundingBox();expect(box.width).toBe(390);expect(box.y).toBeGreaterThan(200);
 const handle=await page.locator('#drawerHandle').boundingBox();await touch('touchStart',[[180,handle.y+20]]);await touch('touchMove',[[180,handle.y-50]]);await touch('touchEnd',[]);await expect(page.locator('#sidebar')).toHaveClass('expanded');
 await page.locator('#drawerHandle').tap();await expect(page.locator('#sidebar')).not.toBeVisible();await context.close();
});
