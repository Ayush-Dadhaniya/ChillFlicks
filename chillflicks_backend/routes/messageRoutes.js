// routes/messageRoutes.js
import express from 'express';
import { getMessages, createMessage } from '../controllers/messageController';

const router = express.Router();

// Get all messages in a specific room
router.get('/:roomCode/messages', getMessages);

// Post a message in a specific room
router.post('/:roomCode/messages', createMessage);

export default router;
