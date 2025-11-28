const API_BASE = import.meta.env.VITE_API_BASE || '';
const SOCKET_URL =
  API_BASE ||
  (import.meta.env.DEV && typeof window !== 'undefined'
    ? 'http://localhost:3001'
    : window.location.origin);

const buildUrl = (path) => `${API_BASE}${path}`;

const apiFetch = async (path, options = {}) => {
  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let error = 'Erreur réseau';
    try {
      const body = await res.json();
      error = body.error || JSON.stringify(body);
    } catch {
      error = res.statusText || error;
    }
    throw new Error(error);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
};

export { API_BASE, SOCKET_URL, apiFetch, buildUrl };
