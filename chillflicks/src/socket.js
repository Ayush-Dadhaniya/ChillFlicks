import Pusher from 'pusher-js';

// Initialize Pusher with environment variables
const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY || 'your-pusher-key', {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
  forceTLS: true
});

export default pusher;
