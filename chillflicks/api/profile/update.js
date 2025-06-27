import connectDB from '../db.js';
import User from '../models/User.js';
import { authenticateUser } from '../utils/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { username, avatar } = req.body;
  try {
    const dbUser = await User.findById(user._id);
    if (username) dbUser.username = username;
    if (avatar) dbUser.avatar = avatar;
    await dbUser.save();
    res.json({
      message: 'Profile updated successfully',
      user: {
        username: dbUser.username,
        email: dbUser.email,
        avatar: dbUser.avatar,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
} 