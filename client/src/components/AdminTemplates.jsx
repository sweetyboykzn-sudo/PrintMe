import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import TshirtCanvas, { DEFAULT_PRINT_FORMATS } from './TshirtCanvas';

/** Дефолтный layout: 3 строки + фото + 2 текста */
export const DEFAULT_TEMPLATE_LAYOUT = {
  title: {
    role: 'title',
    text: 'СТРОКА ОДИН\nСТРОКА ДВА\nСТРОКА ТРИ',
    maxLines: 3,
    fontFamily: 'Impact',
    fontSize: 0.085,
    fill: '#111111',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'center',
    left: 0.5,
    top: 0.06,
    width: 0.92
  },
  image: {
    role: 'image',
    left: 0.5,
    top: 0.4,
    width: 0.92,
    height: 0.38,
    placeholderColor: '#d1d5db',
    src: null
  },
  leftText: {
    role: 'leftText',
    text: 'Текст\nслева',
    maxLines: 6,
    fontFamily: 'Arial',
    fontSize: 0.045,
    fill: '#111111',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    left: 0.27,
    top: 0.84,
    width: 0.42
  },
  rightText: {
    role: 'rightText',
    text: 'Текст\nсправа',
    maxLines: 6,
    fontFamily: 'Arial',
    fontSize: 0.045,
    fill: '#111111',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    left: 0.73,
    top: 0.84,
    width: 0.42
  }
};

const emptyForm = () => ({
  id: null,
  name: '',
  description: '',
  active: true,
  sort: 0,
  thumbnail: null,
  layout: null
});

