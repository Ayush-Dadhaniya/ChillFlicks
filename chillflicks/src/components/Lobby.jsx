import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import pusher from "../socket.js";
import { roomsAPI, messagesAPI } from "../api.js";

const emojis = ["😀", "😂", "😍", "😎", "😢", "👍", "🎉", "❤️", "🔥", "🙌", "👏", "😮", "🤔", "😭", "🥰"];

const Lobby = () => {
  const { roomCode } = useParams();
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const emojiPickerRef = useRef(null);
  const channelRef = useRef(null);

  const extractYouTubeId = (url) => {
    const regExp =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Format time to MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.id !== "emoji-button"
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        // Get user info from token
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const name = decoded.username || decoded.name || "Guest";
        setUserName(name);

        // Join room
        const joinResponse = await roomsAPI.join(roomCode);
        if (joinResponse.data) {
          const roomData = joinResponse.data.room;
          setVideoUrl(roomData.videoUrl);
          setIsPlaying(roomData.isPlaying);
          setCurrentTime(roomData.currentPlaybackTime);
          setParticipants(roomData.participants || []);
        }

        // Get message history
        const messagesResponse = await messagesAPI.get(roomCode);
        if (messagesResponse.data) {
          setMessages(messagesResponse.data.messages || []);
        }

        // Subscribe to Pusher channel
        const channel = pusher.subscribe(`room-${roomCode}`);
        channelRef.current = channel;

        channel.bind('newMessage', (message) => {
          setMessages((prev) => [...prev, message]);
          setTimeout(() => {
            if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
          }, 100);
        });

        channel.bind('participantJoined', (updatedParticipants) => {
          setParticipants(updatedParticipants);
        });

        channel.bind('videoStateChanged', ({ isPlaying, currentTime }) => {
          setIsPlaying(isPlaying);
          setCurrentTime(currentTime);

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

        setLoading(false);
      } catch (error) {
        console.error("Error initializing room:", error);
        setLoading(false);
      }
    };

    initializeRoom();

    return () => {
      if (channelRef.current) {
        pusher.unsubscribe(`room-${roomCode}`);
      }
    };
  }, [roomCode]);

  const addEmoji = (emoji) => {
    setNewMessage((msg) => msg + emoji);
    setShowEmojiPicker(false);
  };

  // Update current time display
  useEffect(() => {
    let timeUpdateInterval;

    if (playerReady && playerRef.current) {
      timeUpdateInterval = setInterval(() => {
        if (isPlaying) {
          const newTime = playerRef.current.getCurrentTime();
          setCurrentTime(newTime);

          if (!duration) {
            setDuration(playerRef.current.getDuration());
          }
        }
      }, 1000);
    }

    return () => {
      if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    };
  }, [playerReady, isPlaying, duration]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (newMessage.trim()) {
      try {
        const response = await messagesAPI.send({
          roomId: roomCode,
          content: newMessage,
        });

        if (response.data) {
          setNewMessage("");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!playerReady || !playerRef.current) return;

    const newPlayState = !isPlaying;
    const currentTime = playerRef.current.getCurrentTime();

    setIsPlaying(newPlayState);
    
    try {
      await roomsAPI.update({
        roomCode,
        isPlaying: newPlayState,
        currentPlaybackTime: currentTime,
      });
    } catch (error) {
      console.error("Error updating video state:", error);
    }
  };

  // Handle seeking
  const handleSeek = async (e) => {
    if (!playerReady || !playerRef.current) return;

    const seekTime = (e.target.value / 100) * duration;
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);

    try {
      await roomsAPI.update({
        roomCode,
        isPlaying,
        currentPlaybackTime: seekTime,
      });
    } catch (error) {
      console.error("Error seeking video:", error);
    }
  };

  // Handle Full Screen
  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      // Add fullscreen styling
      playerContainerRef.current.classList.add('fullscreen-player');

      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        // Remove fullscreen class if fullscreen fails
        playerContainerRef.current.classList.remove('fullscreen-player');
      });
      setIsFullScreen(true);
    } else {
      // Remove fullscreen styling
      playerContainerRef.current.classList.remove('fullscreen-player');

      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  // Toggle between chat and participants
  const toggleView = (view) => {
    if (view === 'chat') {
      setShowChat(true);
      setShowParticipants(false);
    } else {
      setShowChat(false);
      setShowParticipants(true);
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
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
          modestbranding: 1,
          rel: 0,
          controls: 0, // Disable default controls
          fs: 0, // Disable fullscreen button
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
            setDuration(playerRef.current.getDuration());

            // Set player size to fill container
            const playerElement = document.getElementById("youtube-player");
            if (playerElement) {
              const iframe = playerElement.querySelector("iframe");
              if (iframe) {
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.position = "absolute";
                iframe.style.top = "0";
                iframe.style.left = "0";
              }
            }
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
  }, [videoUrl, volume]);

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-4">
        <div className="ml-6 bg-black/30 px-3 py-1 rounded-md flex items-center">
            <span className="text-sm font-medium mr-2">Room:</span>
            <span className="text-sm font-bold">{roomCode}</span>
          </div>
        <div
          className="w-full lg:w-2/3 bg-black rounded-xl overflow-hidden shadow-xl relative"
          ref={playerContainerRef}
          onMouseOver={() => setShowControls(true)}
          onMouseOut={() => setShowControls(false)}
        >
          <div
            id="youtube-player"
            className="aspect-video w-full h-full bg-black"
            style={{ minHeight: "400px", position: "relative" }}
          />

          {/* Video Controls Overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Progress bar */}
            <div className="mb-4 px-2">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={(currentTime / (duration || 1)) * 100}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-600 hover:bg-pink-700 transition-colors text-white"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" ry="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" ry="1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-pink-500 transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullScreen}
                  className="text-white hover:text-pink-500 transition-colors"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0                       0 0 0 2 2v3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat & Participants - Not shown in fullscreen */}
        {!isFullScreen && (
          <div className="w-full lg:w-1/3 flex flex-col bg-gray-800 rounded-xl overflow-hidden shadow-xl">
            {/* Toggle tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => toggleView('chat')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${showChat ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Chat
              </button>
              <button
                onClick={() => toggleView('participants')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Participants ({participants.length})
              </button>
            </div>

            {/* Chat Section */}
            {showChat && (
              <div className="flex flex-col h-[500px]">
                {/* Messages Area */}
                <div
                  ref={chatMessagesRef}
                  className="flex-grow overflow-y-auto flex flex-col p-4 custom-scrollbar"
                >
                  {messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 mb-2 max-w-[85%] ${msg.user === userName ? "bg-pink-600/30 text-white self-end rounded-t-lg rounded-l-lg" : "bg-gray-700 text-white self-start rounded-t-lg rounded-r-lg"}`}
                      >
                        <div className={`font-bold text-sm ${msg.user === userName ? "text-cyan-300" : "text-pink-400"}`}>
                          {msg.user === userName ? "You" : msg.user}
                        </div>
                        <div className="break-words mt-1">{msg.text}</div>
                        <div className="text-xs text-gray-400 mt-1 text-right">{msg.time}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 p-4 flex-grow flex items-center justify-center">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="bg-gray-900 p-3">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                      />
                      <button
                        id="emoji-button"
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        title="Add Emoji"
                      >
                        😊
                      </button>

                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div
                          ref={emojiPickerRef}
                          className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-lg grid grid-cols-5 gap-1 z-20"
                        >
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="text-xl hover:bg-gray-700 p-2 rounded transition-colors"
                              aria-label={`Add emoji ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Participants Section */}
            {showParticipants && (
              <div className="flex flex-col h-[500px]">
                <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                  {participants.length > 0 ? (
                    <div>
                      {participants.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 border-b border-gray-700 last:border-0 hover:bg-gray-700/30 transition-colors rounded-lg mb-1"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                              {p.user.username ? p.user.username.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${p.status === "host" ? "bg-yellow-400" : "bg-green-400"} border border-gray-900`}></span>
                          </div>

                          <div className="flex-grow">
                            <div className="font-bold text-white flex items-center">
                              {p.user.username}
                              {p.user.username === userName && (
                                <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">You</span>
                              )}
                            </div>
                            <div className={`text-xs ${p.status === "host" ? "text-yellow-400" : "text-blue-400"}`}>
                              {p.status === "host" ? "Room Host" : "Viewer"}
                            </div>
                          </div>

                          {p.user.username !== userName && (
                            <button className="text-gray-400 hover:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-12 flex-grow flex items-center justify-center">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p>No participants yet. Invite your friends!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
