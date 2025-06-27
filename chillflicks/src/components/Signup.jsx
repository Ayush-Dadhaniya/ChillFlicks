import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api.js';

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.signup({ fullName, username, email, password });
      const data = res.data;
      if (res.status === 201) {
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('authChanged'));
        navigate('/');
      } else {
        setErrorMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Create a New Account</h2>
        {errorMessage && (
          <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block mb-1">Username</label>
            <input
              type="text"
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="johndoe123"
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-purple-600 rounded-full font-semibold hover:bg-purple-500 transition"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
