const express = require('express');
const { createOrder, getOrders, getOrder, updateOrder, getBase } = require('../services/store');
const { sendOrderToAdmin } = require('../services/telegram');
const { createPayment } = require('../services/yookassa');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { baseId, colorId, size, quantity = 1, side = 'front', designJson, previewDataUrl, customer, comment } = req.body;
    const base = getBase(baseId);
    if (!base) return res.status(400).json({ error: 'Некорректная основа' });
    const color = base.colors.find((c) => c.id === colorId);
    if (!color) return res.status(400).json({ error: 'Некорректный цвет' });
    if (!customer?.name || !customer?.phone) return res.status(400).json({ error: 'Укажите имя и телефон' });

    const qty = Math.max(1, Number(quantity) || 1);
    const unit = Number(base.basePrice) + Number(base.printPrice || 0);
    const total = unit * qty;

    const order = createOrder({
      baseId, baseName: base.name, colorId, colorName: color.name, size,
      quantity: qty, side, unitPrice: unit, total,
      designJson: designJson || null, previewDataUrl: previewDataUrl || null,
      customer, comment: comment || '', status: 'awaiting_payment', paymentStatus: 'pending'
    });

    const returnUrl = process.env.CLIENT_URL + '/payment/result?orderId=' + order.id;
    const payment = await createPayment({
      orderId: order.id, amount: total,
      description: 'Заказ #' + order.id + ' — ' + base.name + ' ' + color.name,
      returnUrl
    });

    const updated = updateOrder(order.id, {
      paymentId: payment.id,
      paymentStatus: payment.status || 'waiting',
      paymentUrl: payment.confirmation?.confirmation_url || null
    });

    sendOrderToAdmin(updated).catch(console.error);
    res.json({ success: true, orderId: updated.id, paymentUrl: updated.paymentUrl, total: updated.total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

router.get('/', adminAuth, (req, res) => res.json(getOrders()));

router.get('/:id', (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: order.id, status: order.status, paymentStatus: order.paymentStatus, total: order.total,
    baseName: order.baseName, colorName: order.colorName, size: order.size, quantity: order.quantity
  });
});

router.patch('/:id', adminAuth, (req, res) => {
  const order = updateOrder(req.params.id, { status: req.body.status, paymentStatus: req.body.paymentStatus });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

module.exports = router;
