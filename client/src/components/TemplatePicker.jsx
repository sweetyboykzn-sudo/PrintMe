import React from 'react';
export default function TemplatePicker({
  templates = [],
  value = null,
  loading = false,
  onChange
}) {
  const list = Array.isArray(templates) ? templates : [];

  function select(tpl) {
    if (!onChange) return;
    // повторный клик по активному — сброс
    if (value?.id && tpl?.id && value.id === tpl.id) onChange(null);
    else onChange(tpl);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
        Загрузка шаблонов…
      </div>
    );
  }

  if (!list.length) {
    return null; // нет шаблонов — блок не показываем
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">Шаблоны</div>
          <div className="text-[11px] text-slate-400">
            Выберите макет — тексты и фото можно заменить
          </div>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="text-[11px] text-slate-500 hover:text-red-600 shrink-0"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {list.map((tpl) => {
          const active = value?.id === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => select(tpl)}
              className={
                'shrink-0 w-[104px] rounded-xl border overflow-hidden text-left transition ' +
                (active
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-blue-300')
              }
            >
              <div className="aspect-[4/5] bg-slate-100 relative">
                {tpl.thumbnail ? (
                  <img
                    src={tpl.thumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[10px] text-slate-400 px-1 text-center">
                    {tpl.name || 'шаблон'}
                  </div>
                )}
              </div>
              <div className="px-1.5 py-1.5">
                <div className="text-[11px] font-medium text-slate-800 truncate">
                  {tpl.name || 'Без названия'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}