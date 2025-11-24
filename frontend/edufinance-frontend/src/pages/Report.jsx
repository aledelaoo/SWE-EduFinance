import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import api from '../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Report({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('Student User');
  const [selectedTerm, setSelectedTerm] = useState('Fall'); // Fall | Spring | Summer

  // Sync with backend for spent/remaining; monthlyBudget is your front-end plan
  const [budgetData, setBudgetData] = useState({
    monthlyBudget: 2000,
    currentMonth: 'November 2025',
    spent: 0,
    remaining: 2000,
  });

  // Simple category structure (you can later swap this for real per-category data)
  const categories = [
    { name: 'Food and Dining', allocated: 200, spent: 40 },
    { name: 'Textbooks and Supplies', allocated: 200, spent: 0 },
    { name: 'Transportation', allocated: 150, spent: 20 },
    { name: 'Housing', allocated: 100, spent: 0 },
    { name: 'Other', allocated: 100, spent: 10 },
  ];

  // Term → months map (no year logic to keep it simple)
  const TERM_MONTHS = {
    Fall: ['September', 'October', 'November', 'December'],
    Spring: ['January', 'February', 'March', 'April'],
    Summer: ['May', 'June', 'July', 'August'],
  };

  // Pull current expenses and username from backend so report stays in sync
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get('/balance');
        if (cancelled) return;

        const data = res.data || {};
        const expenses = data.expenses || 0;

        setUserName(data.userName || 'Student User');
        setBudgetData(prev => ({
          ...prev,
          spent: expenses,
          remaining: prev.monthlyBudget - expenses,
        }));
      } catch (err) {
        console.error('Error loading budget for report:', err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    setIsAuthenticated(false);
    navigate('/login');
  }

  function generatePdf() {
    const doc = new jsPDF();
    const months = TERM_MONTHS[selectedTerm];
    const { monthlyBudget, currentMonth } = budgetData;

    // Header
    doc.setFontSize(16);
    doc.text('4 Month Budget Plan', 14, 18);

    doc.setFontSize(10);
    doc.text(`Student: ${userName}`, 14, 26);
    doc.text(`Term: ${selectedTerm}`, 14, 32);
    doc.text(`Based on: ${currentMonth}`, 14, 38);
    doc.text(`Monthly budget: $${monthlyBudget.toFixed(2)}`, 14, 44);

    // Table body
    const rows = [];
    months.forEach((month, i) => {
      categories.forEach(c => {
        const spent = i === 0 ? c.spent : 0; // only first month uses current sample spent
        const remaining = c.allocated - spent;

        rows.push([
          month,
          c.name,
          `$${c.allocated.toFixed(2)}`,
          `$${spent.toFixed(2)}`,
          `$${remaining.toFixed(2)}`,
        ]);
      });
    });

    autoTable(doc, {
      startY: 54,
      head: [['Month', 'Category', 'Allocated', 'Spent', 'Remaining']],
      body: rows,
    });

    doc.save(`budget_${selectedTerm}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userName={userName} onLogout={handleLogout} />

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Budget Report</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Choose a term and download a 4 month budget plan as a PDF.
        </p>

        {/* 2x2 summary block with colored values */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500">Base month</p>
              <p className="font-semibold text-gray-900">{budgetData.currentMonth}</p>
            </div>
            <div>
              <p className="text-gray-500">Monthly budget</p>
              <p className="font-semibold text-gray-900">
                ${budgetData.monthlyBudget.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Spent</p>
              <p className="font-semibold text-orange-600">
                ${budgetData.spent.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Remaining</p>
              <p className="font-semibold text-green-600">
                ${budgetData.remaining.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Term selector + download button */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Select term</label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                className="border p-2 rounded text-sm"
              >
                <option value="Fall">Fall (Sep–Dec)</option>
                <option value="Spring">Spring (Jan–Apr)</option>
                <option value="Summer">Summer (May–Aug)</option>
              </select>
            </div>

            <button
              onClick={generatePdf}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-green-700 transition"
            >
              Download PDF
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Uses your current monthly budget and expenses as the starting point for this term.
          </p>
        </div>
      </main>
    </div>
  );
}