const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MEMO_MAX = 100;
const NAME_MAX = 30;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ROWS = [
  ['r1-1', 'r1-2', 'r1-3', 'r1-4'],
  ['r2-1', 'r2-2', 'r2-3', 'r2-4'],
];

const DEFAULT_NAME = '';

const CONFESSION_IDS = new Set(['r1-3', 'r1-4']);
const ITEMS = ROWS.flat();

const AVAILABLE = '상담가능';
const IN_USE = '상담중';

const globalStats = {
  chaesuCount: null,
  completedTotal: 0,
};

function createDefaultItem(id) {
  return {
    name: DEFAULT_NAME,
    status: AVAILABLE,
    startedAt: null,
    count: 0,
    isConfession: CONFESSION_IDS.has(id),
    memo: '',
  };
}

const items = Object.fromEntries(ITEMS.map((id) => [id, createDefaultItem(id)]));

function ensureItem(id) {
  return Object.prototype.hasOwnProperty.call(items, id);
}

function sumItemCounts() {
  return ITEMS.reduce((sum, id) => sum + items[id].count, 0);
}

function persistState() {
  try {
    const payload = {
      global: globalStats,
      items: ITEMS.reduce((acc, id) => {
        acc[id] = {
          name: items[id].name,
          status: items[id].status,
          startedAt: items[id].startedAt,
          count: items[id].count,
          memo: items[id].memo,
        };
        return acc;
      }, {}),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist state:', err);
  }
}

function loadPersistedState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (saved.global) {
      const rawChaesu = saved.global.chaesuCount;
      globalStats.chaesuCount =
        rawChaesu === null || rawChaesu === undefined || rawChaesu === ''
          ? null
          : Math.max(0, Number(rawChaesu) || 0);
      globalStats.completedTotal = Math.max(0, Number(saved.global.completedTotal) || 0);
    } else {
      globalStats.completedTotal = sumItemCounts();
    }
    if (!saved.items) return;
    for (const id of ITEMS) {
      const savedItem = saved.items[id];
      if (!savedItem) continue;
      items[id] = {
        ...createDefaultItem(id),
        name: String(savedItem.name ?? '').trim(),
        status: savedItem.status === IN_USE ? IN_USE : AVAILABLE,
        startedAt: savedItem.startedAt ?? null,
        count: Math.max(0, Number(savedItem.count) || 0),
        memo: String(savedItem.memo ?? ''),
      };
    }
  } catch (err) {
    console.error('Failed to load persisted state:', err);
  }
}

loadPersistedState();

function snapshot() {
  return {
    rows: ROWS,
    items,
    global: globalStats,
    memoMax: MEMO_MAX,
    nameMax: NAME_MAX,
    totalCount: globalStats.completedTotal,
  };
}

function mutate(res, fn) {
  fn();
  persistState();
  res.json(snapshot());
}

app.get('/api/status', (_req, res) => {
  res.json(snapshot());
});

app.post('/api/items/:id/use', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const item = items[id];
  if (item.status !== AVAILABLE) {
    return res.status(400).json({ error: '이미 이용중입니다.', ...snapshot() });
  }
  mutate(res, () => {
    item.status = IN_USE;
    item.startedAt = Date.now();
  });
});

app.post('/api/items/:id/return', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const item = items[id];
  if (item.status !== IN_USE) {
    return res.status(400).json({ error: '이용중이 아닙니다.', ...snapshot() });
  }
  mutate(res, () => {
    item.status = AVAILABLE;
    item.startedAt = null;
    item.count += 1;
    globalStats.completedTotal += 1;
  });
});

app.post('/api/items/:id/count', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const delta = Number(req.body?.delta);
  if (delta !== 1 && delta !== -1) {
    return res.status(400).json({ error: '인원은 +1 또는 -1만 가능합니다.', ...snapshot() });
  }
  const next = items[id].count + delta;
  if (next < 0) {
    return res.status(400).json({ error: '인원은 0명 미만으로 줄일 수 없습니다.', ...snapshot() });
  }
  mutate(res, () => {
    items[id].count = next;
  });
});

app.post('/api/items/:id/name', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const name = String(req.body?.name ?? '').trim();
  if (!name) {
    return res.status(400).json({ error: '이름을 입력해 주세요.', ...snapshot() });
  }
  if (name.length > NAME_MAX) {
    return res.status(400).json({ error: `이름은 ${NAME_MAX}자까지 가능합니다.`, ...snapshot() });
  }
  mutate(res, () => {
    items[id].name = name;
  });
});

app.post('/api/items/:id/memo', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const text = String(req.body?.text ?? '').trim();
  if (!text) {
    return res.status(400).json({ error: '메모 내용을 입력해 주세요.', ...snapshot() });
  }
  if (text.length > MEMO_MAX) {
    return res.status(400).json({ error: `메모는 ${MEMO_MAX}자까지 가능합니다.`, ...snapshot() });
  }
  mutate(res, () => {
    items[id].memo = text;
  });
});

app.post('/api/items/:id/memo/reset', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  mutate(res, () => {
    items[id].memo = '';
  });
});

app.post('/api/global/chaesu-count', (req, res) => {
  const raw = String(req.body?.count ?? '').trim();
  if (!raw) {
    return res.status(400).json({ error: '인원을 입력해 주세요.', ...snapshot() });
  }
  if (!/^\d+$/.test(raw)) {
    return res.status(400).json({ error: '인원은 0 이상의 숫자만 입력할 수 있습니다.', ...snapshot() });
  }
  const count = Number(raw);
  mutate(res, () => {
    globalStats.chaesuCount = count;
  });
});

app.post('/api/global/completed/count', (req, res) => {
  const delta = Number(req.body?.delta);
  if (delta !== 1 && delta !== -1) {
    return res.status(400).json({ error: '인원은 +1 또는 -1만 가능합니다.', ...snapshot() });
  }
  const next = globalStats.completedTotal + delta;
  if (next < 0) {
    return res.status(400).json({ error: '인원은 0명 미만으로 줄일 수 없습니다.', ...snapshot() });
  }
  mutate(res, () => {
    globalStats.completedTotal = next;
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`rental-status listening on port ${PORT}`);
});
