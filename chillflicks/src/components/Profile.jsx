import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState({});
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch('http://localhost:3000/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUser(data);
        setAvatarPreview(data.avatar || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    const formData = new FormData();
    formData.append('avatar', avatar);

    try {
      const res = await fetch('http://localhost:3000/profile/update-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile updated successfully');
        setAvatarPreview(data.avatar);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="text-black bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6 text-purple-600">User Profile</h2>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <img
            src={avatarPreview || '/default-avatar.png'}
            alt="Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-md"
          />
          <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
            <input
              type="file"
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.828a2 2 0 00-.586-1.414l-3.828-3.828A2 2 0 0012.172 2H4z" />
            </svg>
          </label>
        </div>

        <div className="text-center space-y-1">
          <p className="text-lg"><strong>Full Name:</strong> {user.fullName}</p>
          <p className="text-md"><strong>Username:</strong> {user.username}</p>
          <p className="text-md"><strong>Email:</strong> {user.email}</p>
        </div>

        <button
          onClick={handleProfileUpdate}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full shadow hover:bg-purple-700 transition transform hover:-translate-y-1"
        >
          Update Avatar
        </button>
      </div>
    </div>
  );
};

export default Profile;
