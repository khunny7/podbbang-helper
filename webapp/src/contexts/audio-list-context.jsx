import { createContext, useContext, useReducer, useEffect, useState } from "react";
import { usePersistedState } from "../hooks/use-persisted-state";
import storageService, { STORAGE_KEYS } from "../services/storage";

// Action types for audio reducer
const AUDIO_ACTIONS = {
  SET_PLAYLIST: 'SET_PLAYLIST',
  ADD_TO_PLAYLIST: 'ADD_TO_PLAYLIST',
  PLAY_EPISODE: 'PLAY_EPISODE',
  REMOVE_FROM_PLAYLIST: 'REMOVE_FROM_PLAYLIST',
  CLEAR_PLAYLIST: 'CLEAR_PLAYLIST',
  SET_CURRENT_EPISODE: 'SET_CURRENT_EPISODE',
  PLAY_NEXT: 'PLAY_NEXT',
  SET_PLAYING: 'SET_PLAYING',
  SET_POSITION: 'SET_POSITION',
  SET_DURATION: 'SET_DURATION',
  SET_VOLUME: 'SET_VOLUME',
  SET_PLAYBACK_SPEED: 'SET_PLAYBACK_SPEED',
  LOAD_PERSISTED_STATE: 'LOAD_PERSISTED_STATE'
};

// Function to get initial state from storage (cached to prevent multiple calls)
let _initialStateCache = null;
let _hasInitialized = false;

const getInitialState = () => {
  // Return cached state to prevent multiple storage reads
  if (_initialStateCache && _hasInitialized) {
    return _initialStateCache;
  }
  
  // Only log if this is the first initialization
  if (!_hasInitialized) {
    console.log('🎛️ Initializing audio context state...');
    _hasInitialized = true;
  }
  
  // Load saved values or use defaults
  const savedVolume = storageService.get(STORAGE_KEYS.VOLUME, 1);
  const savedPlaybackSpeed = storageService.get(STORAGE_KEYS.PLAYBACK_SPEED, 1);
  
  _initialStateCache = {
    playlist: [], // Will be loaded separately in useEffect
    currentEpisode: null, // Will be loaded separately in useEffect
    currentIndex: -1,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: savedVolume,
    playbackSpeed: savedPlaybackSpeed,
    isLoading: false
  };
  
  return _initialStateCache;
};

