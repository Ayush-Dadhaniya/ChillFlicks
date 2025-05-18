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
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      <h2 className="text-xl mb-2">Room: {roomCode}</h2>
      <div id="youtube-player" className="w-full max-w-3xl aspect-video mb-4" />
      <button onClick={handlePlayPause} className="mb-4 bg-blue-600 px-4 py-2 rounded">
        {isPlaying ? "Pause" : "Play"}
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Chat</h3>
          <div className="h-64 overflow-y-auto mb-2 border border-gray-600 p-2 rounded">
            {messages.map((msg, i) => (
              <div key={i} className="mb-1">
                <strong>{msg.user}</strong>: {msg.text} <span className="text-gray-400 text-xs">({msg.time})</span>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              className="flex-grow p-2 rounded-l bg-gray-700 border border-gray-600"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              className="bg-green-600 px-4 rounded-r"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Participants</h3>
          <ul>
            {participants.map((p, i) => (
              <li key={i} className="flex items-center space-x-2 mb-2" title={p.status}>
                <img
                  src={p.user.avatar || "/default_avatar.png"}
                  alt={`${p.user.username}'s avatar`}
                  className="w-8 h-8 rounded-full border border-gray-500"
                  onError={(e) => (e.target.src = "/default_avatar.png")}
                />
                <span className="font-medium">{p.user.username}</span>
                <span className={`text-sm ${p.status === "host" ? "text-yellow-400" : "text-blue-400"}`}>
                  ({p.status === "host" ? "Host" : "Guest"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
