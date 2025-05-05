import React, { useState } from "react";

const Room = () => {
  const [roomCode, setRoomCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [buttonText, setButtonText] = useState("Generate Room Code");
  const [copyText, setCopyText] = useState("Click to copy room code");

  const generateRoomCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setRoomCode(result);
    setShowCode(true);
    setButtonText("Generate New Code");
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopyText("Code copied!");
      setTimeout(() => {
        setCopyText("Click to copy room code");
      }, 2000);
    });
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
            <p className="text-[#7B8794] mb-8">
              Generate a new room code and invite your friends to join your viewing session.
            </p>

            <button
              onClick={generateRoomCode}
              className="bg-[#4CC9F0] text-black font-bold px-6 py-3 rounded-lg hover:-translate-y-1 transition-transform duration-200"
            >
              {buttonText}
            </button>

            {showCode && (
              <>
                <div className="bg-[#0D1117]/80 text-3xl font-bold text-[#4CC9F0] mt-6 p-4 rounded-lg tracking-widest">
                  {roomCode}
                </div>
                <div
                  onClick={copyRoomLink}
                  className="mt-3 text-sm text-[#4CC9F0] cursor-pointer hover:underline"
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
              Enter a room code to join your friend's viewing session already in progress.
            </p>

            <input
              type="text"
              maxLength="6"
              placeholder="Enter room code"
              className="w-full mb-4 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]"
            />
            <button className="bg-[#F72585] text-black font-bold px-6 py-3 rounded-lg hover:-translate-y-1 transition-transform duration-200">
              Join Room
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
