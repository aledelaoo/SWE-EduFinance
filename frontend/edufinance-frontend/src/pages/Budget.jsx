import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const API_URL = 'http://localhost:4000';

export default function Budget({ setIsAuthenticated }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userName, setUsername] = useState('Student User');

    const [budgetData, setBudgetData] = useState({
        monthlyBudget: 2000,
        totalBudget: 5000,
        currentMonth: 'November 2025',
        spent: 0,
        remaining: 0
    });
    const [categoryBudgets, setCategoryBudgets] = useState([
        { id: 1, name: 'Food and Dining', allocated: 200, spent: 0, color: 'orange' },
        { id: 2, name: 'Textbooks and Supplies', allocated: 200, spent: 0, color: 'blue' },
        { id: 3, name: 'Transportation', allocated: 150, spent: 0, color: 'green' },
        { id: 4, name: 'Housing', allocated: 100, spent: 0, color: 'purple' },
        { id: 5, name: 'Other', allocated: 100, spent: 0, color: 'gray' },
    ]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedBudgets, setEditedBudgets] = useState([]);

    useEffect(() => {
        fetchBudgetData();
    }, []);

    async function fetchBudgetData() {
    try {
        // TODO: Replace with actual API call when backend is ready
        const response = await fetch(`${API_URL}/balance`, { 
        credentials: 'include' 
        });

        if (response.ok) {
        const data = await response.json();
        setUsername(data.userName || 'Student User');
        
        // Update budget data with real data when available
        setBudgetData(prev => ({
            ...prev,
            spent: data.expenses || 0,
            remaining: prev.monthlyBudget - (data.expenses || 0)
        }));
        }
    } catch (error) {
        console.error('Error fetching budget data:', error);
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
    }
    catch (error) {
        console.error('Logout error:', error);
    }
    setIsAuthenticated(false);
    navigate('/login');
    }
    function handleEditBudget() {
    setIsEditMode(true);
    setEditedBudgets([...categoryBudgets]);
    }
    function handleCancelEdit() {
    setIsEditMode(false);
    setEditedBudgets([]);
    }
    function handleSaveBudget() {
    setCategoryBudgets(editedBudgets);
    const newMonthlyBudget = editedBudgets.reduce((sum, cat) => sum + cat.allocated, 0);
    setBudgetData(prev => ({
        ...prev,
        monthlyBudget: newMonthlyBudget,
        totalBudget: newMonthlyBudget * 4,
        remaining: newMonthlyBudget - prev.spent
    }));
    setIsEditMode(false);
    setEditedBudgets([]);
    }
    function handleCategoryChange(id, value) {
    setEditedBudgets(prev => prev.map(cat => cat.id == id ? { ...cat, allocated: parseFloat(value) || 0 } : cat )
    );
    } 
    function getColorClasses(color) {
        const colors = {
            orange: 'bg-orange-500',
            blue: 'bg-blue-600',
            green: 'bg-green-600',
            purple: 'bg-purple-600',
            gray: 'bg-gray-600'
        };
        return colors[color] || 'bg-gray-600';
    }
    const percentSpent = ((budgetData.spent / budgetData.monthlyBudget) * 100).toFixed(0);
    const activeBudgets = isEditMode ? editedBudgets : categoryBudgets;
    return (
    <div className="min-h-screen bg-gray-100">
        <NavBar userName={userName} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Budget Management</h2>
            <p className="text-gray-600 text-lg">Plan and track your spending for {budgetData.currentMonth}</p>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* 4-Month Budget */}
            <div className="bg-blue-700 text-white rounded-lg shadow-md p-6">
            <div className="mb-4">
                <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wide">
                4-Month Plan
                </h3>
            </div>
            <p className="text-4xl font-bold">${budgetData.totalBudget.toFixed(2)}</p>
            <p className="text-sm text-blue-200 mt-2">Total budget</p>
            </div>

            {/* Monthly Budget */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <div className="mb-4">
                <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Monthly Budget
                </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">${budgetData.monthlyBudget.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
            </div>

            {/* Spent */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
            <div className="mb-4">
                <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Spent
                </h3>
            </div>
            <p className="text-4xl font-bold text-orange-600">${budgetData.spent.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">{percentSpent}% used</p>
            </div>

            {/* Remaining */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
            <div className="mb-4">
                <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                Remaining
                </h3>
            </div>
            <p className="text-4xl font-bold text-green-600">${budgetData.remaining.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Available</p>
            </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Overall Budget Progress</h3>
            <span className="text-sm font-semibold text-gray-600">{percentSpent}% Used</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
            <div
                className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, percentSpent)}%` }}
            ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>${budgetData.monthlyBudget.toFixed(2)}</span>
            </div>
        </div>

        {/* Category Budgets Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
                Budget by Category
            </h3>
            <div className="flex space-x-3">
                {!isEditMode ? (
                <button
                    onClick={handleEditBudget}
                    className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition font-semibold"
                >
                    Adjust Budget
                </button>
                ) : (
                <>
                    <button
                    onClick={handleCancelEdit}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition font-semibold"
                    >
                    Cancel
                    </button>
                    <button
                    onClick={handleSaveBudget}
                    className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition font-semibold"
                    >
                    Save Changes
                    </button>
                </>
                )}
            </div>
            </div>

            <div className="space-y-6">
            {activeBudgets.map((category) => {
                const categoryPercent = ((category.spent / category.allocated) * 100).toFixed(0);
                const remaining = category.allocated - category.spent;

                return (
                <div key={category.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    {/* Category Header */}
                    <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getColorClasses(category.color)}`}></div>
                        <h4 className="font-semibold text-gray-800 text-lg">{category.name}</h4>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isEditMode ? (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Budget:</span>
                            <input
                            type="number"
                            value={category.allocated}
                            onChange={(e) => handleCategoryChange(category.id, e.target.value)}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            step="10"
                            min="0"
                            />
                        </div>
                        ) : (
                        <>
                            <span className="text-sm text-gray-600">
                            ${category.spent.toFixed(2)} / ${category.allocated.toFixed(2)}
                            </span>
                            <span className={`text-sm font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
                            </span>
                        </>
                        )}
                    </div>
                    </div>

                    {/* Category Progress Bar */}
                    {!isEditMode && (
                    <>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ${getColorClasses(category.color)}`}
                            style={{ width: `${Math.min(100, categoryPercent)}%` }}
                        ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{categoryPercent}% used</span>
                        {categoryPercent > 100 && (
                            <span className="text-red-600 font-semibold">Over budget!</span>
                        )}
                        </div>
                    </>
                    )}
                </div>
                );
            })}
            </div>

            {/* Total Row */}
            <div className="mt-6 pt-6 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900 text-lg">Total Monthly Budget</h4>
                <span className="font-bold text-2xl text-blue-700">
                ${isEditMode 
                    ? editedBudgets.reduce((sum, cat) => sum + cat.allocated, 0).toFixed(2)
                    : categoryBudgets.reduce((sum, cat) => sum + cat.allocated, 0).toFixed(2)
                }
                </span>
            </div>
            </div>
        </div>

        {/* Budget Tips Section */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">Budget Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2">
            <li>• Try to keep each category under 80% to avoid overspending</li>
            <li>• Review and adjust your budget at the start of each month</li>
            <li>• Set aside funds for unexpected expenses in the "Other" category</li>
            <li>• Track your financial aid disbursement dates to align your budget</li>
            </ul>
        </div>
        </main>
    </div>
    );
}