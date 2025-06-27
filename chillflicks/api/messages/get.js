import connectDB from '../db.js';
import Message from '../models/Message.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  const { roomId } = req.query;
  if (!roomId) {
    return res.status(400).json({ message: 'Room ID is required' });
  }
  try {
    const messages = await Message.find({ roomId })
      .populate('user', 'username avatar')
      .sort({ timestamp: 1 })
      .limit(100);
    res.json({
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        timestamp: msg.timestamp,
        user: {
          username: msg.user.username,
          avatar: msg.user.avatar,
        },
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error getting messages' });
  }
} 