export default function AdminTemplates() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const editorApi = useRef(null);
  const formRef = useRef(form);
  formRef.current = form;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // сначала admin, если 401 — public
      let data;
      try {
        data = await api('/api/admin/templates');
      } catch {
        data = await api('/api/templates');
      }
      setList(data.templates || []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить шаблоны');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({
      ...emptyForm(),
      name: 'Новый шаблон',
      layout: JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_LAYOUT))
    });
    setEditing(true);
  }

  function openEdit(t) {
    setForm({
      id: t.id,
      name: t.name || '',
      description: t.description || '',
      active: t.active !== false,
      sort: t.sort ?? 0,
      thumbnail: t.thumbnail || null,
      layout: t.layout
        ? JSON.parse(JSON.stringify(t.layout))
        : JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_LAYOUT))
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(emptyForm());
    editorApi.current = null;
  }

  function applyLayoutToCanvas(layout) {
    if (!editorApi.current || !layout) return;
    editorApi.current.applyTemplate?.({ layout });
  }

  function captureLayoutFromCanvas() {
    if (!editorApi.current?.getTemplateSnapshot) {
      alert('Редактор не готов');
      return null;
    }
    const snap = editorApi.current.getTemplateSnapshot();
    if (!snap?.title || !snap?.image) {
      alert(
        'На canvas нет слотов шаблона. Нажмите «Скелет по умолчанию», расставьте элементы и сохраните снова.'
      );
      return null;
    }
    return snap;
  }

  async function handleSave() {
    const layout = captureLayoutFromCanvas() || form.layout;
    if (!layout) return;
    if (!form.name.trim()) {
      alert('Укажите название шаблона');
      return;
    }

    let thumbnail = form.thumbnail;
    try {
      thumbnail = editorApi.current?.toDataURL?.() || thumbnail;
    } catch (_) {}

    const body = {
      name: form.name.trim(),
      description: form.description || '',
      active: Boolean(form.active),
      sort: Number(form.sort) || 0,
      thumbnail: thumbnail || null,
      layout
    };

    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await api(`/api/admin/templates/${form.id}`, {
          method: 'PUT',
          body
        });
      } else {
        await api('/api/admin/templates', {
          method: 'POST',
          body
        });
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e.message || 'Ошибка сохранения');
      alert(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить шаблон?')) return;
    try {
      await api(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (form.id === id) cancelEdit();
      await load();
    } catch (e) {
      alert(e.message || 'Не удалось удалить');
    }
  }

  async function toggleActive(t) {
    try {
      await api(`/api/admin/templates/${t.id}`, {
        method: 'PUT',
        body: {
          name: t.name,
          description: t.description,
          active: !t.active,
          sort: t.sort,
          thumbnail: t.thumbnail,
          layout: t.layout
        }
      });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {form.id ? 'Редактирование шаблона' : 'Новый шаблон'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Расставьте слоты на зоне печати → «Сохранить». На витрине клиент
              правит тексты и подставляет своё фото.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : 'Сохранить шаблон'}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 space-y-3">
            <section className="bg-white border rounded-2xl p-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Название
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Классика / Именная / …"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Описание
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Кратко для витрины"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Сортировка
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-xl px-3 py-2"
                    value={form.sort}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sort: Number(e.target.value)
                      }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-6">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                  />
                  Показывать на витрине
                </label>
              </div>
            </section>

            <section className="bg-white border rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold text-sm">Слоты на мокапе</h3>
              <p className="text-[11px] text-slate-500">
                1) «Скелет» → 2) двигайте/масштабируйте слоты → 3) правьте
                тексты → 4) «Сохранить шаблон».
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm"
                  onClick={() => {
                    const layout = JSON.parse(
                      JSON.stringify(DEFAULT_TEMPLATE_LAYOUT)
                    );
                    setForm((f) => ({ ...f, layout }));
                    applyLayoutToCanvas(layout);
                  }}
                >
                  Скелет по умолчанию
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border text-sm"
                  onClick={() => applyLayoutToCanvas(form.layout)}
                >
                  Заново наложить layout
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border text-sm"
                  onClick={() => {
                    const snap = captureLayoutFromCanvas();
                    if (snap) {
                      setForm((f) => ({ ...f, layout: snap }));
                      alert('Layout снят с canvas (ещё нажмите «Сохранить шаблон»)');
                    }
                  }}
                >
                  Снять layout с canvas
                </button>
              </div>
            </section>

            <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 text-xs">
                Структура макета
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Заголовок — до 3 строк (textbox)</li>
                <li>Середина — слот фото (серый placeholder или картинка)</li>
                <li>Низ: два текстовых блока (слева / справа)</li>
              </ul>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border rounded-3xl p-4">
              <TshirtCanvas
                key={form.id || 'new-template'}
                mockupUrl={null}
                printArea={{ x: 0.12, y: 0.1, w: 0.76, h: 0.8 }}
                printAreaWidthCm={32}
                formats={DEFAULT_PRINT_FORMATS}
                selectedFormat={DEFAULT_PRINT_FORMATS[1]}
                mode="client"
                onReady={(api) => {
                  editorApi.current = api;
                  const layout =
                    formRef.current.layout ||
                    JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_LAYOUT));
                  requestAnimationFrame(() => {
                    api.applyTemplate?.({ layout });
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Шаблоны принтов</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Макеты для витрины конструктора (3 строки + фото + 2 текста)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + Новый шаблон
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Загрузка…</div>
      ) : !list.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Шаблонов пока нет. Создайте первый — он появится в конструкторе.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((t) => (
            <div
              key={t.id}
              className="bg-white border rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/5] bg-slate-100 relative">
                {t.thumbnail ? (
                  <img
                    src={t.thumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
                    нет превью
                  </div>
                )}
                {!t.active && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded">
                    скрыт
                  </span>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {t.name}
                  </div>
                  {t.description ? (
                    <div className="text-[11px] text-slate-500 line-clamp-2">
                      {t.description}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-slate-400 mt-1">
                    sort: {t.sort ?? 0} · {t.id}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-slate-50"
                  >
                    Править
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(t)}
                    className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-slate-50"
                  >
                    {t.active !== false ? 'Скрыть' : 'Показать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}