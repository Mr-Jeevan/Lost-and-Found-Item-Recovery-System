// src/components/Navbar.jsx (New File)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">LFRS</Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <span className="text-gray-700">Welcome, {user?.user?.username || 'User'}!</span>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600">
                                    Login
                                </Link>
                                <Link to="/register" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;