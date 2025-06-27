import connectDB from '../db.js';
import Room from '../models/Room.js';
import { authenticateUser } from '../utils/auth.js';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ message: 'Video URL is required' });
  }
  try {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new Room({
      roomCode,
      host: user._id,
      participants: [user._id],
      videoUrl,
    });
    await room.save();
    res.status(201).json({
      message: 'Room created successfully',
      room: {
        roomCode: room.roomCode,
        videoUrl: room.videoUrl,
        host: user.username,
        participants: [user.username],
      },
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
} 