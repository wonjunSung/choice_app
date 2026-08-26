const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const AVAILABLE = '상담가능';
const IN_USE = '상담중';

const ROWS = [
  ['차수신부님', '선택신부님', '고해1', '고해2'],
  ['차수수녀님', '선택수녀님', '큰부부님', '작은부부님'],
];

const NO_TIMER = new Set(['고해1', '고해2']);
const ITEMS = ROWS.flat();

const items = Object.fromEntries(
  ITEMS.map((id) => [
    id,
    {
      status: AVAILABLE,
      startedAt: null,
      count: 0,
      showTimer: !NO_TIMER.has(id),
    },
  ])
);

function ensureItem(id) {
  return Object.prototype.hasOwnProperty.call(items, id);
}

function snapshot() {
  return { rows: ROWS, items };
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
    return res.status(400).json({ error: '이미 상담중입니다.', ...snapshot() });
  }
  item.status = IN_USE;
  item.startedAt = item.showTimer ? Date.now() : null;
  res.json(snapshot());
});

app.post('/api/items/:id/return', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const item = items[id];
  if (item.status !== IN_USE) {
    return res.status(400).json({ error: '상담중이 아닙니다.', ...snapshot() });
  }
  item.status = AVAILABLE;
  item.startedAt = null;
  if (item.showTimer) {
    item.count += 1;
  }
  res.json(snapshot());
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`rental-status listening on port ${PORT}`);
});
