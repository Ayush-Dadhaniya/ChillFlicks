import express from 'express';
import { getMessages, createMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:roomCode/messages', getMessages);
router.post('/:roomCode/messages', createMessage);

export default router;
