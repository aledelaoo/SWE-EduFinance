import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
export default function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  //TODO: when linking with backend
  const [userName] = useState('Student User'); 
  const [currentMonth] = useState('October 2025');
  //TODO: budget data from the dummy data, placeholding for now
  const [budgetData] = useState({totalBudget: 2400, monthlyBudget: 1200, spent: 420, remaining: 780});
  //TODO: sample transactions here, replace later with dummy data
  const [transactions] = useState([{id: 1, Name: 'Textbooks - Campus Store', date: 'Oct 8, 2025', amount: -120.00, category: 'books'}, 
    {id: 2, Name: 'Financial Aid Disbursement', date: 'Oct 1, 2025', amount: 1200.00, category: 'income'}]);
  function handleLogout() {
    setIsAuthenticated(false);
    navigate('/login');
  }
  const percentageSpent = ((budgetData.spent / budgetData.monthlyBudget) * 100).toFixed(0);
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <NavBar userName={userName} onLogout={handleLogout} />

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Hey {userName.split(' ')[0]}, welcome back</h2>
          <p className="text-gray-600 text-lg">Your {currentMonth} spending & budget</p>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Budget Card */}
          <div className="bg-blue-700 text-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wide">Total Budget</h3>
            </div>
            <p className="text-4xl font-bold">${budgetData.totalBudget.toLocaleString()}</p>
            <p className="text-sm text-blue-200 mt-2">4-month plan</p>
          </div>

          {/* Monthly Budget Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Monthly Budget</h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">${budgetData.monthlyBudget.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">This month's limit</p>
          </div>

          {/* Spent Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Spent</h3>
            </div>
            <p className="text-4xl font-bold text-orange-600">${budgetData.spent.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">{percentageSpent}% used</p>
          </div>

          {/* Remaining Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
            <div className="mb-4">
              <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Remaining</h3>
            </div>
            <p className="text-4xl font-bold text-green-600">${budgetData.remaining.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Left to spend</p>
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
              style={{ width: `${percentageSpent}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>${budgetData.monthlyBudget.toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">Recent Transactions</h3>
                <div className="flex space-x-2">
                  <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded">
                    Filter
                  </button>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                    View All  
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-3 rounded transition"
                  >
                    <div className="flex items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-xl font-bold text-gray-700">{transaction.category.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{transaction.Name}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-semibold">
                  Load More Transactions
                </button>

                {/*TODO: Left to implement: Alerts and Quick actions */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
