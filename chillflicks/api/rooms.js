import connectDB from './db.js';
import Room from './models/Room.js';
import { authenticateUser } from './utils/auth.js';
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  await connectDB();

  try {
    if (req.method === 'POST') {
      // Handle room creation and joining
      const { action, roomCode, videoUrl } = req.body;
      
      if (action === 'create') {
        const user = await authenticateUser(req);
        if (!user) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        if (!videoUrl) {
          return res.status(400).json({ message: 'Video URL is required' });
        }
        
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room({
          roomCode,
          host: user._id,
          participants: [user._id],
          videoUrl,
          isPlaying: false,
          currentPlaybackTime: 0,
        });
        await room.save();
        
        res.status(201).json({
          message: 'Room created successfully',
          room: {
            roomCode: room.roomCode,
            videoUrl: room.videoUrl,
            host: user.username,
            participants: [{ username: user.username, avatar: user.avatar }],
            isPlaying: room.isPlaying,
            currentPlaybackTime: room.currentPlaybackTime,
          },
        });
      } else if (action === 'join') {
        const user = await authenticateUser(req);
        if (!user) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roomCode) {
          return res.status(400).json({ message: 'Room code is required' });
        }
        
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
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }
    } else if (req.method === 'GET') {
      // Handle getting room info
      const { roomCode } = req.query;
      if (!roomCode) {
        return res.status(400).json({ message: 'Room code is required' });
      }
      
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
    } else if (req.method === 'PUT') {
      // Handle room updates
      const user = await authenticateUser(req);
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { roomCode, isPlaying, currentPlaybackTime } = req.body;
      if (!roomCode) {
        return res.status(400).json({ message: 'Room code is required' });
      }
      
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
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Room operation error:', error);
    res.status(500).json({ message: 'Error processing room request' });
  }
} 