import React, { useState, useEffect } from 'react';
import { getItems, getMyHelpedFindingItems } from '../services/itemServices';
import HelpedFindingForm from '../components/HelpedFindingForm';

function HelpedFindingPage() {
    const [helpedItems, setHelpedItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [items, helpedFindingItems] = await Promise.all([
                    getItems(),
                    getMyHelpedFindingItems()
                ]);
                setAllItems(items);
                setHelpedItems(helpedFindingItems);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [refreshKey]);

    const handleHelpedFindingAdded = () => {
        // Refresh the data
        setRefreshKey(prev => prev + 1);
        setShowForm(false);
    };

    const statusColors = {
        'Returned': 'bg-green-100 text-green-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Pending': 'bg-blue-100 text-blue-800'
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading helped finding items...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Helped Finding Items</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                        {showForm ? 'Cancel' : 'Report Found Item'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-8">
                    <HelpedFindingForm
                        onHelpedFindingAdded={handleHelpedFindingAdded}
                        items={allItems}
                    />
                </div>
            )}

            {helpedItems.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No helped finding items</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by reporting a found item.</p>
                </div>
            ) : (
                <div className="overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {helpedItems.map((item) => (
                            <li key={item.id} className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {allItems.find(i => i.id === item.item_id)?.name || 'Unknown Item'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {allItems.find(i => i.id === item.item_id)?.description || ''}
                                            </p>
                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <span>Found at {item.found_location} on {item.found_date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm">
                                            <p className="text-gray-900">Finder: {item.finder_name}</p>
                                            <p className="text-gray-500">Contact: {item.finder_contact}</p>
                                        </div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[item.status]}`}>
                                            {item.status}
                                        </span>
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

export default HelpedFindingPage;