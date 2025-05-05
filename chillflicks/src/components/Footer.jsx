import React from "react";
import { FaGithub, FaLinkedin, FaGlobe } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-white h-full py-4 px-3 w-full flex flex-col sm:flex-row justify-between items-center text-sm">
      <p className="text-gray-500 text-center sm:text-left">
        © 2025 ChillFlicks. All rights reserved by Ayush Dadhaniya.
      </p>
      <div className="flex gap-4 mt-2 sm:mt-0">
        <a
          href="https://github.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          <FaGithub size={20} />
        </a>
        <a
          href="https://linkedin.com/in/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          <FaLinkedin size={20} />
        </a>
        <a
          href="https://yourportfolio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          <FaGlobe size={20} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
