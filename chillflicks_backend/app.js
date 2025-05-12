import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Room from './models/Room.js';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Avatar storage setup
const avatarDir = path.join(path.resolve(), 'uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Routes setup
app.get('/', (req, res) => res.send('Hello, World!'));

app.get('/rooms/:roomCode', authenticateUser, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Routes for auth, rooms, messages
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/messages', messageRoutes);

const participants = {};
const videoState = {};
const messageHistory = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ roomId, user }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    if (!participants[roomId]) participants[roomId] = [];
    if (!videoState[roomId]) videoState[roomId] = { isPlaying: false, currentTime: 0 };
    if (!messageHistory[roomId]) messageHistory[roomId] = [];

    const alreadyJoined = participants[roomId].some(p => p.id === socket.id);
    if (!alreadyJoined) {
      participants[roomId].push({ id: socket.id, name: user });
    }

    // Notify all users in the room about updated participants
    io.to(roomId).emit('participantJoined', participants[roomId]);

    // Send video state to the new user
    socket.emit('videoStateChanged', videoState[roomId]);

    // Send chat history to the new user
    socket.emit('messageHistory', messageHistory[roomId]);

    console.log(`${user} joined room: ${roomId}`);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    if (!messageHistory[roomId]) messageHistory[roomId] = [];
    messageHistory[roomId].push(message);

    io.to(roomId).emit('newMessage', message);
  });

  socket.on('updateVideoState', ({ roomId, isPlaying, currentTime }) => {
    if (videoState[roomId]) {
      videoState[roomId] = { isPlaying, currentTime };
      io.to(roomId).emit('videoStateChanged', videoState[roomId]);
    }
  });

  socket.on('updateVideoTime', ({ roomId, currentTime }) => {
    if (videoState[roomId]) {
      videoState[roomId].currentTime = currentTime;
      io.to(roomId).emit('videoTime', currentTime);
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && participants[roomId]) {
      participants[roomId] = participants[roomId].filter(p => p.id !== socket.id);

      io.to(roomId).emit('participantJoined', participants[roomId]);

      if (participants[roomId].length === 0) {
        delete participants[roomId];
        delete videoState[roomId];
        delete messageHistory[roomId];
      }
    }

    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
