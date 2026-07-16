import React from 'react';
import { useEffect, useState } from 'react';
import {
  getAllPrintFormats,
  createPrintFormat,
  updatePrintFormat,
  deletePrintFormat
} from '../../api/printFormats';

const emptyForm = {
  name: '',
  widthCm: '',
  heightCm: '',
  price: '',
  enabled: true,
  y: ''
};

export default function FormatsPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await getAllPrintFormats();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить форматы');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item) {
    setEditId(item.id);
    setForm({
      name: item.name ?? '',
      widthCm: String(item.widthCm ?? ''),
      heightCm: String(item.heightCm ?? ''),
      price: String(item.price ?? ''),
      enabled: item.enabled !== false,
	  y: item.y ?? '' 
    });
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
  }

  function buildBody() {
    return {
      name: form.name.trim(),
      widthCm: Number(form.widthCm),
      heightCm: Number(form.heightCm),
      price: Number(form.price),
      enabled: !!form.enabled,
	  y: form.y === '' ? undefined : Number(form.y)
    };
  }

  function validate(body) {
    if (!body.name) return 'Укажите название';
    if (!body.widthCm || body.widthCm <= 0) return 'Укажите ширину';
    if (!body.heightCm || body.heightCm <= 0) return 'Укажите высоту';
    if (Number.isNaN(body.price) || body.price < 0) return 'Укажите цену';
	if (body.y !== undefined && (body.y < 0 || body.y > 1)) return 'Y должен быть от 0 до 1';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const body = buildBody();
    const v = validate(body);
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editId) {
        await updatePrintFormat(editId, body);
      } else {
        await createPrintFormat(body);
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm('Удалить формат?')) return;
    setError('');
    try {
      await deletePrintFormat(id);
      if (editId === id) resetForm();
      await load();
    } catch (e) {
      setError(e?.message || 'Ошибка удаления');
    }
  }

  async function toggleEnabled(item) {
    setError('');
    try {
      await updatePrintFormat(item.id, {
        enabled: item.enabled === false
      });
      await load();
    } catch (e) {
      setError(e?.message || 'Не удалось изменить статус');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">
          {editId ? 'Редактировать формат' : 'Добавить формат'}
        </h2>

        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-slate-600">Название</span>
            <input
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="А4"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600">Цена, ₽</span>
            <input
              type="number"
              min="0"
              step="1"
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="500"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600">Ширина, см</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.widthCm}
              onChange={(e) => setForm((f) => ({ ...f, widthCm: e.target.value }))}
              placeholder="21"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600">Высота, см</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.heightCm}
              onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
              placeholder="29.7"
              required
            />
          </label>
		  
		  <label className="block text-sm">
			<span className="text-slate-600">Y (смещение вниз, от 0 до 1)</span>
			<input
			type="number"
			min="0"
			max="1"
			step="0.01"
			className="mt-1 w-full border rounded-xl px-3 py-2"
			value={form.y}
			onChange={e => setForm(f => ({ ...f, y: e.target.value }))}
			placeholder="0.1"
			/>
		</label>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
            />
            Показывать на витрине (enabled)
          </label>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : editId ? 'Сохранить' : 'Добавить'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border bg-white"
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Список форматов</h2>
          <button
            type="button"
            onClick={load}
            className="text-sm text-blue-600 hover:underline"
          >
            Обновить
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Загрузка…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500 text-sm">Форматов пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-3">Название</th>
                  <th className="py-2 pr-3">Размер</th>
				  <th className="py-2 pr-3">Y (смещение)</th>
				  <th className="py-2 pr-3">Цена</th>
                  <th className="py-2 pr-3">Витрина</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const on = item.enabled !== false;
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">{item.name}</td>
                      <td className="py-3 pr-3">
                        {item.widthCm}×{item.heightCm} см
                      </td>
					  
					  
					  
					  
					  
                      <td className="py-3 pr-3">{item.price} ₽</td>
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => toggleEnabled(item)}
                          className={
                            'text-xs px-2 py-1 rounded-lg border ' +
                            (on
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500')
                          }
                        >
                          {on ? 'Вкл' : 'Выкл'}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-blue-600 hover:underline"
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="text-red-500 hover:underline"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}