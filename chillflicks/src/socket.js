import { io } from "socket.io-client";

// Connect to the backend Socket.IO server (replace with your backend URL)
const socket = io("https://chillflicks.up.railway.app");

export default socket;
