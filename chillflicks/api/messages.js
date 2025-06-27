import connectDB from './db.js';
import Message from './models/Message.js';
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  await connectDB();

  try {
    if (req.method === 'POST') {
      // Handle sending messages
      const user = await authenticateUser(req);
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { roomId, content } = req.body;
      if (!roomId || !content) {
        return res.status(400).json({ message: 'Room ID and content are required' });
      }
      
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
      
      await pusher.trigger(`room-${roomId}`, 'newMessage', messageData);
      
      res.status(201).json({
        message: 'Message sent successfully',
        data: messageData,
      });
    } else if (req.method === 'GET') {
      // Handle getting messages
      const { roomId } = req.query;
      if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
      }
      
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
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Message operation error:', error);
    res.status(500).json({ message: 'Error processing message request' });
  }
} 