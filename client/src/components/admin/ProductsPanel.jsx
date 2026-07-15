import { useEffect, useState } from 'react';
import { api } from '../../api';

const emptyBase = {
  name: '', description: '', type: 'basic', basePrice: 990, printPrice: 500,
  sizes: ['S', 'M', 'L', 'XL', 'XXL'], active: true, colors: []
};

export default function ProductsPanel() {
  const [bases, setBases] = useState([]);
  const [form, setForm] = useState(emptyBase);
  const [editId, setEditId] = useState(null);
  const [colorForm, setColorForm] = useState({ baseId: '', name: '', hex: '#ffffff' });

  async function load() {
    const data = await api('/api/products/all', { admin: true });
    setBases(data.bases || []);
  }
  useEffect(() => { load(); }, []);

  async function saveBase(e) {
    e.preventDefault();
    const body = {
      ...form,
      id: editId || undefined,
      sizes: Array.isArray(form.sizes) ? form.sizes : String(form.sizes).split(',').map((s) => s.trim()).filter(Boolean)
    };
    if (editId) body.colors = bases.find((b) => b.id === editId)?.colors || [];
    await api('/api/products/base', { method: 'POST', admin: true, body });
    setForm(emptyBase); setEditId(null); load();
  }

  async function addColor(e) {
    e.preventDefault();
    await api('/api/products/base/' + colorForm.baseId + '/color', {
      method: 'POST', admin: true, body: { name: colorForm.name, hex: colorForm.hex }
    });
    setColorForm({ baseId: colorForm.baseId, name: '', hex: '#ffffff' });
    load();
  }

  async function uploadMockup(baseId, colorId, side, file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('baseId', baseId);
    fd.append('colorId', colorId);
    fd.append('side', side);
    await api('/api/products/mockup', { method: 'POST', admin: true, body: fd, headers: {} });
    load();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveBase} className="bg-white border rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <h2 className="md:col-span-2 font-bold text-lg">{editId ? 'Редактировать основу' : 'Новая основа'}</h2>
        <input className="border rounded-xl px-3 py-2" placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="border rounded-xl px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="basic">Базовая</option>
          <option value="oversize">Оверсайз</option>
          <option value="other">Другое</option>
        </select>
        <input className="border rounded-xl px-3 py-2" type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
        <input className="border rounded-xl px-3 py-2" type="number" value={form.printPrice} onChange={(e) => setForm({ ...form, printPrice: e.target.value })} />
        <input className="border rounded-xl px-3 py-2 md:col-span-2" value={Array.isArray(form.sizes) ? form.sizes.join(', ') : form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
        <textarea className="border rounded-xl px-3 py-2 md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="md:col-span-2 bg-blue-600 text-white rounded-xl py-3">{editId ? 'Сохранить' : 'Добавить основу'}</button>
      </form>

      <form onSubmit={addColor} className="bg-white border rounded-2xl p-5 grid md:grid-cols-4 gap-3">
        <h2 className="md:col-span-4 font-bold text-lg">Добавить цвет</h2>
        <select className="border rounded-xl px-3 py-2" value={colorForm.baseId} onChange={(e) => setColorForm({ ...colorForm, baseId: e.target.value })} required>
          <option value="">Основа</option>
          {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input className="border rounded-xl px-3 py-2" placeholder="Цвет" value={colorForm.name} onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })} required />
        <input className="border rounded-xl px-3 py-2" type="color" value={colorForm.hex} onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })} />
        <button className="bg-slate-900 text-white rounded-xl">Добавить цвет</button>
      </form>

      <div className="space-y-4">
        {bases.map((b) => (
          <div key={b.id} className="bg-white border rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-lg">{b.name} <span className="text-slate-400 text-sm">({b.type})</span></div>
                <div className="text-sm text-slate-500">{b.basePrice} ₽ + принт {b.printPrice} ₽</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => {
                  setEditId(b.id);
                  setForm({ name: b.name, description: b.description || '', type: b.type, basePrice: b.basePrice, printPrice: b.printPrice, sizes: b.sizes, active: b.active, colors: b.colors });
                }}>Редактировать</button>
                <button className="px-3 py-1.5 border rounded-lg text-sm text-red-600" onClick={async () => {
                  if (!confirm('Удалить основу?')) return;
                  await api('/api/products/base/' + b.id, { method: 'DELETE', admin: true });
                  load();
                }}>Удалить</button>
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {b.colors?.map((c) => (
                <div key={c.id} className="border rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border" style={{ background: c.hex }} />
                    <b>{c.name}</b>
                    <button className="ml-auto text-xs text-red-500" onClick={async () => {
                      await api('/api/products/base/' + b.id + '/color/' + c.id, { method: 'DELETE', admin: true });
                      load();
                    }}>удалить</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="border rounded-lg p-2 cursor-pointer">
                      Front {c.mockupFront ? '✓' : 'загрузить'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMockup(b.id, c.id, 'front', e.target.files[0])} />
                    </label>
                    <label className="border rounded-lg p-2 cursor-pointer">
                      Back {c.mockupBack ? '✓' : 'загрузить'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMockup(b.id, c.id, 'back', e.target.files[0])} />
                    </label>
                  </div>
                  {(c.mockupFront || c.mockupBack) && (
                    <div className="grid grid-cols-2 gap-2">
                      {c.mockupFront && <img src={c.mockupFront} alt="front" className="h-24 object-contain bg-slate-50 rounded border" />}
                      {c.mockupBack && <img src={c.mockupBack} alt="back" className="h-24 object-contain bg-slate-50 rounded border" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
