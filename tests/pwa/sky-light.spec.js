import {test,expect} from '@playwright/test';
test('Daylight follows planning time without enabling atmosphere or removing the sky catalogue',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.skyPatch);
 const sample=async date=>page.evaluate(date=>{skyPatch.state.lat=49.28;skyPatch.state.lon=-123.12;skyPatch.setTime(new Date(date),true);return {color:getComputedStyle(document.querySelector('#skyLight')).backgroundColor,count:skyPatch.objects.length,atmosphere:skyPatch.engine.stel.core.atmosphere.visible,phase:document.querySelector('#skyContext').textContent};},date);
 const night=await sample('2026-09-10T08:00:00Z'),day=await sample('2026-09-10T20:00:00Z');expect(night.color).toBe('rgb(0, 0, 0)');expect(day.color).not.toBe(night.color);expect(day.phase).toContain('Daytime');expect(day.count).toBe(night.count);expect(day.atmosphere).toBe(false);
 await expect(page.locator('#skyLight')).toHaveCSS('pointer-events','none');await expect(page.locator('#skyLight')).toHaveCSS('mix-blend-mode','screen');
});
