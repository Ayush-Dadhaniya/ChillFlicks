import express from 'express';
import { createRoom, joinRoom } from '../controllers/roomController.js';
import { getRoomDetails } from '../controllers/roomController.js'; // Import the function to get room details
const router = express.Router();

// Route to create a room
router.post('/create', createRoom);
// In your roomRouter.js
router.get('/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    try {
      // Fetch the room details based on roomCode
      const room = await getRoomDetails(roomCode); // Replace with actual function to get room details
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.status(200).json(room);
    } catch (error) {
      console.error('Error fetching room details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Route to join a room
router.post('/join/:roomCode', joinRoom);

export default router;
