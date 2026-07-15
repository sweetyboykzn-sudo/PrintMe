import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import TshirtCanvas, { DEFAULT_PRINT_FORMATS } from '../components/TshirtCanvas';
import OrderForm from '../components/OrderForm';
import TemplatePicker from '../components/TemplatePicker';

export default function Constructor() {
  const [bases, setBases] = useState([]);
  const [baseId, setBaseId] = useState('');
  const [colorId, setColorId] = useState('');
  const [side, setSide] = useState('front');
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formats, setFormats] = useState(DEFAULT_PRINT_FORMATS);
  const [format, setFormat] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [template, setTemplate] = useState(null);
// Это надо вставить перед <TshirtCanvas ... />
const baseWidthCm = 60;        // это ширина всего макета, обычно не меняется
const baseHeightCm = 90;       // можно взять "на глаз", обычно стандартная высота футболки

const formatWidthCm = Number(format?.widthCm) || 21;   // ширина формата (например, 21 для А4)
const formatHeightCm = Number(format?.heightCm) || 29.7; // высота формата (например, 29.7 для А4)

const wNorm = formatWidthCm / baseWidthCm;      // отношение ширины формата к ширине макета
const hNorm = formatHeightCm / baseHeightCm;    // отношение высоты формата к высоте макета
const xNorm = (1 - wNorm) / 2;
const [areaX, setAreaX] = useState(xNorm); // xNorm по центру
const [areaY, setAreaY] = useState(Number(format?.y ?? 0.1)); // areaY по формату
useEffect(() => {
  setAreaX(xNorm);
  setAreaY(Number(format?.y ?? 0.1)); // ← вот тут Y берётся из формата!
}, [formatWidthCm, formatHeightCm, format?.y]);

