import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
test('Two releases update on consent and preserve preferences and survey imagery',async({page,context})=>{
 let release='release-one';
 const types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.html':'text/html'};
 const server=createServer(async(req,res)=>{try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  let data=await readFile(resolve('dist','.'+(pathname==='/'?'/index.html':pathname)));
  if(pathname==='/sw.js')data=Buffer.from(data.toString().replace(/const VERSION="[^"]+"/,`const VERSION="${release}"`).replace(/pathname\+'-[a-f0-9]+'/ ,`pathname+'-${release}'`));
  res.writeHead(200,{'Content-Type':types[extname(pathname==='/'?'/index.html':pathname)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.skyPatch&&navigator.serviceWorker.controller);
  await page.locator('.offline-entry').click();await expect(page.locator('#appVersion')).toContainText('release-one');await expect(page.locator('.update-banner')).toBeHidden();
  await page.locator('#checkUpdates').click();await expect(page.locator('#updateStatus')).toHaveText('App is up to date.');
  await page.evaluate(async()=>{localStorage.setItem('update-test','retained');const c=await caches.open('skypatch-survey-v1-/');await c.put('/saved-tile',new Response('retained-image'));});
  release='release-two';await page.locator('#checkUpdates').click();await expect(page.locator('#applyUpdate')).toBeVisible();await expect(page.locator('#updateStatus')).toContainText('ready to install');await expect(page.locator('#appVersion')).toContainText('release-one');
  await page.locator('#closeOffline').click();await page.getByRole('button',{name:'Dismiss update notification'}).click();await expect(page.locator('.update-banner')).toBeHidden();
  await page.locator('.offline-entry').click();await page.locator('#applyUpdate').click();await page.waitForFunction(()=>window.skyPatch);await page.locator('.offline-entry').click();await expect(page.locator('#appVersion')).toContainText('release-two');
  expect(await page.evaluate(()=>localStorage.getItem('update-test'))).toBe('retained');
  expect(await page.evaluate(async()=>await(await(await caches.open('skypatch-survey-v1-/')).match('/saved-tile')).text())).toBe('retained-image');
  await context.setOffline(true);await page.locator('#checkUpdates').click();await expect(page.locator('#updateStatus')).toContainText('Could not check');
 }finally{await context.setOffline(false);await new Promise(r=>server.close(r));}
});
