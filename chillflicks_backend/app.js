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
app.get('/profile', authenticateUser, (req, res) => res.json(req.user));
app.post('/profile/update-avatar', authenticateUser, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    req.user.avatar = avatarPath;
    await req.user.save();
    res.json({ success: true, avatar: avatarPath });
  } catch (err) {
    console.error('Error updating avatar:', err);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

// Routes for auth, rooms, messages
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/messages', messageRoutes);

// Socket.IO logic
const participants = {}; // Track participants per room
const videoState = {}; // Track video state for each room

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joining a room
  socket.on('joinRoom', ({ roomId, user }) => {
    socket.join(roomId);

    if (!participants[roomId]) {
      participants[roomId] = [];
      videoState[roomId] = { isPlaying: false, currentTime: 0 };
    }

    const alreadyJoined = participants[roomId].some(u => u.id === socket.id);
    if (!alreadyJoined) {
      participants[roomId].push({ id: socket.id, name: user });
    }

    console.log(`${user} joined room: ${roomId}`);
    socket.to(roomId).emit('userJoined', `${user} joined`);

    // Send current video state when a new participant joins
    socket.emit('videoState', videoState[roomId]);
  });

  // Handle message sending
  socket.on('sendMessage', ({ roomId, message, sender }) => {
    io.to(roomId).emit('receiveMessage', { message, sender });
  });

  // Handle video play/pause state change
  socket.on('updateVideoState', ({ roomId, isPlaying, currentTime }) => {
    if (videoState[roomId]) {
      videoState[roomId] = { isPlaying, currentTime };
      io.to(roomId).emit('videoState', videoState[roomId]);
    }
  });

  // Handle video time update
  socket.on('updateVideoTime', ({ roomId, currentTime }) => {
    if (videoState[roomId]) {
      videoState[roomId].currentTime = currentTime;
      io.to(roomId).emit('videoTime', currentTime);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const roomId in participants) {
      participants[roomId] = participants[roomId].filter(p => p.id !== socket.id);

      // Optionally notify others
      io.to(roomId).emit('userLeft', socket.id);

      // Clean up empty rooms
      if (participants[roomId].length === 0) {
        delete participants[roomId];
        delete videoState[roomId];
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
