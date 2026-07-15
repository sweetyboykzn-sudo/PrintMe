const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getProducts, getBase, upsertBase, deleteBase, UPLOADS_DIR } = require('../services/store');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + uuidv4() + (path.extname(file.originalname) || '.png'))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', (req, res) => {
  res.json({ bases: getProducts().bases.filter((b) => b.active !== false) });
});

router.get('/all', adminAuth, (req, res) => res.json(getProducts()));

router.post('/base', adminAuth, (req, res) => {
  const body = req.body;
  const existing = body.id ? getBase(body.id) : null;
  const base = {
    id: body.id || uuidv4().slice(0, 8),
    name: body.name,
    description: body.description || '',
    type: body.type || 'basic',
    basePrice: Number(body.basePrice) || 990,
    printPrice: Number(body.printPrice) || 500,
    sizes: body.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
    active: body.active !== false,
    colors: body.colors || existing?.colors || []
  };
  upsertBase(base);
  res.json(base);
});

router.delete('/base/:id', adminAuth, (req, res) => {
  deleteBase(req.params.id);
  res.json({ ok: true });
});

router.post('/base/:baseId/color', adminAuth, (req, res) => {
  const base = getBase(req.params.baseId);
  if (!base) return res.status(404).json({ error: 'Base not found' });
  const color = {
    id: req.body.id || uuidv4().slice(0, 6),
    name: req.body.name,
    hex: req.body.hex || '#ffffff',
    mockupFront: req.body.mockupFront || null,
    mockupBack: req.body.mockupBack || null,
    printArea: req.body.printArea || { x: 0.28, y: 0.22, w: 0.44, h: 0.42 }
  };
  const idx = base.colors.findIndex((c) => c.id === color.id);
  if (idx >= 0) base.colors[idx] = { ...base.colors[idx], ...color };
  else base.colors.push(color);
  upsertBase(base);
  res.json(base);
});

router.delete('/base/:baseId/color/:colorId', adminAuth, (req, res) => {
  const base = getBase(req.params.baseId);
  if (!base) return res.status(404).json({ error: 'Base not found' });
  base.colors = base.colors.filter((c) => c.id !== req.params.colorId);
  upsertBase(base);
  res.json(base);
});

router.post('/mockup', adminAuth, upload.single('file'), (req, res) => {
  const { baseId, colorId, side = 'front' } = req.body;
  const base = getBase(baseId);
  if (!base) return res.status(404).json({ error: 'Base not found' });
  const color = base.colors.find((c) => c.id === colorId);
  if (!color) return res.status(404).json({ error: 'Color not found' });
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = '/uploads/' + req.file.filename;
  if (side === 'back') color.mockupBack = url; else color.mockupFront = url;
  upsertBase(base);
  res.json({ url, base });
});
module.exports = router;
