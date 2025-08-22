import { useState, useEffect, useCallback, useRef } from 'react';
import storageService from '../services/storage';

/**
 * Custom hook for persisted state using localStorage
 * Simple, synchronous approach that works in both web and Electron
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value if nothing in storage
 * @param {boolean} debounce - Whether to debounce saves (default: true)
 * @param {number} debounceMs - Debounce delay in ms (default: 500)
 */
export const usePersistedState = (key, initialValue, debounce = true, debounceMs = 500) => {
  // Initialize state from storage or use initial value
  const [state, setState] = useState(() => {
    return storageService.get(key, initialValue);
  });

  // Use ref for debounce timer to avoid dependency issues
  const debounceTimerRef = useRef(null);
  // Use ref to track current state for functional updates
  const stateRef = useRef(state);
  
  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Save to storage function
  const saveToStorage = useCallback((value) => {
    storageService.set(key, value);
  }, [key]);

  // Update state and persist
  const setPersistedState = useCallback((value) => {
    // Handle functional updates using the ref to avoid circular dependency
    const resolvedValue = typeof value === 'function' ? value(stateRef.current) : value;
    
    setState(resolvedValue);

    if (debounce) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        saveToStorage(resolvedValue);
      }, debounceMs);
    } else {
      // Save immediately
      saveToStorage(resolvedValue);
    }
  }, [debounce, debounceMs, saveToStorage]); // Removed state dependency

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return [state, setPersistedState];
};

/**
 * Hook for managing audio playback position persistence
 * @param {string} episodeId - Current episode ID
 */
export const usePlaybackPosition = (episodeId) => {
  const [positions, setPositions] = usePersistedState('podbbang_playback_positions', {});

  const getPosition = useCallback((id = episodeId) => {
    return positions[id] || 0;
  }, [positions, episodeId]);

  const setPosition = useCallback((position, id = episodeId) => {
    if (id) {
      setPositions(prev => ({
        ...prev,
        [id]: position
      }));
    }
  }, [setPositions, episodeId]);

  const removePosition = useCallback((id = episodeId) => {
    if (id) {
      setPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[id];
        return newPositions;
      });
    }
  }, [setPositions, episodeId]);

  return {
    position: getPosition(),
    setPosition,
    removePosition,
    getPosition
  };
};

/**
 * Hook for managing favorites/bookmarks
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = usePersistedState('podbbang_favorites', []);

  const addFavorite = useCallback((item) => {
    setFavorites(prev => {
      // Avoid duplicates
      const exists = prev.some(fav => fav.id === item.id && fav.type === item.type);
      if (exists) return prev;
      
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((id, type) => {
    setFavorites(prev => prev.filter(fav => !(fav.id === id && fav.type === type)));
  }, [setFavorites]);

  const isFavorite = useCallback((id, type) => {
    return favorites.some(fav => fav.id === id && fav.type === type);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };
};

/**
 * Hook for managing recent channels
 */
export const useRecentChannels = (maxRecent = 10) => {
  const [recentChannels, setRecentChannels] = usePersistedState('podbbang_recent_channels', []);

  const addRecentChannel = useCallback((channel) => {
    setRecentChannels(prev => {
      // Remove if already exists
      const filtered = prev.filter(ch => ch.id !== channel.id);
      // Add to front and limit to maxRecent
      return [{ ...channel, lastVisited: Date.now() }, ...filtered].slice(0, maxRecent);
    });
  }, [setRecentChannels, maxRecent]);

  return {
    recentChannels,
    addRecentChannel
  };
};
