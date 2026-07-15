const FONTS = [
  { id: 'Arial', label: 'Arial' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Times New Roman', label: 'Times New Roman' },
  { id: 'Courier New', label: 'Courier New' },
  { id: 'Verdana', label: 'Verdana' },
  { id: 'Impact', label: 'Impact' },
  { id: 'Comic Sans MS', label: 'Comic Sans' },
  { id: 'Trebuchet MS', label: 'Trebuchet' },
  { id: 'system-ui', label: 'System' }
];

const PRESET_COLORS = [
  '#111111',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#78716c'
];

export default function TextControls({ value, onChange }) {
  const t = value || {};

  function patch(p) {
    onChange?.({ ...t, ...p });
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4">
      <div className="font-semibold text-slate-800">Текст на печати</div>

      <label className="block text-sm">
        <span className="text-slate-600">Надпись</span>
        <textarea
          className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[72px]"
          placeholder="Ваш текст…"
          value={t.value || ''}
          onChange={(e) => patch({ value: e.target.value })}
          maxLength={120}
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-slate-600">Шрифт</span>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
            value={t.fontFamily || 'Arial'}
            onChange={(e) => patch({ fontFamily: e.target.value })}
            style={{ fontFamily: t.fontFamily || 'Arial' }}
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">Размер: {t.fontSize ?? 32}px</span>
          <input
            type="range"
            className="mt-2 w-full"
            min={12}
            max={120}
            step={1}
            value={t.fontSize ?? 32}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
          />
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={12}
              max={120}
              className="w-24 rounded-lg border px-2 py-1 text-sm"
              value={t.fontSize ?? 32}
              onChange={(e) =>
                patch({
                  fontSize: Math.min(120, Math.max(12, Number(e.target.value) || 12))
                })
              }
            />
            <span className="text-xs text-slate-400 self-center">12–120</span>
          </div>
        </label>
      </div>

      <div className="text-sm">
        <span className="text-slate-600">Цвет</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => patch({ color: c })}
              className={
                'h-8 w-8 rounded-full border-2 shrink-0 ' +
                ((t.color || '#111111').toLowerCase() === c
                  ? 'border-blue-600 scale-110'
                  : 'border-slate-200')
              }
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="flex items-center gap-2 text-xs text-slate-500 ml-1">
            <input
              type="color"
              value={t.color || '#111111'}
              onChange={(e) => patch({ color: e.target.value })}
              className="h-8 w-10 cursor-pointer border rounded"
            />
            Свой
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => patch({ bold: !t.bold })}
          className={
            'px-3 py-1.5 rounded-lg border text-sm font-bold ' +
            (t.bold ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          B
        </button>
        <button
          type="button"
          onClick={() => patch({ italic: !t.italic })}
          className={
            'px-3 py-1.5 rounded-lg border text-sm italic ' +
            (t.italic ? 'bg-blue-600 text-white' : 'bg-white')
          }
        >
          I
        </button>
        {(t.value || '').trim() && (
          <button
            type="button"
            onClick={() =>
              patch({ value: '', x: null, y: null, fontSize: 32, color: '#111111' })
            }
            className="px-3 py-1.5 rounded-lg border text-sm text-red-500"
          >
            Очистить текст
          </button>
        )}
      </div>

      {(t.value || '').trim() && (
        <p
          className="text-sm text-slate-500 truncate border rounded-xl px-3 py-2 bg-slate-50"
          style={{
            fontFamily: t.fontFamily || 'Arial',
            color: t.color || '#111',
            fontSize: Math.min(22, t.fontSize || 32),
            fontWeight: t.bold ? 700 : 400,
            fontStyle: t.italic ? 'italic' : 'normal'
          }}
        >
          {t.value}
        </p>
      )}
    </div>
  );
}