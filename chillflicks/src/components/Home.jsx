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

const FloatingEmoji = ({ emoji, style, className = "" }) => (
  <motion.div
    variants={floatingEmojiVariants}
    animate="float"
    className={`text-3xl absolute pointer-events-none ${className}`}
    style={style}
  >
    {emoji}
  </motion.div>
);

const SectionHeading = ({ children }) => (
  <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">
    <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
      {children}
    </span>
  </h2>
);

const Home = () => {
  return (
    <div className="relative w-full min-h-screen p-10 flex flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white">
      {/* Hero Section */}
      <div className="relative text-center z-10 max-w-xl mb-20">
        {/* Floating Emojis (Scoped to Hero Section only) */}
        <FloatingEmoji emoji="🔒" style={{ top: "-10px", left: "-100px" }} />
        <FloatingEmoji emoji="✨" style={{ top: "20px", right: "-40px" }} />
        <FloatingEmoji emoji="🎬" style={{ bottom: "-50px", left: "-20px" }} />
        <FloatingEmoji emoji="🎵" style={{ bottom: "-40px", right: "-90px" }} />

        <div className="inline-block px-4 py-1 text-sm bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mb-4 font-semibold shadow-lg">
          invite-only experience
        </div>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          <span className="text-cyan-400">exclusive vibes.</span>
          <br />
          <span className="text-blue-400">your circle only.</span>
        </h1>

        <p className="text-lg text-gray-300">
          create private watch parties for your closest friends. no randoms, no crashers — just your squad vibing to the same content at the same time.
        </p>
      </div>

      {/* Why We're the Moment */}
      <SectionHeading>why we're the moment</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-6xl w-full px-4">
        {[
          {
            icon: "🔒",
            title: "invite-only vibes",
            desc: "every watch party is private and exclusive. only people you personally invite can join your circle.",
          },
          {
            icon: "🔁",
            title: "perfect sync",
            desc: "everyone's screen stays in sync automatically. when someone pauses, everyone pauses. no more “wait, what part are you at?”",
          },
          {
            icon: "💬",
            title: "private reactions",
            desc: "chat, send emojis, and share your hot takes in real-time with just your friends. no strangers in your comments.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-zinc-900 rounded-xl hover:shadow-fuchsia-700 hover:-translate-y-2 transform transition duration-300 ease-in-out p-6 shadow-lg text-left"
          >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>

        ))}
      </div>

      {/* How It Works */}
      <SectionHeading>how it works</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-6xl w-full px-4 text-center mx-auto">
        {[
          {
            number: "1",
            title: "create a vibe",
            desc: "set up your private watch party in seconds. choose what to watch.",
          },
          {
            number: "2",
            title: "invite your squad",
            desc: "send exclusive invites to your friends through text, DMs, or email.",
          },
          {
            number: "3",
            title: "private reactions",
            desc: "share your reactions and hot takes in real-time with just your invited friends.",
          },
        ].map(({ number, title, desc }) => (
          <div key={number} className="flex flex-col items-center">
            <div className="text-xl font-bold w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 mb-4 shadow-lg">
              {number}
            </div>
            <h4 className="font-semibold text-white mb-2">{title}</h4>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
