import React, { useState, useEffect, useCallback } from 'react';
import ItemList from '../components/ItemList';
import { getItems, updateItem, deleteItem, markItemAsFound } from '../services/itemServices';

function HomePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // This logic for fetching items remains the same.
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const fetchedItems = await getItems();
    setItems(fetchedItems);
    setIsLoading(false);
  }, []);

  // This useEffect hook still runs once on page load to get the item feed.
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEdit = async (item) => {
    // For now, just log the item to be edited
    console.log("Edit item:", item);
    // In a real implementation, you would open a modal or navigate to an edit page
  };

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Lost & Found Recovery System</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help reunite people with their lost belongings. Browse items reported lost by community members.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Global Lost Items Feed</h2>
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
        </div>

        <div className="text-center mt-8">
          <button
            onClick={fetchItems}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            Refresh Feed
          </button>
        </div>
      </div>
    </main>
  );
}

export default HomePage;