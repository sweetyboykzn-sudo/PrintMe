import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import Login from '../components/admin/Login';
import OrdersPanel from '../components/admin/OrdersPanel';
import ProductsPanel from '../components/admin/ProductsPanel';
import FormatsPanel from '../components/admin/FormatsPanel';
import AdminTemplates from '../components/AdminTemplates';

export default function Admin() {
  const [ok, setOk] = useState(!!localStorage.getItem('adminPassword'));
  const [tab, setTab] = useState('orders');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ok) return;
    api('/api/admin/me', { admin: true }).catch(() => {
      localStorage.removeItem('adminPassword');
      setOk(false);
    });
  }, [ok]);

  async function onLogin(password) {
    try {
      await api('/api/admin/login', { method: 'POST', body: { password } });
      localStorage.setItem('adminPassword', password);
      setOk(true);
      setError('');
    } catch {
      setError('Неверный пароль');
    }
  }

  if (!ok) {
    return (
      <div>
        <Login onLogin={onLogin} />
        {error && <p className="text-center text-red-600 -mt-10">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Админ-панель</h1>
        <button
          className="text-red-500 text-sm"
          onClick={() => {
            localStorage.removeItem('adminPassword');
            setOk(false);
          }}
        >
          Выйти
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setTab('orders')}
          className={
            'px-4 py-3 rounded-xl border ' +
            (tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          Заказы
        </button>
        <button
          onClick={() => setTab('products')}
          className={
            'px-4 py-3 rounded-xl border ' +
            (tab === 'products' ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          Основы и цвета
        </button>
        <button
          onClick={() => setTab('formats')}
          className={
            'px-4 py-3 rounded-xl border ' +
            (tab === 'formats' ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          Форматы
        </button>
        <button
          onClick={() => setTab('templates')}
          className={
            'px-4 py-3 rounded-xl border ' +
            (tab === 'templates' ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          Шаблоны
        </button>
      </div>

      {tab === 'orders' && <OrdersPanel />}
      {tab === 'products' && <ProductsPanel />}
      {tab === 'formats' && <FormatsPanel />}
      {tab === 'templates' && <AdminTemplates />}
    </div>
  );
}