import axios from 'axios';

// ✅ 1. Create and configure a central axios instance
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: baseURL,
});

// ✅ 2. Add an interceptor to automatically attach the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ✅ 3. Your getItems function is now cleaner and automatically authenticated
export const getItems = async () => {
  try {
    const response = await api.get('/items/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return [];
  }
};

// ✅ 4. Your createItem function is also cleaner and automatically authenticated
export const createItem = async (item) => {
  try {
    const completeItem = {
      ...item,
      date_lost: item.date_lost || new Date().toISOString().split('T')[0],
      contact_info: item.contact_info || "No contact info provided"
    };
    const response = await api.post('/items/', completeItem);
    return response.data;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
};

// ✅ 5. Add a new function to fetch the current user's details
// Your AuthContext will use this function after login.
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
};

// ✅ 6. Add new functions for item actions
export const getItem = async (itemId) => {
  try {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch item:", error);
    throw error;
  }
};

export const updateItem = async (itemId, item) => {
  try {
    const response = await api.put(`/items/${itemId}`, item);
    return response.data;
  } catch (error) {
    console.error("Failed to update item:", error);
    throw error;
  }
};

export const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete item:", error);
    throw error;
  }
};

export const markItemAsFound = async (itemId) => {
  try {
    const response = await api.put(`/items/${itemId}/mark-found`);
    return response.data;
  } catch (error) {
    console.error("Failed to mark item as found:", error);
    throw error;
  }
};

export const getMyItems = async () => {
  try {
    const response = await api.get('/users/me/items/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch my items:", error);
    return [];
  }
};

export const createHelpedFinding = async (helpedItem) => {
  try {
    const response = await api.post('/helped-finding/', helpedItem);
    return response.data;
  } catch (error) {
    console.error("Failed to create helped finding record:", error);
    throw error;
  }
};

export const getHelpedFindingItems = async () => {
  try {
    const response = await api.get('/helped-finding/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch helped finding items:", error);
    return [];
  }
};

export const getMyHelpedFindingItems = async () => {
  try {
    const response = await api.get('/users/me/helped-finding/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch my helped finding items:", error);
    return [];
  }
};

export const getAllHelpedFindingItems = async () => {
  try {
    const response = await api.get('/helped-finding/all');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch all helped finding items:", error);
    return [];
  }
};

// ✅ 7. Add user profile update function
export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/users/me/', userData);
    return response.data;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
};

// ✅ 8. Add message service functions
export const getMessages = async () => {
  try {
    const response = await api.get('/messages/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return [];
  }
};

export const getUnreadMessages = async () => {
  try {
    const response = await api.get('/messages/unread');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch unread messages:", error);
    return [];
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    throw error;
  }
};

export const createMessage = async (message) => {
  try {
    const response = await api.post('/messages/', message);
    return response.data;
  } catch (error) {
    console.error("Failed to create message:", error);
    throw error;
  }
};

export const getThreadMessages = async (otherUser) => {
  try {
    const response = await api.get(`/messages/thread/${otherUser}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch thread messages:", error);
    throw error;
  }
};

export const getMessageThreads = async () => {
  try {
    // Explicitly get the token and create headers
    const token = localStorage.getItem('token');

    // If no token, throw an error
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Check if token looks like a valid JWT
    if (token.split('.').length !== 3) {
      // Token is invalid, remove it and throw error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Invalid token format. Please log in again.');
    }

    // Create headers with the token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await api.get('/messages/threads', config);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch message threads:", error);
    // Log more detailed error information
    if (error.response) {
      console.error("Error response:", error.response.status, error.response.data);
    }
    throw error;
  }
};
