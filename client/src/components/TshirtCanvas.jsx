import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

const FONTS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Impact',
  'Trebuchet MS',
  'Comic Sans MS',
  'system-ui'
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

/** Стандартные форматы (можно переопределить пропом formats) */
export const DEFAULT_PRINT_FORMATS = [
  { id: 'a5', name: 'A5', widthCm: 14.8, heightCm: 21 },
  { id: 'a4', name: 'A4', widthCm: 21, heightCm: 29.7 },
  { id: 'a3', name: 'A3', widthCm: 29.7, heightCm: 42 },
  { id: 'a3plus', name: 'A3+', widthCm: 32, heightCm: 45 }
];

const DEFAULT_TEXT_STYLE = {
  value: 'Ваш текст',
  fontFamily: 'Arial',
  fill: '#111111',
  fontSize: 28,
  fontWeight: 'normal',
  fontStyle: 'normal'
};

const TEMPLATE_ROLES = ['title', 'image', 'leftText', 'rightText'];

/**
 * mode: "admin" | "client"
 *
 * Формат:
 *  - controlled: selectedFormat + onFormatChange
 *  - uncontrolled: initialFormat / первый из списка
 *
 * API (onReady):
 *  - applyTemplate({ layout })
 *  - getTemplateSnapshot()
 *  - clearTemplate()
 *  - addImageFromFile / addText / toDataURL / ...
 */
export default function TshirtCanvas({
  mockupUrl,
  printArea,
  printAreaWidthCm = 32,
  formats = DEFAULT_PRINT_FORMATS,
  selectedFormat = null,
  onFormatChange,
  mode = 'client',
  onReady,
  onPrintAreaChange
}) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);
  const fileInputRef = useRef(null);
  const fabricRef = useRef(null);
  const maxGuideRef = useRef(null);
  const formatGuideRef = useRef(null);
  const maxAreaRef = useRef(null);
  const formatAreaRef = useRef(null);
  const apiRef = useRef(null);
  const centerVGuide = useRef(null);
const centerHGuide = useRef(null);

  const [size, setSize] = useState({ w: 420, h: 520 });
  const [textStyle, setTextStyle] = useState(DEFAULT_TEXT_STYLE);
  const [textSelected, setTextSelected] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [localFormat, setLocalFormat] = useState(() => {
    if (selectedFormat) return selectedFormat;
    return formats?.[0] || null;
  });

  const activeFormat =
    selectedFormat !== undefined && selectedFormat !== null
      ? selectedFormat
      : localFormat;

  useEffect(() => {
    if (selectedFormat) setLocalFormat(selectedFormat);
  }, [selectedFormat?.id]);

  function handleSelectFormat(fmt) {
    if (!fmt) return;
    setLocalFormat(fmt);
    if (typeof onFormatChange === 'function') onFormatChange(fmt);
  }

  const areaNorm = {
    x: printArea?.x ?? 0.28,
    y: printArea?.y ?? 0.40,
    w: printArea?.w ?? 0.44,
    h: printArea?.h ?? 0.42
  };



  
function getPrintAreaRect() {
  const w = size.w, h = size.h, pa = printArea;
  if (!pa) return { left: 0, top: 0, width: w, height: h };
  if (pa.width != null) return pa;
  return {
    left: (pa.x ?? 0) * w,
    top: (pa.y ?? 0) * h,
    width: (pa.w ?? 1) * w,
    height: (pa.h ?? 1) * h
  };
}

