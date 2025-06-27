import connectDB from '../db.js';
import Room from '../models/Room.js';

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
  const { roomCode } = req.query;
  if (!roomCode) {
    return res.status(400).json({ message: 'Room code is required' });
  }
  try {
    const room = await Room.findOne({ roomCode })
      .populate('host', 'username avatar')
      .populate('participants', 'username avatar');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({
      room: {
        roomCode: room.roomCode,
        videoUrl: room.videoUrl,
        host: room.host.username,
        participants: room.participants.map(p => ({
          username: p.username,
          avatar: p.avatar,
        })),
        isPlaying: room.isPlaying,
        currentPlaybackTime: room.currentPlaybackTime,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Error getting room' });
  }
} 