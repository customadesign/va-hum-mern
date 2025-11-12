import React, { useState } from 'react';
import { UserIcon, XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useFavorites } from '../contexts/FavoritesContext';
import { Link } from 'react-router-dom';

export default function FloatingFavoritesCart() {
  const { favorites, removeFromFavorites, getFavoritesCount, clearFavorites } = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const favoritesCount = getFavoritesCount();

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <UserIcon className="h-6 w-6" />
          {favoritesCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {favoritesCount}
            </span>
          )}
        </button>
      </div>

      {/* Favorites Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <HeartIcon className="h-5 w-5 mr-2" />
                My Favorites ({favoritesCount})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No favorites yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start adding VAs to your favorites to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((va) => (
                    <div
                      key={va._id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {va.avatar ? (
                          <img
                            src={va.avatar}
                            alt={va.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-700">
                              {va.name?.[0]?.toUpperCase() || 'V'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/vas/${va._id}`}
                          onClick={() => setIsOpen(false)}
                          className="block hover:text-blue-600 transition-colors"
                        >
                          <p className="font-medium text-gray-900 truncate">
                            {va.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {va.hero || 'Virtual Assistant'}
                          </p>
                        </Link>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromFavorites(va._id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove from favorites"
                      >
                        <HeartSolidIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {favorites.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {favoritesCount} {favoritesCount === 1 ? 'VA' : 'VAs'} in favorites
                  </span>
                  <button
                    onClick={() => {
                      clearFavorites();
                    }}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}