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

  await connectDB();

  const { route } = req.query;
  const [action] = route || [];

  try {
    switch (action) {
      case 'create':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleCreateRoom(req, res);

      case 'join':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleJoinRoom(req, res);

      case 'get':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleGetRoom(req, res);

      case 'update':
        if (req.method !== 'PUT') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleUpdateRoom(req, res);

      default:
        return res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Rooms API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleCreateRoom(req, res) {
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

async function handleJoinRoom(req, res) {
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

    // Add user to participants if not already there
    if (!room.participants.includes(user._id)) {
      room.participants.push(user._id);
      await room.save();
    }

    const participants = await Room.findById(room._id).populate('participants', 'username avatar');

    const participantsData = participants.participants.map(p => ({
      username: p.username,
      avatar: p.avatar,
    }));

    // Trigger Pusher event for participant joined
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

async function handleGetRoom(req, res) {
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

async function handleUpdateRoom(req, res) {
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

    // Only host can update video state
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

    // Trigger Pusher event for video state change
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