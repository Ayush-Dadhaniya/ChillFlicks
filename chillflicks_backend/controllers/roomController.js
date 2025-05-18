import Room from '../models/Room.js';  // import the Room model
import User from '../models/User.js';

// Create Room
export const createRoom = async (req, res) => {
  try {
    const { host, videoUrl } = req.body;

    const roomCode = generateRoomCode(); // You can extract this logic into a helper function
    const newRoom = new Room({
      roomCode,
      host,
      videoUrl,
      participants: [{ user: host, status: 'host' }]  // Add the host to participants
    });

    await newRoom.save();
    res.status(201).json({ roomCode: newRoom.roomCode, message: "Room created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating room" });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found." });

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found." });

    // Ensure no duplicates (use String comparison for safety)
    const alreadyInRoom = room.participants.some(p => p.user.toString() === user._id.toString());
    if (!alreadyInRoom) {
      // If not already present, add user as active
      room.participants.push({ user: user._id, status: 'active' });
      await room.save();
    }

    res.status(200).json({ message: "Successfully joined the room." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error joining room" });
  }
};


const generateRoomCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate('participants.user', 'username name')
      .exec();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    console.log(room);
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};