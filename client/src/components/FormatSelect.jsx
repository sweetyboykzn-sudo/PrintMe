import React from 'react';
import { useEffect, useState } from 'react';
import { getPrintFormats } from '../api/printFormats';
import './FormatSelect.css';

export default function FormatSelect({ value, onChange }) {
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    getPrintFormats()
      .then((list) => {
        if (!alive) return;
        const arr = Array.isArray(list) ? list : [];
        setFormats(arr);
        // автовыбор первого, если ещё ничего не выбрано
        if (!value && arr.length && onChange) {
          onChange(arr[0]);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'Ошибка загрузки');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="format-status">Загрузка форматов…</p>;
  if (error) return <p className="format-status format-error">{error}</p>;
  if (!formats.length) {
    return <p className="format-status">Форматы пока не добавлены</p>;
  }

  const selectedId = value?.id || '';

  return (
    <div className="format-select">
      <div className="format-select__title">Формат печати</div>

      <div className="format-select__grid" role="listbox" aria-label="Формат печати">
        {formats.map((f) => {
          const active = f.id === selectedId;
          return (
            <button
              key={f.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`format-card${active ? ' is-active' : ''}`}
              onClick={() => onChange?.(f)}
            >
              <span className="format-card__name">{f.name}</span>
              <span className="format-card__size">
                {f.widthCm} × {f.heightCm} см
              </span>
              <span className="format-card__price">{f.price} ₽</span>
            </button>
          );
        })}
      </div>

      {value && (
        <p className="format-select__hint">
          Выбрано: <strong>{value.name}</strong>
          {' — '}
          {value.widthCm}×{value.heightCm} см, от {value.price} ₽
        </p>
      )}
    </div>
  );
}