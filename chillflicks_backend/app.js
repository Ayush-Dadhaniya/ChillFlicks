// app.js
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

// Multer setup
const avatarDir = path.join(path.resolve(), 'uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Auth middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

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

// Routes
app.get('/', (_, res) => res.send('Hello, World!'));
app.get('/rooms/:roomCode', authenticateUser, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/messages', messageRoutes);

// In-memory state
const state = {
  participants: {},
  videoState: {},
  messages: {},
};

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, user }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    const room = state.participants[roomId] ||= [];
    const isHost = room.length === 0;
    const alreadyInRoom = room.some(p => p.id === socket.id);

    if (!alreadyInRoom) {
      room.push({ id: socket.id, user, status: isHost ? 'host' : 'active' });
    }

    state.videoState[roomId] ||= { isPlaying: false, currentTime: 0 };
    state.messages[roomId] ||= [];

    io.to(roomId).emit('participantJoined', room);
    socket.emit('videoStateChanged', state.videoState[roomId]);
    socket.emit('messageHistory', state.messages[roomId]);

    console.log(`${user} joined room ${roomId}`);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const history = state.messages[roomId] ||= [];
    history.push(message);
    io.to(roomId).emit('newMessage', message);
  });

  socket.on('updateVideoState', ({ roomId, isPlaying, currentTime }) => {
    const roomState = state.videoState[roomId];
    if (roomState) {
      roomState.isPlaying = isPlaying;
      roomState.currentTime = currentTime;
      io.to(roomId).emit('videoStateChanged', roomState);
    }
  });

  socket.on('updateVideoTime', ({ roomId, currentTime }) => {
    const roomState = state.videoState[roomId];
    if (roomState) {
      roomState.currentTime = currentTime;
      io.to(roomId).emit('videoTime', currentTime);
    }
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (!roomId) return;

    const room = state.participants[roomId];
    if (room) {
      state.participants[roomId] = room.filter(p => p.id !== socket.id);
      io.to(roomId).emit('participantJoined', state.participants[roomId]);

      if (state.participants[roomId].length === 0) {
        delete state.participants[roomId];
        delete state.videoState[roomId];
        delete state.messages[roomId];
      }
    }

    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
