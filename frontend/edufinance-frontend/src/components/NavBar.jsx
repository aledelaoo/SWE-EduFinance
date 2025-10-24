import { Link } from 'react-router-dom';

export default function NavBar({ userName, onLogout }) {
  return (
    <nav className="bg-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left side: Logo and navigation links */}
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-white">EduFinance</h1>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className="text-white hover:text-orange-400 font-medium transition"
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className="text-white hover:text-orange-400 font-medium transition"
              >
                Transactions
              </Link>
              {/*<Link
                to="/budget"
                className="text-white hover:text-orange-400 font-medium transition"
              >
                Budget
              </Link>
              <Link
                to="/reports"
                className="text-white hover:text-orange-400 font-medium transition"
              >
                Reports
              </Link>*/}
            </div>
          </div>

          {/* Right side: User info and logout */}
          <div className="flex items-center space-x-4">
            {/* Placeholder for future notifications */}
            <button className="text-white hover:text-orange-400">
              {/* Notification icon to be added later */}
            </button>

            {/* User avatar and name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userName?.charAt(0) || '?'}
              </div>
              <span className="text-white hidden md:block">{userName}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}