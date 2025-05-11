import Room from '../models/Room.js';  // import the Room model

// Create Room
export const createRoom = async (req, res) => {
  try {
    const { host, videoUrl } = req.body;

    const roomCode = generateRoomCode(); // You can extract this logic into a helper function
    const newRoom = new Room({
      roomCode,
      host,
      videoUrl,
      participants: [{ name: host, status: 'host' }]  // Add the host to participants
    });

    await newRoom.save();
    res.status(201).json({ roomCode: newRoom.roomCode, message: "Room created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating room" });
  }
};

// Join Room
export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.body.userId; // assuming userId is sent in the body

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    room.participants.push({ name: userId, status: 'active' });  // Add participant with 'active' status
    await room.save();
    
    res.status(200).json({ message: "Successfully joined the room." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error joining room" });
  }
};

// Helper function to generate the room code
const generateRoomCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
