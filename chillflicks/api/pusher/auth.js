import Pusher from 'pusher';
import { authenticateUser } from '../utils/auth.js';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { socket_id, channel_name } = req.body;
  if (!socket_id || !channel_name) {
    return res.status(400).json({ message: 'Missing socket_id or channel_name' });
  }
  try {
    const presenceData = {
      user_id: user._id.toString(),
      user_info: {
        username: user.username,
        avatar: user.avatar,
      },
    };
    const auth = pusher.authenticate(socket_id, channel_name, presenceData);
    res.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ message: 'Error authenticating with Pusher' });
  }
} 