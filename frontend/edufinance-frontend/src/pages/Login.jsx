import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import data from '../data/generatedDummy.json';
import { Link } from 'react-router-dom'

export default function Login({setIsAuthenticated, setCurrentUserID}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        // 1) Try real (dummy) users from generated JSON
        const user = data.users.find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (user) {
            if (user.password === password) {
            setCurrentUserID(user.id);
            setIsAuthenticated(true);
            navigate('/dashboard');
            return;
            } else {
            setError('Invalid email or password');
            return;
            }
        }

        // Universal dev login
        const universalEmail = 'admin@edufinance.dev';
        const universalPassword = '1234';

        if (email === universalEmail && password === universalPassword) {
            const fallbackUser = data.users[0];
            setCurrentUserID(fallbackUser?.id ?? null);
            setIsAuthenticated(true);
            navigate('/dashboard');
            return;
        }

        setError('Invalid email or password');
};

return (
    <div className = "min-h-screen bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center p-4">
        <div className = "bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
            {/* Logo section: */}
            <div className = "text-center mb-8">
                <h1 className = "text-5xl font-extrabold text-blue-700 mb-3 tracking-tight">EduFinance</h1>
                <p className = "text-gray-500 text-lg">Manage your student finances with ease</p>
            </div>
            {/* Login form: */}
            <div className = "space-y-6">
                {/* Email input: */}
                <div> 
                    <label htmlFor = "email" className = "block text-sm font-medium text-gray-700 mb-2">
                        Email Address</label>
                    <input 
                        type = "email"
                        id = "email"
                        value={email}
                        onChange = {(e) => setEmail(e.target.value)}
                        className = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder = "student@university.edu"
                    />
                </div>
                {/* Password input: */}
                <div>
                    <label htmlFor = "password" className = "block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <input 
                        type = "password"
                        id = "password"
                        value = {password}
                        onChange = {(e) => setPassword(e.target.value)}
                        className = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder = "Enter your password"
                    />
                </div>
                {/* Error message: */}
                {error && (
                    <div className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                {/* Login button: */}
                <button onClick={handleLogin}
                    className = "w-full bg-blue-700 text-white py-3 rounded-md font-bold hover:bg-blue-800 transition shadow-md">
                        Sign In
                </button>
                {/* Additional Links */}
                <div className = "text-center space-y-2">
                    <a href = "#" className = "text-sm text-blue-600 hover:underline block">
                        Forgot Password?
                    </a>
                    <p className = "text-sm text-gray-600">
                        Don't have an account?{' '}
                        <a href = "#" className = "text-blue-600 hover:underline font-semibold">
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </div>
    );
}