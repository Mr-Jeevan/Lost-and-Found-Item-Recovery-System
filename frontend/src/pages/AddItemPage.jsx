import React from 'react';
import { useNavigate } from 'react-router-dom';
import ItemForm from '../components/ItemForm';

function AddItemPage() {
    const navigate = useNavigate();

    // This function will be called by the ItemForm component 
    // after a new item has been successfully submitted to the API.
    const handleItemAdded = () => {
        // Navigate the user back to the homepage to see the updated feed.
        navigate('/');
    };

    return (
        <main>
            {/* The ItemForm now calls our navigation function on success */}
            <ItemForm onItemAdded={handleItemAdded} />
        </main>
    );
}

export default AddItemPage;
