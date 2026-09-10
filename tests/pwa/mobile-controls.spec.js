import {test,expect} from '@playwright/test';
test.use({viewport:{width:390,height:844}});
test('Mobile time visibility persists and installation prompt dismisses without returning',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);
 await expect(page.locator('#appStatus')).toBeVisible();await expect(page.locator('.install-nudge')).toBeVisible({timeout:10000});
 await page.getByRole('button',{name:'Not now',exact:true}).click();await expect(page.locator('.install-nudge')).toBeHidden();
 const height=await page.locator('#sky').evaluate(e=>e.clientHeight);
 await page.locator('#timeToggle').click();await expect(page.locator('#planningTime')).toBeHidden();expect(await page.locator('#sky').evaluate(e=>e.clientHeight)).toBeGreaterThan(height);
 await page.reload();await page.waitForFunction(()=>window.skyPatch);await expect(page.locator('#planningTime')).toBeHidden();await expect(page.locator('#timeToggle')).toHaveText('Show time');
 await page.locator('#timeToggle').click();await expect(page.locator('#planningTime')).toBeVisible();
 await page.locator('#appStatus').click();await expect(page.locator('.offline-dialog')).toBeVisible();await page.locator('#closeOffline').click();
 await page.waitForTimeout(4200);await expect(page.locator('.install-nudge')).toBeHidden();
 await page.setViewportSize({width:320,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
});
test('Installed mobile app hides install promotion',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);await page.waitForTimeout(4500);
 await expect(page.locator('#appStatus')).toHaveText('✓ App');await expect(page.locator('.install-nudge')).toBeHidden();
});
