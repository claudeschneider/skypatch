import {test,expect} from '@playwright/test';
test('Task panels put search results and selected information first on desktop and mobile',async({page,context})=>{
 await page.addInitScript(()=>localStorage.setItem('skypatch-install-prompt-seen','true'));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/');await page.waitForFunction(()=>window.skyPatch);
  if(width===390)await page.locator('#sidebarToggle').click();
  await page.locator('#search').fill('M33');await expect(page.locator('[data-object="M33"]')).toBeInViewport();
  await page.locator('[data-object="M33"]').click();await expect(page.locator('#infoPanel')).toBeVisible();await expect(page.locator('#selection h1')).toBeInViewport();await expect(page.locator('.search-wrap')).toBeHidden();
  await page.locator('#framingTab').click();await expect(page.locator('#equipmentPreset')).toBeInViewport();await expect(page.locator('#selection')).toBeHidden();
  await page.locator('#patchTab').click();await expect(page.locator('#drawPatch')).toBeInViewport();
  await page.locator('#filtersTab').click();await expect(page.locator('#filtersEnabled')).toBeVisible();
 }
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.skyPatch);expect(await page.evaluate(()=>skyPatch.objects.length)).toBeGreaterThan(12000);
});
test('iOS gesture zoom is cancelled without disabling map pinch',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);
 expect(await page.evaluate(()=>{const event=new Event('gesturechange',{cancelable:true,bubbles:true});document.dispatchEvent(event);return event.defaultPrevented;})).toBe(true);
 expect(await page.locator('#sky').evaluate(el=>getComputedStyle(el).touchAction)).toBe('none');
});
