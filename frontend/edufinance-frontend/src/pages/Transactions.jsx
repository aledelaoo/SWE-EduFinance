import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import api from '../api/api';

export default function Transactions({ currentUserID }) {
  const navigate = useNavigate();

  // remote data
  const [allTx, setAllTx] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // keep a simple user/title fallback — backend may return only the current user's txs
  const userName = 'User';
  const month = 'This Month';
  // filters
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  // load transactions from backend when query/category change
  useEffect(() => {
    let cancelled = false;
    const fetchTx = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (query && query.trim()) params.q = query.trim();
        if (category && category !== 'all') params.category = category;

        const res = await api.get('/transactions', { params });
        if (!cancelled) setAllTx(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data || err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // debounce the request slightly to avoid spamming while the user types
    const t = setTimeout(fetchTx, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category]);


  const categories = useMemo(() => {
    const set = new Set(allTx.map(t => t.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [allTx]);

  const filteredTx = useMemo(() => {
    // server-side search/filter applied, but keep a client-side safety filter
    const q = query.trim().toLowerCase();
    return allTx.filter(t => {
      const matchText = !q || t.name?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
      const matchCat = category === 'all' || t.category === category;
      return matchText && matchCat;
    });
  }, [allTx, query, category]);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={() => navigate('/login')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600">Showing transactions{allTx.length ? ` — ${allTx.length} results` : ''}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or category…"
              className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
            />

            <select
              className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>

            <button
              onClick={() => { setQuery(''); setCategory('all'); }}
              className="px-4 py-2 border rounded font-medium hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="divide-y">
            {loading && (
              <div className="p-8 text-center text-gray-500">Loading transactions…</div>
            )}
            {error && (
              <div className="p-8 text-center text-red-500">{typeof error === 'string' ? error : JSON.stringify(error)}</div>
            )}
            {filteredTx.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    t.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="font-bold text-gray-700">
                      {t.category?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{t.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{t.category}
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            ))}
            {!filteredTx.length && (
              <div className="p-8 text-center text-gray-500">No transactions match your filter.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}