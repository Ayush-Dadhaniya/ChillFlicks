import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const Lobby = () => {
  const { roomCode } = useParams();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);

  const API_URL = "http://localhost:3000";

  const extractYouTubeId = (url) => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const fetchRoomDetails = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideoUrl(response.data.videoUrl);
      setIsPlaying(response.data.isPlaying);
      setParticipants(response.data.participants);
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
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

    socket.emit("joinRoom", { roomId: roomCode, user: userName });

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("videoStateChanged", ({ isPlaying, currentTime }) => {
      setIsPlaying(isPlaying);

      const trySyncPlayback = () => {
        if (playerRef.current && playerReady) {
          const state = playerRef.current.getPlayerState();
          const diff = Math.abs(playerRef.current.getCurrentTime() - currentTime);

          if (diff > 1) playerRef.current.seekTo(currentTime, true);

          if (isPlaying && state !== 1) playerRef.current.playVideo();
          if (!isPlaying && state === 1) playerRef.current.pauseVideo();
        } else {
          setTimeout(trySyncPlayback, 500);
        }
      };

      trySyncPlayback();
    });

    socket.on("participantJoined", (participants) => {
      setParticipants(participants);
    });

    return () => {
      socket.off("newMessage");
      socket.off("videoStateChanged");
      socket.off("participantJoined");
    };
  }, [roomCode, userName, playerReady]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        user: userName,
        text: newMessage,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("sendMessage", { roomId: roomCode, message });
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage("");
    }
  };

  const handlePlayPause = () => {
    if (!playerReady || !playerRef.current) return;

    const newPlayState = !isPlaying;
    const currentTime = playerRef.current.getCurrentTime();

    setIsPlaying(newPlayState);
    socket.emit("updateVideoState", {
      roomId: roomCode,
      isPlaying: newPlayState,
      currentTime,
    });
  };

  useEffect(() => {
    if (!videoUrl) return;
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;

    const loadPlayer = () => {
      if (playerRef.current) return;

      const player = new window.YT.Player("youtube-player", {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          controls: 0,
          fs: 0,
          iv_load_policy: 3,
          disablekb: 1,
          autoplay: 0,
          playsinline: 1,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            setPlayerReady(true);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      const existingScript = document.querySelector("script[src='https://www.youtube.com/iframe_api']");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = loadPlayer;
    }
  }, [videoUrl]);

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      <div className="mb-6 w-full max-w-6xl text-center">
        <span className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-green-400 text-transparent bg-clip-text">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        <div className="bg-[#121212] flex-1 rounded-xl shadow-xl border border-[#00FF88] p-4 flex flex-col items-center">
          <div className="w-full aspect-video bg-black border border-[#00FF88] rounded-lg relative flex items-center justify-center">
            {videoUrl ? (
              <>
                <div className="w-full h-full" id="youtube-player"></div>
                <button
                  onClick={handlePlayPause}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-semibold px-6 py-2 rounded-full shadow-lg hover:scale-105 transition"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
              </>
            ) : (
              <div className="text-center">
                <button className="bg-[#FF00FF] w-16 h-16 rounded-full text-xl text-white shadow-lg mb-4">
                  ▶
                </button>
                <p className="text-green-400 font-bold">WAITING FOR HOST</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:w-96 gap-4">
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
          {participants.map((part, i) => (
            <div key={i} className="flex items-center space-x-2">
              <span className="text-[#7dd3fc]">
                {typeof part === "object" ? part.name || "Unnamed" : "Unknown"}
              </span>
              <span className="text-xs text-gray-400">
                {part.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
