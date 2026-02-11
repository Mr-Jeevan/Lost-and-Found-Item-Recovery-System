import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyItems, getMyHelpedFindingItems, updateUserProfile } from '../services/itemServices';

function AccountPage() {
    const { user, logout, updateUser } = useAuth();
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(profile);
    const [stats, setStats] = useState({
        itemsReported: 0,
        itemsFound: 0,
        helpProvided: 0
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Load user data and statistics
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Set initial profile data
                setProfile({
                    full_name: user?.full_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    location: user?.location || ''
                });
                setEditedProfile({
                    full_name: user?.full_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    location: user?.location || ''
                });

                // Fetch statistics
                const [items, helpedItems] = await Promise.all([
                    getMyItems(),
                    getMyHelpedFindingItems()
                ]);

                setStats({
                    itemsReported: items.length,
                    itemsFound: items.filter(item => item.is_found).length,
                    helpProvided: helpedItems.length
                });
            } catch (error) {
                console.error("Failed to load account data:", error);
                setMessage('Failed to load account data. Please try again.');
                setIsError(true);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile(profile);
    };

    const handleSave = async () => {
        try {
            const updatedUser = await updateUserProfile(editedProfile);
            setProfile(editedProfile);
            setIsEditing(false);
            setMessage('Profile updated successfully!');
            setIsError(false);

            // Update the user in context
            updateUser(updatedUser);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setMessage('Failed to update profile. Please try again.');
            setIsError(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile(profile);
        setMessage('');
    };

    const handleChange = (e) => {
        setEditedProfile({
            ...editedProfile,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Loading account information...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
                {!isEditing ? (
                    <button
                        onClick={handleEdit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div className="space-x-2">
                        <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-md ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
                        <span className="text-gray-500">Profile Picture</span>
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-semibold">
                            {profile.full_name || user?.username || 'User'}
                        </h2>
                        <p className="text-gray-600">{profile.email || user?.email}</p>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={editedProfile.full_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                        {profile.full_name || 'Not provided'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={editedProfile.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={editedProfile.phone}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                        {profile.phone || 'Not provided'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={editedProfile.location}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                        {profile.location || 'Not provided'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Items Reported</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.itemsReported}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Items Found</p>
                                <p className="text-2xl font-bold text-green-700">{stats.itemsFound}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Help Provided</p>
                                <p className="text-2xl font-bold text-purple-700">{stats.helpProvided}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
                            >
                                Logout
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                        // In a real app, you would call a delete account API endpoint
                                        logout();
                                        alert("Account deleted successfully.");
                                    }
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountPage;