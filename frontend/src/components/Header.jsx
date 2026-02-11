// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ 1. Import the useAuth hook
import { getUnreadMessages } from '../services/itemServices'; // Import message service

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // ✅ 2. Get authentication status and user details from the context
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const messages = await getUnreadMessages();
          setUnreadCount(messages.length);
        } catch (error) {
          console.error("Failed to fetch unread messages:", error);
        }
      }
    };

    fetchUnreadCount();

    // Set up polling for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ✅ 3. Create a handler for logging out
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false); // Close mobile menu on logout
    navigate('/login'); // Redirect to login page
  };

  return (
    <header className="app-header shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center p-4 bg-white">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-700 flex items-center">
              <span className="bg-indigo-600 text-white rounded-lg px-2 py-1 mr-2">LFRS</span>
              Lost & Found
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Link to="/" className="px-4 py-2 rounded-lg hover:bg-gray-100">Home</Link>
            {/* ✅ Show these links only if the user is logged in */}
            {isAuthenticated && (
              <>
                <Link to="/add-item" className="px-4 py-2 rounded-lg hover:bg-gray-100">Add Item</Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {/* ✅ 4. Conditionally render buttons based on authentication status */}
            {isAuthenticated ? (
              // If LOGGED IN, show welcome message and Logout button
              <div className="hidden md:flex items-center space-x-3">
                {/* Messages notification */}
                <Link to="/messages" className="relative px-3 py-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <span className="text-gray-700 font-medium">Welcome, {user?.username}!</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // If LOGGED OUT, show Login and Register buttons
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-indigo-600">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Register</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {/* SVG icon */}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* ✅ Apply the same conditional logic to the mobile menu */}
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/add-item" onClick={() => setIsMenuOpen(false)}>Add Item</Link>
                  <button onClick={handleLogout} className="w-full text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;