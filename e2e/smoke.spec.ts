import { test, expect, type Page } from '@playwright/test';

// Headless smoke test against the real production build: profile creation →
// journey path → a First-words skill (Listen & Tap) → an unbroken stream of
// challenges (no round-complete interstitial) → Review, which still ends in a
// celebration. Round content/options are randomized, so each question is
// answered by trying pic-cards in order until the app reacts (a wrong tap
// just flashes red and stays put).

async function isRoundComplete(page: Page) {
  return page.getByText(/Hienoa|Great job/i).isVisible().catch(() => false);
}

/**
 * Answer one question in the endless skill stream by watching the header's
 * session-star counter (`N tähteä`): a correct tap bumps it by one.
 */
async function answerUntilStarAdvance(page: Page) {
  const counter = page.getByLabel(/\d+ tähteä/);
  const before = await counter.getAttribute('aria-label');

  for (let attempt = 0; attempt < 5; attempt++) {
    const cards = page.locator('.pic-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await cards.nth(i).click();

      // Poll briefly: a correct tap bumps the star counter; a wrong tap just
      // flashes red and stays put, so move on to the next card.
      for (let ms = 0; ms < 900; ms += 100) {
        await page.waitForTimeout(100);
        const after = await counter.getAttribute('aria-label').catch(() => null);
        if (after && after !== before) return;
      }
    }
  }
  throw new Error('Could not advance past the question');
}

/** Answer one Review question by watching the question dots advance. */
async function answerUntilDotAdvance(page: Page) {
  const header = page.getByLabel(/Question \d+ of \d+/);
  const before = await header.getAttribute('aria-label');

  for (let attempt = 0; attempt < 5; attempt++) {
    const cards = page.locator('.pic-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await cards.nth(i).click();

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

test('full happy path: create profile, play a skill as one unbroken stream', async ({ page }) => {
  await page.goto('/');

  // Fresh data with no profile bounces to the picker.
  await expect(page).toHaveURL(/#\/profiles/);
  await page.getByLabel(/^Nimi/).fill('Aino');
  await page.getByRole('button', { name: /Aloita/i }).click();

  // Lands on the path with the new player's greeting.
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: /Hei, Aino/i })).toBeVisible();

  // Open the first "First words" skill (Listen & Tap over animals). Force:
  // the suggested-next node bobs forever, so it never reads as "stable".
  await page.getByRole('link', { name: /Eläimet|Animals/i }).click({ force: true });
  await expect(page).toHaveURL(/#\/skill\/listen-animals$/);

  // In-session header counts stars, not questions — there is no round to count.
  await expect(page.getByLabel('0 tähteä')).toBeVisible();

  // Play PAST the old 6-question boundary: the stream never stops.
  for (let q = 0; q < 7; q++) {
    await answerUntilStarAdvance(page);
    expect(await isRoundComplete(page)).toBe(false);
  }
  await expect(page.getByLabel('7 tähteä')).toBeVisible();
  await expect(page.locator('.pic-card').first()).toBeVisible();

  // The only exit is the header's home button; back button works from the path.
  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/#\/$/);

  await page.goto(`${page.url()}`.replace(/#.*$/, '#/skill/listen-animals'));
  await expect(page).toHaveURL(/#\/skill\/listen-animals$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
});

test('spaced-repetition Review is reachable from the path and completes', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/^Nimi/).fill('Otto');
  await page.getByRole('button', { name: /Aloita/i }).click();
  await expect(page).toHaveURL(/#\/$/);

  // The Review node is always present (new words backfill an empty schedule).
  await page.getByRole('link', { name: /Kertaus|Review/i }).click();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(page.getByLabel(/Question 1 of \d+/)).toBeVisible();

  // Review keeps its finite round + celebration (the "due today" set is real).
  for (let guard = 0; guard < 20; guard++) {
    if (await isRoundComplete(page)) break;
    await answerUntilDotAdvance(page);
  }

  await expect(page.getByText(/Hienoa|Great job/i)).toBeVisible();
  await page.getByRole('button', { name: /Koti|Home/i }).click();
  await expect(page).toHaveURL(/#\/$/);
});
