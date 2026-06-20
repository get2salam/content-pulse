#!/usr/bin/env node
// Validate a Content Pulse JSON backup before importing it in the browser.

import { readFile } from 'node:fs/promises';
import { explainIdea } from '../js/scoring.mjs';

const REQUIRED_TEXT = ['title', 'category', 'state', 'channel', 'format', 'hook'];
const NUMERIC_0_TO_10 = ['score', 'effort', 'channelFit'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function validateBoardFile(path, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const raw = await readFile(path, 'utf8');
  return validateBoard(JSON.parse(raw), { today });
}

export function validateBoard(board, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const errors = [];
  const items = Array.isArray(board?.items) ? board.items : null;

  if (!items) errors.push('items must be an array');
  if (typeof board?.boardTitle !== 'string' || !board.boardTitle.trim()) {
    errors.push('boardTitle must be a non-empty string');
  }

  for (const [index, item] of (items || []).entries()) {
    const label = `items[${index}]`;
    for (const field of REQUIRED_TEXT) {
      if (typeof item?.[field] !== 'string' || !item[field].trim()) {
        errors.push(`${label}.${field} must be a non-empty string`);
      }
    }
    for (const field of NUMERIC_0_TO_10) {
      const value = Number(item?.[field]);
      if (!Number.isFinite(value) || value < 0 || value > 10) {
        errors.push(`${label}.${field} must be a number from 0 to 10`);
      }
    }
    if (!ISO_DATE.test(item?.publishDate || '')) {
      errors.push(`${label}.publishDate must use YYYY-MM-DD`);
    }
  }

  const ranked = [...(items || [])]
    .map((idea) => ({ idea, result: explainIdea(idea, { today }) }))
    .sort((a, b) => b.result.priority - a.result.priority);

  return {
    ok: errors.length === 0,
    errors,
    itemCount: items?.length || 0,
    topIdea: ranked[0]?.idea.title || null,
    topPriority: ranked[0]?.result.priority ?? null,
    topTier: ranked[0]?.result.tier || null,
  };
}

function printResult(result, path) {
  if (!result.ok) {
    console.error(`Invalid Content Pulse backup: ${path}`);
    for (const error of result.errors) console.error(`- ${error}`);
    return;
  }

  console.log(`Valid Content Pulse backup: ${path}`);
  console.log(`ideas: ${result.itemCount}`);
  if (result.topIdea) {
    console.log(`top idea: ${result.topIdea} (${result.topTier}, priority ${result.topPriority})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  const today = process.env.CONTENT_PULSE_TODAY;
  if (!path) {
    console.error('Usage: node scripts/validate-board.mjs path/to/content-pulse.json');
    process.exit(2);
  }

  try {
    const result = await validateBoardFile(path, { today });
    printResult(result, path);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(`Could not validate ${path}: ${error.message}`);
    process.exit(1);
  }
}
