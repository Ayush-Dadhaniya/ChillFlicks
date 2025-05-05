import React, { useState } from "react";

const Room = () => {
  const [roomCode, setRoomCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [buttonText, setButtonText] = useState("Generate Room Code");
  const [copyText, setCopyText] = useState("Click to copy room link");

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
    const dummyLink = `https://chillflicks.com/room/${roomCode}`;
    navigator.clipboard.writeText(dummyLink).then(() => {
      setCopyText("Link copied!");
      setTimeout(() => {
        setCopyText("Click to copy room link");
      }, 2000);
    });
  };

  return (
    <div style={{ backgroundColor: "#0D1117", color: "#E6EDF3", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem" }}>
      <main>
        <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "3rem" }}>
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#161B22", borderRadius: "16px", padding: "2rem", textAlign: "center", flex: 1, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "5px", backgroundColor: "#4CC9F0" }}></div>
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem", color: "#4CC9F0" }}>⚡</div>
              <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Create Room</h2>
              <p style={{ color: "#7B8794", marginBottom: "2rem" }}>Generate a new room code and invite your friends to join your viewing session.</p>

              <button onClick={generateRoomCode} style={{
                backgroundColor: "transparent", color: "#E6EDF3", border: "none", padding: "0.8rem 1.5rem", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s ease", backgroundColor: "#4CC9F0"
              }}>
                {buttonText}
              </button>

              {showCode && (
                <>
                  <div style={{
                    backgroundColor: "rgba(13, 17, 23, 0.8)", padding: "1rem", borderRadius: "8px", fontSize: "2rem", fontWeight: "bold", color: "#4CC9F0", margin: "1rem 0", textAlign: "center", letterSpacing: "5px"
                  }}>
                    {roomCode}
                  </div>
                  <div onClick={copyRoomLink} style={{
                    marginTop: "1rem", color: "#4CC9F0", cursor: "pointer", fontSize: "0.9rem"
                  }}>
                    {copyText}
                  </div>
                </>
              )}
            </div>

            <div style={{ backgroundColor: "#161B22", borderRadius: "16px", padding: "2rem", textAlign: "center", flex: 1, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "5px", backgroundColor: "#F72585" }}></div>
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem", color: "#F72585" }}>🎬</div>
              <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Join Room</h2>
              <p style={{ color: "#7B8794", marginBottom: "2rem" }}>Enter a room code to join your friend's viewing session already in progress.</p>
              <input type="text" placeholder="Enter room code" maxLength="6" style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#E6EDF3", padding: "0.8rem 1rem", borderRadius: "8px", fontSize: "1rem", width: "100%", marginBottom: "1rem"
              }} />
              <button style={{
                backgroundColor: "transparent", color: "#E6EDF3", border: "none", padding: "0.8rem 1.5rem", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", backgroundColor: "#F72585"
              }}>Join Room</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
