// Simulate a year of daily play for a few kinds of learner, on the real engine
// (src/game/simulate.ts), and print how far each gets and how well they hold
// on to what they met. Averages over several seeds.
//
// Run: npm run sim:progress [-- days]
import { LEARNERS, simulate, type Snapshot } from '../src/game/simulate';

const days = Number(process.argv[2] ?? 365);
const seeds = [11, 22, 33, 44, 55];
const mean = (xs: Snapshot[], k: keyof Snapshot) => xs.reduce((a, x) => a + (x[k] as number), 0) / xs.length;

console.log(`After ${days} days, mean of ${seeds.length} runs:\n`);
console.log('learner        unit  recall  due  hard-step skill  course rounds  review rounds  warm-ups (review / subject)');
for (const m of LEARNERS) {
  const end = seeds.map((s) => simulate(m, days, s).at(-1)!);
  console.log(
    `${m.name.padEnd(14)} ${mean(end, 'unit').toFixed(1).padStart(4)}  ${mean(end, 'recall').toFixed(2).padStart(6)}  ${mean(end, 'due').toFixed(0).padStart(3)}  ${mean(end, 'hardSkill').toFixed(2).padStart(15)}  ${mean(end, 'courseRounds').toFixed(0).padStart(13)}  ${mean(end, 'flowReviews').toFixed(0).padStart(13)}  ${mean(end, 'reviewWarmups').toFixed(0)} / ${mean(end, 'subjectWarmups').toFixed(0)}`,
  );
}
