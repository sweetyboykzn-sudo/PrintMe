const express = require('express');
const { updateOrder } = require('../services/store');
const { answerCallback, editMessage } = require('../services/telegram');

const router = express.Router();

router.post('/webhook', async (req, res) => {
  try {
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      if (req.query.secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const cb = req.body.callback_query;
    if (cb?.data?.startsWith('status:')) {
      const parts = cb.data.split(':');
      const orderId = parts[1];
      const status = parts[2];
      const patch = { status };
      if (status === 'paid') patch.paymentStatus = 'succeeded';
      if (status === 'awaiting_payment') patch.paymentStatus = 'waiting';
      if (status === 'cancelled') patch.paymentStatus = 'canceled';
      const order = updateOrder(orderId, patch);
      await answerCallback(cb.id, order ? ('Статус: ' + status) : 'Заказ не найден');
      if (order && cb.message) await editMessage(cb.message.chat.id, cb.message.message_id, order);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.json({ ok: true });
  }
});

module.exports = router;
