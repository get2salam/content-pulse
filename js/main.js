const CONFIG = {
  slug: 'content-pulse',
  title: 'Content Pulse',
  boardTitle: 'Content pulse board',
  boardSubtitle: 'A lightweight system for content that compounds.',
  categories: ['Insight', 'Case study', 'Tutorial', 'Distribution'],
  states: ['Raw', 'Promising', 'Scheduled', 'Published'],
  items: [
    {
      title: 'What lawyers actually lose to bad search',
      category: 'Insight',
      state: 'Promising',
      score: 9,
      effort: 3,
      channelFit: 8,
      publishDate: '2026-04-27',
      channel: 'LinkedIn post',
      format: 'Carousel',
      hook: 'Bad search is not a small annoyance, it is a compounding revenue leak.',
      note: 'Lead with wasted hours and hidden costs, not generic productivity framing.',
    },
    {
      title: 'Behind the scraper system',
      category: 'Case study',
      state: 'Raw',
      score: 7,
      effort: 5,
      channelFit: 6,
      publishDate: '2026-05-02',
      channel: 'Blog post',
      format: 'Build breakdown',
      hook: 'Reliability stories sell competence better than a feature list.',
      note: 'A technical build story can signal competence if the jargon stays grounded.',
    },
    {
      title: 'Repurpose the demo into clips',
      category: 'Distribution',
      state: 'Scheduled',
      score: 8,
      effort: 2,
      channelFit: 9,
      publishDate: '2026-04-25',
      channel: 'X thread',
      format: 'Clipped demo',
      hook: 'One strong demo should become several small proof assets.',
      note: 'One live demo should become several smaller assets.',
    },
  ],
};

const STORAGE_KEY = `${CONFIG.slug}/state/v2`;
const NUMBER_FIELDS = new Set(['score', 'effort', 'channelFit']);
const refs = {
  boardTitle: document.querySelector('[data-role="board-title"]'),
  boardSubtitle: document.querySelector('[data-role="board-subtitle"]'),
  stats: document.querySelector('[data-role="stats"]'),
  insights: document.querySelector('[data-role="insights"]'),
  count: document.querySelector('[data-role="count"]'),
  list: document.querySelector('[data-role="list"]'),
  editor: document.querySelector('[data-role="editor"]'),
  secondaryPrimary: document.querySelector('[data-role="secondary-primary"]'),
  secondarySecondary: document.querySelector('[data-role="secondary-secondary"]'),
  search: document.querySelector('[data-field="search"]'),
  category: document.querySelector('[data-field="category"]'),
  status: document.querySelector('[data-field="status"]'),
  importFile: document.querySelector('#import-file'),
};

const toastHost = (() => {
  const host = document.createElement('div');
  host.className = 'toast-host';
  document.body.appendChild(host);
  return host;
})();

function showToast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  toastHost.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 200);
  }, 2200);
}

function uid() {
  return `${CONFIG.slug}_${Math.random().toString(36).slice(2, 10)}`;
}

function todayISO(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function daysFromToday(value) {
  if (!value) return 999;
  const today = new Date(`${todayISO()}T00:00:00`);
  const target = new Date(`${value}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function bumpDate(value, days) {
  const date = new Date(`${value || todayISO()}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalize(item = {}) {
  return {
    id: item.id || uid(),
    title: item.title || 'New idea',
    category: CONFIG.categories.includes(item.category) ? item.category : CONFIG.categories[0],
    state: CONFIG.states.includes(item.state) ? item.state : CONFIG.states[0],
    score: Number(item.score ?? 7),
    effort: Number(item.effort ?? 3),
    channelFit: Number(item.channelFit ?? 6),
    publishDate: item.publishDate || todayISO(3),
    channel: item.channel || 'Primary channel',
    format: item.format || 'Format',
    hook: item.hook || 'The opening angle that earns the first 5 seconds.',
    note: item.note || 'Capture the business reason this idea deserves attention.',
  };
}

function priority(item) {
  const publishBoost = Math.max(0, 4 - Math.max(daysFromToday(item.publishDate), 0)) * 4;
  const stateBoost = item.state === 'Scheduled' ? 10 : item.state === 'Promising' ? 6 : item.state === 'Published' ? 3 : 1;
  return item.score * 6 + item.channelFit * 5 + publishBoost + stateBoost - item.effort * 4;
}

function seedState() {
  return {
    boardTitle: CONFIG.boardTitle,
    boardSubtitle: CONFIG.boardSubtitle,
    items: CONFIG.items.map((item) => normalize(item)),
    ui: { search: '', category: 'all', status: 'all', selectedId: null },
  };
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    return {
      ...seedState(),
      ...parsed,
      items: (parsed.items || []).map((item) => normalize(item)),
      ui: { ...seedState().ui, ...(parsed.ui || {}) },
    };
  } catch (error) {
    console.warn('Falling back to seed state', error);
    return seedState();
  }
}

let state = hydrate();
if (!state.ui.selectedId && state.items[0]) state.ui.selectedId = state.items[0].id;

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function filteredItems() {
  const query = state.ui.search.trim().toLowerCase();
  return [...state.items]
    .filter((item) => state.ui.category === 'all' || item.category === state.ui.category)
    .filter((item) => state.ui.status === 'all' || item.state === state.ui.status)
    .filter((item) => !query || `${item.title} ${item.note} ${item.category} ${item.state} ${item.channel} ${item.hook} ${item.format}`.toLowerCase().includes(query))
    .sort((a, b) => priority(b) - priority(a) || daysFromToday(a.publishDate) - daysFromToday(b.publishDate));
}

function selectedItem() {
  return state.items.find((item) => item.id === state.ui.selectedId) || filteredItems()[0] || null;
}

function commit(nextState) {
  state = nextState;
  if (!state.ui.selectedId && state.items[0]) state.ui.selectedId = state.items[0].id;
  persist();
  render();
}

function updateSelected(field, value) {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, [field]: NUMBER_FIELDS.has(field) ? Number(value) : value } : item),
  });
}

