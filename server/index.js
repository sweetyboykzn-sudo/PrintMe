const path = require('path');
const express = require('express');
const cors = require('cors');
import React from 'react';
require('dotenv').config();

const productsRoutes = require('./routes/products');
const printFormatsRouter = require('./routes/printFormats');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const telegramRoutes = require('./routes/telegram');
const adminRoutes = require('./routes/admin');
const { publicRouter: templatesPublic, adminRouter: templatesAdmin } = require('./routes/templates');
const { UPLOADS_DIR } = require('./services/store');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/products', productsRoutes);
app.use('/api/print-formats', printFormatsRouter);

// шаблоны принтов
app.use('/api/templates', templatesPublic);          // витрина
app.use('/api/admin/templates', templatesAdmin);     // CRUD в админке

app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/admin', adminRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => console.log('API: http://localhost:' + PORT));