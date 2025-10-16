export default function NavBar({ userName, onLogout }) {
    return (
    <nav className="bg-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-white">EduFinance</h1>
            <div className="hidden md:flex space-x-4">
              <button className="text-white hover:text-orange-400 font-medium">Dashboard</button>
              <button className="text-white hover:text-orange-400 font-medium">Transactions</button>
              <button className="text-white hover:text-orange-400 font-medium">Budget</button>
              <button className="text-white hover:text-orange-400 font-medium">Reports</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-orange-400">
              { /* add notification icon here in the future */}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
              <span className="text-white hidden md:block">{userName}</span>
            </div>
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