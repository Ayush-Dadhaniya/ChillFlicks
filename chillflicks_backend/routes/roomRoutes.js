import express from 'express';
import { createRoom, joinRoom } from '../controllers/roomController.js';

const router = express.Router();

// Route to create a room
router.post('/create', createRoom);

// Route to join a room
router.post('/join/:roomCode', joinRoom);

export default router;
