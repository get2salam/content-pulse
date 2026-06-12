#!/usr/bin/env node
// Runnable scoring walkthrough for the README.
// It shows how Content Pulse turns a small board export into a ranked queue.

import { explainIdea } from '../js/scoring.mjs';

const TODAY = '2026-06-09';
const sampleIdeas = [
  {
    title: 'Launch teardown thread',
    state: 'Scheduled',
    score: 8,
    channelFit: 9,
    effort: 2,
    publishDate: '2026-06-10',
    channel: 'X thread',
  },
  {
    title: 'Customer interview clips',
    state: 'Promising',
    score: 7,
    channelFit: 8,
    effort: 4,
    publishDate: '2026-06-17',
    channel: 'LinkedIn video',
  },
  {
    title: 'Founder note draft',
    state: 'Raw',
    score: 5,
    channelFit: 5,
    effort: 7,
    publishDate: '2026-06-11',
    channel: 'Newsletter',
  },
];

const ranked = sampleIdeas
  .map((idea) => ({ idea, result: explainIdea(idea, { today: TODAY }) }))
  .sort((a, b) => b.result.priority - a.result.priority);

console.log(`Content Pulse sample ranking for ${TODAY}`);
console.log('rank | priority | tier   | idea');
console.log('-----|----------|--------|-------------------------');

for (const [index, { idea, result }] of ranked.entries()) {
  const rank = String(index + 1).padStart(4, ' ');
  const priority = String(result.priority).padStart(8, ' ');
  const tier = result.tier.padEnd(6, ' ');
  console.log(`${rank} | ${priority} | ${tier} | ${idea.title} (${result.summary})`);
}
