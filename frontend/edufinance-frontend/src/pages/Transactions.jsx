import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function Transactions() {
  // pretend user context for now
  const userName = "Student User";

  // sample data (replace with data bank later)
  const [items] = useState([
    { id: 1, name: "Textbooks - Campus Store", date: "2025-10-08", amount: -120.0, category: "Books" },
    { id: 2, name: "Financial Aid Disbursement", date: "2025-10-01", amount: 1200.0, category: "Income" },
    { id: 3, name: "Groceries - Market", date: "2025-10-10", amount: -64.35, category: "Food" },
    { id: 4, name: "Bus Pass", date: "2025-09-28", amount: -35.0, category: "Transport" },
    { id: 5, name: "Campus Job Paycheck", date: "2025-09-25", amount: 320.0, category: "Income" },
    { id: 6, name: "Coffee", date: "2025-10-11", amount: -4.5, category: "Food" },
  ]);

  // ui state
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const categories = useMemo(() => {
    const s = new Set(items.map(i => i.category));
    return ["all", ...Array.from(s)];
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter(i => {
        if (type === "income" && i.amount <= 0) return false;
        if (type === "expense" && i.amount >= 0) return false;
        if (cat !== "all" && i.category !== cat) return false;
        if (q.trim()) {
          const t = q.trim().toLowerCase();
          return (
            i.name.toLowerCase().includes(t) ||
            i.category.toLowerCase().includes(t)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "date") {
          return (new Date(a.date) - new Date(b.date)) * dir;
        }
        if (sortKey === "amount") {
          return (a.amount - b.amount) * dir;
        }
        // name
        return a.name.localeCompare(b.name) * dir;
      });
  }, [items, type, cat, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function exportCSV() {
    const rows = [["Name","Date","Amount","Category"]]
      .concat(filtered.map(i => [i.name, i.date, i.amount.toString(), i.category]));
    const csv = rows.map(r => r.map(f => `"${String(f).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={() => {}} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Transactions</h2>
            <p className="text-gray-600">Search, filter, and export your history</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by name or category"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="flex gap-2">
                {["all","income","expense"].map(t => (
                  <button
                    key={t}
                    onClick={() => { setType(t); setPage(1); }}
                    className={`px-3 py-2 rounded-md border ${
                      type === t
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={cat}
                onChange={(e) => { setCat(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Results</h3>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => toggleSort("date")} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Sort by Date {sortKey === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button onClick={() => toggleSort("amount")} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Amount {sortKey === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button onClick={() => toggleSort("name")} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Name {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100">
            {pageItems.map(t => (
              <li key={t.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      t.amount > 0 ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <span className="font-bold text-gray-700">
                        {t.category.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(t.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        {" • "}
                        <span className="text-gray-600">{t.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {t.amount > 0 ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
            {pageItems.length === 0 && (
              <li className="px-6 py-10 text-center text-gray-500">No transactions match your filters</li>
            )}
          </ul>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages} • {filtered.length} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-2 rounded border ${
                  page === 1 ? "text-gray-400 bg-gray-100 border-gray-200" : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded border ${
                  page === totalPages ? "text-gray-400 bg-gray-100 border-gray-200" : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
