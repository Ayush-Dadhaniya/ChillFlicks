import connectDB from '../db.js';
import Room from '../models/Room.js';
import { authenticateUser } from '../utils/auth.js';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

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

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { roomCode, isPlaying, currentPlaybackTime } = req.body;
  if (!roomCode) {
    return res.status(400).json({ message: 'Room code is required' });
  }
  try {
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.host.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update room' });
    }
    if (typeof isPlaying !== 'undefined') {
      room.isPlaying = isPlaying;
    }
    if (typeof currentPlaybackTime !== 'undefined') {
      room.currentPlaybackTime = currentPlaybackTime;
    }
    await room.save();
    await pusher.trigger(`room-${roomCode}`, 'videoStateChanged', {
      isPlaying: room.isPlaying,
      currentTime: room.currentPlaybackTime,
    });
    res.json({
      message: 'Room updated successfully',
      room: {
        isPlaying: room.isPlaying,
        currentPlaybackTime: room.currentPlaybackTime,
      },
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Error updating room' });
  }
} 