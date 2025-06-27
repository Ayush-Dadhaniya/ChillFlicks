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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { roomCode } = req.body;
  if (!roomCode) {
    return res.status(400).json({ message: 'Room code is required' });
  }
  try {
    const room = await Room.findOne({ roomCode }).populate('host', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.participants.includes(user._id)) {
      room.participants.push(user._id);
      await room.save();
    }
    const participants = await Room.findById(room._id).populate('participants', 'username avatar');
    const participantsData = participants.participants.map(p => ({
      username: p.username,
      avatar: p.avatar,
    }));
    await pusher.trigger(`room-${roomCode}`, 'participantJoined', participantsData);
    res.json({
      message: 'Joined room successfully',
      room: {
        roomCode: room.roomCode,
        videoUrl: room.videoUrl,
        host: room.host.username,
        participants: participantsData,
        isPlaying: room.isPlaying,
        currentPlaybackTime: room.currentPlaybackTime,
      },
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
} 