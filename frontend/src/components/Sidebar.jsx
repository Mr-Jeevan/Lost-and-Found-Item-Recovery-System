import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ 1. Import the useAuth hook

function Sidebar() {
    const location = useLocation();
    const { user } = useAuth(); // ✅ 2. Get the user object from the context

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            name: 'Add Item',
            path: '/add-item',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )
        },
        {
            name: 'My Items',
            path: '/my-items',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            name: 'Helped Finding',
            path: '/helped-finding',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            name: 'Messages',
            path: '/messages',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        }
    ];

    return (
        <div className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-4 border-b">
                
            </div>

            <nav className="mt-5">
                <div className="px-2 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`${location.pathname === item.path
                                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } group flex items-center px-4 py-3 text-sm font-medium rounded-r`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
                <div className="flex items-center">
                    <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                        {/* ✅ 3. Display the first letter of the username as an avatar */}
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3 ">
                        {/* ✅ 4. Display the actual username and email, with fallbacks */}
                        <p className="text-sm font-medium text-gray-700">{user?.username || 'User Name'}</p>
                        <p className="text-xs font-medium text-gray-500">{user?.email || 'user@example.com'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;