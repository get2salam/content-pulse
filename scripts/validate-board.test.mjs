// Tests for the backup validator used by the README import-safety example.
// Run with: node --test scripts/validate-board.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateBoard } from './validate-board.mjs';

const validBoard = {
  boardTitle: 'Content launch board',
  items: [
    {
      title: 'Launch teardown thread',
      category: 'Insight',
      state: 'Scheduled',
      score: 8,
      effort: 2,
      channelFit: 9,
      publishDate: '2026-06-10',
      channel: 'X thread',
      format: 'Thread',
      hook: 'Turn one launch into lessons buyers remember.',
    },
  ],
};

test('validateBoard accepts a complete Content Pulse backup and reports its top idea', () => {
  const result = validateBoard(validBoard, { today: '2026-06-09' });

  assert.equal(result.ok, true);
  assert.equal(result.itemCount, 1);
  assert.equal(result.topIdea, 'Launch teardown thread');
  assert.equal(result.topTier, 'top');
  assert.equal(result.topPriority, 107);
  assert.deepEqual(result.errors, []);
});

test('validateBoard rejects malformed imports before they reach browser state', () => {
  const result = validateBoard({ boardTitle: 'Broken', items: [{ title: '', score: 99, publishDate: 'tomorrow' }] });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /items\[0\]\.title/);
  assert.match(result.errors.join('\n'), /items\[0\]\.score/);
  assert.match(result.errors.join('\n'), /items\[0\]\.publishDate/);
  assert.match(result.errors.join('\n'), /items\[0\]\.channelFit/);
});

test('validateBoard requires the exported items array', () => {
  const result = validateBoard({ boardTitle: 'No items here' });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ['items must be an array']);
  assert.equal(result.itemCount, 0);
  assert.equal(result.topIdea, null);
});
