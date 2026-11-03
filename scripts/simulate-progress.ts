// Simulate a year of daily play for a few kinds of learner, on the real engine
// (src/game/simulate.ts), and print how far each gets, which everyday themes
// they have met, and how well they hold on to what they met. Averages over
// several seeds. Younger learners play the younger readers' order, the older
// one the original order (path.tsx `YOUNGER_ORDER`).
//
// Run: npm run sim:progress [-- days]
import { LEARNERS, simulate, type Snapshot } from '../src/game/simulate';

const days = Number(process.argv[2] ?? 365);
const seeds = [11, 22, 33, 44, 55];
const at = [90, 180, 365].filter((d) => d <= days);
const mean = (xs: Snapshot[], k: keyof Snapshot) => xs.reduce((a, x) => a + (x[k] as number), 0) / xs.length;

/** The everyday themes a 6–7-year-old needs first, by the unit that brings each. */
const THEMES: Record<string, string> = {
  describing: 'colors',
  likes: 'food',
  'not-having': 'clothes',
  feelings: 'feelings',
  where: 'in / on',
  weather: 'weather',
  body: 'body',
  comparing: 'animals',
  when: 'days & clock',
  nature: 'nature',
};

console.log(`Mean of ${seeds.length} runs.\n`);
console.log('learner        day  unit  days/unit  words  recall (settled)  due  hard-step skill (2 weeks on)  themes met');
for (const m of LEARNERS) {
  const runs = seeds.map((s) => simulate(m, days, s, [...new Set([...at, days])]));
  for (const d of [...new Set([...at, days])]) {
    const snaps = runs.map((r) => r.find((x) => x.day === d)!);
    const unit = mean(snaps, 'unit');
    const themes = Object.entries(THEMES)
      .filter(([id]) => snaps.filter((x) => x.met.includes(id)).length * 2 > snaps.length)
      .map(([, name]) => name);
    console.log(
      `${m.name.padEnd(14)} ${String(d).padStart(3)}  ${unit.toFixed(1).padStart(4)}  ${(d / unit).toFixed(1).padStart(9)}  ${mean(snaps, 'words').toFixed(0).padStart(5)}  ${mean(snaps, 'recall').toFixed(2).padStart(6)} (${mean(snaps, 'recallSettled').toFixed(2)})  ${mean(snaps, 'due').toFixed(0).padStart(3)}  ${mean(snaps, 'hardSkill').toFixed(2).padStart(15)} (${mean(snaps, 'hardSkillLater').toFixed(2)})        ${themes.length}: ${themes.join(', ')}`,
    );
  }
  const end = runs.map((r) => r.at(-1)!);
  console.log(
    `${''.padEnd(14)}      rounds: course ${mean(end, 'courseRounds').toFixed(0)}, review ${mean(end, 'flowReviews').toFixed(0)}; warm-ups: review ${mean(end, 'reviewWarmups').toFixed(0)} / subject ${mean(end, 'subjectWarmups').toFixed(0)}\n`,
  );
}
