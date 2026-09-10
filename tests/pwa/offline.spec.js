import {test,expect} from '@playwright/test';
test('Core cache boots offline, handles versioned sky assets and excludes source archives',async({page,context})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const manifest=await page.evaluate(async()=>{const r=await fetch('manifest.webmanifest');return r.json();});expect(manifest.display).toBe('standalone');
 const keys=await page.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.startsWith('skypatch-core-'));return (await(await caches.open(name)).keys()).map(r=>r.url);});expect(keys.some(k=>k.includes('/data/catalogue.json'))).toBe(true);expect(keys.some(k=>k.includes('/source/'))).toBe(false);
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.skyPatch);expect(await page.evaluate(()=>skyPatch.objects.length)).toBeGreaterThan(12000);
 expect(await page.evaluate(async()=>(await fetch('skydata/surveys/milkyway/Norder0/Allsky.webp?v=123')).ok)).toBe(true);
 await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M33')));await expect(page.locator('.object-description')).toContainText('Triangulum');
 await page.locator('.offline-entry').click();await expect(page.locator('#coreStatus')).toContainText('Core ready offline');await expect(page.locator('#surveyStatus')).toContainText('No survey imagery');
});
test('Optional survey cancellation and removal preserve the core',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);await page.locator('.offline-entry').click();
 await page.locator('#downloadSurvey').click();await page.locator('#cancelSurvey').click();await expect(page.locator('#cancelSurvey')).toBeHidden();await expect(page.locator('#surveyStatus')).toContainText('paused');
 await page.locator('#removeSurvey').click();await expect(page.locator('#surveyStatus')).toContainText('No survey imagery');await expect(page.locator('#coreStatus')).toContainText('Core ready offline');
});
