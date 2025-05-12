import Message from "../models/Message.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

// Get all messages for a specific room
const getMessages = async (req, res) => {
  const { roomCode } = req.params;

  try {
    // Find the room by its code
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Find messages by room._id
    const messages = await Message.find({ room: room._id })
      .populate("room")
      .populate("sender", "name") // Only populate the name of the sender
      .sort({ sentAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
};

// Create a new message in a room
const createMessage = async (req, res) => {
  const { roomCode } = req.params;
  const { senderId, content } = req.body;

  if (!senderId || !content) {
    return res.status(400).json({ error: "Sender and content are required" });
  }

  try {
    // Find the room by its code
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Find the user by senderId
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Create a new message
    const newMessage = new Message({
      room: room._id,
      sender: sender._id, // Store sender ID
      content,
      sentAt: new Date(),
    });

    await newMessage.save();
    const populatedMessage = await newMessage.populate("sender", "name");  // Populate sender's name

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create message" });
  }
};

export { getMessages, createMessage };
