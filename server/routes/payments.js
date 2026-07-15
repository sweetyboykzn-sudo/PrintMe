const express = require('express');
const { getOrder, updateOrder } = require('../services/store');
const { getPayment } = require('../services/yookassa');
const { sendOrderToAdmin } = require('../services/telegram');

const router = express.Router();

router.get('/check/:orderId', async (req, res) => {
  try {
    const order = getOrder(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Not found' });

    if (order.paymentId) {
      const payment = await getPayment(order.paymentId);
      if (payment.status === 'succeeded' || payment.paid) {
        return res.json(updateOrder(order.id, {
          paymentStatus: 'succeeded',
          status: order.status === 'awaiting_payment' ? 'paid' : order.status
        }));
      }
      if (payment.status === 'canceled') {
        return res.json(updateOrder(order.id, { paymentStatus: 'canceled' }));
      }
    }

    if (req.query.dev === '1' && String(order.paymentId || '').startsWith('dev_')) {
      const updated = updateOrder(order.id, { paymentStatus: 'succeeded', status: 'paid' });
      sendOrderToAdmin(updated).catch(console.error);
      return res.json(updated);
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/webhook', express.json(), async (req, res) => {
  try {
    const event = req.body?.event;
    const obj = req.body?.object;
    if (event === 'payment.succeeded' && obj?.metadata?.orderId) {
      const updated = updateOrder(obj.metadata.orderId, {
        paymentStatus: 'succeeded', status: 'paid', paymentId: obj.id
      });
      if (updated) sendOrderToAdmin(updated).catch(console.error);
    }
    if (event === 'payment.canceled' && obj?.metadata?.orderId) {
      updateOrder(obj.metadata.orderId, { paymentStatus: 'canceled' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
