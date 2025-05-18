import React, { useEffect, useRef, useState } from "react";

const emojiList = ["😀", "😂", "😍", "😢", "👍", "🎉", "💯", "🔥", "🙏", "😎"];

const Lobby = ({ roomCode, userName, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinRoom", { roomId: roomCode, user: userName });

    socket.on("messageHistory", (history) => {
      setMessages(history);
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("participantJoined", (list) => {
      setParticipants(list);
    });

    socket.on("videoStateChanged", ({ playing, currentTime }) => {
      if (!playerRef.current) return;
      if (playing && !isPlaying) {
        playerRef.current.playVideo();
      } else if (!playing && isPlaying) {
        playerRef.current.pauseVideo();
      }
      const playerTime = playerRef.current.getCurrentTime();
      if (Math.abs(playerTime - currentTime) > 1) {
        playerRef.current.seekTo(currentTime, true);
      }
      setIsPlaying(playing);
    });

    return () => {
      socket.off("messageHistory");
      socket.off("newMessage");
      socket.off("participantJoined");
      socket.off("videoStateChanged");
    };
  }, [socket, roomCode, userName, isPlaying]);

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (trimmed && socket) {
      const msg = {
        user: userName,
        text: trimmed,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("sendMessage", msg);
      setNewMessage("");
      setShowEmojiPicker(false);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((show) => !show);
  };

  const addEmoji = (emoji) => {
    setNewMessage((msg) => msg + emoji);
  };

  // YouTube Player related

  // Play/pause toggle
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      socket.emit("updateVideoState", { playing: false, currentTime: playerRef.current.getCurrentTime() });
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      socket.emit("updateVideoState", { playing: true, currentTime: playerRef.current.getCurrentTime() });
      setIsPlaying(true);
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

  // Volume slider
  const handleVolumeChange = (e) => {
    const vol = parseInt(e.target.value, 10);
    if (!playerRef.current) return;
    playerRef.current.setVolume(vol);
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      } else if (playerContainerRef.current.mozRequestFullScreen) {
        playerContainerRef.current.mozRequestFullScreen();
      } else if (playerContainerRef.current.msRequestFullscreen) {
        playerContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Load YouTube Player API and setup player
  useEffect(() => {
    const loadPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: extractVideoId(videoUrl),
        events: {
          onReady: () => {
            setPlayerReady(true);
            playerRef.current.setVolume(volume);
            if (isMuted) playerRef.current.mute();
          },
          onStateChange: (event) => {
            const state = event.data;
            // 1=playing, 2=paused
            if (state === 1 && !isPlaying) setIsPlaying(true);
            else if (state === 2 && isPlaying) setIsPlaying(false);
          },
        },
      });
    };

    // Extract video ID helper
    const extractVideoId = (url) => {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : url;
    };

    // Load YouTube IFrame API if not loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        loadPlayer();
      };
    } else {
      loadPlayer();
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl, volume, isMuted]);

  return (
    <div className="lobby-container" style={{ maxWidth: 900, margin: "auto" }}>
      <h2>Room: {roomCode}</h2>
      <div
        ref={playerContainerRef}
        className="player-wrapper"
        style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
      >
        <div
          id="youtube-player"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        >
          {!playerReady && <p>Loading video player...</p>}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={handlePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          style={{ verticalAlign: "middle", marginLeft: 10 }}
        />
      </div>

      <div style={{ marginTop: 20, display: "flex" }}>
        {/* Chat Section */}
        <div
          className="chat-section"
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: 10,
            maxHeight: 400,
            overflowY: "auto",
            marginRight: 10,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div style={{ flexGrow: 1, overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 8,
                  backgroundColor: msg.user === userName ? "#dcf8c6" : "#fff",
                  padding: "5px 8px",
                  borderRadius: 5,
                  alignSelf: msg.user === userName ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  wordWrap: "break-word",
                }}
              >
                <strong>{msg.user}</strong> [{msg.time}]: {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              style={{ flexGrow: 1, padding: 6, fontSize: 14 }}
            />
            <button onClick={toggleEmojiPicker} style={{ marginLeft: 5 }}>
              😊
            </button>
            <button onClick={handleSendMessage} style={{ marginLeft: 5 }}>
              Send
            </button>
          </div>

          {showEmojiPicker && (
            <div
              style={{
                border: "1px solid #ccc",
                padding: 5,
                marginTop: 5,
                background: "#fff",
                position: "absolute",
                zIndex: 1000,
                maxWidth: 200,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                bottom: "40px",
                right: "10px",
              }}
            >
              {emojiList.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => addEmoji(emoji)}
                  style={{ fontSize: 20, cursor: "pointer", border: "none", background: "none" }}
                  aria-label={`Add emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div
          className="participants-section"
          style={{
            width: 180,
            border: "1px solid #ccc",
            padding: 10,
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          <h4>Participants ({participants.length})</h4>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {participants.map((p, idx) => (
              <li key={idx} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
                {p.user.username}{p.status}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;