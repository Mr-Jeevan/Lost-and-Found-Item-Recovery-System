import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItem, createHelpedFinding, updateItem, createMessage } from '../services/itemServices';
import { useAuth } from '../context/AuthContext';

function ItemDetailPage() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState({
        name: '',
        description: '',
        location_lost: '',
        date_lost: '',
        contact_info: ''
    });

    // Form state for reporting found item
    const [finderName, setFinderName] = useState('');
    const [finderContact, setFinderContact] = useState('');
    const [foundLocation, setFoundLocation] = useState('');
    const [foundDate, setFoundDate] = useState('');
    const [reportMessage, setReportMessage] = useState('');
    const [isReportError, setIsReportError] = useState(false);
    const [isReporting, setIsReporting] = useState(false);

    // Edit form state
    const [editMessage, setEditMessage] = useState('');
    const [isEditError, setIsEditError] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const itemData = await getItem(itemId);
                setItem(itemData);
                // Initialize edited item with current item data
                setEditedItem({
                    name: itemData.name,
                    description: itemData.description,
                    location_lost: itemData.location_lost,
                    date_lost: itemData.date_lost,
                    contact_info: itemData.contact_info
                });
            } catch (err) {
                setError('Failed to load item details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [itemId]);

    const handleReportFound = async (e) => {
        e.preventDefault();
        setIsReporting(true);
        setReportMessage('');
        setIsReportError(false);

        try {
            const helpedFindingData = {
                item_id: itemId,
                finder_name: finderName || user?.username || 'Anonymous',
                finder_contact: finderContact || user?.email || 'No contact provided',
                found_location: foundLocation,
                found_date: foundDate || new Date().toISOString().split('T')[0]
            };

            await createHelpedFinding(helpedFindingData);
            setReportMessage('Thank you for reporting! The item owner will be notified.');
            setIsReportError(false);

            // Reset form
            setFinderName('');
            setFinderContact('');
            setFoundLocation('');
            setFoundDate('');

            // Refresh item data
            const itemData = await getItem(itemId);
            setItem(itemData);
        } catch (err) {
            setReportMessage('Failed to report. Please try again.');
            setIsReportError(true);
            console.error(err);
        } finally {
            setIsReporting(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // Reset edited item to original values
        if (item) {
            setEditedItem({
                name: item.name,
                description: item.description,
                location_lost: item.location_lost,
                date_lost: item.date_lost,
                contact_info: item.contact_info
            });
        }
        setIsEditing(false);
        setEditMessage('');
        setIsEditError(false);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsEditingItem(true);
        setEditMessage('');
        setIsEditError(false);

        try {
            const updatedItem = await updateItem(itemId, editedItem);
            setItem(updatedItem);
            setIsEditing(false);
            setEditMessage('Item updated successfully!');
            setIsEditError(false);
        } catch (err) {
            setEditMessage('Failed to update item. Please try again.');
            setIsEditError(true);
            console.error(err);
        } finally {
            setIsEditingItem(false);
        }
    };

    const handleSendMessageToOwner = async (messageText) => {
        try {
            const messageData = {
                to_user: item.reported_by,
                item_id: itemId,
                item_name: item.name,
                message: messageText
            };

            await createMessage(messageData);
            // Redirect to the message thread with the owner
            navigate(`/messages/thread/${item.reported_by}`);
        } catch (err) {
            console.error('Failed to send message:', err);
            // Log the detailed error for debugging
            if (err.response && err.response.data) {
                console.error('Error details:', err.response.data);
                // Log the specific validation errors
                if (err.response.data.detail) {
                    console.error('Validation errors:', err.response.data.detail);
                    // Show a more detailed error message to the user
                    const validationErrors = err.response.data.detail.map(error =>
                        `${error.loc.join('.')}: ${error.msg}`
                    ).join('\n');
                    alert(`Failed to send message due to validation errors:\n${validationErrors}`);
                }
            }
            alert('Failed to send message. Please try again.');
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
    if (!item) return <div className="text-center py-12">Item not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-64 object-cover"
                    />
                ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                    </div>
                )}

                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedItem.name}
                                    onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                                    className="text-3xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
                            )}
                            {item.is_found && (
                                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Found!
                                </span>
                            )}
                        </div>
                        {user && item.reported_by === user.username && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Your Item
                            </span>
                        )}
                    </div>

                    {/* Edit controls for item owner */}
                    {user && item.reported_by === user.username && !isEditing && (
                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={handleEditClick}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                            >
                                Edit
                            </button>
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleSaveEdit}>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editedItem.description}
                                        onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                                        rows="4"
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lost Location
                                        </label>
                                        <input
                                            type="text"
                                            value={editedItem.location_lost}
                                            onChange={(e) => setEditedItem({ ...editedItem, location_lost: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lost Date
                                        </label>
                                        <input
                                            type="date"
                                            value={editedItem.date_lost}
                                            onChange={(e) => setEditedItem({ ...editedItem, date_lost: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Information
                                        </label>
                                        <input
                                            type="text"
                                            value={editedItem.contact_info}
                                            onChange={(e) => setEditedItem({ ...editedItem, contact_info: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-2">
                                <button
                                    type="submit"
                                    disabled={isEditingItem}
                                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isEditingItem ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>

                            {editMessage && (
                                <div className={`mt-4 p-3 rounded-md ${isEditError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {editMessage}
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                                <p className="mt-2 text-gray-600">{item.description}</p>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
                                <div className="mt-2 space-y-2">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Lost Location:</span> {item.location_lost}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Lost Date:</span> {item.date_lost}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Reported by:</span> {item.reported_by}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Contact:</span> {item.contact_info}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Found Form - Only show if item is not already found and user is not the owner */}
                    {!item.is_found && user && item.reported_by !== user.username && (
                        <div className="mt-8 border-t pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Report Found Item</h2>
                            <form onSubmit={handleReportFound} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="finderName" className="block text-sm font-medium text-gray-700">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            id="finderName"
                                            value={finderName}
                                            onChange={(e) => setFinderName(e.target.value)}
                                            placeholder={user?.username || "Your name"}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="finderContact" className="block text-sm font-medium text-gray-700">
                                            Contact Information
                                        </label>
                                        <input
                                            type="text"
                                            id="finderContact"
                                            value={finderContact}
                                            onChange={(e) => setFinderContact(e.target.value)}
                                            placeholder={user?.email || "Your contact info"}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="foundLocation" className="block text-sm font-medium text-gray-700">
                                            Found Location
                                        </label>
                                        <input
                                            type="text"
                                            id="foundLocation"
                                            value={foundLocation}
                                            onChange={(e) => setFoundLocation(e.target.value)}
                                            placeholder="Where did you find it?"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="foundDate" className="block text-sm font-medium text-gray-700">
                                            Found Date
                                        </label>
                                        <input
                                            type="date"
                                            id="foundDate"
                                            value={foundDate}
                                            onChange={(e) => setFoundDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isReporting}
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isReporting ? 'Reporting...' : 'Report Found Item'}
                                    </button>
                                </div>

                                {reportMessage && (
                                    <div className={`p-3 rounded-md ${isReportError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                        {reportMessage}
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {item.is_found && (
                        <div className="mt-8 border-t pt-6">
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">This item has been found!</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>Thank you for reporting this item. The owner has been notified.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Owner Button - Show for all users except the owner */}
                    {user && item.reported_by !== user.username && (
                        <div className="mt-8 border-t pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Item Owner</h2>
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-800">Want to get in touch with the owner?</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>Send a message directly to {item.reported_by} about this item.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Show message form in a modal or alert
                                            const message = prompt("Enter your message to the owner:");
                                            if (message) {
                                                handleSendMessageToOwner(message);
                                            }
                                        }}
                                        className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Message Owner
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ItemDetailPage;