import { expect, test } from '@playwright/test';

test('de pagina toont de titel van de toepassing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('vl-functional-header').getByText('Containeraanvraag')).toBeVisible();
});

test('een aanvraag toont de bevestiging en de samenvatting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Naam' }).fill('An Peeters');
    await page.getByRole('textbox', { name: 'Leverdatum' }).fill('31.12.2030');
    await page.getByRole('button', { name: 'Vraag aan' }).click();
    await expect(page.getByText('Aanvraag ontvangen')).toBeVisible();
    await expect(page.locator('#samenvatting')).toContainText('An Peeters');
    await expect(page.locator('#samenvatting')).toContainText('2030-12-31');
});

test('de header is te vinden op zijn titel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('vl-functional-header[title="Containeraanvraag"]')).toBeVisible();
});
