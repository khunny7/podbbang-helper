import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import AudioListsContext from '../contexts/audio-list-context.jsx';
import { usePlaybackPosition } from '../hooks/use-persisted-state';
import { useTranslation } from '../contexts/language-context';
import fallbackArtwork from '../assets/fallback-podcast.svg';
import './modern-audio-player.css';

const ModernAudioPlayer = () => {
  const { t } = useTranslation();
  const {
    playlist,
    currentEpisode,
    currentIndex,
    isPlaying,
    position,
    duration,
    volume,
    playbackSpeed,
    playEpisode,
    removeFromPlaylist,
    clearPlaylist,
    setPlaying,
    setPosition,
    setDuration,
    setVolume,
    setPlaybackSpeed,
    playNext,
    playPrevious
  } = useContext(AudioListsContext);

  const audioRef = useRef(null);
  const sourceChangingRef = useRef(false);
  const restoredEpisodeRef = useRef(null);
  const activeEpisodeRef = useRef(null);
  const requestedSourceRef = useRef(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [sleepTimer, setSleepTimer] = useState('off');
  const [playbackError, setPlaybackError] = useState(null);
  const sleepTimerRef = useRef(null);

  // Hook for position persistence
  const { 
    position: savedPosition, 
    setPosition: setSavedPosition,
    savePositionImmediately,
  } = usePlaybackPosition(currentEpisode?.id);

  useEffect(() => {
    const savePositionBeforeClose = () => {
      const audio = audioRef.current;
      if (currentEpisode?.id && audio && audio.currentTime > 0 && !audio.ended) {
        savePositionImmediately(audio.currentTime, currentEpisode.id);
      }
    };
    window.addEventListener('pagehide', savePositionBeforeClose);
    return () => window.removeEventListener('pagehide', savePositionBeforeClose);
  }, [currentEpisode?.id, savePositionImmediately]);

  // Save the previous episode before replacing its media source.
  useEffect(() => {
    const audio = audioRef.current;
    if (activeEpisodeRef.current && activeEpisodeRef.current !== String(currentEpisode?.id)) {
      if (audio?.currentTime > 0) setSavedPosition(audio.currentTime, activeEpisodeRef.current);
      sourceChangingRef.current = true;
      audio?.pause();
    }
    activeEpisodeRef.current = currentEpisode?.id ? String(currentEpisode.id) : null;

    if (audio && currentEpisode?.mediaUrl) {
      sourceChangingRef.current = true;
      restoredEpisodeRef.current = null;
      setPlaybackError(null);
      audio.pause();
      audio.src = currentEpisode.mediaUrl;
      requestedSourceRef.current = audio.src;
      audio.load();
    } else if (audio) {
      sourceChangingRef.current = true;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      requestedSourceRef.current = null;
      sourceChangingRef.current = false;
    }
  }, [currentEpisode?.id, currentEpisode?.mediaUrl]);

  // Sync audio element with context state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          if (error.name === 'AbortError') return;
          setPlaybackError('This episode could not be played. Try another episode or check back later.');
          console.error('Could not start episode playback:', error);
          setPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentEpisode?.id, currentEpisode?.mediaUrl]);

  useEffect(() => () => clearTimeout(sleepTimerRef.current), []);

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
    if (reason === 'seek' || reason === 'pause' || reason === 'end' || reason === 'unload' || timeSinceLastSave >= 5000) {
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
    const audio = audioRef.current;
    if (!audio || !currentEpisode?.id || audio.currentSrc !== requestedSourceRef.current) return;

    const episodeKey = String(currentEpisode.id);
    sourceChangingRef.current = false;
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    if (restoredEpisodeRef.current === episodeKey) return;

    restoredEpisodeRef.current = episodeKey;
    if (savedPosition > 0 && Number.isFinite(audio.duration) && savedPosition < audio.duration) {
      audio.currentTime = savedPosition;
      setPosition(savedPosition);
    }
  };

  const handleEnded = () => {
    throttledSavePosition(0, 'end'); // Clear saved position when episode completes
    if (sleepTimer === 'end-track') {
      setPlaying(false);
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
      setSleepTimer('off');
      return;
    }
    playNext();
  };

  const handlePlay = () => {
    if (audioRef.current?.paused || audioRef.current?.currentSrc !== requestedSourceRef.current) return;
    setPlaybackError(null);
    setPlaying(true);
  };

  const handlePause = () => {
    if (sourceChangingRef.current) return;
    setPlaying(false);
    // Save position when paused (throttled)
    if (audioRef.current && !audioRef.current.ended && audioRef.current.currentTime > 0) {
      throttledSavePosition(audioRef.current.currentTime, 'pause');
    }
  };

  const handleAudioError = () => {
    if (audioRef.current?.currentSrc !== requestedSourceRef.current) return;
    sourceChangingRef.current = false;
    setPlaybackError('This episode could not be played. Try another episode or check back later.');
    setPlaying(false);
  };

  // Control functions
  const togglePlay = () => {
    if (currentEpisode) {
      setPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const newTime = Number(e.target.value);
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

  const handleSleepTimerChange = (event) => {
    const value = event.target.value;
    clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimer(value);
    if (value !== 'off' && value !== 'end-track') {
      sleepTimerRef.current = setTimeout(() => {
        setPlaying(false);
        setSleepTimer('off');
        sleepTimerRef.current = null;
      }, Number(value) * 60 * 1000);
    }
  };

  const handleSkip = (seconds) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = Math.min(duration, Math.max(0, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setPosition(newTime);
    throttledSavePosition(newTime, 'seek');
  };

  const handleEpisodeSelect = (episode) => {
    playEpisode(episode);
    setShowPlaylist(false);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

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
        onError={handleAudioError}
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
                  src={currentEpisode.image || fallbackArtwork}
                  alt={currentEpisode.title}
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackArtwork; }}
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
              onClick={() => handleSkip(-15)}
              disabled={!currentEpisode}
              aria-label={t('Go back 15 seconds')}
            >
              <span>↶15</span>
            </button>

            <button 
              className="control-btn" 
              onClick={playPrevious}
              disabled={currentIndex <= 0}
              aria-label={t('Previous episode')}
            >
              <span>⏮</span>
            </button>
            
            <button 
              className="play-pause-btn" 
              onClick={togglePlay}
              disabled={!currentEpisode}
              aria-label={t(isPlaying ? 'Pause' : 'Play')}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>
            
            <button 
              className="control-btn" 
              onClick={playNext}
              disabled={!currentEpisode || currentIndex >= playlist.length - 1}
              aria-label={t('Next episode')}
            >
              <span>⏭</span>
            </button>

            <button
              className="control-btn"
              onClick={() => handleSkip(15)}
              disabled={!currentEpisode}
              aria-label={t('Skip forward 15 seconds')}
            >
              <span>15↷</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="progress-section">
            <span className="time-display">{formatTime(position)}</span>
            <input
              className="progress-bar"
              type="range"
              min="0"
              max={Math.max(duration, 0)}
              step="1"
              value={Math.min(position, Math.max(duration, 0))}
              onChange={handleSeek}
              disabled={!duration}
              aria-label={t('Episode progress')}
              aria-valuetext={t('{position} of {duration}', { position: formatTime(position), duration: formatTime(duration) })}
              style={{ '--progress': `${progressPercentage}%` }}
            />
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
              aria-label={t('Playback speed')}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          <select
            className="speed-select sleep-timer-select"
            value={sleepTimer}
            onChange={handleSleepTimerChange}
            aria-label={t('Sleep timer')}
          >
            <option value="off">{t('Timer off')}</option>
            <option value="15">{t('{minutes} min', { minutes: 15 })}</option>
            <option value="30">{t('{minutes} min', { minutes: 30 })}</option>
            <option value="45">{t('{minutes} min', { minutes: 45 })}</option>
            <option value="end-track">{t('End of episode')}</option>
          </select>

          {/* Volume control */}
          <div className="volume-control">
            <button 
              className="volume-btn"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              aria-label={t('Volume')}
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
                  aria-label={t('Volume level')}
                />
              </div>
            )}
          </div>

          {/* Playlist toggle */}
          <button 
            className="playlist-btn"
            onClick={() => setShowPlaylist(!showPlaylist)}
            aria-label={t('Toggle playlist')}
          >
            <span>📋</span>
            <span className="playlist-count">{playlist.length}</span>
          </button>
        </div>
      </div>

      {playbackError && <p className="player-error" role="alert">{t(playbackError)}</p>}

      {/* Playlist panel */}
      {showPlaylist && (
        <div className="playlist-panel">
          <div className="playlist-header">
            <h3>{t('Playlist ({count} episodes)', { count: playlist.length })}</h3>
            <button
              className="queue-clear-btn"
              type="button"
              onClick={() => { clearPlaylist(); setShowPlaylist(false); }}
            >
              {t('Clear queue')}
            </button>
            <button 
              className="close-btn"
              onClick={() => setShowPlaylist(false)}
              aria-label={t('Close playlist')}
            >
              ×
            </button>
          </div>
          <div className="playlist-content">
            {playlist.map((episode, index) => (
              <div
                key={episode.id}
                className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
              >
                <button
                  className="playlist-item-select"
                  type="button"
                  onClick={() => handleEpisodeSelect(episode)}
                  aria-current={index === currentIndex ? 'true' : undefined}
                  aria-label={t('Play {title}', { title: episode.title })}
                >
                  <span className="playlist-item-artwork">
                    <img
                      src={episode.image || fallbackArtwork}
                      alt=""
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackArtwork; }}
                    />
                    {index === currentIndex && isPlaying && (
                      <span className="playing-indicator" aria-hidden="true">▶</span>
                    )}
                  </span>
                  <span className="playlist-item-details">
                    <span className="playlist-item-title">{episode.title}</span>
                    <span className="playlist-item-subtitle">{episode.channelTitle || 'Podbbang'}</span>
                  </span>
                </button>
                <div className="playlist-item-number">{index + 1}</div>
                <button
                  className="queue-remove-btn"
                  type="button"
                  onClick={() => removeFromPlaylist(index)}
                  aria-label={t('Remove {title} from queue', { title: episode.title })}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAudioPlayer;
