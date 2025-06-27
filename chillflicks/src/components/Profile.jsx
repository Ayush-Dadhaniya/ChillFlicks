import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../api.js';

const Profile = () => {
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await profileAPI.get();
        if (res.status !== 200) throw new Error('Failed to fetch user');
        const data = res.data;
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="text-black bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6 text-purple-600">User Profile</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <img
            src={user.avatar || '/default_avatar.png'}
            alt=""
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default_avatar.png';
            }}
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-md"
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg"><strong>Full Name:</strong> {user.fullName}</p>
          <p className="text-md"><strong>Username:</strong> {user.username}</p>
          <p className="text-md"><strong>Email:</strong> {user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
