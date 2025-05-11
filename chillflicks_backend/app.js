import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import fs from 'fs';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for avatars
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Ensure the avatars folder exists
const avatarDir = path.join(path.resolve(), 'uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Middleware to authenticate and attach user to request
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Protected profile route
app.get('/profile', authenticateUser, (req, res) => {
  res.json(req.user);
});

// Update avatar route (protected)
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

// Auth routes
app.use('/auth', authRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
