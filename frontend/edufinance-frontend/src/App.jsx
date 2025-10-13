import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

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
    </Routes>
  );
}
