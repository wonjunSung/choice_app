const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ITEMS = ['신부님', '선택수녀님', '차수수녀님', '큰부부님', '작은부부님'];
const AVAILABLE = '상담가능';
const IN_USE = '상담중';

const items = Object.fromEntries(ITEMS.map((id) => [id, AVAILABLE]));

function ensureItem(id) {
  return ITEMS.includes(id);
}

app.get('/api/status', (_req, res) => {
  res.json(items);
});

app.post('/api/items/:id/use', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  if (items[id] !== AVAILABLE) {
    return res.status(400).json({ error: '이미 상담중입니다.', items });
  }
  items[id] = IN_USE;
  res.json(items);
});

app.post('/api/items/:id/return', (req, res) => {
  const { id } = req.params;
  if (!ensureItem(id)) {
    return res.status(404).json({ error: '항목이 없습니다.' });
  }
  if (items[id] !== IN_USE) {
    return res.status(400).json({ error: '상담중이 아닙니다.', items });
  }
  items[id] = AVAILABLE;
  res.json(items);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`rental-status listening on port ${PORT}`);
});
