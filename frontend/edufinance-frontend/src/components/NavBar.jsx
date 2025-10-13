export default function NavBar({ email, onLogout }) {
    return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-blue-600">EduFinance</h1>
            <div className="hidden md:flex space-x-4">
              <button className="text-gray-700 hover:text-blue-600 font-medium">Dashboard</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium">Transactions</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium">Budget</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium">Reports</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-800">
              { /* add notification icon here in the future */}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
              <span className="text-gray-700 hidden md:block">{userName}</span>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}