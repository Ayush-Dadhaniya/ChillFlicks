import Pusher from 'pusher';

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { route } = req.query;
  const [action] = route || [];

  try {
    switch (action) {
      case 'auth':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleAuth(req, res);

      case 'trigger':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return await handleTrigger(req, res);

      default:
        return res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Pusher API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleAuth(req, res) {
  const { socket_id, channel_name } = req.body;

  if (!socket_id || !channel_name) {
    return res.status(400).json({ message: 'socket_id and channel_name are required' });
  }

  try {
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    res.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ message: 'Error authorizing channel' });
  }
}

async function handleTrigger(req, res) {
  const { channel, event, data } = req.body;

  if (!channel || !event || !data) {
    return res.status(400).json({ message: 'channel, event, and data are required' });
  }

  try {
    await pusher.trigger(channel, event, data);
    res.json({ message: 'Event triggered successfully' });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    res.status(500).json({ message: 'Error triggering event' });
  }
} 