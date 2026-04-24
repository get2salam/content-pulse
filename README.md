# Content Pulse

Plan, score, and evolve content ideas that actually support the business.

![Content Pulse preview](docs/preview.svg)

Content Pulse is a small local-first planning tool for solo builders, operators, and creative teams who want a cleaner way to manage ideas. Add items, score the signal, track the friction, and keep the strongest opportunities visible without needing a backend or build step.

## Features

- Local-first persistence with `localStorage`
- Search and filter controls
- Ranked list sorted by signal minus friction
- Inline editor for title, notes, type, status, score, and effort
- Import/export JSON backups
- Re-seed action for resetting the sample board
- Keyboard shortcuts: `N` for new, `/` for search
- No build tooling, just open in a browser

## Quick start

```bash
git clone https://github.com/<you>/content-pulse.git
cd content-pulse
python -m http.server 8000
```

Then open <http://localhost:8000>.

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
      "effort": 3
    }
  ]
}
```

## Privacy

Everything stays in your browser unless you export a JSON backup.

## License

MIT