const printArea = {
  x: areaX,
  y: areaY,
  w: wNorm,
  h: hNorm,
};

  const editorApi = useRef(null);
  const templateRef = useRef(null);
  templateRef.current = template;
  
  useEffect(() => {
    api('/api/products')
      .then((d) => {
        setBases(d.bases || []);
        if (d.bases?.[0]) {
          setBaseId(d.bases[0].id);
          setColorId(d.bases[0].colors?.[0]?.id || '');
          setSize(d.bases[0].sizes?.[1] || d.bases[0].sizes?.[0] || 'M');
        }

        if (Array.isArray(d.formats) && d.formats.length) {
          setFormats(d.formats);
          setFormat(d.formats[0]);
        }
      })
      .catch(console.error);

    api('/api/print-formats')
      .then((d) => {
        const list = d.formats || d.items || (Array.isArray(d) ? d : null);
        if (Array.isArray(list) && list.length) {
          setFormats(list);
          setFormat((prev) => prev || list[0]);
        }
      })
      .catch(() => {});

    setTemplatesLoading(true);
    api('/api/templates')
      .then((d) => {
        setTemplates(d.templates || []);
      })
      .catch(() => {
        setTemplates([]);
      })
      .finally(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    if (!format && formats?.length) {
      setFormat(formats[0]);
    }
  }, [formats, format]);

  const base = useMemo(
    () => bases.find((b) => b.id === baseId),
    [bases, baseId]
  );

  const color = useMemo(
    () => base?.colors?.find((c) => c.id === colorId),
    [base, colorId]
  );

  const mockupUrl =
    (side === 'back' ? color?.mockupBack : color?.mockupFront) || null;

  const total = useMemo(() => {
    if (!base) return 0;
    const formatPrice = Number(format?.price) || 0;
    return (Number(base.basePrice) + formatPrice) * Number(qty || 1);
  }, [base, format, qty]);

  function applyTplToEditor(api, tpl) {
    if (!api) return;
    if (!tpl?.layout) {
      api.clearTemplate?.();
      return;
    }
    api.applyTemplate?.({ layout: tpl.layout });
  }

  function handleTemplateChange(tpl) {
    setTemplate(tpl);
    if (!editorApi.current) return;
    applyTplToEditor(editorApi.current, tpl);
  }

  async function submit(customer) {
    if (!editorApi.current) return alert('Редактор не готов');
    if (!editorApi.current.hasDesign()) {
      return alert('Добавьте принт, текст или выберите шаблон');
    }

    const selected =
      format || editorApi.current.getSelectedFormat?.() || null;

    setLoading(true);
    try {
      const data = await api('/api/orders', {
        method: 'POST',
        body: {
          baseId,
          colorId,
          size,
          quantity: qty,
          side,
          formatId: selected?.id || null,
          formatName: selected?.name || null,
          formatPrice: Number(selected?.price) || 0,
          templateId: template?.id || null,
          templateName: template?.name || null,
          designJson: editorApi.current.toJSON(),
          previewDataUrl: editorApi.current.toDataURL(),
          customer,
          comment: customer.comment
        }
      });
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else alert('Заказ ' + data.orderId + ' создан');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3 space-y-4">
        <section className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Основа</h2>
          <select
            className="w-full border rounded-xl px-3 py-2.5"
            value={baseId}
            onChange={(e) => {
              const id = e.target.value;
              setBaseId(id);
              const b = bases.find((x) => x.id === id);
              setColorId(b?.colors?.[0]?.id || '');
              setSize(b?.sizes?.[1] || b?.sizes?.[0] || 'M');
            }}
          >
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </section>

        <section className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Цвет</h2>
          <div className="flex flex-wrap gap-2">
            {base?.colors?.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => setColorId(c.id)}
                className={
                  'w-10 h-10 rounded-full border-2 ' +
                  (colorId === c.id
                    ? 'border-blue-600 ring-2 ring-blue-200'
                    : 'border-slate-200')
                }
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Сторона / размер</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('front')}
              className={
                'py-2 rounded-xl border ' +
                (side === 'front' ? 'bg-blue-600 text-white' : '')
              }
            >
              Перед
            </button>
            <button
              type="button"
              onClick={() => setSide('back')}
              className={
                'py-2 rounded-xl border ' +
                (side === 'back' ? 'bg-blue-600 text-white' : '')
              }
            >
              Спина
            </button>
          </div>
          <select
            className="w-full border rounded-xl px-3 py-2.5"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {(base?.sizes || []).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label className="block text-sm text-slate-600">
            Количество
            <input
              type="number"
              min={1}
              max={50}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2.5"
            />
          </label>
        </section>

        <section className="bg-white border rounded-2xl p-5 space-y-2">
          <h2 className="font-semibold">Сумма</h2>
          <div className="text-sm text-slate-600 flex justify-between">
            <span>Основа</span>
            <span>
              {Number(base?.basePrice || 0).toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="text-sm text-slate-600 flex justify-between">
            <span>Печать {format?.name ? `(${format.name})` : ''}</span>
            <span>
              {Number(format?.price || 0).toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {template && (
            <div className="text-sm text-slate-600 flex justify-between">
              <span>Шаблон</span>
              <span className="truncate max-w-[55%] text-right">
                {template.name}
              </span>
            </div>
          )}
          <div className="pt-2 border-t flex justify-between font-bold text-lg">
            <span>Итого × {qty}</span>
            <span>{total.toLocaleString('ru-RU')} ₽</span>
          </div>
          {!format && (
            <p className="text-[11px] text-amber-600">
              Выберите формат печати на мокапе
            </p>
          )}
        </section>
      </aside>

      <section className="lg:col-span-5">
        <div className="bg-white border rounded-3xl p-4 space-y-3">
          {!mockupUrl && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Мокап не загружен. Загрузите фото в админке.
            </div>
          )}

          <TemplatePicker
            templates={templates}
            value={template}
            loading={templatesLoading}
            onChange={handleTemplateChange}
          />

          {color && (
            <TshirtCanvas
              key={`${base?.id || 'b'}-${color?.id || 'c'}-${side}`}
              mockupUrl={mockupUrl}
              printArea={printArea}
			  onPrintAreaChange={(xy) => {
    if (xy.x !== undefined) setAreaX(xy.x);
    if (xy.y !== undefined) setAreaY(xy.y);
  }}
              printAreaWidthCm={32}
              formats={formats}
              selectedFormat={format}
              onFormatChange={setFormat}
              mode="client"
              onReady={(api) => {
                editorApi.current = api;
                const tpl = templateRef.current;
                if (tpl?.layout) {
                  requestAnimationFrame(() => {
                    applyTplToEditor(api, tpl);
                  });
                }
              }}
            />
          )}
        </div>
      </section>

      <aside className="lg:col-span-4">
        <div className="bg-white border rounded-2xl p-6 sticky top-24">
          <h2 className="font-bold text-xl mb-4">Оформление</h2>
          <OrderForm total={total} loading={loading} onSubmit={submit} />
        </div>
      </aside>
    </main>
  );
}