function centerSelection(axis = 'both') {
  const canvas = fabricRef.current;
  if (!canvas) return;
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const area = getPrintAreaRect();
  obj.setCoords();
  const bound = obj.getBoundingRect(true);

  if (axis === 'h' || axis === 'both') {
    const cx = area.left + area.width / 2;
    const dx = cx - (bound.left + bound.width / 2);
    obj.set({ left: (obj.left ?? 0) + dx });
  }
  if (axis === 'v' || axis === 'both') {
    const cy = area.top + area.height / 2;
    const dy = cy - (bound.top + bound.height / 2);
    obj.set({ top: (obj.top ?? 0) + dy });
  }
  obj.setCoords();
  fabricRef.current.requestRenderAll();
  fabricRef.current.fire?.('object:modified', { target: obj });
}
function showCenterGuide(axis) {
  const canvas = fabricRef.current;
  const area = getPrintAreaRect();
  if (axis === 'v') {
    if (!centerVGuide.current) {
      const cx = area.left + area.width / 2;
      centerVGuide.current = new fabric.Line(
        [cx, area.top, cx, area.top + area.height],
        { stroke: '#3b82f6', strokeWidth: 2, selectable: false, evented: false }
      );
      canvas.add(centerVGuide.current);
    }
    centerVGuide.current.visible = true;
    canvas.bringToFront(centerVGuide.current);
  }
  if (axis === 'h') {
    if (!centerHGuide.current) {
      const cy = area.top + area.height / 2;
      centerHGuide.current = new fabric.Line(
        [area.left, cy, area.left + area.width, cy],
        { stroke: '#3b82f6', strokeWidth: 2, selectable: false, evented: false }
      );
      canvas.add(centerHGuide.current);
    }
    centerHGuide.current.visible = true;
    canvas.bringToFront(centerHGuide.current);
  }
  canvas.requestRenderAll();
}
function hideCenterGuides() {
  const canvas = fabricRef.current;
  if (centerVGuide.current) centerVGuide.current.visible = false;
  if (centerHGuide.current) centerHGuide.current.visible = false;
  canvas?.requestRenderAll?.();
}
function snapSelectionIfNearCenter(target, snapDist = 6) {
  if (!target) return;
  const area = getPrintAreaRect();
  const cx = area.left + area.width / 2;
  const cy = area.top + area.height / 2;
  target.setCoords();
  const bound = target.getBoundingRect(true);
  let snapped = false;
  let midX = bound.left + bound.width / 2;
  let midY = bound.top + bound.height / 2;
  if (Math.abs(midX - cx) < snapDist) {
    target.set({ left: (target.left ?? 0) + (cx - midX) });
    showCenterGuide('v');
    snapped = true;
  }
  if (Math.abs(midY - cy) < snapDist) {
    target.set({ top: (target.top ?? 0) + (cy - midY) });
    showCenterGuide('h');
    snapped = true;
  }
  if (!snapped) hideCenterGuides();
  target.setCoords();
  fabricRef.current.requestRenderAll();
}






  const isTextObject = (obj) =>
    obj &&
    obj.name !== 'max-guide' &&
    obj.name !== 'format-guide' &&
    (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox');

  const isGuide = (obj) =>
    obj && (obj.name === 'max-guide' || obj.name === 'format-guide');

  const isTemplateObject = (obj) =>
    obj && obj.role && TEMPLATE_ROLES.includes(obj.role);

  const syncTextStyleFromObject = (obj) => {
    if (!isTextObject(obj)) {
      setTextSelected(false);
      return;
    }
    setTextSelected(true);
    setTextOpen(true);
    setTextStyle({
      value: obj.text || '',
      fontFamily: obj.fontFamily || 'Arial',
      fill: obj.fill || '#111111',
      fontSize: Math.round(obj.fontSize || 28),
      fontWeight:
        obj.fontWeight === 'bold' || obj.fontWeight === 700 ? 'bold' : 'normal',
      fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal'
    });
  };

  useEffect(() => {
    let alive = true;
    let canvas = null;

    if (!canvasElRef.current) return;

    if (fabricRef.current) {
      try {
        fabricRef.current.dispose();
      } catch (_) {}
      fabricRef.current = null;
    }

    const width = Math.min(420, wrapRef.current?.clientWidth || 420);
    const height = Math.round(width * 1.24);
    setSize({ w: width, h: height });

    try {
      canvas = new fabric.Canvas(canvasElRef.current, {
        width,
        height,
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: '#e2e8f0'
      });
    } catch (e) {
      console.error(e);
      return;
    }

    fabricRef.current = canvas;

    const isAlive = () =>
      alive &&
      canvas &&
      canvas.contextContainer &&
      typeof canvas.contextContainer.clearRect === 'function';

    const safeRender = () => {
      if (!isAlive()) return;
      try {
        canvas.renderAll();
      } catch (_) {}
    };

    const maxArea = {
      left: width * areaNorm.x,
      top: height * areaNorm.y,
      width: width * areaNorm.w,
      height: height * areaNorm.h
    };
    maxAreaRef.current = { ...maxArea };

    const pxPerCm = maxArea.width / (printAreaWidthCm || 32);

    const calcFormatArea = (fmt) => {
      const max = maxAreaRef.current;
      if (!fmt) return { ...max };

      let fw = Number(fmt.widthCm) * pxPerCm;
      let fh = Number(fmt.heightCm) * pxPerCm;

      const scale = Math.min(1, max.width / fw, max.height / fh);
      fw *= scale;
      fh *= scale;

      return {
        left: max.left + (max.width - fw) / 2,
        top: max.top + (max.height - fh) / 2,
        width: fw,
        height: fh
      };
    };

    formatAreaRef.current = calcFormatArea(activeFormat);

    const makeClip = (area) =>
      new fabric.Rect({
        left: area.left,
        top: area.top,
        width: area.width,
        height: area.height,
        absolutePositioned: true
      });

    const getWorkBox = () =>
      mode === 'client' && activeFormat
        ? formatAreaRef.current
        : maxAreaRef.current;

    const commonControls = {
      cornerColor: '#3b82f6',
      borderColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false
    };

    const refreshDesignClips = () => {
      if (!isAlive()) return;
      const clipArea = getWorkBox();
      canvas.getObjects().forEach((obj) => {
        if (isGuide(obj)) return;
        obj.clipPath = makeClip(clipArea);
        obj.dirty = true;
      });
      safeRender();
    };

    const constrainObjectToFormat = (obj) => {
      if (mode !== 'client' || !activeFormat) return;
      if (!obj || isGuide(obj)) return;

      const box = formatAreaRef.current;
      obj.setCoords();

      let w = obj.getScaledWidth();
      let h = obj.getScaledHeight();

      if (w > box.width || h > box.height) {
        const s = Math.min(box.width / w, box.height / h);
        obj.scaleX *= s;
        obj.scaleY *= s;
      }

      obj.setCoords();
      w = obj.getScaledWidth();
      h = obj.getScaledHeight();

      let left = obj.left;
      let top = obj.top;

      if (obj.originX === 'center') {
        left = Math.min(
          Math.max(left, box.left + w / 2),
          box.left + box.width - w / 2
        );
      } else {
        left = Math.min(Math.max(left, box.left), box.left + box.width - w);
      }

      if (obj.originY === 'center') {
        top = Math.min(
          Math.max(top, box.top + h / 2),
          box.top + box.height - h / 2
        );
      } else if (obj.originY === 'top') {
        top = Math.min(Math.max(top, box.top), box.top + box.height - h);
      } else {
        top = Math.min(Math.max(top, box.top), box.top + box.height - h);
      }

      obj.set({ left, top });
      obj.setCoords();
    };

    const drawMaxGuide = () => {
      if (mode !== 'admin') return;
      const a = maxAreaRef.current;

      const guide = new fabric.Rect({
        left: a.left,
        top: a.top,
        width: a.width,
        height: a.height,
        fill: 'rgba(59,130,246,0.08)',
        stroke: 'rgba(37,99,235,0.95)',
        strokeWidth: 2,
        strokeDashArray: [8, 5],
        selectable: true,
        evented: true,
        lockRotation: true,
        hasRotatingPoint: false,
        lockScalingFlip: true,
        cornerColor: '#2563eb',
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerSize: 12,
        excludeFromExport: true,
        name: 'max-guide'
      });
	  
	  // Блокировать изменение размера и любые контроллы resize
guide.lockScalingX = true;
guide.lockScalingY = true;
guide.lockScalingFlip = true;
guide.lockRotation = true;
guide.hasRotatingPoint = false;
guide.set({ lockUniScaling: true, lockScalingFlip: true });
// Убрать все контроллы ресайза (и поворота!)
guide.setControlsVisibility({
  ml: false, mt: false, mr: false, mb: false,
  tl: false, tr: false, br: false, bl: false,
  mtr: false
});

// Самое главное – ЭТО ЕЩЁ РАЗ ПЕРЕЗАДАТЬ ПРИ КАЖДОМ ПАКЕТЕ РЕНДЕРА!
// Поэтому, после canvas.add(guide) добавь:
canvas.on('object:scaling', function(e) {
  if (e.target && e.target.name === 'format-guide') {
    e.target.lockScalingX = true;
    e.target.lockScalingY = true;
    e.target.scaleX = 1;
    e.target.scaleY = 1;
  }
});
      canvas.add(guide);
      maxGuideRef.current = guide;
      canvas.setActiveObject(guide);
    };

    const drawFormatGuide = () => {
      if (formatGuideRef.current) {
        canvas.remove(formatGuideRef.current);
        formatGuideRef.current = null;
      }
      if (mode !== 'client' || !activeFormat) return;

      const a = calcFormatArea(activeFormat);
      formatAreaRef.current = a;

      const guide = new fabric.Rect({
        left: a.left,
        top: a.top,
        width: a.width,
        height: a.height,
        fill: 'rgba(16,185,129,0.10)',
        stroke: 'rgba(5,150,105,0.95)',
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        selectable: true,
        evented: true,
        excludeFromExport: true,
        name: 'format-guide'
      });

      canvas.add(guide);
      formatGuideRef.current = guide;
      canvas.bringToFront(guide);
      refreshDesignClips();
    };

    const readRect = (obj) => {
      obj.setCoords();
      const b = obj.getBoundingRect(true, true);
      return {
        left: Math.max(0, b.left),
        top: Math.max(0, b.top),
        width: Math.max(20, b.width),
        height: Math.max(20, b.height)
      };
    };

    const onMaxModified = (e) => {
      const obj = e?.target;
      if (!obj || obj.name !== 'max-guide' || mode !== 'admin') return;

      const next = readRect(obj);
      next.width = Math.min(next.width, width - next.left);
      next.height = Math.min(next.height, height - next.top);
      maxAreaRef.current = next;

      obj.set({
        left: next.left,
        top: next.top,
        width: next.width,
        height: next.height,
        scaleX: 1,
        scaleY: 1
      });
      obj.setCoords();

      if (typeof onPrintAreaChange === 'function') {
        onPrintAreaChange({
          x: +(next.left / width).toFixed(4),
          y: +(next.top / height).toFixed(4),
          w: +(next.width / width).toFixed(4),
          h: +(next.height / height).toFixed(4)
        });
      }
      safeRender();
    };

    const onDesignChanging = (e) => {
      const obj = e?.target;
      if (!obj || isGuide(obj)) return;
      constrainObjectToFormat(obj);
    };
function moveObjectsWithFormatGuide(newArea) {
  const canvas = fabricRef.current;
  if (!canvas) return;
  // Вычисляем дельту перемещения —
  // СТАРОЕ положение зелёной зоны:
  const oldArea = formatAreaRef.current || newArea;
  const dx = newArea.left - oldArea.left;
  const dy = newArea.top - oldArea.top;

  // Пропускаем саму рамку (guide)
  canvas.getObjects().forEach((obj) => {
    if (obj.name === 'format-guide') return;
    // Можно добавить фильтр: только текст/картинки/элементы дизайна
    if (!obj.clipPath) return; // не трогать если нет clipPath (можно убрать если хочется двигать ВСЁ)
    if (typeof obj.left === 'number') obj.left += dx;
    if (typeof obj.top === 'number') obj.top += dy;
    obj.setCoords();
  });
  canvas.requestRenderAll();
}
    const onDesignModified = (e) => {
      const obj = e?.target;
      if (!obj || isGuide(obj)) return;
	  if (obj.name === 'format-guide') {
  const left = obj.left, top = obj.top, width = obj.width, height = obj.height;
  formatAreaRef.current = { left, top, width, height }; // !!! новая зона всегда тут
  // 1. Обнови printArea у родителя
  if (typeof onPrintAreaChange === 'function') {
    onPrintAreaChange({
      x: +(left / size.w).toFixed(4),
      y: +(top / size.h).toFixed(4),
      w: +(width / size.w).toFixed(4),
      h: +(height / size.h).toFixed(4)
    });
  }
  // 2. Перенести все объекты вместе с рамкой
  moveObjectsWithFormatGuide({ left, top, width, height });
  return;
}
      constrainObjectToFormat(obj);
      if (isTextObject(obj)) syncTextStyleFromObject(obj);
      safeRender();
    };

    const onSelection = (e) => {
      const obj = e?.selected?.[0] || canvas.getActiveObject();
      syncTextStyleFromObject(obj);
    };

    const onSelectionCleared = () => setTextSelected(false);

    canvas.on('object:modified', (e) => {
      onMaxModified(e);
      onDesignModified(e);
    });
    canvas.on('object:moving', onDesignChanging);
    canvas.on('object:scaling', onDesignChanging);
    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', onSelectionCleared);
	canvas.on('object:moving', (e) => {
  const obj = e.target;
  if (!obj || isGuide(obj)) return;
  snapSelectionIfNearCenter(obj, 6);
});
canvas.on('object:modified', hideCenterGuides);
canvas.on('selection:cleared', hideCenterGuides);
    canvas.on('text:changed', (e) => {
      if (isTextObject(e?.target)) syncTextStyleFromObject(e.target);
    });

    // ---------- helpers: templates ----------
    const findByRole = (role) =>
      canvas.getObjects().find((o) => o.role === role);

    const clearTemplateSlots = () => {
      canvas
        .getObjects()
        .slice()
        .forEach((obj) => {
          if (isTemplateObject(obj)) canvas.remove(obj);
        });
    };

    const relFontSize = (fs, box) => {
      const n = Number(fs);
      if (!n || Number.isNaN(n)) return Math.max(14, box.height * 0.05);
      // < 2 → доля высоты зоны, иначе px
      if (n > 0 && n < 2) return Math.max(10, box.height * n);
      return n;
    };

    const placeTextSlot = (slot, role) => {
      if (!slot) return null;
      const box = formatAreaRef.current;
      const fontSize = relFontSize(slot.fontSize, box);
      const w = box.width * (slot.width != null ? Number(slot.width) : 0.9);

      const t = new fabric.Textbox(slot.text || '', {
        left: box.left + box.width * (slot.left != null ? Number(slot.left) : 0.5),
        top: box.top + box.height * (slot.top != null ? Number(slot.top) : 0.1),
        originX: 'center',
        originY: role === 'title' ? 'top' : 'center',
        width: Math.max(20, w),
        fill: slot.fill || '#111111',
        fontSize,
        fontWeight: slot.fontWeight || (role === 'title' ? 'bold' : 'normal'),
        fontStyle: slot.fontStyle || 'normal',
        fontFamily: slot.fontFamily || (role === 'title' ? 'Impact' : 'Arial'),
        textAlign: slot.textAlign || 'center',
        splitByGrapheme: false,
        ...commonControls,
        clipPath: makeClip(box),
        name: `tpl-${role}`,
        role
      });

      // maxLines подсказка (мягко): не режем жёстко
      if (slot.maxLines) t.set('dataMaxLines', slot.maxLines);

      canvas.add(t);
      constrainObjectToFormat(t);
      return t;
    };

    const placeImageSlot = (slot) => {
      if (!slot) return Promise.resolve(null);
      const box = formatAreaRef.current;
      const w = box.width * (slot.width != null ? Number(slot.width) : 0.9);
      const h = box.height * (slot.height != null ? Number(slot.height) : 0.35);
      const left =
        box.left + box.width * (slot.left != null ? Number(slot.left) : 0.5);
      const top =
        box.top + box.height * (slot.top != null ? Number(slot.top) : 0.4);

      const applyMeta = (obj) => {
        obj.set({
          left,
          top,
          originX: 'center',
          originY: 'center',
          ...commonControls,
          clipPath: makeClip(box),
          name: 'tpl-image',
          role: 'image',
          placeholderColor: slot.placeholderColor || '#d1d5db'
        });
        obj.setCoords();
        constrainObjectToFormat(obj);
        canvas.add(obj);
        return obj;
      };

      if (slot.src) {
        return new Promise((resolve) => {
          fabric.Image.fromURL(
            slot.src,
            (img) => {
              if (!isAlive() || !img) {
                // fallback placeholder
                const rect = new fabric.Rect({
                  width: w,
                  height: h,
                  fill: slot.placeholderColor || '#d1d5db',
                  stroke: '#9ca3af',
                  strokeWidth: 1
                });
                resolve(applyMeta(rect));
                return;
              }
              const scale = Math.min(w / (img.width || 1), h / (img.height || 1));
              img.scale(scale);
              resolve(applyMeta(img));
              safeRender();
            },
            { crossOrigin: 'anonymous' }
          );
        });
      }

      const rect = new fabric.Rect({
        width: w,
        height: h,
        fill: slot.placeholderColor || '#d1d5db',
        stroke: '#9ca3af',
        strokeDashArray: [6, 4],
        strokeWidth: 1
      });
      applyMeta(rect);
      return Promise.resolve(rect);
    };

    const applyTemplate = async ({ layout } = {}) => {
      if (!isAlive() || !layout) return;
      clearTemplateSlots();

      if (layout.title) placeTextSlot(layout.title, 'title');
      if (layout.leftText) placeTextSlot(layout.leftText, 'leftText');
      if (layout.rightText) placeTextSlot(layout.rightText, 'rightText');
      if (layout.image) await placeImageSlot(layout.image);

      if (formatGuideRef.current) canvas.bringToFront(formatGuideRef.current);
      canvas.discardActiveObject();
      setTextSelected(false);
      safeRender();
    };

    const snapshotText = (obj, role) => {
      if (!obj) return null;
      const box = formatAreaRef.current;
      obj.setCoords();
      const bw = Math.max(1, box.width);
      const bh = Math.max(1, box.height);
      const sw = obj.getScaledWidth();
      const fontSizeRel = (obj.fontSize || 16) / bh;

      return {
        role,
        text: obj.text || '',
        maxLines: obj.dataMaxLines || (role === 'title' ? 3 : 6),
        fontFamily: obj.fontFamily || 'Arial',
        fontSize: +fontSizeRel.toFixed(4),
        fill: obj.fill || '#111111',
        fontWeight:
          obj.fontWeight === 'bold' || obj.fontWeight === 700
            ? 'bold'
            : 'normal',
        fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal',
        textAlign: obj.textAlign || 'center',
        left: +((obj.left - box.left) / bw).toFixed(4),
        top: +((obj.top - box.top) / bh).toFixed(4),
        width: +(sw / bw).toFixed(4)
      };
    };

    const snapshotImage = (obj) => {
      if (!obj) return null;
      const box = formatAreaRef.current;
      obj.setCoords();
      const bw = Math.max(1, box.width);
      const bh = Math.max(1, box.height);
      const sw = obj.getScaledWidth();
      const sh = obj.getScaledHeight();

      let src = null;
      if (obj.type === 'image') {
        src = obj.getSrc?.() || obj._element?.src || null;
        // dataURL оставляем; внешние url — тоже
      }

      return {
        role: 'image',
        left: +((obj.left - box.left) / bw).toFixed(4),
        top: +((obj.top - box.top) / bh).toFixed(4),
        width: +(sw / bw).toFixed(4),
        height: +(sh / bh).toFixed(4),
        placeholderColor: obj.placeholderColor || '#d1d5db',
        src
      };
    };

    const getTemplateSnapshot = () => {
      if (!isAlive()) return null;
      const title = findByRole('title');
      const image = findByRole('image');
      const leftText = findByRole('leftText');
      const rightText = findByRole('rightText');

      if (!title || !image) return null;

      return {
        title: snapshotText(title, 'title'),
        image: snapshotImage(image),
        leftText: snapshotText(leftText, 'leftText'),
        rightText: snapshotText(rightText, 'rightText')
      };
    };

    const replaceImageSlotFromDataUrl = (dataUrl) => {
      const slot = findByRole('image');
      const box = formatAreaRef.current;

      fabric.Image.fromURL(dataUrl, (img) => {
        if (!isAlive() || !img) {
          setBusy(false);
          return;
        }

        let left;
        let top;
        let targetW;
        let targetH;

        if (slot) {
          left = slot.left;
          top = slot.top;
          targetW = slot.getScaledWidth();
          targetH = slot.getScaledHeight();
          canvas.remove(slot);
        } else {
          left = box.left + box.width / 2;
          top = box.top + box.height / 2;
          targetW = box.width * 0.9;
          targetH = box.height * 0.38;
        }

        const scale = Math.min(
          targetW / (img.width || 1),
          targetH / (img.height || 1)
        );
        img.scale(scale);
        img.set({
          left,
          top,
          originX: 'center',
          originY: 'center',
          ...commonControls,
          clipPath: makeClip(box),
          name: 'tpl-image',
          role: 'image',
          placeholderColor: '#d1d5db'
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        constrainObjectToFormat(img);
        setTextSelected(false);
        if (formatGuideRef.current) canvas.bringToFront(formatGuideRef.current);
        setBusy(false);
        safeRender();
      });
    };

    const publishApi = () => {
      if (!isAlive()) return;

      const api = {
        constrainObject: constrainObjectToFormat,

        getSelectedFormat() {
          return activeFormat;
        },

        applyTemplate,
        getTemplateSnapshot,
        clearTemplate() {
          if (!isAlive()) return;
          clearTemplateSlots();
          safeRender();
        },

        addImageFromFile(file) {
          if (!isAlive() || !file) return;
          setBusy(true);

          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target.result;

            // если есть слот шаблона — подставляем в него
            if (findByRole('image')) {
              replaceImageSlotFromDataUrl(dataUrl);
              return;
            }

            fabric.Image.fromURL(dataUrl, (img) => {
              setBusy(false);
              if (!isAlive() || !img) return;

              const box = formatAreaRef.current;
              const scale = Math.min(
                (box.width * 0.9) / (img.width || 1),
                (box.height * 0.9) / (img.height || 1),
                1
              );

              img.scale(scale);
              img.set({
                left: box.left + box.width / 2,
                top: box.top + box.height / 2,
                originX: 'center',
                originY: 'center',
                ...commonControls,
                clipPath: makeClip(box),
                name: 'design'
              });

              canvas.add(img);
              canvas.setActiveObject(img);
              setTextSelected(false);
              if (formatGuideRef.current) canvas.bringToFront(formatGuideRef.current);
              safeRender();
            });
          };
          reader.onerror = () => setBusy(false);
          reader.readAsDataURL(file);
        },

        addText(textOrOptions = 'Ваш текст', fillArg) {
          if (!isAlive()) return null;

          const opts =
            typeof textOrOptions === 'object' && textOrOptions !== null
              ? textOrOptions
              : { text: textOrOptions, fill: fillArg };

          const box = formatAreaRef.current;
          const maxFs = Math.max(12, Math.floor(box.height * 0.35));
          const fontSize = Math.min(Number(opts.fontSize) || 28, maxFs);

          const t = new fabric.IText(opts.text || 'Ваш текст', {
            left: box.left + box.width / 2,
            top: box.top + box.height / 2,
            originX: 'center',
            originY: 'center',
            fill: opts.fill || '#111111',
            fontSize,
            fontWeight: opts.fontWeight || 'normal',
            fontStyle: opts.fontStyle || 'normal',
            fontFamily: opts.fontFamily || 'Arial',
            textAlign: 'center',
            ...commonControls,
            clipPath: makeClip(box),
            name: 'design'
          });

          canvas.add(t);
          canvas.setActiveObject(t);
          constrainObjectToFormat(t);
          syncTextStyleFromObject(t);
          setTextOpen(true);
          if (formatGuideRef.current) canvas.bringToFront(formatGuideRef.current);
          safeRender();
          return t;
        },

        updateSelectedText(patch = {}) {
          if (!isAlive()) return;
          const obj = canvas.getActiveObject();
          if (!isTextObject(obj)) return;

          obj.set({
            text: patch.text ?? patch.value ?? obj.text,
            fill: patch.fill ?? patch.color ?? obj.fill,
            fontSize: patch.fontSize ?? obj.fontSize,
            fontFamily: patch.fontFamily ?? obj.fontFamily,
            fontWeight: patch.fontWeight ?? obj.fontWeight,
            fontStyle: patch.fontStyle ?? obj.fontStyle
          });
          obj.setCoords();
          constrainObjectToFormat(obj);
          syncTextStyleFromObject(obj);
          safeRender();
        },

        getSelectedText() {
          if (!isAlive()) return null;
          const obj = canvas.getActiveObject();
          if (!isTextObject(obj)) return null;
          return {
            text: obj.text,
            fill: obj.fill,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            fontWeight: obj.fontWeight,
            fontStyle: obj.fontStyle
          };
        },

        deleteSelected() {
          if (!isAlive()) return;
          canvas.getActiveObjects().forEach((obj) => {
            if (!isGuide(obj)) canvas.remove(obj);
          });
          canvas.discardActiveObject();
          setTextSelected(false);
          safeRender();
        },

        getPrintArea() {
          const a = maxAreaRef.current;
          return {
            x: +(a.left / width).toFixed(4),
            y: +(a.top / height).toFixed(4),
            w: +(a.width / width).toFixed(4),
            h: +(a.height / height).toFixed(4)
          };
        },

        toJSON() {
          if (!isAlive()) return null;
          return canvas.toJSON(['name', 'role', 'placeholderColor', 'dataMaxLines']);
        },

        toDataURL() {
          if (!isAlive()) return null;
          const hide = [maxGuideRef.current, formatGuideRef.current];
          hide.forEach((g) => g && (g.visible = false));
          const url = canvas.toDataURL({
            format: 'png',
            quality: 0.92,
            multiplier: 1.5
          });
          hide.forEach((g) => g && (g.visible = true));
          safeRender();
          return url;
        },

        hasDesign() {
          if (!isAlive()) return false;
          return canvas.getObjects().some((o) => !isGuide(o));
        }
      };

      apiRef.current = api;
      if (typeof onReady === 'function') onReady(api);
    };

    const start = () => {
      drawMaxGuide();
      drawFormatGuide();
      publishApi();
      safeRender();
    };

    if (!mockupUrl) {
      start();
    } else {
      fabric.Image.fromURL(
        mockupUrl,
        (img) => {
          if (!isAlive()) return;
          if (!img || !img.width) {
            start();
            return;
          }
          const scale = Math.min(width / img.width, height / img.height);
          canvas.setBackgroundImage(
            img,
            () => {
              if (!isAlive()) return;
              start();
            },
            {
              originX: 'center',
              originY: 'center',
              left: width / 2,
              top: height / 2,
              scaleX: scale,
              scaleY: scale
            }
          );
        },
        { crossOrigin: 'anonymous' }
      );
    }

    return () => {
      alive = false;
      apiRef.current = null;
      if (fabricRef.current) {
        try {
          fabricRef.current.backgroundImage = null;
          fabricRef.current.dispose();
        } catch (_) {}
        fabricRef.current = null;
      }
    };
  }, [
    mockupUrl,
    mode,
    areaNorm.x,
    areaNorm.y,
    areaNorm.w,
    areaNorm.h,
    printAreaWidthCm,
    activeFormat?.id,
    activeFormat?.widthCm,
    activeFormat?.heightCm
  ]);

  const clientNeedsFormat = mode === 'client' && !activeFormat;
  const formatList =
    Array.isArray(formats) && formats.length ? formats : DEFAULT_PRINT_FORMATS;

  function handleAddImageClick() {
    if (clientNeedsFormat || busy) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    apiRef.current?.addImageFromFile(file);
  }

  function handleAddText() {
    if (clientNeedsFormat) return;
    apiRef.current?.addText({
      text: textStyle.value || 'Ваш текст',
      fill: textStyle.fill,
      fontSize: textStyle.fontSize,
      fontFamily: textStyle.fontFamily,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle
    });
    setTextOpen(true);
  }

  function handleTextPatch(patch) {
    const next = { ...textStyle, ...patch };
    setTextStyle(next);
    if (textSelected) {
      apiRef.current?.updateSelectedText({
        text: next.value,
        fill: next.fill,
        fontSize: next.fontSize,
        fontFamily: next.fontFamily,
        fontWeight: next.fontWeight,
        fontStyle: next.fontStyle
      });
    }
  }

  function handleDelete() {
    apiRef.current?.deleteSelected();
  }

  return (
    <div ref={wrapRef} className="w-full max-w-[420px] mx-auto space-y-3">
      {mode === 'client' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Формат печати
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                От размера зависит зелёная зона на мокапе
              </div>
            </div>
            {activeFormat && (
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold text-emerald-700">
                  {activeFormat.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeFormat.widthCm}×{activeFormat.heightCm} см
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {formatList.map((fmt) => {
              const active = activeFormat?.id === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleSelectFormat(fmt)}
                  className={
                    'relative flex flex-col items-center justify-center rounded-xl px-1 py-2.5 text-center transition border ' +
                    (active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50')
                  }
                >
                  <span className="text-sm font-bold leading-none">
                    {fmt.name}
                  </span>
                  <span
                    className={
                      'text-[9px] mt-1 leading-tight ' +
                      (active ? 'text-emerald-100' : 'text-slate-400')
                    }
                  >
                    {fmt.widthCm}×{fmt.heightCm}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[11px] leading-snug text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        {mode === 'admin'
          ? 'Админ: синяя рамка — max-зона печати. Тяните края, чтобы изменить.'
          : activeFormat
            ? `${activeFormat.name} · ${activeFormat.widthCm}×${activeFormat.heightCm} см · зелёная рамка — лимит печати`
            : 'Выберите формат печати — затем добавьте изображение или текст'}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-3 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={handleAddImageClick}
            disabled={clientNeedsFormat || busy}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16m-2-2l1.5-1.5a2 2 0 012.8 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {busy ? 'Загрузка…' : 'Изображение'}
          </button>

          <button
            type="button"
            onClick={handleAddText}
            disabled={clientNeedsFormat}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7V5h16v2M9 19h6M12 5v14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Текст
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
            title="Удалить выделенное"
          >
            Удалить
          </button>
        </div>

        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setTextOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition"
            aria-expanded={textOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-slate-800">
                Настройки текста
              </span>
              {textSelected && (
                <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  выделен
                </span>
              )}
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className={
                'shrink-0 text-slate-400 transition-transform duration-200 ' +
                (textOpen ? 'rotate-180' : '')
              }
              fill="none"
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={
              'grid transition-[grid-template-rows] duration-200 ease-out ' +
              (textOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
            }
          >
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-3">
                {!textSelected && (
                  <p className="text-[11px] text-slate-400">
                    Добавьте текст или выделите его на мокапе — стили применятся сразу.
                  </p>
                )}

                <label className="block text-xs font-medium text-slate-600">
                  Надпись
                  <input
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    value={textStyle.value}
                    onChange={(e) => handleTextPatch({ value: e.target.value })}
                    placeholder="Ваш текст…"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Шрифт
                    <select
                      className="mt-1 w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={textStyle.fontFamily}
                      onChange={(e) =>
                        handleTextPatch({ fontFamily: e.target.value })
                      }
                      style={{ fontFamily: textStyle.fontFamily }}
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    <span className="flex justify-between">
                      <span>Размер</span>
                      <span className="text-slate-400 font-normal">
                        {textStyle.fontSize}px
                      </span>
                    </span>
                    <input
                      type="range"
                      className="mt-2 w-full accent-blue-600"
                      min={12}
                      max={96}
                      step={1}
                      value={textStyle.fontSize}
                      onChange={(e) =>
                        handleTextPatch({ fontSize: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">
                    Цвет
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_COLORS.map((c) => {
                      const active =
                        String(textStyle.fill).toLowerCase() === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          title={c}
                          onClick={() => handleTextPatch({ fill: c })}
                          className={
                            'h-7 w-7 rounded-full border-2 shrink-0 transition ' +
                            (active
                              ? 'border-blue-600 scale-110 shadow-sm'
                              : 'border-slate-200 hover:scale-105')
                          }
                          style={{ backgroundColor: c }}
                        />
                      );
                    })}
                    <label
                      className="h-7 w-9 rounded-lg border border-slate-200 overflow-hidden cursor-pointer ml-0.5"
                      title="Свой цвет"
                    >
                      <input
                        type="color"
                        className="h-10 w-12 -m-1 cursor-pointer border-0"
                        value={
                          /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(textStyle.fill)
                            ? textStyle.fill
                            : '#111111'
                        }
                        onChange={(e) =>
                          handleTextPatch({ fill: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTextPatch({
                        fontWeight:
                          textStyle.fontWeight === 'bold' ? 'normal' : 'bold'
                      })
                    }
                    className={
                      'w-9 h-9 rounded-lg border text-sm font-bold transition ' +
                      (textStyle.fontWeight === 'bold'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                    }
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTextPatch({
                        fontStyle:
                          textStyle.fontStyle === 'italic' ? 'normal' : 'italic'
                      })
                    }
                    className={
                      'w-9 h-9 rounded-lg border text-sm italic transition ' +
                      (textStyle.fontStyle === 'italic'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                    }
                  >
                    I
                  </button>

                  {textSelected && (
                    <span className="text-[11px] text-slate-400 ml-1">
                      Двойной клик по тексту на мокапе — правка на месте
                    </span>
                  )}
				  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto rounded-2xl shadow-md border border-slate-200 overflow-hidden bg-slate-200 ring-1 ring-black/5"
        style={{ width: size.w, height: size.h }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}