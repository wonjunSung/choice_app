const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MEMO_MAX = 100;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ROWS = [
  ['차수신부님', '선택신부님', '고해1', '고해2'],
  ['차수수녀님', '선택수녀님', '큰부부님', '작은부부님'],
];

const NO_TIMER = new Set(['고해1', '고해2']);
const ITEMS = ROWS.flat();

function labels(showTimer) {
  return showTimer
    ? { available: '상담가능', inUse: '상담중' }
    : { available: '고해가능', inUse: '고해중' };
}

const items = Object.fromEntries(
  ITEMS.map((id) => {
    const showTimer = !NO_TIMER.has(id);
    const { available } = labels(showTimer);
    return [
      id,
      {
        status: available,
        startedAt: null,
        count: 0,
        showTimer,
        memo: '',
      },
    ];
  })
);

function ensureItem(id) {
  return Object.prototype.hasOwnProperty.call(items, id);
}

function snapshot() {
  return { rows: ROWS, items, memoMax: MEMO_MAX };
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
  const { available, inUse } = labels(item.showTimer);
  if (item.status !== available) {
    return res.status(400).json({ error: '이미 이용중입니다.', ...snapshot() });
  }
  item.status = inUse;
  item.startedAt = item.showTimer ? Date.now() : null;
  res.json(snapshot());
});

app.post('/api/items/:id/return', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  const item = items[id];
  const { available, inUse } = labels(item.showTimer);
  if (item.status !== inUse) {
    return res.status(400).json({ error: '이용중이 아닙니다.', ...snapshot() });
  }
  item.status = available;
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
