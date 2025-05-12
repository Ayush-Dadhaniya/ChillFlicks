import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// Connect to the server
const socket = io("http://localhost:3000");

const Lobby = () => {
  const { roomCode } = useParams();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const API_URL = "http://localhost:3000";

  const fetchRoomDetails = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched room:", response.data);
      setVideoUrl(response.data.videoUrl);
      setIsPlaying(response.data.isPlaying);
    } catch (error) {
      console.error("Error fetching room details:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const name = decoded.username || decoded.name || "Unknown";
      setUserName(name);
      fetchRoomDetails(token);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!userName) return;

    socket.emit("joinRoom", roomCode, userName);

    socket.on("roomDetails", (roomData) => {
      setVideoUrl(roomData.videoUrl);
      setIsPlaying(roomData.isPlaying);
    });

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("videoStateChanged", (isPlaying) => {
      setIsPlaying(isPlaying);
    });

    socket.on("participantJoined", (participants) => {
      setParticipants(participants);
    });

    return () => {
      socket.off("roomDetails");
      socket.off("newMessage");
      socket.off("videoStateChanged");
      socket.off("participantJoined");
    };
  }, [roomCode, userName]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("sendMessage", roomCode, userName, newMessage);
      setNewMessage("");
    }
  };

  const handlePlayPause = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    socket.emit("updateVideoState", roomCode, newPlayState);
  };

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      <div className="mb-6 w-full max-w-6xl text-center">
        <span className="text-lg lg:text-xl font-semibold tracking-wide bg-gradient-to-r from-pink-500 to-green-400 text-transparent bg-clip-text">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        {/* Video Player */}
        <div className="bg-[#121212] flex-1 rounded-xl overflow-hidden shadow-xl border border-[#00FF88] p-4 flex flex-col justify-center items-center">
          <div className="w-full aspect-video bg-black flex items-center justify-center text-center border border-[#00FF88] rounded-lg relative">
            {videoUrl ? (
              <div className="w-full h-full relative">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${new URL(videoUrl).searchParams.get("v")}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <button
                  onClick={handlePlayPause}
                  className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-2xl text-white bg-green-600 p-2 rounded-full"
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

        {/* Chat and Participants */}
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
                  <span className={`px-3 py-1 rounded-md w-fit ${msg.user === userName ? "bg-green-800 text-white" : "bg-[#2a2a2a]"}`}>
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

          {/* Participants */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border-t-4 border-[#D946EF] flex flex-col">
            <div className="bg-[#D946EF] text-black text-sm font-bold px-4 py-2 rounded-t-xl">🫂 Participants</div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm">
              {participants.map((part, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-[#7dd3fc]">{part.name}</span>
                  <span className="text-xs text-gray-400">{part.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
