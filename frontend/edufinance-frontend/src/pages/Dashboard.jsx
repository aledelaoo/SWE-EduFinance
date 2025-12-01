import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const API_URL = 'http://localhost:4000';

export default function Dashboard({ setIsAuthenticated, currentUserID }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  // Source: https://devtrium.com/posts/async-functions-useeffect
  useEffect(() => {
    fetchData();
  }, []);

  // Source: https://javascript.plainenglish.io/promise-all-from-multiple-fetches-with-async-await-d7266ff98ee7
  async function fetchData() {
    try {
      const [balanceRes, txRes] = await Promise.all([
        fetch(`${API_URL}/balance`, { credentials: 'include' }),
        fetch(`${API_URL}/transactions`, { credentials: 'include' })
      ]);

      if (!balanceRes.ok || !txRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const balanceData = await balanceRes.json();
      const txData = await txRes.json();

      setBalance(balanceData);
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsAuthenticated(false);
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  const userName = balance?.userName || 'User';
  const currentMonth = balance?.month || 'This Month';
  const income = balance?.income || 0;
  const expenses = balance?.expenses || 0;
  const netBalance = balance?.balance || 0;

  // Calculate a simple monthly budget (for demo purposes)
  const monthlyBudget = 2000;
  const percentageSpent = ((expenses / monthlyBudget) * 100).toFixed(0);

  // Source: https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/stacked
  // AI assist to add visual polish to the page and improve formatting
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Hey {userName.split(' ')[0]}, welcome back
          </h2>
          <p className="text-gray-600 text-lg">Your {currentMonth} spending & budget</p>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Income Card */}
          <div className="bg-green-700 text-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-green-100 text-sm uppercase tracking-wide">
                Total Income
              </h3>
            </div>
            <p className="text-4xl font-bold">${income.toFixed(2)}</p>
            <p className="text-sm text-green-200 mt-2">All deposits</p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Total Expenses
              </h3>
            </div>
            <p className="text-4xl font-bold text-orange-600">${expenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">{percentageSpent}% of budget</p>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Net Balance
              </h3>
            </div>
            <p className={`text-4xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${netBalance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Income - Expenses</p>
          </div>

          {/* Remaining Budget Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Budget Left
              </h3>
            </div>
            <p className="text-4xl font-bold text-green-600">
              ${Math.max(0, monthlyBudget - expenses).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Of ${monthlyBudget.toFixed(2)}</p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Monthly Budget Progress</h3>
            <span className="text-sm font-semibold text-gray-600">{percentageSpent}% Used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, percentageSpent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>${monthlyBudget.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
                  Recent Transactions
                </h3>
                <button
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                </button>
              </div>

              <div className="space-y-1">
                {transactions.slice(0, visibleCount).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-3 rounded transition"
                  >
                    <div className="flex items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <span className="text-xl font-bold text-gray-700">
                          {transaction.category?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{transaction.name}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold text-lg ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : '-'}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="py-8 text-center text-gray-500">No transactions yet</div>
                )}
              </div>

              {visibleCount < transactions.length && (
                <div className="mt-6 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                    onClick={() => setVisibleCount((c) => c + 5)}
                  >
                    Load More Transactions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alerts Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                Alerts
              </h3>
              <div className="space-y-3">
                {expenses > monthlyBudget * 0.8 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-yellow-800 font-medium text-sm">High spending alert</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You've used {percentageSpent}% of your monthly budget
                    </p>
                  </div>
                )}
                {netBalance < 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="text-red-800 font-medium text-sm">Negative balance</p>
                    <p className="text-xs text-red-700 mt-1">
                      Your expenses exceed your income
                    </p>
                  </div>
                )}
                {netBalance > 500 && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <p className="text-green-800 font-medium text-sm">Great job!</p>
                    <p className="text-xs text-green-700 mt-1">
                      You have a healthy positive balance
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 transition font-bold"
                >
                  + Add Transaction
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition font-semibold"
                >
                  View Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}