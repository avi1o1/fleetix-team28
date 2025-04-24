'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
      localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
      if (prefersDarkMode) document.documentElement.classList.add('dark');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);

      // Submit login request to backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.status === 200 && response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        router.push('/profile');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Logo and Navigation */}
      <div className="w-full p-6 flex justify-center">
        <Link href="/" className="flex items-center text-2xl font-bold text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Fleetix
        </Link>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-8 transition-colors duration-300`}>
          <h2 className={`text-center text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h2>
          <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to access your account
          </p>

          {error && (
            <div className={`mt-4 ${isDarkMode ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-400'} border px-4 py-3 rounded-md flex items-start`}>
              <AlertCircle className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} mr-2 h-5 w-5 flex-shrink-0 mt-0.5`} />
              <span className={`${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`pl-10 appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`pl-10 appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 focus:ring-gray-600' : 'bg-gray-100 border-gray-300 focus:ring-green-500'} rounded focus:ring-offset-gray-800`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className={`font-medium ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-500 hover:text-green-400'}`}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link href="/" className={`font-medium text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-sm">
          © {new Date().getFullYear()} Fleetix. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
