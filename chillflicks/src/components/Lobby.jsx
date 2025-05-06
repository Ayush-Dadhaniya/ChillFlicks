import React, { useState } from "react";
import { useParams } from "react-router-dom";

const Lobby = () => {
  const { roomCode } = useParams(); // ✅ Get room code from URL param

  const [messages, setMessages] = useState([
    { user: "SkaterKid", text: "This movie is absolutely fire! 🔥", time: "6:42 PM" },
    { user: "AestheticQueen", text: "fr fr no cap, best scene coming up! 💯", time: "6:43 PM" },
    { user: "You", text: "vibes are immaculate rn ✨", time: "6:44 PM" },
    { user: "VibeeLord", text: "brb", time: "6:45 PM" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([
      ...messages,
      { user: "You", text: newMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setNewMessage("");
  };

  const participants = [
    { name: "SkaterKid", status: "watching" },
    { name: "AestheticQueen", status: "host" },
    { name: "You", status: "watching" },
    { name: "VibeeLord", status: "brb" },
    { name: "TikTokStar", status: "watching" },
  ];

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      {/* Room Code Header */}
      <div className="mb-6 w-full max-w-6xl text-center">
        <span className="text-lg lg:text-xl font-semibold tracking-wide bg-gradient-to-r from-pink-500 to-green-400 text-transparent bg-clip-text">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        {/* Video Player */}
        <div className="bg-[#121212] flex-1 rounded-xl overflow-hidden shadow-xl border border-[#00FF88] p-4 flex flex-col justify-center items-center">
          <div className="w-full aspect-video bg-black flex items-center justify-center text-center border border-[#00FF88] rounded-lg">
            <div>
              <button className="bg-[#FF00FF] w-16 h-16 rounded-full text-xl text-white shadow-lg mb-4">
                ▶
              </button>
              <p className="text-green-400 font-bold">WAITING FOR HOST</p>
            </div>
          </div>
        </div>

        {/* Right Side - Chat & Squad */}
        <div className="flex flex-col lg:w-96 gap-4">
          {/* Chat Box */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border-t-4 border-[#D946EF] flex flex-col h-[400px]">
            <div className="bg-[#D946EF] text-black text-sm font-bold px-4 py-2 rounded-t-xl">💬 VIBE CHAT</div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[#7dd3fc] font-semibold">{msg.user} <span className="text-gray-400 text-xs">{msg.time}</span></span>
                  <span className={`px-3 py-1 rounded-md w-fit ${msg.user === "You" ? "bg-green-800 text-white" : "bg-[#2a2a2a]"}`}>
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

          {/* Squad List */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border-t-4 border-[#00FF88] flex-1">
            <div className="bg-[#00FF88] text-black text-sm font-bold px-4 py-2 rounded-t-xl">🧑‍🤝‍🧑 SQUAD</div>
            <ul className="p-4 space-y-2 text-sm">
              {participants.map((p, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-[#A5F3FC]">{p.name}</span>
                  <span className={`text-xs rounded px-2 py-0.5 ${
                    p.status === "host" ? "bg-yellow-500 text-black" :
                    p.status === "brb" ? "bg-purple-500 text-white" :
                    "bg-green-600 text-white"
                  }`}>
                    {p.status}
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
