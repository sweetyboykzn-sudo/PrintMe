const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

function authHeader() {
  const id = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  return 'Basic ' + Buffer.from(id + ':' + secret).toString('base64');
}

async function createPayment({ orderId, amount, description, returnUrl }) {
  if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
    return {
      id: 'dev_' + orderId,
      status: 'pending',
      confirmation: {
        confirmation_url: process.env.CLIENT_URL + '/payment/result?orderId=' + orderId + '&dev=1'
      },
      dev: true
    };
  }

  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': uuidv4(),
      Authorization: authHeader()
    },
    body: JSON.stringify({
      amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: returnUrl },
      description,
      metadata: { orderId }
    })
  });

  if (!res.ok) throw new Error('YooKassa error: ' + (await res.text()));
  return res.json();
}

async function getPayment(paymentId) {
  if (String(paymentId).startsWith('dev_')) {
    return { id: paymentId, status: 'succeeded', paid: true };
  }
  const res = await fetch('https://api.yookassa.ru/v3/payments/' + paymentId, {
    headers: { Authorization: authHeader() }
  });
  if (!res.ok) throw new Error('Cannot fetch payment');
  return res.json();
}

module.exports = { createPayment, getPayment };
