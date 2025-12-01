import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const API_URL = 'http://localhost:4000';

export default function Login({ setIsAuthenticated, setCurrentUserID }) {
  // Source: https://react.dev/learn/reacting-to-input-with-state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Source: https://jasonwatmore.com/post/2020/02/01/react-fetch-http-post-request-examples
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      setCurrentUserID(data.userId);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Source: https://pagedone.io/blocks/full-pages/login-page
  // AI assist to add visual polish to the page and improve formatting
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-3 tracking-tight">EduFinance</h1>
          <p className="text-gray-500 text-lg">Manage your student finances with ease</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              placeholder="student@university.edu"
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              placeholder="Enter your password"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-md font-bold hover:bg-blue-800 transition shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/SignUp" className="text-blue-600 hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}