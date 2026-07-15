const fetch = require('node-fetch');
const FormData = require('form-data');

const token = () => process.env.BOT_TOKEN;
const chatId = () => process.env.ADMIN_CHAT_ID;

async function api(method, body) {
  if (!token()) return null;
  const res = await fetch('https://api.telegram.org/bot' + token() + '/' + method, {
    method: 'POST',
    headers: body instanceof FormData ? body.getHeaders() : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
  return res.json();
}

function statusKeyboard(orderId) {
  return {
    inline_keyboard: [
      [
        { text: '🟡 В работу', callback_data: 'status:' + orderId + ':processing' },
        { text: '✅ Готово', callback_data: 'status:' + orderId + ':done' }
      ],
      [
        { text: '💳 Ожидает оплаты', callback_data: 'status:' + orderId + ':awaiting_payment' },
        { text: '💰 Оплачен', callback_data: 'status:' + orderId + ':paid' }
      ],
      [{ text: '❌ Отменить', callback_data: 'status:' + orderId + ':cancelled' }]
    ]
  };
}

function formatOrder(order) {
  return [
    '🆕 <b>Заказ #' + order.id + '</b>',
    'Статус: <b>' + order.status + '</b> | Оплата: <b>' + order.paymentStatus + '</b>',
    '',
    '👤 ' + (order.customer?.name || '—'),
    '📞 ' + (order.customer?.phone || '—'),
    '📧 ' + (order.customer?.email || '—'),
    '📍 ' + (order.customer?.address || '—'),
    '',
    '👕 ' + order.baseName + ' / ' + order.colorName,
    '📏 ' + order.size + ' × ' + order.quantity,
    '💰 ' + order.total + ' ₽',
    '🖨 Сторона: ' + (order.side || 'front'),
    '',
    '📝 ' + (order.comment || '—'),
    '🕒 ' + new Date(order.createdAt).toLocaleString('ru-RU')
  ].join('\n');
}

async function sendOrderToAdmin(order) {
  if (!token() || !chatId()) {
    console.warn('Telegram не настроен');
    return;
  }
  await api('sendMessage', {
    chat_id: chatId(),
    text: formatOrder(order),
    parse_mode: 'HTML',
    reply_markup: statusKeyboard(order.id)
  });
  if (order.previewDataUrl) {
    try {
      const base64 = order.previewDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const form = new FormData();
      form.append('chat_id', chatId());
      form.append('caption', 'Превью #' + order.id);
      form.append('photo', buffer, { filename: 'preview-' + order.id + '.png' });
      await api('sendPhoto', form);
    } catch (e) {
      console.error('preview telegram error', e.message);
    }
  }
}

async function answerCallback(callbackQueryId, text) {
  return api('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: false });
}

async function editMessage(chatIdValue, messageId, order) {
  return api('editMessageText', {
    chat_id: chatIdValue,
    message_id: messageId,
    text: formatOrder(order),
    parse_mode: 'HTML',
    reply_markup: statusKeyboard(order.id)
  });
}

module.exports = { sendOrderToAdmin, answerCallback, editMessage };
