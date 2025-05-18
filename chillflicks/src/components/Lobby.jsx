// File: Lobby.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const API_URL = "http://localhost:3000";
const socket = io(API_URL);

const Lobby = () => {
  const { roomCode } = useParams();
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const extractYouTubeId = (url) => {
    const regExp =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
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

  // Zoom toggle
  const toggleZoom = () => {
    setIsZoomed((z) => !z);
  };

  // Volume change handler
  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
      if (vol === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  // Mute/unmute toggle
  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      setVolume(playerRef.current.getVolume());
    } else {
      playerRef.current.mute();
      setIsMuted(true);
      setVolume(0);
    }
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
          modestbranding: 0,
          rel: 0,
          controls: 1,
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
            playerRef.current.setVolume(volume);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      const existingScript = document.querySelector(
        "script[src='https://www.youtube.com/iframe_api']"
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = loadPlayer;
    }
  }, [videoUrl]);

  return (
    <div className="bg-[#0f0f0f] text-white min-h-screen p-6 font-sans">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#7f00ff] mb-6 text-center">
        Room Code: {roomCode}
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
        {/* Video Section */}
        <div
          className={`w-full lg:w-2/3 transition-transform duration-300 ${
            isZoomed ? "scale-125" : "scale-100"
          }`}
          ref={playerContainerRef}
        >
          <div
            id="youtube-player"
            className="aspect-video w-full rounded-xl shadow-cyan-200"
          />
          {/* Custom Controls */}
          <div className="flex items-center mt-4 space-x-4">
            <button
              onClick={handlePlayPause}
              className="px-6 py-2 text-white font-semibold rounded-full bg-gradient-to-r from-[#ff00ff] to-[#7f00ff] hover:from-[#00d0dd] hover:to-[#6a00cc] shadow-lg transition"
            >
              {isPlaying ? "Pause Video" : "Play Video"}
            </button>

            <button
              onClick={toggleZoom}
              className={`px-4 py-2 rounded-full font-semibold shadow-lg transition ${
                isZoomed
                  ? "bg-purple-700 hover:bg-purple-900 text-white"
                  : "bg-[#7f00ff] hover:bg-[#5a00cc] text-white"
              }`}
              title="Toggle Zoom"
            >
              {isZoomed ? "Normal Size" : "Magnify"}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="px-3 py-1 rounded-full bg-[#7f00ff] hover:bg-[#5a00cc] text-white shadow-lg transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 cursor-pointer"
                title="Volume"
              />
            </div>
          </div>
        </div>

        {/* Chat & Participants */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Chat */}
          <div className="bg-[#1a1a1a] border border-[#7f00ff] rounded-lg p-4 shadow-[0_0_10px_#00f0ff]">
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#7f00ff] mb-2">
              Chat
            </h3>
            <div className="h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#00f0ff] mb-3 px-1">
              {messages.map((msg, i) => (
                <div key={i} className="p-2 rounded-md bg-transparent">
                  <strong className="text-[#00f0ff]">{msg.user}</strong>:{" "}
                  {msg.text}
                  <div className="text-xs text-gray-400">{msg.time}</div>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                className="flex-grow p-2 bg-[#121212] border border-[#00f0ff] rounded-l-md text-white outline-none focus:outline-none focus:ring-0"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type something..."
                style={{ resize: "none", minHeight: "38px" }}
              />
              <button
                className="bg-gradient-to-r from-[#ff00ff] to-[#7f00ff] hover:from-[#00d0dd] hover:to-[#6a00cc] shadow-lg transition px-4 rounded-r-md font-semibold text-white"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-[#1a1a1a] border border-[#00f0ff] rounded-lg p-4 shadow-[0_0_10px_#00f0ff]">
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#7f00ff] mb-2">
              Participants
            </h3>
            <ul className="space-y-3">
              {participants.map((p, i) => (
                <li key={i} className="flex items-center space-x-3">
                  <img
                    src={p.user.avatar || "/default_avatar.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-[#00f0ff]"
                    onError={(e) => (e.target.src = "/default_avatar.png")}
                  />
                  <span className="font-semibold text-white">
                    {p.user.username}
                  </span>
                  <span
                    className={`text-sm ${
                      p.status === "host" ? "text-yellow-400" : "text-[#00f0ff]"
                    }`}
                  >
                    ({p.status === "host" ? "Host" : "Guest"})
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