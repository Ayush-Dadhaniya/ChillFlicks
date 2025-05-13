import express from 'express';
import { createRoom, joinRoom } from '../controllers/roomController.js';
import { getRoomDetails } from '../controllers/roomController.js'; // Import the function to get room details
const router = express.Router();

// Route to create a room
router.post('/create', createRoom);

router.get('/:roomCode', getRoomDetails);

router.post('/join/:roomCode', joinRoom);

export default router;
