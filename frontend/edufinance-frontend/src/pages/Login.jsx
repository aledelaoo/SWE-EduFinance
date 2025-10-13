import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({setIsAuthenticated}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        if (!email.includes('@')) {
            setError("Please enter a valid email");
            return;
        }

        //TODO: Connect to backend for authentication
        if (email && password) {
            setIsAuthenticated(true);
            navigate('/dashboard');
    }
};
return (
    <div className = "min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className = "bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
            {/* Logo section: */}
            <div className = "text-center mb-8">
                <h1 className = "text-4xl font-bold text-gray-800 mb-2">EduFinance</h1>
                <p className = "text-gray-600">Manage your student finances with ease</p>
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
                    className = "w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg">
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