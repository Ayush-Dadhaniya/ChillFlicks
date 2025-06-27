import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  videoUrl: {
    type: String,
    required: true,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  currentPlaybackTime: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Room || mongoose.model('Room', roomSchema); 