function addItem() {
  const item = normalize({ title: 'New idea', channel: 'Primary channel', format: 'Format' });
  commit({
    ...state,
    items: [item, ...state.items],
    ui: { ...state.ui, selectedId: item.id },
  });
  showToast('Added a new content idea.');
}

function removeSelected() {
  const target = selectedItem();
  if (!target) return;
  const nextItems = state.items.filter((item) => item.id !== target.id);
  commit({
    ...state,
    items: nextItems,
    ui: { ...state.ui, selectedId: nextItems[0]?.id || null },
  });
  showToast('Removed content idea.');
}

function exportState() {
  const blob = new Blob([JSON.stringify({ schema: `${CONFIG.slug}/v2`, ...state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${CONFIG.slug}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded backup.');
}

async function importState(file) {
  const raw = await file.text();
  const parsed = JSON.parse(raw);
  commit({
    ...seedState(),
    ...parsed,
    items: (parsed.items || []).map((item) => normalize(item)),
    ui: { ...seedState().ui, ...(parsed.ui || {}) },
  });
  showToast('Imported backup.');
}

function scheduleSoon() {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, state: 'Scheduled', publishDate: bumpDate(todayISO(), 2) } : item),
  });
  showToast('Moved this idea into the publishing queue.');
}

function markPublished() {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, state: 'Published', publishDate: todayISO() } : item),
  });
  showToast('Marked this idea as published.');
}

async function copyHook() {
  const target = selectedItem();
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.hook);
    showToast('Copied content hook.');
  } catch {
    window.prompt('Copy this hook:', target.hook);
  }
}

function toneForDate(item) {
  const days = daysFromToday(item.publishDate);
  if (days <= 0) return 'danger';
  if (days <= 2) return 'warn';
  return 'success';
}

function renderStats(items) {
  const scheduled = state.items.filter((item) => item.state === 'Scheduled').length;
  const published = state.items.filter((item) => item.state === 'Published').length;
  const dueSoon = state.items.filter((item) => item.state !== 'Published' && daysFromToday(item.publishDate) <= 3).length;
  const avgFit = state.items.length ? (state.items.reduce((sum, item) => sum + item.channelFit, 0) / state.items.length).toFixed(1) : '0.0';
  const cards = [
    ['Ideas', String(state.items.length), 'tracked content ideas'],
    ['Scheduled', String(scheduled), 'ready to move toward publish'],
    ['Due soon', String(dueSoon), `${published} already published`],
    ['Channel fit', avgFit, 'average fit across the board'],
  ];
  refs.stats.innerHTML = cards.map(([label, valueText, note]) => `
    <article class="card stat">
      <span>${label}</span>
      <strong>${valueText}</strong>
      <small>${note}</small>
    </article>
  `).join('');
  refs.count.textContent = items[0] ? `Top: ${items[0].title}` : 'No ideas';
}

