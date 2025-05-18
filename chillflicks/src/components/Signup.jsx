import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const res = await fetch('https://chillflicks.up.railway.app/auth/signup',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, username, email, password })
      })
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('authChanged'));
        navigate('/');
      }else {
        alert(data.message || 'Registration failed');
      }
    }catch(err){
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Create a New Account</h2>
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
