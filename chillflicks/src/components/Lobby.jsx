import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const API_URL = "http://localhost:3000";
const socket = io(API_URL);

// Simple emoji list for picker
const emojiList = [
  "😀", "😂", "😍", "😎", "😭", "👍", "🎉", "❤️", "🔥", "🥳", "🤔", "🙌"
];

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
      setShowEmojiPicker(false);
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

  // Fullscreen toggle for video container
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (playerContainerRef.current.mozRequestFullScreen) {
        playerContainerRef.current.mozRequestFullScreen();
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      } else if (playerContainerRef.current.msRequestFullscreen) {
        playerContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Detect fullscreen change so we can update state even if user exits fullscreen manually
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

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

  // Emoji picker toggle
  const toggleEmojiPicker = () => {
    setShowEmojiPicker((v) => !v);
  };

  // Add emoji to input
  const addEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
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
          className={`w-full lg:w-2/3 transition-transform duration-300`}
          ref={playerContainerRef}
          style={{ position: "relative" }}
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
              onClick={toggleFullscreen}
              className="px-4 py-2 rounded-md border border-purple-500 hover:bg-purple-600 transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? "Minimize" : "Fullscreen"}
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-xl"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-32"
              />
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-1/3 flex flex-col h-[600px] bg-[#181818] rounded-xl shadow-lg p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 px-2">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-4">No messages yet</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 p-2 rounded-md ${msg.user === userName
                    ? "bg-purple-600 text-white self-end max-w-[75%]"
                    : "bg-gray-700 text-white max-w-[75%]"
                  }`}
              >
                <div className="text-sm font-semibold">{msg.user}</div>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-300 text-right">{msg.time}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 relative">
            <button
              onClick={toggleEmojiPicker}
              className="text-2xl hover:text-purple-400 transition"
              title="Emoji picker"
            >
              😊
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-[#222222] border border-purple-500 rounded-md p-2 grid grid-cols-6 gap-2 shadow-lg z-50">
                {emojiList.map((emoji, i) => (
                  <button
                    key={i}
                    className="text-xl hover:bg-purple-700 rounded-md p-1 transition"
                    onClick={() => addEmoji(emoji)}
                    aria-label={`Add emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-grow bg-[#333333] rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-purple-700 px-4 py-2 rounded-md hover:bg-purple-900 transition"
            >
              Send
            </button>
          </div>

          {/* Participants */}
          <div className="mt-4 border-t border-purple-600 pt-2 text-sm text-gray-400">
            <h4 className="font-semibold mb-1">Participants ({participants.length})</h4>
            <div className="flex flex-wrap gap-2">
              {participants.map((p, i) => (
                <span
                  key={i}
                  className="bg-purple-700 rounded-full px-3 py-1 text-white"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;