import React, { useEffect, useState, useRef } from "react";

const emojis = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
  "😋", "😎", "😍", "😘", "🥰", "😗", "😙", "😚", "🙂", "🤗",
  "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥",
];

const Lobby = ({ userName, roomId, socket }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);

  // Sync playback and video URL from server via socket
  useEffect(() => {
    socket.on("room_data", (data) => {
      setVideoUrl(data.videoUrl);
      setIsPlaying(data.isPlaying);
      setCurrentTime(data.currentTime);
      setParticipants(data.participants);
      setMessages(data.messages);
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("participants_update", (list) => {
      setParticipants(list);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("room_data");
      socket.off("new_message");
      socket.off("participants_update");
    };
  }, [socket]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
      videoRef.current.volume = volume;
    }
  }, [videoUrl, isPlaying, currentTime, volume]);

  const handlePlayPause = () => {
    socket.emit("toggle_play");
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    socket.emit("seek", time);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    const msg = {
      user: userName,
      text: newMessage,
      time: new Date().toLocaleTimeString(),
    };
    socket.emit("send_message", msg);
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 text-white flex flex-col gap-6">
      <h1 className="text-3xl font-bold mb-4">Room: {roomId}</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Section */}
        <div
          ref={videoContainerRef}
          className="flex-1 bg-black rounded-xl shadow-lg relative flex flex-col"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full rounded-t-xl bg-black"
            controls={false}
          />
          <div className="flex items-center justify-between p-3 bg-[#111] rounded-b-xl">
            <button
              onClick={handlePlayPause}
              className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-md font-semibold"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <input
              type="range"
              min="0"
              max={videoRef.current ? videoRef.current.duration : 0}
              value={currentTime}
              onChange={handleSeek}
              step="0.1"
              className="flex-grow mx-4 cursor-pointer"
            />

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 cursor-pointer"
            />

            <button
              onClick={toggleFullscreen}
              className="ml-4 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-md font-semibold"
              aria-label="Toggle fullscreen"
              title="Toggle fullscreen"
            >
              ⛶
            </button>
          </div>
        </div>

        {/* Chat and Participants Section */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          {/* Participants */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-lg max-h-60 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-3">Participants</h3>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {participants.map((p, i) => (
                <li
                  key={i}
                  className="border-b border-[#333] py-1 text-sm truncate"
                  title={p}
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Box */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-lg flex flex-col h-96">
            <h3 className="text-xl font-semibold mb-3">Chat</h3>
            <div
              className="flex-1 overflow-y-auto mb-2 px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
              style={{ scrollbarWidth: "thin" }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 p-2 rounded-md ${
                    msg.user === userName
                      ? "bg-gradient-to-r from-purple-700 to-pink-700 text-white ml-auto max-w-[70%]"
                      : "bg-[#222] text-gray-200 max-w-[70%]"
                  }`}
                  title={`${msg.user} @ ${msg.time}`}
                >
                  <strong>{msg.user}:</strong> {msg.text}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 relative">
              <button
                onClick={toggleEmojiPicker}
                className="text-2xl px-2 hover:text-pink-500 transition"
                aria-label="Toggle Emoji Picker"
                title="Emoji picker"
              >
                😀
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-[#222] rounded-md p-2 shadow-lg grid grid-cols-5 gap-2 z-50">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="text-xl hover:bg-[#7f00ff] rounded-md transition"
                      aria-label={`Add emoji ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-grow rounded-full px-4 py-2 bg-[#222] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold hover:from-pink-500 hover:to-purple-500 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;