// Deterministic unit tests for the content-idea scoring module.
// Run with: node --test scripts/scoring.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

import { explainIdea, scoreIdea, tierFor, __test__ } from '../js/scoring.mjs';

const TODAY = '2026-06-09';

const baseIdea = {
  title: 'Baseline idea',
  score: 7,
  channelFit: 6,
  effort: 3,
  publishDate: '2026-06-15',
  state: 'Promising',
};

test('scoreIdea returns the documented weighted sum for a known idea', () => {
  const result = scoreIdea(baseIdea, { today: TODAY });
  // 7*6 + 6*5 + 0 (publish > 4 days out) + 6 (Promising) - 3*4 = 42 + 30 + 0 + 6 - 12
  assert.equal(result.priority, 66);
  assert.equal(result.daysUntil, 6);
  assert.deepEqual(result.components, {
    leverage: 42,
    channelFit: 30,
    publishBoost: 0,
    stateBoost: 6,
    friction: 12,
  });
});

test('publishBoost ramps up as the publish date approaches today', () => {
  const day = (days) => scoreIdea({ ...baseIdea, publishDate: addDays(TODAY, days) }, { today: TODAY });
  assert.equal(day(4).components.publishBoost, 0);
  assert.equal(day(3).components.publishBoost, 4);
  assert.equal(day(2).components.publishBoost, 8);
  assert.equal(day(1).components.publishBoost, 12);
  assert.equal(day(0).components.publishBoost, 16);
});

test('overdue ideas keep the same max publishBoost rather than going negative', () => {
  const overdue = scoreIdea({ ...baseIdea, publishDate: addDays(TODAY, -7) }, { today: TODAY });
  assert.equal(overdue.components.publishBoost, 16);
  assert.equal(overdue.daysUntil, -7);
});

test('state boost matches the documented table and falls back to Raw', () => {
  for (const [state, expected] of Object.entries(__test__.STATE_BOOSTS)) {
    const result = scoreIdea({ ...baseIdea, state }, { today: TODAY });
    assert.equal(result.components.stateBoost, expected, `state ${state}`);
  }
  const unknown = scoreIdea({ ...baseIdea, state: 'Mystery' }, { today: TODAY });
  assert.equal(unknown.components.stateBoost, __test__.STATE_BOOSTS.Raw);
});

test('numeric fields are clamped to 0..10 and survive garbage input', () => {
  const messy = scoreIdea(
    { ...baseIdea, score: 9999, channelFit: -4, effort: 'not-a-number' },
    { today: TODAY },
  );
  assert.equal(messy.components.leverage, 10 * 6);
  assert.equal(messy.components.channelFit, 0);
  assert.equal(messy.components.friction, 0);
});

test('scoreIdea is total even when the idea is missing fields', () => {
  const result = scoreIdea({}, { today: TODAY });
  assert.ok(Number.isFinite(result.priority));
  assert.equal(result.daysUntil, 999);
});

test('priority ordering reflects leverage and channel fit', () => {
  const weak = scoreIdea({ ...baseIdea, score: 2, channelFit: 2 }, { today: TODAY });
  const strong = scoreIdea({ ...baseIdea, score: 9, channelFit: 9 }, { today: TODAY });
  assert.ok(strong.priority > weak.priority);
});

test('tierFor maps priority to recruiter-readable buckets', () => {
  assert.equal(tierFor(120), 'top');
  assert.equal(tierFor(90), 'top');
  assert.equal(tierFor(89), 'strong');
  assert.equal(tierFor(60), 'strong');
  assert.equal(tierFor(59), 'moderate');
  assert.equal(tierFor(30), 'moderate');
  assert.equal(tierFor(29), 'weak');
  assert.equal(tierFor(0), 'weak');
});

test('explainIdea flags overdue, scheduled, and high-friction ideas', () => {
  const overdue = explainIdea(
    { ...baseIdea, publishDate: addDays(TODAY, -2), state: 'Scheduled', effort: 10 },
    { today: TODAY },
  );
  assert.match(overdue.summary, /overdue/);
  assert.match(overdue.summary, /already scheduled/);
  assert.match(overdue.summary, /high friction/);
});

test('explainIdea highlights strong leverage and channel fit on stand-out ideas', () => {
  const great = explainIdea(
    { ...baseIdea, score: 10, channelFit: 10, effort: 1, state: 'Promising' },
    { today: TODAY },
  );
  assert.match(great.summary, /strong leverage/);
  assert.match(great.summary, /great channel fit/);
  assert.equal(great.tier, tierFor(great.priority));
});

test('explainIdea falls back to a balanced summary for middle-of-the-road ideas', () => {
  const meh = explainIdea(
    { ...baseIdea, score: 6, channelFit: 6, effort: 5, publishDate: addDays(TODAY, 30) },
    { today: TODAY },
  );
  assert.equal(meh.summary, 'balanced trade-offs');
});

function addDays(isoDate, days) {
  const millis = Date.parse(`${isoDate}T00:00:00Z`) + days * 86400000;
  return new Date(millis).toISOString().slice(0, 10);
}
