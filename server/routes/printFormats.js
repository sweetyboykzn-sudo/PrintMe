const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/printFormats.json');

function readFormats() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('readFormats error:', e.message);
    return [];
  }
}

function writeFormats(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function sortFormats(list) {
  return [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function normalize(item = {}) {
  const id =
    String(item.id || item.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-') || `fmt-${Date.now()}`;

  return {
    id,
    name: String(item.name || id).trim(),
    widthCm: Number(item.widthCm) || 0,
    heightCm: Number(item.heightCm) || 0,
    price: Number(item.price) || 0,
    enabled: item.enabled !== false,
    sort: Number(item.sort) || 0,
	y: typeof item.y === 'number' ? item.y : (item.y !== undefined ? Number(item.y) : undefined),
  };
}

// GET /api/print-formats          — витрина (только enabled)
// GET /api/print-formats?all=1    — админка (все)
router.get('/', (req, res) => {
  let list = sortFormats(readFormats());
  const all = req.query.all === '1' || req.query.all === 'true';
  if (!all) {
    list = list.filter((f) => f.enabled !== false);
  }
  res.json(list);
});

// PUT /api/print-formats  — полная замена списка (админка)
router.put('/', (req, res) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: 'Body must be an array' });
  }
  const list = sortFormats(body.map(normalize));
  writeFormats(list);
  res.json(list);
});

// POST /api/print-formats — добавить один
router.post('/', (req, res) => {
  const list = readFormats();
  const item = normalize(req.body);

  if (list.some((f) => f.id === item.id)) {
    return res.status(409).json({ error: 'Format with this id already exists' });
  }
  if (!item.sort) {
    item.sort = list.reduce((m, f) => Math.max(m, f.sort || 0), 0) + 1;
  }

  list.push(item);
  const sorted = sortFormats(list);
  writeFormats(sorted);
  res.status(201).json(item);
});

// PATCH /api/print-formats/:id — обновить один
router.patch('/:id', (req, res) => {
  const list = readFormats();
  const idx = list.findIndex((f) => f.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' });
  }
  list[idx] = normalize({ ...list[idx], ...req.body, id: list[idx].id });
  const sorted = sortFormats(list);
  writeFormats(sorted);
  res.json(list[idx]);
});

// DELETE /api/print-formats/:id
router.delete('/:id', (req, res) => {
  const list = readFormats();
  const next = list.filter((f) => f.id !== req.params.id);
  if (next.length === list.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  writeFormats(sortFormats(next));
  res.json({ ok: true });
});

module.exports = router;