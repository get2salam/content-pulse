# Content Pulse

Plan, score, and evolve content ideas that actually support the business.

![Content Pulse preview](docs/preview.svg)

Content Pulse is a local-first publishing board for founders, operators, and solo creators who want a sharper way to decide what content deserves effort. It keeps hooks, channel fit, publish dates, and idea leverage visible so your content system feels strategic instead of random.

## What it does

- ranks ideas by leverage, channel fit, publish timing, and friction
- tracks **hook**, **channel**, **format**, **publish date**, and **channel fit** for each idea
- highlights the next publish slot, strongest current bet, and sharpest channel match
- includes quick actions for scheduling an idea, copying its hook, and marking it published
- renders a publishing queue and content mix snapshot beneath the main board
- saves locally in the browser with JSON import/export backups

## Why it feels different

Content Pulse is not a generic content calendar. It is designed for choosing the right idea first, sharpening its angle, and making sure what gets published actually supports the business.

## Quick start

```bash
git clone https://github.com/get2salam/content-pulse.git
cd content-pulse
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Keyboard shortcuts

- `N` creates a new idea
- `/` focuses the search box

## Data shape

```json
{
  "boardTitle": "Content pulse board",
  "items": [
    {
      "title": "What lawyers actually lose to bad search",
      "category": "Insight",
      "state": "Promising",
      "score": 9,
      "channelFit": 8,
      "channel": "LinkedIn post",
      "format": "Carousel",
      "publishDate": "2026-04-27"
    }
  ]
}
```

## Runnable scoring example

Use the sample scoring walkthrough to see how Content Pulse converts a few ideas into a ranked publishing queue without opening the browser:

```bash
npm run example:score
```

Example output:

```text
Content Pulse sample ranking for 2026-06-09
rank | priority | tier   | idea
-----|----------|--------|-------------------------
   1 |      107 | top    | Launch teardown thread (strong leverage, great channel fit, publishes this week, already scheduled)
   2 |       72 | strong | Customer interview clips (great channel fit)
   3 |       36 | moderate | Founder note draft (high friction)
```

The example uses `scripts/example-score.mjs` and the same `js/scoring.mjs` module as the app, so scoring-model changes are easy to review from the command line.

## Validate a backup before import

Before sharing or re-importing a browser export, run the backup validator against the JSON file. It checks the board shape, required idea fields, 0-10 scoring ranges, and ISO publish dates, then prints the current top idea using the same scoring module as the app.

```bash
CONTENT_PULSE_TODAY=2026-06-09 npm run validate:board -- ./content-pulse.json
```

Successful output looks like:

```text
Valid Content Pulse backup: ./content-pulse.json
ideas: 3
top idea: Launch teardown thread (top, priority 107)
```

If an import is malformed, the command exits non-zero and lists the exact field paths to fix, such as `items[0].publishDate must use YYYY-MM-DD`.

## Local verification

A dependency-free Node script confirms `index.html`, `js/main.js`, and the README stay in sync before you push.

```bash
node scripts/verify.mjs
# or
npm test
```

It catches the common silent breakages: a `data-role` or `data-field` selector renamed in `main.js` but not in `index.html`, a moved stylesheet or script asset, and a stale JSON example in this README. The same script runs in CI on every push and pull request.

## Privacy

Everything stays in your browser unless you export a JSON backup.

## License

MIT
