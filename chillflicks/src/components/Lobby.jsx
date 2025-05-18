import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const API_URL = "http://localhost:3000";
const socket = io(API_URL);

const Lobby = () => {
  const { roomCode } = useParams();
  const playerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const extractYouTubeId = (url) => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const name = decoded.username || decoded.name || "Guest";
      setUserName(name);

      axios
        .get(`${API_URL}/rooms/${roomCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setVideoUrl(res.data.videoUrl);
          setIsPlaying(res.data.isPlaying);
          setParticipants(res.data.participants || []);
        });
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!userName) return;

    socket.emit("joinRoom", { roomId: roomCode, user: userName });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("messageHistory", (history) => {
      setMessages(history);
    });

    socket.on("participantJoined", (updatedParticipants) => {
      setParticipants(updatedParticipants);
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

    return () => {
      socket.off("newMessage");
      socket.off("messageHistory");
      socket.off("participantJoined");
      socket.off("videoStateChanged");
    };
  }, [userName, roomCode, playerReady]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const msg = {
        user: userName,
        text: newMessage,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("sendMessage", { roomId: roomCode, message: msg });
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
  <div className="bg-black min-h-screen text-white font-sans flex flex-col items-center justify-start p-4 space-y-4">
    {/* Video Player */}
    <div className="relative w-full max-w-5xl aspect-video rounded-xl border border-gray-700 shadow-2xl bg-gradient-to-tr from-[#0f0f0f] to-[#1a1a1a]">
      <div id="youtube-player" className="w-full h-full rounded-xl" />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <button
            onClick={handlePlayPause}
            className="bg-pink-600 text-white text-4xl p-6 rounded-full shadow-md hover:scale-110 transition"
          >
            ▶
          </button>
          <p className="absolute bottom-10 w-full text-green-400 text-xl animate-pulse">WAITING FOR HOST</p>
        </div>
      )}
    </div>

    {/* Chat + Squad */}
    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Vibe Chat */}
      <div className="col-span-2 rounded-xl bg-gradient-to-br from-purple-800 to-pink-700 p-4 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold tracking-wider">VIBE CHAT</h3>
          <div className="bg-yellow-400 text-black rounded-full px-2 py-1 text-xs font-bold">
            🔥 23 VIBING
          </div>
        </div>
        <div className="h-64 overflow-y-auto bg-black bg-opacity-20 rounded-lg p-3 space-y-2 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className="p-2 bg-black bg-opacity-50 rounded-md">
              <span className="font-bold text-[cyan]">{msg.user}</span>{" "}
              <span className="text-white">{msg.text}</span>{" "}
              <span className="text-gray-400 text-xs">({msg.time})</span>
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          <input
            className="flex-grow px-4 py-2 rounded-l bg-gray-900 border border-gray-700 focus:outline-none text-white"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a vibe..."
          />
          <button
            className="bg-green-500 px-4 py-2 rounded-r hover:bg-green-600 transition"
            onClick={handleSendMessage}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Squad Section */}
      <div className="rounded-xl bg-gradient-to-br from-green-400 to-green-600 p-4 shadow-lg text-black">
        <h3 className="text-lg font-bold mb-3">SQUAD</h3>
        <ul className="space-y-2">
          {participants.map((p, i) => (
            <li key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={p.user.avatar || "/default_avatar.png"}
                    alt={`${p.user.username}'s avatar`}
                    onError={(e) => (e.target.src = "/default_avatar.png")}
                  />
                </div>
                <span className="font-medium">{p.user.username}</span>
              </div>
              <div className="text-xs">
                {p.status === "host" ? (
                  <span className="text-yellow-700 font-bold">👑 Host</span>
                ) : (
                  <span className="text-blue-700 font-semibold">🎥 Watching</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);
};

export default Lobby;
