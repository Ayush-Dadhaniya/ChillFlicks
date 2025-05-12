import express from 'express';
import { getMessages, createMessage } from '../controllers/messageController.js';

const router = express.Router();

// Route to get all messages in a room
router.get('/:roomCode/messages', getMessages);

// Route to create a new message in a room
router.post('/:roomCode/messages', createMessage);

export default router;
