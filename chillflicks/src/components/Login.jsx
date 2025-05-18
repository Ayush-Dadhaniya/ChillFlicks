import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      setErrorMessage('Username and password are required.');
      return;
    }

    try {
      const res = await fetch('https://chillflicks.up.railway.app/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('authChanged'));
        navigate('/');
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (err) {
      console.log(err);
      setErrorMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Your Account</h2>
        {errorMessage && (
          <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Username</label>
            <input
              type="text"
              value={username} // Bind input value to state
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password} // Bind input value to state
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-purple-600 rounded-full font-semibold hover:bg-purple-500 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
