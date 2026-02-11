import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ItemList({ items, isLoading, onEdit, onDelete, onMarkFound }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <p>Loading items...</p>;
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-4">No lost items have been reported yet.</p>;
  }

  return (
    <div className="item-list-container">
      <h2 className="text-2xl font-bold mb-6 text-center">Lost Items Global Feed</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => navigate(`/item/${item.id}`)}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-3">{item.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Lost at: {item.location_lost}
                </span>
                <span>{item.date_lost}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm"><span className="font-medium">Contact:</span> {item.contact_info}</p>
                {item.reported_by && (
                  <p className="text-sm"><span className="font-medium">Reported by:</span> {item.reported_by}</p>
                )}
              </div>
              {item.is_found && (
                <div className="mt-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    Found!
                  </span>
                </div>
              )}

              {/* Action buttons - only show for the item owner */}
              {user && item.reported_by === user.username && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit && onEdit(item);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete && onDelete(item.id);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm"
                  >
                    Delete
                  </button>
                  {!item.is_found && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkFound && onMarkFound(item.id);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm"
                    >
                      Mark Found
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ItemList;