import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('vaFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vaFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (va) => {
    setFavorites(prevFavorites => {
      // Check if VA is already in favorites
      const exists = prevFavorites.some(fav => fav._id === va._id);
      if (exists) {
        // Remove from favorites if already exists
        return prevFavorites.filter(fav => fav._id !== va._id);
      } else {
        // Add to favorites
        return [...prevFavorites, va];
      }
    });
  };

  const removeFromFavorites = (vaId) => {
    setFavorites(prevFavorites => 
      prevFavorites.filter(fav => fav._id !== vaId)
    );
  };

  const isFavorite = (vaId) => {
    return favorites.some(fav => fav._id === vaId);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  const clearFavorites = () => {
    if (window.confirm('Are you sure you want to clear all favorites?')) {
      setFavorites([]);
    }
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesCount,
    clearFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};