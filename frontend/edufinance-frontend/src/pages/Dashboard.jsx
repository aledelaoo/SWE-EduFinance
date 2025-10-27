import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { api } from '../api/api.js';
import { auth } from '../auth';

export default function Dashboard({ setIsAuthenticated, setCurrentUserID }) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(5);
  const [userName, setUserName] = useState('User');
  const [budgetData, setBudgetData] = useState({
    totalBudget: 0,
    monthlyBudget: 0,
    spent: 0,
    remaining: 0,
    month: 'N/A'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const authData = auth.get();
      setUserName(authData.name || 'User');

      const [txRes, balRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/balance')
      ]);

      setTransactions(txRes.data || []);
      
      const balance = balRes.data;
      const monthlyBudget = 1500; // Default budget
      const spent = balance.expenses;
      const remaining = monthlyBudget - spent;

      setBudgetData({
        totalBudget: monthlyBudget * 4,
        monthlyBudget,
        spent,
        remaining: Math.max(0, remaining),
        month: balance.month || 'This Month'
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    auth.clear();
    setIsAuthenticated(false);
    setCurrentUserID(null);
    navigate('/login');
  }

  const percentageSpent = ((budgetData.spent / budgetData.monthlyBudget) * 100).toFixed(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Hey {userName.split(' ')[0]}, welcome back
          </h2>
          <p className="text-gray-600 text-lg">
            Your {budgetData.month} spending & budget
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-700 text-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wide mb-4">
              Total Budget
            </h3>
            <p className="text-4xl font-bold">${budgetData.totalBudget.toLocaleString()}</p>
            <p className="text-sm text-blue-200 mt-2">4-month plan</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide mb-4">
              Monthly Budget
            </h3>
            <p className="text-4xl font-bold text-gray-900">
              ${budgetData.monthlyBudget.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">This month's limit</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide mb-4">
              Spent
            </h3>
            <p className="text-4xl font-bold text-orange-600">
              ${budgetData.spent.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">{percentageSpent}% used</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide mb-4">
              Remaining
            </h3>
            <p className="text-4xl font-bold text-green-600">
              ${budgetData.remaining.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Left to spend</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Monthly Budget Progress</h3>
            <span className="text-sm font-semibold text-gray-600">{percentageSpent}% Used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentageSpent, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>${budgetData.monthlyBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-xl font-bold text-gray-700">
                          {transaction.category.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{transaction.name}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount < 0 ? '-' : ''}
                        ${Math.abs(transaction.amount).toFixed(2)}
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

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                Alerts
              </h3>
              <div className="space-y-3">
                {percentageSpent > 80 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-yellow-800 font-medium text-sm">High spending alert</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You are {percentageSpent}% through your monthly budget
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-blue-800 font-medium text-sm">Track your expenses</p>
                  <p className="text-xs text-blue-700 mt-1">Keep adding transactions to stay on budget</p>
                </div>
                {percentageSpent < 50 && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <p className="text-green-800 font-medium text-sm">Great job!</p>
                    <p className="text-xs text-green-700 mt-1">You're managing your budget well</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/transactions')}
                  className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 transition font-bold"
                >
                  View All Transactions
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition font-semibold">
                  View Full Report
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition font-semibold">
                  Adjust Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}