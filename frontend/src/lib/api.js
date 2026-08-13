const BASE = import.meta.env.VITE_API_BASE || '/library/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err });
  }

  return res.json();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),

  upload: (path, formData, method = 'POST') => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${BASE}${path}`, { method, headers, body: formData })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          throw Object.assign(new Error(err.message || 'Upload failed'), { status: res.status });
        }
        return res.json();
      });
  },

  // For endpoints that return raw HTML/text (e.g. printable sheets) rather than JSON.
  // A plain window.open(url) can't carry the Authorization header, so JWT-protected
  // endpoints meant to be opened in a new tab/window must be fetched like this instead.
  getText: async (path) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(err.message || err.error || 'Request failed'), { status: res.status, data: err });
    }
    return res.text();
  },
};

export default api;
