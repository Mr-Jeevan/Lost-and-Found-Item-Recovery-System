import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMessage } from '../services/itemServices';
import { useAuth } from '../context/AuthContext';

function ComposeMessagePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        to_user: '',
        item_name: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // We'll need to add item_id later, for now we'll just send a general message
            const messageData = {
                to_user: formData.to_user,
                item_name: formData.item_name || 'General Message',
                message: formData.message,
                item_id: 'general' // Placeholder for general messages
            };

            await createMessage(messageData);
            setSuccess(true);

            // Redirect to the message thread with the recipient
            setTimeout(() => {
                navigate(`/messages/thread/${formData.to_user}`);
            }, 1000);
        } catch (err) {
            console.error('Failed to send message:', err);
            // Log the detailed error for debugging
            if (err.response && err.response.data) {
                console.error('Error details:', err.response.data);
                // Log the specific validation errors
                if (err.response.data.detail) {
                    console.error('Validation errors:', err.response.data.detail);
                }
            }
            setError('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="text-center py-12">You must be logged in to send messages.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 ml-4">Compose Message</h1>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                        Message sent successfully! Redirecting to conversation...
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="to_user" className="block text-sm font-medium text-gray-700 mb-1">
                            To Username
                        </label>
                        <input
                            type="text"
                            id="to_user"
                            name="to_user"
                            value={formData.to_user}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="item_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Subject (Item Name)
                        </label>
                        <input
                            type="text"
                            id="item_name"
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter item name (optional)"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="6"
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Type your message here..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/messages')}
                            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ComposeMessagePage;