const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

//fetch-based helper
//allows api.get(path, { params }) -> returns {data}
export default {
  get: async (path, { params } = {}) => {
    const base = API_BASE.replace(/\/$/, '');
    const url = new URL(path.startsWith('/') ? `${base}${path}` : `${base}/${path}`);
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }

    const res = await fetch(url.toString(), {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    let body = null;
    try { body = await res.json(); } catch (e) {}

    if (!res.ok) {
      //throw so callers can inspect .response
      const err = new Error(res.statusText || 'Request failed');
      err.response = body;
      throw err;
    }

    return { data: body };
  }
,
  post: async (path, { data } = {}) => {
    const base = API_BASE.replace(/\/$/, '');
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    let body = null;
    try { body = await res.json(); } catch (e) {}

    if (!res.ok) {
      const err = new Error(res.statusText || 'Request failed');
      err.response = body;
      throw err;
    }

    return { data: body };
  },
  delete: async (path) => {
    const base = API_BASE.replace(/\/$/, '');
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, { method: 'DELETE', credentials: 'include', headers: { 'Accept': 'application/json' } });
    let body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error(res.statusText || 'Request failed');
      err.response = body;
      throw err;
    }
    return { data: body };
  }
};
