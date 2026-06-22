import { test, expect, type Page } from '@playwright/test';

// Headless smoke test against the real production build: profile creation →
// map → topic → Listen & Tap → finish the round → RoundComplete with stars.
// The round content/options are randomized, so each question is answered by
// trying pic-cards in order until the progress indicator advances (a wrong
// tap just flashes red and stays put) rather than predicting the right one.

async function isRoundComplete(page: Page) {
  return page.getByText(/Hienoa|Great job/i).isVisible().catch(() => false);
}

async function answerUntilAdvance(page: Page) {
  const header = page.getByLabel(/Question \d+ of \d+/);
  const before = await header.getAttribute('aria-label');

  for (let attempt = 0; attempt < 5; attempt++) {
    const cards = page.locator('.pic-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await cards.nth(i).click();

      // Poll briefly: a correct tap advances the question (or finishes the
      // round); a wrong tap just flashes red and stays put, so move on.
      for (let ms = 0; ms < 900; ms += 100) {
        await page.waitForTimeout(100);
        if (await isRoundComplete(page)) return;
        const after = await header.getAttribute('aria-label').catch(() => null);
        if (after && after !== before) return;
      }
    }
  }
  throw new Error('Could not advance past the question');
}

test('full happy path: create profile, play Listen & Tap, finish the round', async ({ page }) => {
  await page.goto('/');

  // Fresh data with no profile bounces to the picker.
  await expect(page).toHaveURL(/#\/profiles/);
  await page.getByLabel(/^Nimi/).fill('Aino');
  await page.getByRole('button', { name: /Aloita/i }).click();

  // Lands on the map with the new player's greeting.
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: /Hei, Aino/i })).toBeVisible();

  // Open a topic, then its Listen & Tap activity.
  await page.getByRole('link', { name: /Eläimet|Animals/i }).click();
  await expect(page).toHaveURL(/#\/topic\/animals$/);
  await page.getByRole('link', { name: /Kuuntele ja osoita|Listen & Tap/i }).click();
  await expect(page).toHaveURL(/#\/topic\/animals\/listen$/);

  await expect(page.getByLabel('Question 1 of 6')).toBeVisible();

  for (let q = 0; q < 6; q++) {
    await answerUntilAdvance(page);
  }

  await expect(page.getByText(/Hienoa|Great job/i)).toBeVisible();
  await expect(page.getByText(/\d\s*\/\s*6/)).toBeVisible();

  // "Home" returns to the map; the browser back button also works from there.
  await page.getByRole('button', { name: /Koti|Home/i }).click();
  await expect(page).toHaveURL(/#\/$/);

  await page.goto(`${page.url()}`.replace(/#.*$/, '#/topic/animals'));
  await expect(page).toHaveURL(/#\/topic\/animals$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
});
