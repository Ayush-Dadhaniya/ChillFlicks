import connectDB from '../db.js';
import Message from '../models/Message.js';
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
      case 'send':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleSendMessage(req, res);

      case 'get':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleGetMessages(req, res);

      default:
        return res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Messages API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleSendMessage(req, res) {
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const { roomId, content } = req.body;

  if (!roomId || !content) {
    return res.status(400).json({ message: 'Room ID and content are required' });
  }

  try {
    const message = new Message({
      roomId,
      user: user._id,
      content,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id).populate('user', 'username avatar');

    const messageData = {
      id: populatedMessage._id,
      content: populatedMessage.content,
      timestamp: populatedMessage.timestamp,
      user: {
        username: populatedMessage.user.username,
        avatar: populatedMessage.user.avatar,
      },
    };

    // Trigger Pusher event
    await pusher.trigger(`room-${roomId}`, 'newMessage', messageData);

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageData,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
}

async function handleGetMessages(req, res) {
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