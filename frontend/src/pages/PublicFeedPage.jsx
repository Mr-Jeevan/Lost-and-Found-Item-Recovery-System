import React, { useState, useEffect, useCallback } from 'react';
import ItemList from '../components/ItemList';
import { getItems } from '../services/itemServices'; // Assuming this can be public

function PublicFeedPage() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        const fetchedItems = await getItems();
        setItems(fetchedItems);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Global Lost & Found Feed</h2>
            <p className="text-center text-gray-600 mb-6">Log in or register to report an item or access your account.</p>
            <ItemList items={items} isLoading={isLoading} />
        </div>
    );
}

export default PublicFeedPage;