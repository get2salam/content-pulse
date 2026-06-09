// Deterministic, explainable scoring for content ideas.
// Pure module: every call accepts an explicit `today` (ISO date), so unit
// tests and browser code share the same maths without timing flakiness.

const STATE_BOOSTS = { Scheduled: 10, Promising: 6, Published: 3, Raw: 1 };
const WEIGHTS = { leverage: 6, channelFit: 5, friction: 4, publishStep: 4 };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clampInt(value, lo, hi) {
  const n = Number(value);
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function parseISODateUTC(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function daysUntil(today, target) {
  if (!target) return 999;
  const a = parseISODateUTC(today);
  const b = parseISODateUTC(target);
  if (a == null || b == null) return 999;
  return Math.round((b - a) / 86400000);
}

export function scoreIdea(idea, { today = todayISO() } = {}) {
  const leverage = clampInt(idea?.score, 0, 10) * WEIGHTS.leverage;
  const channelFit = clampInt(idea?.channelFit, 0, 10) * WEIGHTS.channelFit;
  const friction = clampInt(idea?.effort, 0, 10) * WEIGHTS.friction;
  const days = daysUntil(today, idea?.publishDate);
  const publishBoost = Math.max(0, 4 - Math.max(days, 0)) * WEIGHTS.publishStep;
  const stateBoost = STATE_BOOSTS[idea?.state] ?? STATE_BOOSTS.Raw;

  const priority = leverage + channelFit + publishBoost + stateBoost - friction;

  return {
    priority,
    daysUntil: days,
    components: { leverage, channelFit, publishBoost, stateBoost, friction },
  };
}

export function tierFor(priority) {
  if (priority >= 90) return 'top';
  if (priority >= 60) return 'strong';
  if (priority >= 30) return 'moderate';
  return 'weak';
}

export function explainIdea(idea, opts) {
  const result = scoreIdea(idea, opts);
  const { components, daysUntil: days } = result;
  const reasons = [];

  if (components.leverage >= 48) reasons.push('strong leverage');
  else if (components.leverage <= 18) reasons.push('thin leverage');

  if (components.channelFit >= 40) reasons.push('great channel fit');
  else if (components.channelFit <= 20) reasons.push('weak channel fit');

  if (days <= 0 && idea?.state !== 'Published') reasons.push('overdue');
  else if (components.publishBoost >= 12) reasons.push('publishes this week');

  if (components.stateBoost >= 10) reasons.push('already scheduled');
  if (components.friction >= 28) reasons.push('high friction');

  return {
    ...result,
    tier: tierFor(result.priority),
    summary: reasons.length ? reasons.join(', ') : 'balanced trade-offs',
  };
}

export const __test__ = { WEIGHTS, STATE_BOOSTS, daysUntil };
