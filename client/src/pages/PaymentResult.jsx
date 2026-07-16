import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const dev = params.get('dev');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    api('/api/payments/check/' + orderId + (dev ? '?dev=1' : ''))
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [orderId, dev]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white border rounded-3xl p-8">
        <div className="text-5xl mb-4">{order?.paymentStatus === 'succeeded' ? '✅' : '⏳'}</div>
        <h1 className="text-2xl font-bold mb-2">
          {order?.paymentStatus === 'succeeded' ? 'Оплата прошла' : 'Проверяем оплату'}
        </h1>
        {order && <p className="text-slate-600 mb-4">Заказ <b>#{order.id}</b> · {order.total} ₽ · {order.status}</p>}
        {error && <p className="text-red-600">{error}</p>}
        <Link to="/" className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl">На главную</Link>
      </div>
    </div>
  );
}
