import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Lobby = () => {
  const { roomCode } = useParams();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState(""); // Get the username from token
  const [videoUrl, setVideoUrl] = useState(""); // State to hold videoUrl
  const [isPlaying, setIsPlaying] = useState(false); // To track if video is playing

  const API_URL = "http://localhost:3000"; // Change to your backend URL

  // Fetch messages for a specific room
  const fetchMessages = async (roomCode) => {
    try {
      const response = await axios.get(`${API_URL}/messages/${roomCode}/messages`);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  // Fetch participants for a specific room
  const fetchParticipants = async (roomCode) => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomCode}/participants`);
      return response.data;
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  };

  // Fetch room details (including videoUrl) for a specific room
  const fetchRoomDetails = async (roomCode) => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomCode}`);
      const roomData = response.data;
      setVideoUrl(roomData.videoUrl);  // Set the video URL from the room data
      setIsPlaying(roomData.isPlaying); // Set video play state from room data
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  // Send a message to the room
  const sendMessage = async (roomCode, senderId, content) => {
    try {
      const response = await axios.post(`${API_URL}/messages/${roomCode}/messages`, { senderId, content });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  };

  // Add the current user to the participants list
  const addUserToRoom = async (roomCode, userName) => {
    try {
      const response = await axios.post(`${API_URL}/rooms/${roomCode}/addParticipant`, { name: userName, status: 'active' });
      return response.data;
    } catch (error) {
      console.error("Error adding user to room:", error);
      return null;
    }
  };

  // Fetch messages, participants, and room details when the component mounts
  useEffect(() => {
    const getData = async () => {
      const messagesData = await fetchMessages(roomCode);
      const participantsData = await fetchParticipants(roomCode);
      setMessages(messagesData);
      setParticipants(participantsData);
    };

    const addUser = async () => {
      await addUserToRoom(roomCode, userName); // Add user to the room
    };

    // Get user name from token
    const token = localStorage.getItem("authToken");  // Get the token from local storage
    if (token) {
      const user = JSON.parse(atob(token.split('.')[1])); // Decode token (JWT)
      setUserName(user.name);  // Assuming the token has a 'name' field
    }

    getData();
    if (userName) addUser(); // Ensure user is added after username is set
    fetchRoomDetails(roomCode); // Fetch the room details (including videoUrl)
  }, [roomCode, userName]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Use the actual userName as the sender
    const senderId = userName;

    const sentMessage = await sendMessage(roomCode, senderId, newMessage);

    if (sentMessage) {
      setMessages([
        ...messages,
        {
          user: "You", // Assuming 'You' is the current logged-in user
          text: newMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setNewMessage("");
    }
  };

  const handlePlayPause = async () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);

    try {
      await axios.put(`${API_URL}/rooms/${roomCode}/updatePlayback`, { isPlaying: newPlayState });
    } catch (error) {
      console.error("Error updating video playback state:", error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      {/* Room Code Header */}
      <div className="mb-6 w-full max-w-6xl text-center">
        <span className="text-lg lg:text-xl font-semibold tracking-wide bg-gradient-to-r from-pink-500 to-green-400 text-transparent bg-clip-text">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        {/* Video Player */}
        <div className="bg-[#121212] flex-1 rounded-xl overflow-hidden shadow-xl border border-[#00FF88] p-4 flex flex-col justify-center items-center">
          <div className="w-full aspect-video bg-black flex items-center justify-center text-center border border-[#00FF88] rounded-lg">
            {videoUrl ? (
              <div className="w-full h-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${new URL(videoUrl).searchParams.get("v")}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <button
                  onClick={handlePlayPause}
                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-2xl text-white bg-green-600 p-2 rounded-full"
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
              </div>
            ) : (
              <div>
                <button className="bg-[#FF00FF] w-16 h-16 rounded-full text-xl text-white shadow-lg mb-4">
                  ▶
                </button>
                <p className="text-green-400 font-bold">WAITING FOR HOST</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat & Squad */}
        <div className="flex flex-col lg:w-96 gap-4">
          {/* Chat Box */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border-t-4 border-[#D946EF] flex flex-col h-[400px]">
            <div className="bg-[#D946EF] text-black text-sm font-bold px-4 py-2 rounded-t-xl">💬 VIBE CHAT</div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[#7dd3fc] font-semibold">
                    {msg.user} <span className="text-gray-400 text-xs">{msg.time}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-md w-fit ${msg.user === "You" ? "bg-green-800 text-white" : "bg-[#2a2a2a]"}`}>
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center border-t border-gray-700 px-4 py-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Send a vibe..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                className="text-[#00FF88] font-bold hover:text-white transition"
              >
                ➤
              </button>
            </div>
          </div>

          {/* Squad List */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border-t-4 border-[#00FF88] flex-1">
            <div className="bg-[#00FF88] text-black text-sm font-bold px-4 py-2 rounded-t-xl">🧑‍🤝‍🧑 SQUAD</div>
            <ul className="p-4 space-y-2 text-sm">
              {participants.map((p, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-[#A5F3FC]">{p.name}</span>
                  <span
                    className={`text-xs rounded px-2 py-0.5 ${
                      p.status === "host" ? "bg-yellow-500 text-black" :
                      p.status === "brb" ? "bg-purple-500 text-white" :
                      "bg-green-500 text-white"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
