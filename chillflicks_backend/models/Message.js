import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500  // Optional: Limit the message length
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Optional: Add indexes for performance optimization
messageSchema.index({ room: 1, sentAt: -1 }); // Sorting messages by sentAt

export default mongoose.model('Message', messageSchema);
