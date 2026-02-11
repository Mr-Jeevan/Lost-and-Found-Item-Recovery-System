import React, { useState } from 'react';
import { createHelpedFinding } from '../services/itemServices';

function HelpedFindingForm({ onHelpedFindingAdded, items }) {
    const [formData, setFormData] = useState({
        item_id: '',
        finder_name: '',
        finder_contact: '',
        found_location: '',
        found_date: '',
        status: 'Pending'
    });
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const helpedFinding = await createHelpedFinding(formData);
            setMessage('Helped finding record created successfully!');
            setIsError(false);

            // Clear the form fields
            setFormData({
                item_id: '',
                finder_name: '',
                finder_contact: '',
                found_location: '',
                found_date: '',
                status: 'Pending'
            });

            // Call the parent function to refresh the list
            if (onHelpedFindingAdded) {
                onHelpedFindingAdded(helpedFinding);
            }

        } catch (error) {
            console.error("Error creating helped finding record:", error);
            setMessage('Failed to create helped finding record. Please try again.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Report Helped Finding</h2>

            <div className="form-group mb-4">
                <label htmlFor="item_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Lost Item:
                </label>
                <select
                    id="item_id"
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">Select an item</option>
                    {items.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name} (Lost at {item.location_lost})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="form-group">
                    <label htmlFor="finder_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name:
                    </label>
                    <input
                        id="finder_name"
                        type="text"
                        name="finder_name"
                        value={formData.finder_name}
                        onChange={handleChange}
                        placeholder="e.g., John Smith"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="finder_contact" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Contact:
                    </label>
                    <input
                        id="finder_contact"
                        type="text"
                        name="finder_contact"
                        value={formData.finder_contact}
                        onChange={handleChange}
                        placeholder="e.g., email@example.com or phone number"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="form-group mb-4">
                <label htmlFor="found_location" className="block text-sm font-medium text-gray-700 mb-1">
                    Found Location:
                </label>
                <input
                    id="found_location"
                    type="text"
                    name="found_location"
                    value={formData.found_location}
                    onChange={handleChange}
                    placeholder="e.g., Central Park, near the fountain"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="form-group">
                    <label htmlFor="found_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Found Date:
                    </label>
                    <input
                        id="found_date"
                        type="date"
                        name="found_date"
                        value={formData.found_date}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status:
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Returned">Returned</option>
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isLoading ? 'Submitting...' : 'Submit Helped Finding'}
            </button>

            {message && (
                <div className={`mt-4 p-3 rounded-md ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}
        </form>
    );
}

export default HelpedFindingForm;