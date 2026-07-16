import React from 'react';
import { useEffect, useState } from 'react';
import { getAllPrintFormats, savePrintFormats } from '../../api/printFormats';

export default function PrintFormats() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getAllPrintFormats()
      .then(setList)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);

  function updateRow(id, patch) {
    setList((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addRow() {
    setList((prev) => [
      ...prev,
      {
        id: `format_${Date.now()}`,
        name: 'Новый формат',
        widthCm: 20,
        heightCm: 30,
        price: 0,
        enabled: true,
        sort: prev.length + 1,
		y: 0.1,
      },
    ]);
  }

  function removeRow(id) {
    setList((prev) => prev.filter((f) => f.id !== id));
  }

  async function onSave() {
    setSaving(true);
    setMessage('');
    try {
      const result = await savePrintFormats(list);
      setList(result.items || list);
      setMessage('Сохранено');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <h1>Форматы печати</h1>

      {message && (
        <p style={{ color: message === 'Сохранено' ? 'green' : 'crimson' }}>
          {message}
        </p>
      )}

      <table cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Название</th>
            <th align="left">Ширина, см</th>
            <th align="left">Высота, см</th>
			<th align="left">Y (смещение)</th>
            <th align="left">Цена</th>
            <th align="left">Сорт.</th>
            <th align="left">Включён</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((f) => (
            <tr key={f.id} style={{ borderTop: '1px solid #ddd' }}>
              <td>
                <input
                  value={f.name}
                  onChange={(e) => updateRow(f.id, { name: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.1"
                  value={f.widthCm}
                  onChange={(e) =>
                    updateRow(f.id, { widthCm: Number(e.target.value) })
                  }
                  style={{ width: 90 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.1"
                  value={f.heightCm}
                  onChange={(e) =>
                    updateRow(f.id, { heightCm: Number(e.target.value) })
                  }
                  style={{ width: 90 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={f.price}
                  onChange={(e) =>
                    updateRow(f.id, { price: Number(e.target.value) })
                  }
                  style={{ width: 100 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={f.sort}
                  onChange={(e) =>
                    updateRow(f.id, { sort: Number(e.target.value) })
                  }
                  style={{ width: 70 }}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!f.enabled}
                  onChange={(e) =>
                    updateRow(f.id, { enabled: e.target.checked })
                  }
                />
              </td>
              <td>
                <button type="button" onClick={() => removeRow(f.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button type="button" onClick={addRow}>
          Добавить формат
        </button>
        <button type="button" onClick={onSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}