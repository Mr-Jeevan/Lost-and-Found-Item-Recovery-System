import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // 1. Import the useAuth hook

// Import your pages and components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import HelpedFindingPage from './pages/HelpedFindingPage';
import PublicFeedPage from './pages/PublicFeedPage'; // 2. Import the public feed page
import MyItemsPage from './pages/MyItemsPage'; // Import the new MyItemsPage
import ItemDetailPage from './pages/ItemDetailPage'; // Import the new ItemDetailPage
import MessagesPage from './pages/MessagesPage'; // Import the new MessagesPage
import ComposeMessagePage from './pages/ComposeMessagePage'; // Import the new ComposeMessagePage
import MessageThreadPage from './pages/MessageThreadPage'; // Import the new MessageThreadPage

/**
 * 3. Create a PrivateRoute component.
 * This component will act as a guard for your protected pages.
 * If the user is authenticated, it renders the requested component (`children`).
 * If not, it redirects them to the public feed.
 */
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/public" />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Your Header will be visible on all pages */}
        <Header />
        <div className="flex">

          {/* 4. Conditionally render the Sidebar */}
          {/* The sidebar will only appear if the user is logged in. */}
          {isAuthenticated && (
            <div className="hidden md:block">
              <Sidebar />
            </div>
          )}

          {/* Main content */}
          <div className="flex-1">
            <div className="container mx-auto p-4 md:p-6 mt-20">
              {/* 5. Define public and private routes */}
              <Routes>
                {/* PUBLIC ROUTES */}
                {/* These are accessible to everyone. */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/public" element={<PublicFeedPage />} />

                {/* PRIVATE ROUTES */}
                {/* These routes are wrapped with our PrivateRoute component. */}
                <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                <Route path="/add-item" element={<PrivateRoute><ItemForm /></PrivateRoute>} />
                <Route path="/items" element={<PrivateRoute><ItemList /></PrivateRoute>} />
                <Route path="/my-items" element={<PrivateRoute><MyItemsPage /></PrivateRoute>} />
                <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
                <Route path="/helped-finding" element={<PrivateRoute><HelpedFindingPage /></PrivateRoute>} />
                <Route path="/item/:itemId" element={<PrivateRoute><ItemDetailPage /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                <Route path="/messages/compose" element={<PrivateRoute><ComposeMessagePage /></PrivateRoute>} />
                <Route path="/messages/thread/:otherUser" element={<PrivateRoute><MessageThreadPage /></PrivateRoute>} />

                {/* FALLBACK REDIRECT */}
                {/* If a user enters any other URL, redirect them. */}
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/public"} />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;