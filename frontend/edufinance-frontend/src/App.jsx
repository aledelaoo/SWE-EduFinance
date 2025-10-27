import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import { auth } from './auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const a = auth.get();
    if (a?.isAuthed) {
      setIsAuthenticated(true);
      setCurrentUserID(a.userId ?? null);
    }
    setBooted(true);
  }, []);

  if (!booted) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUserID={setCurrentUserID}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <SignUp
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUserID={setCurrentUserID}
            />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUserID={setCurrentUserID}
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/transactions"
        element={
          isAuthenticated ? (
            <Transactions
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUserID={setCurrentUserID}
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}
