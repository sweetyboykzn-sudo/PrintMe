import { useEffect, useState } from 'react';
import {
  getAllPrintFormats,
  savePrintFormats,
} from '../../api/printFormats';

const emptyRow = () => ({
  id: '',
  name: '',
  widthCm: 21,
  heightCm: 29.7,
  price: 0,
  enabled: true,
  sort: 0,
});

export default function AdminPrintFormats() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const list = await getAllPrintFormats();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setMessage(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (index, patch) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        ...emptyRow(),
        sort: prev.reduce((m, r) => Math.max(m, Number(r.sort) || 0), 0) + 1,
      },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = rows.map((r, i) => ({
        ...r,
        id:
          String(r.id || r.name || `fmt-${i + 1}`)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-') || `fmt-${i + 1}`,
        name: String(r.name || r.id || '').trim(),
        widthCm: Number(r.widthCm) || 0,
        heightCm: Number(r.heightCm) || 0,
        price: Number(r.price) || 0,
        enabled: r.enabled !== false,
        sort: Number(r.sort) || i + 1,
      }));

      const saved = await savePrintFormats(payload);
      setRows(saved);
      setMessage('Сохранено');
    } catch (e) {
      setMessage(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Загрузка…</p>;

  return (
    <div className="admin-print-formats">
      <h2>Форматы печати</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Ширина, см</th>
            <th>Высота, см</th>
			<th>Y (смещение вниз, 0...1)</th>
            <th>Цена, ₽</th>
            <th>Сорт.</th>
            <th>Вкл.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              <td>
                <input
                  value={row.id}
                  onChange={(e) => updateRow(index, { id: e.target.value })}
                  placeholder="a4"
                />
              </td>
              <td>
                <input
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder="А4"
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.1"
                  value={row.widthCm}
                  onChange={(e) =>
                    updateRow(index, { widthCm: e.target.value })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.1"
                  value={row.heightCm}
                  onChange={(e) =>
                    updateRow(index, { heightCm: e.target.value })
                  }
                />
              </td>
			  <td>
				<input
				type="number"
				min={0}
				max={1}
				step={0.01}
				value={row.y ?? ''}
				placeholder="0.1"
				onChange={e => updateRow(index, { y: e.target.value === '' ? undefined : Number(e.target.value) })}
				title="Смещение зоны принта вниз (от 0 до 1)"
			  />
			 </td>
              <td>
                <input
                  type="number"
                  value={row.price}
                  onChange={(e) => updateRow(index, { price: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.sort}
                  onChange={(e) => updateRow(index, { sort: e.target.value })}
                />
              </td>
			  
			  
			   
			 
              <td>
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) =>
                    updateRow(index, { enabled: e.target.checked })
                  }
                />
              </td> 
			  			 
              <td>
                <button type="button" onClick={() => removeRow(index)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={addRow}>
          + Добавить
        </button>
        <button type="button" onClick={onSave} disabled={saving}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button type="button" onClick={load}>
          Обновить
        </button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}