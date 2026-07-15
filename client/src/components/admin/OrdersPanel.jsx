import { useEffect, useState } from 'react';
import { api } from '../../api';

const statuses = ['new', 'awaiting_payment', 'paid', 'processing', 'done', 'cancelled'];

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  async function load() { setOrders(await api('/api/orders', { admin: true })); }
  useEffect(() => { load(); }, []);
  const list = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', ...statuses].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={'px-3 py-1.5 rounded-lg border text-sm ' + (filter === s ? 'bg-blue-600 text-white' : 'bg-white')}>{s}</button>
        ))}
      </div>
      {list.map((o) => (
        <div key={o.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="font-bold text-lg">#{o.id} · {o.status} · pay:{o.paymentStatus}</div>
            <div className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString('ru-RU')}</div>
            <div className="mt-1">{o.customer?.name} · {o.customer?.phone}</div>
            <div className="text-sm">{o.baseName} / {o.colorName} · {o.size} × {o.quantity} · <b>{o.total} ₽</b></div>
          </div>
          <div className="space-y-2">
            {o.previewDataUrl && <img src={o.previewDataUrl} alt="" className="w-28 h-28 object-contain border rounded-lg bg-slate-50" />}
            <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={o.status}
              onChange={async (e) => {
                await api('/api/orders/' + o.id, { method: 'PATCH', admin: true, body: { status: e.target.value } });
                load();
              }}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
      {!list.length && <p className="text-center text-slate-500 py-10">Заказов нет</p>}
    </div>
  );
}
