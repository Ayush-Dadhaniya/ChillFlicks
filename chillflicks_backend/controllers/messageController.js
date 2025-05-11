// controllers/messageController.js
import Message from "../models/Message";
import User from "../models/User"; // Assuming you have a User model
import Room from "../models/Room"; // Assuming you have a Room model

// Get messages for a specific room
const getMessages = async (req, res) => {
  const { roomCode } = req.params;

  try {
    const messages = await Message.find({ room: roomCode })
      .populate('room')
      .populate('sender')  // Populate sender details (User model)
      .sort({ sentAt: -1 }); // Sort messages by sentAt in descending order
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
};

// Post a new message to a room
const createMessage = async (req, res) => {
  const { roomCode } = req.params;
  const { senderId, content } = req.body;  // senderId should come from the frontend (i.e., current logged-in user)

  if (!senderId || !content) {
    return res.status(400).json({ error: "Sender and content are required" });
  }

  try {
    const newMessage = new Message({
      room: roomCode,
      sender: senderId,
      content,
      sentAt: new Date(),
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create message" });
  }
};

export { getMessages, createMessage };
