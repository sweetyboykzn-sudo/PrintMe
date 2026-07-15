const express = require('express');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'templates.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ templates: [] }, null, 2),
      'utf8'
    );
  }
}

function load() {
  ensureData();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.templates)) return { templates: [] };
    return data;
  } catch {
    return { templates: [] };
  }
}

function save(data) {
  ensureData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function uid() {
  return (
    'tpl_' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

function sortTemplates(list) {
  return [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

/**
 * Простая защита админ-методов.
 * Подстройте под ваш admin auth (Bearer / cookie / session).
 *
 * Поддерживает:
 *  - Authorization: Bearer <ADMIN_TOKEN>
 *  - x-admin-token: <ADMIN_TOKEN>
 *  - если ADMIN_TOKEN не задан в .env — в dev пропускает (удобно локально)
 */
function requireAdmin(req, res, next) {
  const expected =
    process.env.ADMIN_TOKEN ||
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    '';

  if (!expected) {
    // нет секрета — не блокируем (локальная разработка)
    return next();
  }

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : '';
  const custom = (req.headers['x-admin-token'] || '').toString().trim();

  if (bearer === expected || custom === expected) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

function validateLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    return 'layout is required';
  }
  if (!layout.title || !layout.image) {
    return 'layout.title and layout.image are required';
  }
  return null;
}

// ---------- public: /api/templates ----------
const publicRouter = express.Router();

// список для витрины (только active)
publicRouter.get('/', (req, res) => {
  const { templates } = load();
  const list = sortTemplates(templates.filter((t) => t.active !== false));
  res.json({ templates: list });
});

publicRouter.get('/:id', (req, res) => {
  const { templates } = load();
  const t = templates.find((x) => x.id === req.params.id);
  if (!t || t.active === false) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json({ template: t });
});

// ---------- admin: /api/admin/templates ----------
const adminRouter = express.Router();

adminRouter.use(requireAdmin);

// все шаблоны (включая скрытые)
adminRouter.get('/', (req, res) => {
  const { templates } = load();
  res.json({ templates: sortTemplates(templates) });
});

adminRouter.get('/:id', (req, res) => {
  const { templates } = load();
  const t = templates.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json({ template: t });
});

adminRouter.post('/', (req, res) => {
  const body = req.body || {};
  const err = validateLayout(body.layout);
  if (err) return res.status(400).json({ error: err });

  const data = load();
  const item = {
    id: uid(),
    name: body.name || 'Новый шаблон',
    description: body.description || '',
    active: body.active !== false,
    sort:
      body.sort != null
        ? Number(body.sort)
        : data.templates.length + 1,
    thumbnail: body.thumbnail || null,
    layout: body.layout,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.templates.push(item);
  save(data);
  res.status(201).json({ template: item });
});

adminRouter.put('/:id', (req, res) => {
  const data = load();
  const i = data.templates.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'not found' });

  const body = req.body || {};
  if (body.layout) {
    const err = validateLayout(body.layout);
    if (err) return res.status(400).json({ error: err });
  }

  const prev = data.templates[i];
  data.templates[i] = {
    ...prev,
    name: body.name != null ? body.name : prev.name,
    description:
      body.description != null ? body.description : prev.description,
    active: body.active != null ? Boolean(body.active) : prev.active,
    sort: body.sort != null ? Number(body.sort) : prev.sort,
    thumbnail:
      body.thumbnail !== undefined ? body.thumbnail : prev.thumbnail,
    layout: body.layout || prev.layout,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: new Date().toISOString()
  };

  save(data);
  res.json({ template: data.templates[i] });
});

adminRouter.delete('/:id', (req, res) => {
  const data = load();
  const before = data.templates.length;
  data.templates = data.templates.filter((x) => x.id !== req.params.id);
  if (data.templates.length === before) {
    return res.status(404).json({ error: 'not found' });
  }
  save(data);
  res.json({ ok: true });
});

module.exports = {
  publicRouter,
  adminRouter
};