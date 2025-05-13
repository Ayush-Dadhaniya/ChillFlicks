import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  currentPlaybackTime: {
    type: Number,
    default: 0 // in seconds
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['host', 'active'],
      default: 'active'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
},{ timestamps: true });

export default mongoose.model('Room', roomSchema);
