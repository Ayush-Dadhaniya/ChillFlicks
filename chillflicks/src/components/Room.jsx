import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomsAPI } from "../api.js";

const Room = () => {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [buttonText, setButtonText] = useState("Generate Room Code");
  const [copyText, setCopyText] = useState("Click to copy room code");
  const [loading, setLoading] = useState(false);

  const convertToEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
  
      let videoId = "";
      if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v");
      } else if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.startsWith("m.youtube.com")) {
        videoId = urlObj.searchParams.get("v");
      }
  
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
  
      return url; // Return original if not a recognized YouTube format
    } catch (e) {
      console.error("Invalid video URL", e);
      return url;
    }
  };

  const generateRoomCode = async () => {
    if (!videoUrl.trim()) {
      alert("Please enter a video URL.");
      return;
    }

    setLoading(true);
    try {
      const response = await roomsAPI.create({ 
        videoUrl: convertToEmbedUrl(videoUrl) 
      });

      if (response.data) {
        setRoomCode(response.data.room.roomCode);
        setShowCode(true);
        setButtonText("Generate New Code");
        navigate(`/rooms/${response.data.room.roomCode}`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert(error.response?.data?.message || "Error creating room");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopyText("Code copied!");
      setTimeout(() => {
        setCopyText("Click to copy room code");
      }, 2000);
    });
  };

  const joinRoom = () => {
    const trimmed = inputCode.trim().toUpperCase();
    if (trimmed.length === 6) {
      navigate(`/rooms/${trimmed}`);
    } else {
      alert("Please enter a valid 6-character room code.");
    }
  };

  return (
    <div className="bg-[#0D1117] text-[#E6EDF3] min-h-screen flex flex-col justify-center p-8">
      <main className="max-w-4xl w-full mx-auto flex flex-col gap-12">
        <div className="flex flex-col md:flex-row gap-8 justify-center">

          {/* Create Room Card */}
          <div className="bg-[#161B22] hover:shadow-[0_8px_24px_#4CC9F0] hover:-translate-y-2 transition-all duration-800 rounded-2xl p-8 text-center flex-1 relative">
            <div className="w-full h-[10px] bg-[#4CC9F0] rounded-t-2xl absolute top-0 left-0"></div>
            <div className="text-5xl mb-6 text-[#4CC9F0]">⚡</div>
            <h2 className="text-2xl font-semibold mb-4">Create Room</h2>
            <p className="text-[#7B8794] mb-6">
              Enter a video URL to generate a room and watch together with others.
            </p>

            {/* Video URL input */}
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter video URL (e.g. YouTube or direct link)"
              className="w-full mb-4 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]"
            />

            <button
              onClick={generateRoomCode}
              disabled={loading}
              className="bg-[#4CC9F0] text-black font-bold px-6 py-3 rounded-lg hover:-translate-y-1 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : buttonText}
            </button>

            {showCode && (
              <>
                <div className="bg-[#0D1117]/80 text-3xl font-bold text-[#4CC9F0] mt-6 p-4 rounded-lg tracking-widest">
                  {roomCode}
                </div>
                <div
                  onClick={copyRoomLink}
                  className="mt-3 text-sm text-[#4CC9F0] cursor-pointer"
                >
                  {copyText}
                </div>
              </>
            )}
          </div>

          {/* Join Room Card */}
          <div className="bg-[#161B22] hover:shadow-[0_8px_24px_#F72585] hover:-translate-y-2 transition-all duration-800 rounded-2xl p-8 text-center flex-1 relative">
            <div className="w-full h-[10px] bg-[#F72585] rounded-t-2xl absolute top-0 left-0"></div>
            <div className="text-5xl mb-6 text-[#F72585]">🎬</div>
            <h2 className="text-2xl font-semibold mb-4">Join Room</h2>
            <p className="text-[#7B8794] mb-8">
              Enter a room code to join your friend's watch party.
            </p>

            <input
              type="text"
              maxLength="6"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full mb-4 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]"
            />
            <button
              onClick={joinRoom}
              className="bg-[#F72585] text-black font-bold px-6 py-3 rounded-lg hover:-translate-y-1 transition-transform duration-200"
            >
              Join Room
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
