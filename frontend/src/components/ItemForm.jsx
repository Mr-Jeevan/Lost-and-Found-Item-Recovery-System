import React, { useState } from 'react';
import { createItem } from '../services/itemServices';
import { useAuth } from '../context/AuthContext';

// The 'onItemAdded' prop is a function passed from the parent (App.jsx)
// to notify it when a new item has been successfully added.
function ItemForm({ onItemAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [image, setImage] = useState(null); // New state for image file
  const [imagePreview, setImagePreview] = useState(null); // New state for image preview
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Use user's email as contact info if not provided
      const contact = contactInfo || (user ? user.email : "No contact info provided");

      let imageUrl = null;
      // Upload image if provided
      if (image) {
        const formData = new FormData();
        formData.append('file', image);

        const uploadResponse = await fetch('http://127.0.0.1:8000/upload-image/', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (uploadResponse.ok) {
          const imageData = await uploadResponse.json();
          imageUrl = imageData.file_url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      const newItem = {
        name,
        description,
        location_lost: locationLost,
        date_lost: dateLost,
        contact_info: contact,
        image_url: imageUrl
      };

      const addedItem = await createItem(newItem);
      setMessage(`Successfully reported: ${addedItem.name}`);
      setIsError(false);

      // Clear the form fields
      setName('');
      setDescription('');
      setLocationLost('');
      setDateLost('');
      setContactInfo('');
      setImage(null);
      setImagePreview(null);

      // Call the parent function to refresh the item list
      if (onItemAdded) {
        onItemAdded();
      }

    } catch (error) {
      console.error("Error creating item:", error);
      setMessage('Failed to report item. Please try again.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Report a Lost Item</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name:
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Black Wallet"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateLost" className="block text-sm font-medium text-gray-700 mb-1">
            Date Lost:
          </label>
          <input
            id="dateLost"
            type="date"
            value={dateLost}
            onChange={(e) => setDateLost(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="form-group mt-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description:
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Contains ID and credit cards"
          required
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="form-group mt-4">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location Lost:
        </label>
        <input
          id="location"
          type="text"
          value={locationLost}
          onChange={(e) => setLocationLost(e.target.value)}
          placeholder="e.g., Central Park, near the fountain"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="form-group mt-4">
        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Information:
        </label>
        <input
          id="contactInfo"
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder={user ? `Default: ${user.email}` : "e.g., email@example.com or phone number"}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {!contactInfo && user && (
          <p className="mt-1 text-sm text-gray-500">Using your email as contact info</p>
        )}
      </div>

      {/* Image Upload Field */}
      <div className="form-group mt-4">
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Image (Optional):
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Reporting Item...' : 'Report Item'}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </form>
  );
}

export default ItemForm;