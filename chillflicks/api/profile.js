import connectDB from './db.js';
import User from './models/User.js';
import { authenticateUser } from './utils/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  await connectDB();
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    if (req.method === 'GET') {
      const dbUser = await User.findById(user._id).select('username email avatar');
      res.json({
        user: {
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
        },
      });
    } else if (req.method === 'PUT') {
      const { username, avatar } = req.body;
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
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error processing profile request' });
  }
} 