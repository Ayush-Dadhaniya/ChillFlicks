# ChillFlicks - Serverless Version

A real-time video watching platform built with React, Vercel serverless functions, MongoDB, and Pusher for real-time communication.

## Features

- 🎬 Real-time synchronized video watching
- 💬 Live chat with emoji support
- 👥 Multi-user rooms with participant management
- 🔐 JWT authentication
- 📱 Responsive design
- ⚡ Serverless architecture

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: MongoDB Atlas
- **Real-time**: Pusher
- **Authentication**: JWT
- **Deployment**: Vercel

## Prerequisites

1. **MongoDB Atlas Account**
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Get your connection string

2. **Pusher Account**
   - Sign up at [Pusher](https://pusher.com/)
   - Create a new Channels app
   - Get your app credentials

3. **Vercel Account**
   - Sign up at [Vercel](https://vercel.com/)

## Environment Variables

### Backend (Vercel Environment Variables)

Set these in your Vercel project dashboard:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

### Frontend (Vercel Environment Variables)

```env
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
VITE_API_URL=https://your-vercel-domain.vercel.app/api
```

## Deployment Steps

### 1. Prepare Your Repository

1. Make sure all your code is in the `chillflicks` directory
2. Remove the old `chillflicks_backend` folder (if it exists)
3. Commit and push your changes to GitHub

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `chillflicks`
5. Configure environment variables (see above)
6. Deploy

### 3. Configure Environment Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add all the variables listed above
4. Redeploy if needed

## Local Development

### 1. Install Dependencies

```bash
cd chillflicks
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `chillflicks` directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Rooms
- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/join` - Join an existing room
- `GET /api/rooms/get` - Get room information
- `PUT /api/rooms/update` - Update room state (host only)

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages/get` - Get message history

### Profile
- `GET /api/profile` - Get user profile

### Pusher
- `POST /api/pusher/auth` - Authenticate Pusher channel
- `POST /api/pusher/trigger` - Trigger Pusher events

## Real-time Events

The app uses Pusher channels for real-time communication:

- `room-{roomCode}` - Room-specific channel
- Events:
  - `newMessage` - New chat message
  - `participantJoined` - User joined room
  - `videoStateChanged` - Video play/pause/seek

## Project Structure

```
chillflicks/
├── api/                    # Serverless functions
│   ├── auth/              # Authentication endpoints
│   ├── rooms/             # Room management
│   ├── messages/          # Chat functionality
│   ├── pusher/            # Real-time events
│   ├── models/            # Database models
│   ├── utils/             # Utility functions
│   └── db.js              # Database connection
├── src/                   # Frontend React app
│   ├── components/        # React components
│   ├── api.js             # API service
│   └── socket.js          # Pusher configuration
├── public/                # Static assets
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Vercel domain is added to your MongoDB Atlas IP whitelist
2. **Pusher Connection**: Verify your Pusher credentials are correct
3. **Database Connection**: Check your MongoDB Atlas connection string
4. **Environment Variables**: Ensure all variables are set in Vercel dashboard

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set correctly
4. Ensure your MongoDB Atlas cluster is accessible

## License

This project is open source and available under the [MIT License](LICENSE).
