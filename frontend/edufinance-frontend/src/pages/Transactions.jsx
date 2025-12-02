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

  // keep a simple user/title fallback
  const userName = 'User';
  const month = 'This Month';
  // filters
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  // load transactions from backend when query/category change
  // expose a load function we can call after creating a transaction
  // source: https://blog.openreplay.com/axios-react-get-post/
  const loadTransactions = async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (opts.query !== undefined ? opts.query : query) {
        const qv = opts.query !== undefined ? opts.query : query;
        if (qv && qv.trim()) params.q = qv.trim();
      }
      const cat = opts.category !== undefined ? opts.category : category;
      if (cat && cat !== 'all') params.category = cat;

      const res = await api.get('/transactions', { params });
      setAllTx(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Source: https://www.freecodecamp.org/news/debouncing-explained/
  useEffect(() => {
    let cancelled = false;
    // debounce the request slightly to avoid spamming while the user types
    const t = setTimeout(() => {
      if (!cancelled) loadTransactions();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category]);

  // Source: https://www.freecodecamp.org/news/how-to-work-with-usememo-in-react/
  const categories = useMemo(() => {
    const set = new Set(allTx.map(t => t.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [allTx]);

  // source: https://shiftasia.com/community/understanding-usememo-in-react-when-and-how-to-use-it/
  const filteredTx = useMemo(() => {
    // server-side search/filter applied, but keep a client-side safety filter
    const q = query.trim().toLowerCase();
    return allTx.filter(t => {
      const matchText = !q || t.name?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
      const matchCat = category === 'all' || t.category === category;
      return matchText && matchCat;
    });
  }, [allTx, query, category]);

  // add transaction form state
  // Source: https://blog.logrocket.com/axios-javascript/
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({ name: '', amount: '', category: '', date: '', note: '' });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const handleFormChange = (k, v) => setFormState(s => ({ ...s, [k]: v }));

  const submitTransaction = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    try {
      const payload = {
        name: formState.name.trim(),
        amount: Number(formState.amount),
        category: formState.category.trim() || 'Other',
        date: formState.date || new Date().toISOString().slice(0,10),
        note: formState.note || null
      };
      if (!payload.name || Number.isNaN(payload.amount)) {
        setPostError('Name and a numeric amount are required');
        setPosting(false);
        return;
      }

      const res = await api.post('/transactions', { data: payload });
      //refresh transactions
      await loadTransactions();
      setShowForm(false);
      setFormState({ name: '', amount: '', category: '', date: '', note: '' });
    } catch (err) {
      setPostError(err?.response?.error?.message || err?.message || 'Failed to create');
    } finally {
      setPosting(false);
    }
  };

  // Source: https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/stacked
  // AI assist to add visual polish to the page and improve formatting
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={() => navigate('/login')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600">Showing transactions{allTx.length ? ` — ${allTx.length} results` : ''}</p>
        </div>

        {/* Add / Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Add a transaction</h2>
            <button onClick={() => setShowForm(s => !s)} className="px-3 py-1 border rounded">{showForm ? 'Hide' : 'Add'}</button>
          </div>
          {showForm && (
            <form onSubmit={submitTransaction} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input className="border p-2 rounded col-span-2" placeholder="Name" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} />
              <input type="number" step="0.01" className="border p-2 rounded" placeholder="Amount (negative = expense)" value={formState.amount} onChange={e => handleFormChange('amount', e.target.value)} />
              <input className="border p-2 rounded" placeholder="Category" value={formState.category} onChange={e => handleFormChange('category', e.target.value)} />
              <input type="date" className="border p-2 rounded" value={formState.date} onChange={e => handleFormChange('date', e.target.value)} />
              <input className="border p-2 rounded col-span-3" placeholder="Note (optional)" value={formState.note} onChange={e => handleFormChange('note', e.target.value)} />
              <div className="col-span-1 sm:col-span-4">
                {postError && <div className="text-red-500 text-sm mb-2">{postError}</div>}
                <div className="flex gap-2">
                  <button disabled={posting} className="bg-blue-600 text-white px-4 py-2 rounded">{posting ? 'Adding…' : 'Add transaction'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setFormState({ name: '', amount: '', category: '', date: '', note: '' }); }} className="px-4 py-2 border rounded">Cancel</button>
                </div>
              </div>
            </form>
          )}
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
