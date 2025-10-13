import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
export default function Dashboard({ setIsAuthenticated }) {
  function logout() {
    localStorage.removeItem("edufin_user"); 
    setIsAuthenticated?.(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mb-4">This is a placeholder dashboard. UI coming next.</p>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
