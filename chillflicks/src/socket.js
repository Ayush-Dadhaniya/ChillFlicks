import Pusher from 'pusher-js';

// Initialize Pusher
const pusher = new Pusher(process.env.VITE_PUSHER_KEY || 'your-pusher-key', {
  cluster: process.env.VITE_PUSHER_CLUSTER || 'us2',
  forceTLS: true
});

export default pusher;
