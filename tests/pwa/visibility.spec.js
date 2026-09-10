import {test,expect} from '@playwright/test';
test('Visibility charts work offline and preview another time',async({page,context})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M33')));await expect(page.locator('.visibility-panel svg')).toBeVisible();await expect(page.locator('.horizon-windows')).not.toHaveText('');
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.skyPatch);await page.evaluate(()=>skyPatch.select(skyPatch.objects.find(o=>o.id==='M33')));await expect(page.locator('.visibility-panel svg')).toBeVisible();
 const old=await page.evaluate(()=>+skyPatch.state.date);await page.locator('.visibility-time').evaluate(el=>{el.value=+el.min+6*3600000;el.dispatchEvent(new Event('change'));});expect(await page.evaluate(()=>+skyPatch.state.date)).not.toBe(old);
});
