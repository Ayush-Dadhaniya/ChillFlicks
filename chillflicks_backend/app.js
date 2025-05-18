import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import User from './models/User.js';
import Room from './models/Room.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

const avatarDir = path.join(path.resolve(), 'uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/', (_, res) => res.send('Hello, World!'));

app.get('/profile', authenticateUser, (req, res) => {
  res.json(req.user);
});

app.post('/profile/update-avatar', upload.single('avatar'), async (req, res) => {
  try {
    req.user.avatar = `/uploads/avatars/${req.file.filename}`;
    await req.user.save();
    res.json({ success: true, avatar: req.user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/messages', messageRoutes);

const state = {
  participants: {},
  messages: {},
};

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('joinRoom', async ({ roomId, user }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    const room = state.participants[roomId] ||= [];
    const isHost = room.length === 0;
    const alreadyInRoom = room.some(p => p.id === socket.id);
    if (!alreadyInRoom) {
      const userData = await User.findOne({ username: user }).select('username avatar');
      room.push({ id: socket.id, user: userData, status: isHost ? 'host' : 'active' });
    }

    state.messages[roomId] ||= [];

    const dbRoom = await Room.findOne({ roomCode: roomId });
    if (dbRoom) {
      socket.emit('videoStateChanged', {
        isPlaying: dbRoom.isPlaying,
        currentTime: dbRoom.currentPlaybackTime
      });
    }

    socket.emit('messageHistory', state.messages[roomId]);
    io.to(roomId).emit('participantJoined', room);
    console.log(`${user} joined room ${roomId}`);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const history = state.messages[roomId] ||= [];
    history.push(message);
    io.to(roomId).emit('newMessage', message);
  });

  socket.on('updateVideoState', async ({ roomId, isPlaying, currentTime }) => {
    try {
      const dbRoom = await Room.findOne({ roomCode: roomId });
      if (dbRoom) {
        dbRoom.isPlaying = isPlaying;
        dbRoom.currentPlaybackTime = currentTime;
        await dbRoom.save();
        io.to(roomId).emit('videoStateChanged', {
          isPlaying: dbRoom.isPlaying,
          currentTime: dbRoom.currentPlaybackTime
        });
      }
    } catch (error) {
      console.error('Error updating DB video state:', error);
    }
  });

  socket.on('updateVideoTime', async ({ roomId, currentTime }) => {
    try {
      const dbRoom = await Room.findOne({ roomCode: roomId });
      if (dbRoom) {
        dbRoom.currentPlaybackTime = currentTime;
        await dbRoom.save();
        io.to(roomId).emit('videoTime', currentTime);
      }
    } catch (error) {
      console.error('Error updating DB video time:', error);
    }
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (!roomId) return;

    const room = state.participants[roomId];
    if (room) {
      state.participants[roomId] = room.filter(p => p.id !== socket.id);
      const remaining = state.participants[roomId];
      if (!remaining.some(p => p.status === 'host') && remaining.length > 0) {
        remaining[0].status = 'host';
      }
      io.to(roomId).emit('participantJoined', remaining);
      console.log(`${socket.data.user} disconnected from room ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));