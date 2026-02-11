import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThreadMessages, createMessage } from '../services/itemServices';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

function MessageThreadPage() {
    const { otherUser } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize WebSocket connection
        socketRef.current = io('http://localhost:8000');

        // Join the specific thread room
        const threadId = [user.username, otherUser].sort().join('_');
        socketRef.current.emit('join', { thread_id: threadId });

        // Listen for new messages
        socketRef.current.on('new_message', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        // Fetch initial messages
        const fetchThreadMessages = async () => {
            try {
                setLoading(true);
                const threadMessages = await getThreadMessages(otherUser);
                setMessages(threadMessages);
            } catch (err) {
                setError('Failed to load messages');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (otherUser) {
            fetchThreadMessages();
        }

        // Clean up WebSocket connection
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [otherUser, user.username]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Create a temporary message object for optimistic update
        const tempMessage = {
            id: Date.now().toString(), // Temporary ID
            from_user: user.username,
            to_user: otherUser,
            message: newMessage,
            created_at: new Date().toISOString(),
            is_read: false
        };

        // Optimistically update the UI
        setMessages(prevMessages => [...prevMessages, tempMessage]);
        const messageToSend = newMessage;
        setNewMessage('');
        setSending(true);

        try {
            const messageData = {
                to_user: otherUser,
                item_name: 'Direct Message',
                message: messageToSend
            };

            await createMessage(messageData);
            // Note: We don't need to update the messages state here
            // because the WebSocket event will handle it
        } catch (err) {
            // If the message failed to send, remove the optimistic update
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
            console.error('Failed to send message:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="text-center py-12">Loading messages...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
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
                <h1 className="text-2xl font-bold text-gray-900 ml-4">Chat with {otherUser}</h1>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Messages container */}
                <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No messages yet. Start a conversation!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.from_user === user.username ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.from_user === user.username
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-white border border-gray-200'
                                            }`}
                                    >
                                        <div className="text-sm">{message.message}</div>
                                        <div
                                            className={`text-xs mt-1 ${message.from_user === user.username ? 'text-indigo-200' : 'text-gray-500'
                                                }`}
                                        >
                                            {new Date(message.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message input */}
                <div className="border-t border-gray-200 p-4">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="bg-indigo-600 text-white rounded-full px-6 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MessageThreadPage;