import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Profile from './Profile'; // Import your Profile component

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    // Run once on mount
    checkAuth();

    // Listen for login/logout events
    window.addEventListener('authChanged', checkAuth);

    return () => {
      window.removeEventListener('authChanged', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChanged'));
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="bg-black font-sans text-white p-1 sticky top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0 w-52 h-16 flex items-center">
          <img src="/chill-flicks-transparent.svg" alt="logo" className="w-full h-auto" />
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex space-x-6 text-lg justify-center flex-1">
          <Link to="/" className="hover:text-gray-300 hover:font-bold">Home</Link>
          <Link to="/rooms" className="hover:text-gray-300 hover:font-bold">Room</Link>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex space-x-4">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 font-bold rounded-full hover:-translate-y-1 transition-transform duration-200"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 font-bold bg-purple-500 rounded-full hover:-translate-y-1 hover:text-black transition-transform duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="px-4 py-2 font-bold bg-purple-500 rounded-full hover:-translate-y-1 hover:text-black transition-transform duration-200">
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-4 py-2 font-bold rounded-full hover:-translate-y-1 transition-transform duration-200">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white focus:outline-none">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="flex flex-col justify-center items-center bg-black px-4 pt-4 pb-2 md:hidden">
          <Link to="/" className="block py-2 hover:font-bold hover:text-gray-300">Home</Link>
          <Link to="/rooms" className="block py-2 hover:font-bold hover:text-gray-300">Room</Link>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setShowProfile(true);
                  setMenuOpen(false);
                }}
                className="block py-2 hover:font-bold hover:text-gray-300"
              >
                Profile
              </button>
              <button onClick={handleLogout} className="block py-2 hover:font-bold hover:text-gray-300">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block w-full text-center py-2 hover:font-bold hover:text-gray-300">
                Login
              </Link>
              <Link to="/signup" className="block w-full text-center py-2 hover:font-bold hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      {/* Profile Sidebar Drawer */}
      {showProfile && (
        <div className="fixed top-5 right-0 text-black shadow-lg z-50 p-4 overflow-y-auto">
          <button
            onClick={() => setShowProfile(false)}
            className="text-gray-700 font-bold text-lg absolute top-17 right-7"
          >
            ✕
          </button>
          <div className="mt-10">
            <Profile />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
