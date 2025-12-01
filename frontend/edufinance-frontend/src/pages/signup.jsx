import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:4000';

export default function SignUp({ setIsAuthenticated, setCurrentUserID }) {
  // Source: https://react.dev/learn/reacting-to-input-with-state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Source: https://jasonwatmore.com/post/2020/02/01/react-fetch-http-post-request-examples
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[SignUp] submit clicked');
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      console.log('[SignUp] status', response.status, 'data', data);

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      // Auto-login after successful registration
      setCurrentUserID(data.userId);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Source: https://flowbite.com/blocks/marketing/login/
  // AI assist to add visual polish to the page and improve formatting
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-3 tracking-tight">EduFinance</h1>
          <p className="text-gray-500 text-lg">Create your account</p>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              placeholder="John Doe"
            />
          </div>

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
              required
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
              placeholder="At least 6 characters"
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Signup button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-md font-bold hover:bg-blue-800 transition shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}