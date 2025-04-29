import React from "react";
import { motion } from "framer-motion";

const floatingEmojiVariants = {
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const FloatingEmoji = ({ emoji, style }) => (
  <motion.div
    variants={floatingEmojiVariants}
    animate="float"
    className="text-3xl absolute"
    style={style}
  >
    {emoji}
  </motion.div>
);

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Floating Emojis */}
      <FloatingEmoji emoji="🔒" style={{ top: "5%", left: "5%" }} />
      <FloatingEmoji emoji="✨" style={{ top: "10%", right: "10%" }} />
      <FloatingEmoji emoji="🎬" style={{ bottom: "20%", left: "30%" }} />
      <FloatingEmoji emoji="🎵" style={{ bottom: "15%", right: "15%" }} />

      <div className="text-center z-10">
        <div className="inline-block px-4 py-1 text-sm bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mb-4 font-semibold shadow-lg">
          invite-only experience
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
          <span className="text-cyan-400">exclusive vibes.</span>
          <br />
          <span className="text-blue-400">your circle only.</span>
        </h1>

        <p className="max-w-xl mx-auto text-gray-300 text-2xl sm:text-base mb-8">
          create private watch parties for your closest friends. no randoms, no crashers — just your squad vibing to the same content at the same time.
        </p>

        {/* <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full font-semibold text-white text-lg shadow-md hover:scale-105 transition-transform">
          create exclusive vibe ✨
        </button> */}
      </div>
    </div>
  );
};

export default Home;
