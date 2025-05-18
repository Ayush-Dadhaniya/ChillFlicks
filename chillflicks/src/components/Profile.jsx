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
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch('https://chillflicks.up.railway.app/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const data = await res.json();
        setUser(data);

        const avatarPath = data.avatar ? data.avatar : '/uploads/avatars/default-avatar.png';
        setAvatarPreview(`https://chillflicks.up.railway.app${avatarPath}`);
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
        setAvatarPreview(reader.result); // Temporary preview before upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!avatar) return alert('Please select an image first');

    const formData = new FormData();
    formData.append('avatar', avatar);

    try {
      const res = await fetch('https://chillflicks.up.railway.app/profile/update-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert('Profile updated successfully');
        setAvatarPreview(`https://chillflicks.up.railway.app${data.avatar}`);
        setAvatar(null); // clear selected file
      } else {
        alert('Avatar update failed');
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
            src={avatarPreview}
            alt="Avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://chillflicks.up.railway.app/uploads/avatars/default_avatar.png';
            }}
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-md"
          />
          <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
            <input
              type="file"
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
            📸
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
