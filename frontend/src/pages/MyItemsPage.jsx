import React, { useState, useEffect, useCallback } from 'react';
import ItemList from '../components/ItemList';
import { getMyItems, deleteItem, markItemAsFound, updateItem } from '../services/itemServices';
import { useNavigate } from 'react-router-dom';

function MyItemsPage() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        const fetchedItems = await getMyItems();
        setItems(fetchedItems);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteItem(itemId);
                // Refresh the item list
                fetchItems();
            } catch (error) {
                console.error("Failed to delete item:", error);
                alert("Failed to delete item. Please try again.");
            }
        }
    };

    const handleMarkFound = async (itemId) => {
        try {
            await markItemAsFound(itemId);
            // Refresh the item list
            fetchItems();
        } catch (error) {
            console.error("Failed to mark item as found:", error);
            alert("Failed to mark item as found. Please try again.");
        }
    };

    const handleEdit = async (item) => {
        // Navigate to the item detail page where editing can happen
        navigate(`/item/${item.id}`);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Reported Items</h1>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    {items.length} items
                </span>
            </div>

            <ItemList
                items={items}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarkFound={handleMarkFound}
            />

            {items.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No items reported</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by reporting a lost item.</p>
                    <div className="mt-6">
                        <a
                            href="/add-item"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Report Lost Item
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyItemsPage;