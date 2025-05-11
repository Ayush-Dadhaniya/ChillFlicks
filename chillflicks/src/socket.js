import { io } from "socket.io-client";

// Connect to the backend Socket.IO server (replace with your backend URL)
const socket = io("http://localhost:3000");

export default socket;
