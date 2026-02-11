// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
// ✅ Use a NAMED import to get the specific function you need
import { getCurrentUser } from '../services/itemServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('token'));

    useEffect(() => {
        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, [user, token]);

    const login = async (data) => {
        // First, set the token in state and localStorage
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);

        try {
            // ✅ Use the new function to fetch user data
            const userData = await getCurrentUser();
            setUser(userData);
            console.log("User logged in and details fetched.");
        } catch (error) {
            console.error("Failed to fetch user details after login", error);
            logout();
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = { user, token, isAuthenticated: !!token, login, logout, updateUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};