function renderInsights(items) {
  const nextPublish = [...state.items].filter((item) => item.state !== 'Published').sort((a, b) => daysFromToday(a.publishDate) - daysFromToday(b.publishDate))[0];
  const bestFit = [...state.items].sort((a, b) => b.channelFit - a.channelFit)[0];
  const strongest = items[0];
  const cards = [
    {
      label: 'Best current bet',
      title: strongest?.title || 'No idea yet',
      body: strongest ? `Priority ${priority(strongest)} with ${strongest.channelFit}/10 channel fit.` : 'Add a content idea to surface the strongest bet.',
    },
    {
      label: 'Next publish slot',
      title: nextPublish?.title || 'Nothing scheduled',
      body: nextPublish ? `${formatDate(nextPublish.publishDate)} on ${nextPublish.channel}.` : 'Your next publish date will surface here.',
    },
    {
      label: 'Sharpest fit',
      title: bestFit?.title || 'No fit data',
      body: bestFit ? `${bestFit.format} format with ${bestFit.channelFit}/10 channel fit.` : 'Channel fit becomes useful once ideas are scored.',
    },
  ];
  refs.insights.innerHTML = cards.map((card) => `
    <article class="card insight-card">
      <p class="eyebrow">${card.label}</p>
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </article>
  `).join('');
}

function renderList(items) {
  if (!items.length) {
    refs.list.innerHTML = `
      <div class="empty">
        <strong>No content ideas yet</strong>
        <p>Capture the ideas worth turning into posts, guides, or threads.</p>
      </div>
    `;
    return;
  }

  refs.list.innerHTML = items.map((item) => `
    <button class="item ${item.id === state.ui.selectedId ? 'is-selected' : ''}" type="button" data-id="${item.id}">
      <div class="item-top">
        <strong>${item.title}</strong>
        <span class="score">${priority(item)}</span>
      </div>
      <p>${item.hook}</p>
      <div class="badge-row">
        <span class="pill ${toneForDate(item)}">${formatDate(item.publishDate)}</span>
        <span class="pill">${item.channel}</span>
        <span class="pill">${item.format}</span>
      </div>
      <div class="meta">
        <span>${item.category}</span>
        <span>${item.state}</span>
        <span>Fit ${item.channelFit}/10</span>
        <span>Effort ${item.effort}/10</span>
      </div>
    </button>
  `).join('');
}

function renderEditor(item) {
  if (!item) {
    refs.editor.innerHTML = `
      <div class="empty">
        <strong>No selection</strong>
        <p>Pick a content idea or create a new one.</p>
      </div>
    `;
    return;
  }

  refs.editor.innerHTML = `
    <div class="editor-head">
      <div>
        <p class="eyebrow">Idea editor</p>
        <h3>${item.title}</h3>
      </div>
      <span class="score">Priority ${priority(item)}</span>
    </div>
    <div class="editor-grid">
      <label class="field">
        <span>Idea title</span>
        <input type="text" data-item-field="title" value="${escapeHtml(item.title)}" />
      </label>
      <label class="field">
        <span>Channel</span>
        <input type="text" data-item-field="channel" value="${escapeHtml(item.channel)}" />
      </label>
      <label class="field">
        <span>Format</span>
        <input type="text" data-item-field="format" value="${escapeHtml(item.format)}" />
      </label>
      <label class="field">
        <span>Hook</span>
        <textarea data-item-field="hook">${escapeHtml(item.hook)}</textarea>
      </label>
      <label class="field">
        <span>Strategy note</span>
        <textarea data-item-field="note">${escapeHtml(item.note)}</textarea>
      </label>
      <div class="field-grid">
        <label class="field">
          <span>Type</span>
          <select data-item-field="category">${CONFIG.categories.map((entry) => `<option value="${entry}" ${item.category === entry ? 'selected' : ''}>${entry}</option>`).join('')}</select>
        </label>
        <label class="field">
          <span>Status</span>
          <select data-item-field="state">${CONFIG.states.map((entry) => `<option value="${entry}" ${item.state === entry ? 'selected' : ''}>${entry}</option>`).join('')}</select>
        </label>
      </div>
      <div class="field-grid">
        <label class="field">
          <span>Publish date</span>
          <input type="date" data-item-field="publishDate" value="${item.publishDate}" />
        </label>
        <label class="field range-wrap">
          <span>Channel fit</span>
          <input type="range" min="1" max="10" data-item-field="channelFit" value="${item.channelFit}" />
          <output>${item.channelFit} / 10</output>
        </label>
      </div>
      <div class="field-grid">
        <label class="field range-wrap">
          <span>Leverage</span>
          <input type="range" min="1" max="10" data-item-field="score" value="${item.score}" />
          <output>${item.score} / 10</output>
        </label>
        <label class="field range-wrap">
          <span>Friction</span>
          <input type="range" min="1" max="10" data-item-field="effort" value="${item.effort}" />
          <output>${item.effort} / 10</output>
        </label>
      </div>
      <div class="quick-actions">
        <button class="btn" type="button" data-action="schedule-soon">Schedule soon</button>
        <button class="btn" type="button" data-action="copy-hook">Copy hook</button>
        <button class="btn" type="button" data-action="mark-published">Mark published</button>
      </div>
      <div class="editor-actions">
        <span class="helper">Publish ${formatDate(item.publishDate)} on ${item.channel} as ${item.format}.</span>
        <button class="btn btn-danger" type="button" data-action="remove-current">Remove</button>
      </div>
    </div>
  `;
}

