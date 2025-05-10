import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors'
import multer from 'multer';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();
connectDB();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars'); // Store avatars in 'uploads/avatars' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set a unique filename
  }
});

const upload = multer({ storage });

// Route to fetch user data
app.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user); // Return user data including avatar URL
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Route to update avatar
app.post('/profile/update-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findById(req.user.id);
    user.avatar = avatarPath; // Save avatar URL in the user’s profile
    await user.save();
    res.json({ success: true, avatar: avatarPath });
  } catch (err) {
    res.status(500).json({ message: 'Error updating avatar' });
  }
});
app.use('/auth', authRoutes);


app.listen(3000, () => {
  console.log('Server is running on port 3000');
} );