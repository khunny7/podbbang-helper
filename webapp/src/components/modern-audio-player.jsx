import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import AudioListsContext from '../contexts/audio-list-context.jsx';
import { usePlaybackPosition } from '../hooks/use-persisted-state';
import './modern-audio-player.css';

const ModernAudioPlayer = () => {
  const {
    playlist,
    currentEpisode,
    currentIndex,
    isPlaying,
    position,
    duration,
    volume,
    playbackSpeed,
    setCurrentEpisode,
    setPlaying,
    setPosition,
    setDuration,
    setVolume,
    setPlaybackSpeed,
    playNext,
    playPrevious
  } = useContext(AudioListsContext);

  const audioRef = useRef(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Hook for position persistence
  const { 
    position: savedPosition, 
    setPosition: setSavedPosition 
  } = usePlaybackPosition(currentEpisode?.id);

  // Update audio element when current episode changes
  useEffect(() => {
    if (audioRef.current && currentEpisode) {
      console.log('🎵 Loading new episode:', currentEpisode.title);
      audioRef.current.src = currentEpisode.mediaUrl;
      audioRef.current.load();
    }
  }, [currentEpisode?.id]);

  // Restore saved position when episode loads and metadata is available
  useEffect(() => {
    if (audioRef.current && currentEpisode && savedPosition > 0) {
      const restorePosition = () => {
        if (audioRef.current.duration && savedPosition < audioRef.current.duration) {
          // Only log if we haven't restored this episode's position yet
          const episodeKey = `restored_${currentEpisode.id}`;
          if (!window._restoredPositions?.has(episodeKey)) {
            window._restoredPositions = window._restoredPositions || new Set();
            window._restoredPositions.add(episodeKey);
            console.log(`📍 Restoring position for ${currentEpisode.title}: ${savedPosition}s`);
          }
          audioRef.current.currentTime = savedPosition;
          setPosition(savedPosition);
        }
      };

      // If metadata is already loaded, restore immediately
      if (audioRef.current.duration) {
        restorePosition();
      } else {
        // Otherwise wait for metadata to load
        const handleLoadedMetadata = () => {
          restorePosition();
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
          audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }
  }, [currentEpisode?.id, savedPosition]); // Removed setPosition from dependencies

  // Sync audio element with context state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Remove the separate auto-save interval - we'll handle auto-saving in timeupdate
  // Auto-save position every 5 seconds while playing is now handled in handleTimeUpdate

  // Audio event handlers (throttled to prevent excessive updates)
  const lastTimeUpdateRef = useRef(0);
  const lastPositionSaveRef = useRef(0);
  
  // Throttled position saving function (max once per 5 seconds)
  const throttledSavePosition = useCallback((currentTime, reason = 'auto') => {
    const now = Date.now();
    const timeSinceLastSave = now - lastPositionSaveRef.current;
    const componentId = currentEpisode?.id ? String(currentEpisode.id).slice(-4) : 'none';
    
    // Always allow saves for manual seeks or episode completion
    // For other reasons, throttle to once per 5 seconds
    if (reason === 'seek' || reason === 'end' || timeSinceLastSave >= 5000) {
      setSavedPosition(currentTime);
      lastPositionSaveRef.current = now;
      // Only log important saves (seeks, ends, or every 30 seconds of auto-save)
      if (reason === 'seek' || reason === 'end' || Math.floor(currentTime) % 30 === 0) {
        console.log(`💾 [${componentId}] ${reason === 'seek' ? '🎯 Seek' : reason === 'end' ? '✅ End' : '📍 30s checkpoint'} saved: ${currentTime.toFixed(1)}s`);
      }
    }
    // Remove the verbose skipped save logging
  }, [setSavedPosition, currentEpisode?.id]);
  
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      
      // Update UI position if there's a significant change (0.5 seconds)
      if (Math.abs(currentTime - lastTimeUpdateRef.current) >= 0.5) {
        lastTimeUpdateRef.current = currentTime;
        setPosition(currentTime);
        
        // Auto-save position every 5 seconds while playing
        if (isPlaying && currentTime > 0) {
          throttledSavePosition(currentTime, 'auto');
        }
      }
    }
  }, [isPlaying, setPosition, throttledSavePosition]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    throttledSavePosition(0, 'end'); // Clear saved position when episode completes
    playNext();
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
    // Save position when paused (throttled)
    if (audioRef.current && audioRef.current.currentTime > 0) {
      throttledSavePosition(audioRef.current.currentTime, 'pause');
    }
  };

  // Control functions
  const togglePlay = () => {
    if (currentEpisode) {
      setPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration) {
      const clickX = e.nativeEvent.offsetX;
      const width = e.currentTarget.offsetWidth;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setPosition(newTime);
      throttledSavePosition(newTime, 'seek'); // Save position immediately on manual seek
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleEpisodeSelect = (episode, index) => {
    setCurrentEpisode(episode);
    setShowPlaylist(false);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (position / duration) * 100 : 0;

  if (!playlist.length) {
    return null; // Don't show player if no episodes
  }

  return (
    <div className="modern-audio-player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
      />

      {/* Main player bar */}
      <div className="player-bar">
        {/* Episode info */}
        <div className="episode-info">
          {currentEpisode && (
            <>
              <div className="episode-artwork">
                <img 
                  src={currentEpisode.image || '/favicon.ico'} 
                  alt={currentEpisode.title}
                  onError={(e) => e.target.src = '/favicon.ico'}
                />
              </div>
              <div className="episode-details">
                <div className="episode-title">{currentEpisode.title}</div>
                <div className="episode-subtitle">Podbbang</div>
              </div>
            </>
          )}
        </div>

        {/* Player controls */}
        <div className="player-controls">
          <div className="control-buttons">
            <button 
              className="control-btn" 
              onClick={playPrevious}
              disabled={currentIndex <= 0}
              aria-label="Previous episode"
            >
              <span>⏮</span>
            </button>
            
            <button 
              className="play-pause-btn" 
              onClick={togglePlay}
              disabled={!currentEpisode}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>
            
            <button 
              className="control-btn" 
              onClick={playNext}
              disabled={currentIndex >= playlist.length - 1}
              aria-label="Next episode"
            >
              <span>⏭</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="progress-section">
            <span className="time-display">{formatTime(position)}</span>
            <div className="progress-bar" onClick={handleSeek}>
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="right-controls">
          {/* Speed control */}
          <div className="speed-control">
            <select 
              value={playbackSpeed} 
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="speed-select"
              aria-label="Playback speed"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Volume control */}
          <div className="volume-control">
            <button 
              className="volume-btn"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              aria-label="Volume"
            >
              <span>{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
            </button>
            {showVolumeSlider && (
              <div className="volume-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume level"
                />
              </div>
            )}
          </div>

          {/* Playlist toggle */}
          <button 
            className="playlist-btn"
            onClick={() => setShowPlaylist(!showPlaylist)}
            aria-label="Toggle playlist"
          >
            <span>📋</span>
            <span className="playlist-count">{playlist.length}</span>
          </button>
        </div>
      </div>

      {/* Playlist panel */}
      {showPlaylist && (
        <div className="playlist-panel">
          <div className="playlist-header">
            <h3>Playlist ({playlist.length} episodes)</h3>
            <button 
              className="close-btn"
              onClick={() => setShowPlaylist(false)}
              aria-label="Close playlist"
            >
              ×
            </button>
          </div>
          <div className="playlist-content">
            {playlist.map((episode, index) => (
              <div
                key={episode.id}
                className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleEpisodeSelect(episode, index)}
              >
                <div className="playlist-item-artwork">
                  <img 
                    src={episode.image || '/favicon.ico'} 
                    alt={episode.title}
                    onError={(e) => e.target.src = '/favicon.ico'}
                  />
                  {index === currentIndex && isPlaying && (
                    <div className="playing-indicator">▶</div>
                  )}
                </div>
                <div className="playlist-item-details">
                  <div className="playlist-item-title">{episode.title}</div>
                  <div className="playlist-item-subtitle">Podbbang</div>
                </div>
                <div className="playlist-item-number">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAudioPlayer;