function renderPanels() {
  const queue = [...state.items].filter((item) => item.state !== 'Published').sort((a, b) => daysFromToday(a.publishDate) - daysFromToday(b.publishDate));
  refs.secondaryPrimary.innerHTML = `
    <div class="secondary-head">
      <div>
        <p class="eyebrow">Publishing queue</p>
        <h3>What should go live next</h3>
      </div>
      <span class="chip">${queue.length} pending</span>
    </div>
    <div class="stack">
      ${queue.slice(0, 4).map((item) => `
        <div class="mini-card">
          <div class="inline-split">
            <strong>${item.title}</strong>
            <span class="pill ${toneForDate(item)}">${formatDate(item.publishDate)}</span>
          </div>
          <p>${item.channel} · ${item.format} · ${item.channelFit}/10 fit.</p>
        </div>
      `).join('') || `<div class="empty"><strong>No pending ideas</strong><p>Everything has been published. Nice.</p></div>`}
    </div>
  `;

  const byCategory = CONFIG.categories.map((entry) => ({ entry, count: state.items.filter((item) => item.category === entry).length }));
  refs.secondarySecondary.innerHTML = `
    <div class="secondary-head">
      <div>
        <p class="eyebrow">Content mix</p>
        <h3>Where your ideas are clustering</h3>
      </div>
      <span class="chip">${state.items.filter((item) => item.state === 'Published').length} published</span>
    </div>
    <ul class="metric-list">
      ${byCategory.map(({ entry, count }) => `<li><span>${entry}</span><strong>${count}</strong></li>`).join('')}
      <li><span>Strongest channel</span><strong>${state.items.length ? [...state.items].sort((a, b) => b.channelFit - a.channelFit)[0].channel : '—'}</strong></li>
    </ul>
  `;
}

function render() {
  refs.boardTitle.textContent = state.boardTitle;
  refs.boardSubtitle.textContent = state.boardSubtitle;
  refs.search.value = state.ui.search;
  refs.category.innerHTML = `<option value="all">All types</option>${CONFIG.categories.map((entry) => `<option value="${entry}" ${state.ui.category === entry ? 'selected' : ''}>${entry}</option>`).join('')}`;
  refs.status.innerHTML = `<option value="all">All statuses</option>${CONFIG.states.map((entry) => `<option value="${entry}" ${state.ui.status === entry ? 'selected' : ''}>${entry}</option>`).join('')}`;
  const items = filteredItems();
  if (!items.some((item) => item.id === state.ui.selectedId)) state.ui.selectedId = items[0]?.id || null;
  renderStats(items);
  renderInsights(items);
  renderList(items);
  renderEditor(selectedItem());
  renderPanels();
}

document.addEventListener('click', (event) => {
  const itemButton = event.target.closest('.item');
  if (itemButton) {
    commit({ ...state, ui: { ...state.ui, selectedId: itemButton.dataset.id } });
    return;
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'new') addItem();
  if (action === 'reset') { commit(seedState()); showToast('Re-seeded sample board.'); }
  if (action === 'remove-current') removeSelected();
  if (action === 'export') exportState();
  if (action === 'import') refs.importFile.click();
  if (action === 'schedule-soon') scheduleSoon();
  if (action === 'copy-hook') copyHook();
  if (action === 'mark-published') markPublished();
});

document.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (field === 'search') {
    commit({ ...state, ui: { ...state.ui, search: event.target.value } });
    return;
  }
  const itemField = event.target.dataset.itemField;
  if (itemField) updateSelected(itemField, event.target.value);
});

document.addEventListener('change', async (event) => {
  const field = event.target.dataset.field;
  if (field === 'category' || field === 'status') {
    commit({ ...state, ui: { ...state.ui, [field]: event.target.value } });
    return;
  }
  if (event.target.id === 'import-file') {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importState(file);
    } catch (error) {
      console.error(error);
      showToast('Import failed.');
    } finally {
      event.target.value = '';
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.target.closest('input, textarea, select')) return;
  if (event.key.toLowerCase() === 'n') {
    event.preventDefault();
    addItem();
  }
  if (event.key === '/') {
    event.preventDefault();
    refs.search.focus();
  }
});

render();
