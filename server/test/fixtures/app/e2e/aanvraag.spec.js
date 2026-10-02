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

test('een ophaaldatum na de leverdatum laat de aanvraag door', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Naam' }).fill('An Peeters');
    await page.getByRole('textbox', { name: 'Leverdatum' }).fill('30.12.2030');
    await page.getByRole('textbox', { name: 'Ophaaldatum' }).fill('31.12.2030');
    await page.getByRole('button', { name: 'Vraag aan' }).click();
    await expect(page.getByText('Aanvraag ontvangen')).toBeVisible();
});

test('een ophaaldatum vóór de leverdatum houdt de aanvraag tegen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Naam' }).fill('An Peeters');
    await page.getByRole('textbox', { name: 'Leverdatum' }).fill('31.12.2030');
    await page.getByRole('textbox', { name: 'Ophaaldatum' }).fill('30.12.2030');
    await page.getByRole('button', { name: 'Vraag aan' }).click();
    await expect(page.getByText('Aanvraag ontvangen')).toBeHidden();
});

test('annuleren maakt het formulier leeg na bevestiging', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Naam' }).fill('An Peeters');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Annuleren' }).click();
    await expect(page.getByRole('textbox', { name: 'Naam' })).toHaveValue('');
});

test('zoeken op een onbekend aanvraagnummer meldt dat er geen aanvraag is', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Aanvraagnummer' }).fill('A-123');
    await page.getByRole('searchbox', { name: 'Aanvraagnummer' }).press('Enter');
    await expect(page.getByText('Geen aanvraag gevonden voor A-123.')).toBeVisible();
});