// Audio reducer
const audioReducer = (state, action) => {
  switch (action.type) {
    case AUDIO_ACTIONS.SET_PLAYLIST:
      return {
        ...state,
        playlist: action.payload,
        currentIndex: action.currentIndex ?? 0,
        currentEpisode: action.payload[action.currentIndex ?? 0] || null
      };

    case AUDIO_ACTIONS.ADD_TO_PLAYLIST:
      if (state.playlist.some(episode => String(episode.id) === String(action.payload.id))) {
        return state;
      }
      const newPlaylist = [...state.playlist, action.payload];
      return {
        ...state,
        playlist: newPlaylist,
        currentEpisode: state.currentEpisode || action.payload,
        currentIndex: state.currentEpisode
          ? newPlaylist.findIndex(episode => String(episode.id) === String(state.currentEpisode.id))
          : 0
      };

    case AUDIO_ACTIONS.PLAY_EPISODE: {
      const isCurrentEpisode = String(state.currentEpisode?.id) === String(action.payload.id);
      const existingIndex = state.playlist.findIndex(
        episode => String(episode.id) === String(action.payload.id)
      );
      const playlist = existingIndex >= 0
        ? state.playlist.map((episode, index) => index === existingIndex ? action.payload : episode)
        : [...state.playlist, action.payload];
      const currentIndex = existingIndex >= 0 ? existingIndex : playlist.length - 1;
      return {
        ...state,
        playlist,
        currentEpisode: playlist[currentIndex],
        currentIndex,
        isPlaying: true,
        position: isCurrentEpisode ? state.position : 0,
        duration: isCurrentEpisode ? state.duration : 0
      };
    }

    case AUDIO_ACTIONS.REMOVE_FROM_PLAYLIST:
      const filteredPlaylist = state.playlist.filter((_, index) => index !== action.index);
      const newIndex = action.index < state.currentIndex ? state.currentIndex - 1 : 
                      action.index === state.currentIndex ? 
                        (state.currentIndex >= filteredPlaylist.length ? filteredPlaylist.length - 1 : state.currentIndex) :
                        state.currentIndex;
      
      return {
        ...state,
        playlist: filteredPlaylist,
        currentIndex: filteredPlaylist.length === 0 ? -1 : newIndex,
        currentEpisode: filteredPlaylist[newIndex] || null,
        isPlaying: filteredPlaylist.length > 0 && state.isPlaying,
        position: action.index === state.currentIndex ? 0 : state.position,
        duration: action.index === state.currentIndex ? 0 : state.duration
      };

    case AUDIO_ACTIONS.CLEAR_PLAYLIST:
      return {
        ...state,
        playlist: [],
        currentEpisode: null,
        currentIndex: -1,
        isPlaying: false,
        position: 0
      };

    case AUDIO_ACTIONS.SET_CURRENT_EPISODE:
      const episodeIndex = state.playlist.findIndex(
        ep => String(ep.id) === String(action.payload?.id)
      );
      const currentEpisodeChanged = String(state.currentEpisode?.id) !== String(action.payload?.id);
      return {
        ...state,
        currentEpisode: action.payload,
        currentIndex: episodeIndex,
        position: currentEpisodeChanged ? 0 : state.position,
        duration: currentEpisodeChanged ? 0 : state.duration
      };

    case AUDIO_ACTIONS.PLAY_NEXT:
      if (state.currentIndex >= state.playlist.length - 1) {
        return { ...state, isPlaying: false };
      }
      return {
        ...state,
        currentIndex: Math.max(0, state.currentIndex + 1),
        currentEpisode: state.playlist[Math.max(0, state.currentIndex + 1)],
        isPlaying: true,
        position: 0,
        duration: 0
      };

    case AUDIO_ACTIONS.SET_PLAYING:
      return { ...state, isPlaying: action.payload };

    case AUDIO_ACTIONS.SET_POSITION:
      return { ...state, position: action.payload };

    case AUDIO_ACTIONS.SET_DURATION:
      return { ...state, duration: action.payload };

    case AUDIO_ACTIONS.SET_VOLUME:
      return { ...state, volume: action.payload };

    case AUDIO_ACTIONS.SET_PLAYBACK_SPEED:
      return { ...state, playbackSpeed: action.payload };

    case AUDIO_ACTIONS.LOAD_PERSISTED_STATE:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Default state for context (fallback when no provider)
const defaultState = {
  playlist: [],
  currentEpisode: null,
  currentIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,
  isLoading: false
};

// Context
const AudioListsContext = createContext({
  // State
  ...defaultState,
  
  // Actions
  setPlaylist: () => {},
  addToPlaylist: () => {},
  removeFromPlaylist: () => {},
  clearPlaylist: () => {},
  setCurrentEpisode: () => {},
  playEpisode: () => {},
  setPlaying: () => {},
  setPosition: () => {},
  setDuration: () => {},
  setVolume: () => {},
  setPlaybackSpeed: () => {},
  
  // Navigation
  playNext: () => {},
  playPrevious: () => {},
  
  // Utilities
  saveState: () => {},
  loadState: () => {}
});

// Provider component
export const AudioListsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, getInitialState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      console.log('🔄 Loading persisted state...');
      const savedPlaylist = storageService.get(STORAGE_KEYS.PLAYLIST, []);
      const savedCurrentEpisode = storageService.get(STORAGE_KEYS.CURRENT_EPISODE, null);

      console.log('📊 Loaded data details:', {
        savedPlaylist: savedPlaylist,
        playlistLength: savedPlaylist?.length || 0,
        savedCurrentEpisode: savedCurrentEpisode,
        currentEpisodeId: savedCurrentEpisode?.id || 'none',
        currentVolume: state.volume,
        currentPlaybackSpeed: state.playbackSpeed
      });

      if (savedPlaylist.length > 0 || savedCurrentEpisode) {
        const currentIndex = savedCurrentEpisode ? 
          savedPlaylist.findIndex(ep => ep.id === savedCurrentEpisode.id) : -1;
        
        // Load playback position for current episode
        let savedPosition = 0;
        if (savedCurrentEpisode?.id) {
          const positions = storageService.get('podbbang_playback_positions', {});
          savedPosition = positions[savedCurrentEpisode.id] || 0;
          console.log(`📍 Restored position for episode ${savedCurrentEpisode.id}: ${savedPosition}`);
        }
        
        console.log('✅ Restoring state with currentIndex:', currentIndex);
        
        dispatch({
          type: AUDIO_ACTIONS.LOAD_PERSISTED_STATE,
          payload: {
            playlist: savedPlaylist,
            currentEpisode: savedCurrentEpisode,
            currentIndex: currentIndex,
            position: savedPosition
            // volume and playbackSpeed are already loaded in initial state
          }
        });
        
        console.log('🏁 State restoration dispatched');
      } else {
        console.log('❌ No persisted playlist/episode found');
      }
      
      // Mark as initialized after loading (this should be after state updates)
      setTimeout(() => {
        console.log('🎯 Setting initialized to true');
        setIsInitialized(true);
      }, 0);
      
      // Debug current storage state
      storageService.debugStorage();
    };

    loadPersistedState();
  }, []); // Only run once on mount

  // Persist state changes (only after initialization to avoid overwriting loaded data)
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('💾 Playlist changed, saving:', state.playlist.length, 'episodes');
    if (state.playlist.length > 0) {
      storageService.set(STORAGE_KEYS.PLAYLIST, state.playlist);
    } else {
      // Clear playlist from storage when empty
      storageService.remove(STORAGE_KEYS.PLAYLIST);
    }
  }, [state.playlist, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('💾 Current episode changed, saving:', state.currentEpisode?.title || 'null');
    if (state.currentEpisode) {
      storageService.set(STORAGE_KEYS.CURRENT_EPISODE, state.currentEpisode);
    } else {
      // Clear current episode from storage when null
      storageService.remove(STORAGE_KEYS.CURRENT_EPISODE);
    }
  }, [state.currentEpisode, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('💾 Volume changed, saving:', state.volume);
    storageService.set(STORAGE_KEYS.VOLUME, state.volume);
  }, [state.volume, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('💾 Playback speed changed, saving:', state.playbackSpeed);
    storageService.set(STORAGE_KEYS.PLAYBACK_SPEED, state.playbackSpeed);
  }, [state.playbackSpeed, isInitialized]);

  // Action creators
  const setPlaylist = (episodes, currentIndex = 0) => {
    dispatch({ 
      type: AUDIO_ACTIONS.SET_PLAYLIST, 
      payload: episodes, 
      currentIndex 
    });
  };

  const addToPlaylist = (episode) => {
    dispatch({ type: AUDIO_ACTIONS.ADD_TO_PLAYLIST, payload: episode });
  };

  const removeFromPlaylist = (index) => {
    dispatch({ type: AUDIO_ACTIONS.REMOVE_FROM_PLAYLIST, index });
  };

  const clearPlaylist = () => {
    dispatch({ type: AUDIO_ACTIONS.CLEAR_PLAYLIST });
    storageService.remove(STORAGE_KEYS.PLAYLIST);
    storageService.remove(STORAGE_KEYS.CURRENT_EPISODE);
  };

  const setCurrentEpisode = (episode) => {
    dispatch({ type: AUDIO_ACTIONS.SET_CURRENT_EPISODE, payload: episode });
  };

  const playEpisode = (episode) => {
    dispatch({ type: AUDIO_ACTIONS.PLAY_EPISODE, payload: episode });
  };

  const setPlaying = (playing) => {
    dispatch({ type: AUDIO_ACTIONS.SET_PLAYING, payload: playing });
  };

  const setPosition = (position) => {
    dispatch({ type: AUDIO_ACTIONS.SET_POSITION, payload: position });
  };

  const setDuration = (duration) => {
    dispatch({ type: AUDIO_ACTIONS.SET_DURATION, payload: duration });
  };

  const setVolume = (volume) => {
    dispatch({ type: AUDIO_ACTIONS.SET_VOLUME, payload: volume });
  };

  const setPlaybackSpeed = (speed) => {
    dispatch({ type: AUDIO_ACTIONS.SET_PLAYBACK_SPEED, payload: speed });
  };

  const playNext = () => {
    dispatch({ type: AUDIO_ACTIONS.PLAY_NEXT });
  };

  const playPrevious = () => {
    if (state.currentIndex > 0) {
      const prevEpisode = state.playlist[state.currentIndex - 1];
      setCurrentEpisode(prevEpisode);
    }
  };

  const contextValue = {
    // State
    ...state,
    
    // Actions
    setPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    setCurrentEpisode,
    playEpisode,
    setPlaying,
    setPosition,
    setDuration,
    setVolume,
    setPlaybackSpeed,
    
    // Navigation
    playNext,
    playPrevious,
    
    // Legacy support
    audioLists: state.playlist,
    clearPriorAudioLists: clearPlaylist,
    setAudioListsWithClear: setPlaylist
  };

  return (
    <AudioListsContext.Provider value={contextValue}>
      {children}
    </AudioListsContext.Provider>
  );
};

// Custom hook to use the context
export const useAudioContext = () => {
  const context = useContext(AudioListsContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioListsProvider');
  }
  return context;
};

export default AudioListsContext;
