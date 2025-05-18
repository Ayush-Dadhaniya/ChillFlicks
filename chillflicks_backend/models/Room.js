import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['host', 'active'], default: 'active' }
});

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl: { type: String, required: true },

  participants: [participantSchema], // 👥 Array of users with status

  // 🔄 These two fields are needed for video sync persistence
  isPlaying: { type: Boolean, default: false },
  currentPlaybackTime: { type: Number, default: 0 }, // in seconds

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Room', roomSchema);
