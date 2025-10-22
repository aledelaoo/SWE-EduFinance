import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  return (
    <Routes>
      <Route 
        path = "/login" 
        element = {isAuthenticated ? <Navigate to = "/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} />}
      />
      <Route
        path = "/dashboard"
        element = {isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to = "/login" />}
      />
      <Route
        path = "/" element = {<Navigate to = "/login" />}
      />
      <Route
        path="/transactions"
        element={
          isAuthenticated ? (
            <Transactions />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
