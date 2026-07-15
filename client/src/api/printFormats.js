const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  // DELETE может вернуть пустое тело
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

/** Витрина — только enabled */
export function getPrintFormats() {
  return request('/print-formats');
}

/** Админка — все форматы */
export function getAllPrintFormats() {
  return request('/print-formats?all=1');
}

/** Сохранить весь список */
export function savePrintFormats(list) {
  return request('/print-formats', {
    method: 'PUT',
    body: JSON.stringify(list),
  });
}

export function createPrintFormat(item) {
  return request('/print-formats', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function updatePrintFormat(id, patch) {
  return request(`/print-formats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deletePrintFormat(id) {
  return request(`/print-formats/${id}`, {
    method: 'DELETE',
  });
}