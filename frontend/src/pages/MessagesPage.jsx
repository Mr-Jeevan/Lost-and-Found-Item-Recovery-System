import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMessageThreads, getMessages, markMessageAsRead } from '../services/itemServices';
import { useAuth } from '../context/AuthContext';

function MessagesPage() {
    const navigate = useNavigate();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchMessageThreads = async () => {
            try {
                setLoading(true);
                const threadData = await getMessageThreads();
                setThreads(threadData);
            } catch (err) {
                setError('Failed to load message threads');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessageThreads();
    }, []);

    const handleNewMessageClick = () => {
        navigate('/messages/compose');
    };

    if (loading) return <div className="text-center py-12">Loading messages...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <button
                    onClick={handleNewMessageClick}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    New Message
                </button>
            </div>

            {threads.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No conversations</h3>
                    <p className="mt-1 text-gray-500">You don't have any message threads yet.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleNewMessageClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Start a conversation
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {threads.map((thread) => (
                            <li
                                key={thread._id}
                                className="p-6 hover:bg-gray-50 cursor-pointer"
                                onClick={() => navigate(`/messages/thread/${thread.other_user}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                            {thread.other_user.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {thread.other_user}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {thread.last_message}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-gray-500 mr-4">
                                            {new Date(thread.last_message_time).toLocaleDateString()}
                                        </p>
                                        {thread.unread_count > 0 && (
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                                {thread.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default MessagesPage;