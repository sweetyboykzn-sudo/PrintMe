const express = require('express');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ error: 'Неверный пароль' });
});

router.get('/me', adminAuth, (req, res) => res.json({ ok: true }));
module.exports = router;
