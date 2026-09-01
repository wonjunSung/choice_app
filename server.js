const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MEMO_MAX = 100;
const NAME_MAX = 30;

const ROWS = [
  ['r1-1', 'r1-2', 'r1-3', 'r1-4'],
  ['r2-1', 'r2-2', 'r2-3', 'r2-4'],
];

const DEFAULT_NAMES = {
  'r1-1': '차수신부님',
  'r1-2': '선택신부님',
  'r1-3': '고해1',
  'r1-4': '고해2',
  'r2-1': '차수수녀님',
  'r2-2': '선택수녀님',
  'r2-3': '큰부부님',
  'r2-4': '작은부부님',
};

const CONFESSION_IDS = new Set(['r1-3', 'r1-4']);
const ITEMS = ROWS.flat();

const AVAILABLE = '상담가능';
const IN_USE = '상담중';

const items = Object.fromEntries(
  ITEMS.map((id) => [
    id,
    {
      name: DEFAULT_NAMES[id],
      status: AVAILABLE,
      startedAt: null,
      count: 0,
      isConfession: CONFESSION_IDS.has(id),
      memo: '',
    },
  ])
);

function ensureItem(id) {
  return Object.prototype.hasOwnProperty.call(items, id);
}

function totalCount() {
  return ITEMS.reduce((sum, id) => sum + items[id].count, 0);
}

function snapshot() {
  return { rows: ROWS, items, memoMax: MEMO_MAX, nameMax: NAME_MAX, totalCount: totalCount() };
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
  item.status = IN_USE;
  item.startedAt = Date.now();
  res.json(snapshot());
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
  item.status = AVAILABLE;
  item.startedAt = null;
  item.count += 1;
  res.json(snapshot());
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
  items[id].count = next;
  res.json(snapshot());
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
  items[id].name = name;
  res.json(snapshot());
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
  items[id].memo = text;
  res.json(snapshot());
});

app.post('/api/items/:id/memo/reset', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  items[id].memo = '';
  res.json(snapshot());
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`rental-status listening on port ${PORT}`);
});
