import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import SignUp from './pages/SignUp.jsx'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserID, setCurrentUserID] = useState(null)

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" />
            : <Login setIsAuthenticated={setIsAuthenticated} setCurrentUserID={setCurrentUserID} />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" />
            : <SignUp setIsAuthenticated={setIsAuthenticated} setCurrentUserID={setCurrentUserID} />
        }
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} currentUserID={currentUserID}/> : <Navigate to="/login" />}
      />
      <Route
        path="/transactions"
        element={isAuthenticated ? <Transactions currentUserID={currentUserID}/> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  )
}
