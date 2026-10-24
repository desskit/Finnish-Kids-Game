import { test, expect, type Page } from '@playwright/test';

// Headless smoke test against the real production build: profile creation →
// the course home → Continue into unit 1's lesson → read it through → its
// first practice step (the greetings dialogue) as an unbroken stream of
// challenges (no round-complete interstitial) → home with the lesson ticked;
// then Review, which still ends in a celebration. Round content/options are
// randomized, so each question is answered by trying options in order until
// the app reacts (a wrong tap just flashes red and stays put). Along the way,
// no emoji may show as text: every one is drawn as a picture.

/** No emoji reaches the screen as text: every one is drawn as a picture. */
async function expectNoEmojiText(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text.match(/\p{Extended_Pictographic}/gu) ?? []).toEqual([]);
}

async function isRoundComplete(page: Page) {
  return page.getByText(/Hienoa|Great job/i).isVisible().catch(() => false);
}

/**
 * A fresh profile meets brand-new words through a no-stakes "Uusi sana!" intro
 * card before the quiz — dismiss it (its "Jatka" button) when it's showing.
 */
async function dismissIntro(page: Page) {
  const jatka = page.getByRole('button', { name: /jatka/i });
  if (await jatka.isVisible().catch(() => false)) await jatka.click();
}

/**
 * Answer one question in the endless skill stream by watching the header's
 * session-star counter (`N tähteä`, `1 tähti`): a correct tap bumps it by one.
 */
async function answerUntilStarAdvance(page: Page, optionSelector = '.pic-card') {
  const counter = page.getByLabel(/^\d+ täh(teä|ti)$/);
  const before = await counter.getAttribute('aria-label');

  for (let attempt = 0; attempt < 8; attempt++) {
    await dismissIntro(page);
    // Only enabled cards: right after a correct tap the outgoing question's
    // cards linger disabled for ~750ms before the next question (or an intro
    // card) mounts — clicking those would hang.
    const cards = page.locator(`${optionSelector}:not([disabled])`);
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      // Best-effort click: the grid can remount mid-loop (question advance /
      // intro card), detaching the handle — just move on and re-scan.
      await cards.nth(i).click({ timeout: 2000 }).catch(() => {});

      // Poll briefly: a correct tap bumps the star counter; a wrong tap just
      // flashes red and stays put, so move on to the next card.
      for (let ms = 0; ms < 900; ms += 100) {
        await page.waitForTimeout(100);
        const after = await counter.getAttribute('aria-label').catch(() => null);
        if (after && after !== before) return;
      }
    }
    // Nothing clickable yet (mid-transition) — give the next screen a moment.
    await page.waitForTimeout(300);
  }
  throw new Error('Could not advance past the question');
}

/**
 * Answer one Review question by watching the question dots advance. The
 * header goes when the celebration comes, so every read of it gives up
 * quickly rather than waiting for a header that will never come back.
 */
async function answerUntilDotAdvance(page: Page) {
  const header = page.getByLabel(/Question \d+ of \d+/);
  const label = () => header.getAttribute('aria-label', { timeout: 500 }).catch(() => null);
  const before = await label();
  if (before === null) return;

  for (let attempt = 0; attempt < 5; attempt++) {
    // Only enabled cards, and a best-effort click: after the last right
    // answer the cards linger disabled, then the celebration replaces them.
    const cards = page.locator('.pic-card:not([disabled])');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      if (await isRoundComplete(page)) return;
      await cards.nth(i).click({ timeout: 2000 }).catch(() => {});

      for (let ms = 0; ms < 900; ms += 100) {
        await page.waitForTimeout(100);
        if (await isRoundComplete(page)) return;
        const after = await label();
        if (after !== before) return;
      }
    }
  }
  throw new Error('Could not advance past the question');
}

test('full happy path: create profile, hear the first story, practise as one unbroken stream', async ({ page }) => {
  await page.goto('/');

  // Fresh data with no profile bounces to the picker.
  await expect(page).toHaveURL(/#\/profiles/);
  await page.getByLabel(/^Nimi/).fill('Aino');
  // Picking the Pink look shows it at once.
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'day');
  await page.getByRole('button', { name: /Pinkki/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'pink');
  await page.getByRole('button', { name: /Aloita/i }).click();

  // Lands on the course home with the new player's greeting, in her look,
  // which is there from the first paint after a reload too.
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: /Hei, Aino/i })).toBeVisible();
  await expect(html).toHaveAttribute('data-theme', 'pink');
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('pink');
  await expect(page.getByRole('heading', { name: /Hei, Aino/i })).toBeVisible();
  await expectNoEmojiText(page);

  // Continue → unit 1's story, heard before any practice (no questions).
  await page.getByRole('link', { name: /Continue/ }).click();
  await expect(page).toHaveURL(/#\/opener\/hello$/);
  await expectNoEmojiText(page);
  await page.getByRole('button', { name: /Listen/ }).click();
  for (let i = 0; i < 10; i++) {
    const next = page.getByRole('button', { name: /Next page|The end/ });
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
  }
  await expect(page.getByText('Loppu!')).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();

  // Straight into the unit's first step.
  await expect(page).toHaveURL(/#\/skill\/greetings$/);
  await expect(page.getByLabel('0 tähteä')).toBeVisible();
  await expectNoEmojiText(page);

  // Play PAST the old 6-question boundary: the stream never stops.
  for (let q = 0; q < 7; q++) {
    await answerUntilStarAdvance(page, '.reply-tile');
    expect(await isRoundComplete(page)).toBe(false);
  }
  await expect(page.getByLabel('7 tähteä')).toBeVisible();

  // The only exit is the header's back button → home, with the story ticked.
  await page.getByRole('button', { name: 'Back home' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.unit--current .unit-step--done').first()).toBeVisible();
  await expectNoEmojiText(page);

  // Browser history works across a step.
  await page.goto(`${page.url()}`.replace(/#.*$/, '#/skill/greetings'));
  await expect(page).toHaveURL(/#\/skill\/greetings$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
});

test('spaced-repetition Review is reachable from home and completes', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/^Nimi/).fill('Otto');
  await page.getByRole('button', { name: /Aloita/i }).click();
  await expect(page).toHaveURL(/#\/$/);

  // The Review tile is always present (new words backfill an empty schedule).
  await page.getByRole('link', { name: /Kertaus|Review/i }).click();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(page.getByLabel(/Question 1 of \d+/)).toBeVisible();
  await expectNoEmojiText(page);

  // Review keeps its finite round + celebration (the "due today" set is real).
  for (let guard = 0; guard < 20; guard++) {
    if (await isRoundComplete(page)) break;
    await answerUntilDotAdvance(page);
  }

  await expect(page.getByText(/Hienoa|Great job/i)).toBeVisible();
  await expectNoEmojiText(page);
  await page.getByRole('button', { name: /Koti|Home/i }).click();
  await expect(page).toHaveURL(/#\/$/);
});
