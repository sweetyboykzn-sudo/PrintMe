const API_URL = import.meta.env.VITE_API_URL; // Добавляем такую строку!

const adminPass = () => localStorage.getItem('adminPassword') || '';

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (options.admin) headers['x-admin-password'] = adminPass();

  // Если path начинается с '/', добавляем API_URL впереди:
  const url = path.startsWith('/')
    ? `${API_URL}${path}`
    : path;

  const res = await fetch(url, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && headers['Content-Type']?.includes('json')
        ? JSON.stringify(options.body)
        : options.body
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}