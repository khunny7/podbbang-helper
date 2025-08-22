import { useEffect, useRef } from 'react';
import { useAudioContext } from '../contexts/audio-list-context.jsx';
import { usePlaybackPosition } from './use-persisted-state';

/**
 * Enhanced audio control hook with persistence
 */
export const useAudioControlWithPersistence = () => {
  const audioRef = useRef(null);
  const {
    currentEpisode,
    isPlaying,
    position,
    duration,
    volume,
    playbackSpeed,
    playlist,
    setPlaying,
    setPosition,
    setDuration,
    setVolume,
    setPlaybackSpeed,
    playNext,
    playPrevious
  } = useAudioContext();

  const { 
    position: savedPosition, 
    setPosition: setSavedPosition,
    removePosition 
  } = usePlaybackPosition(currentEpisode?.id);

  // Load saved position when episode changes
  useEffect(() => {
    if (currentEpisode && audioRef.current && savedPosition > 0) {
      audioRef.current.currentTime = savedPosition;
      setPosition(savedPosition);
    }
  }, [currentEpisode?.id, savedPosition, setPosition]);

  // Auto-save position every 5 seconds while playing
  useEffect(() => {
    if (!isPlaying || !currentEpisode) return;

    const interval = setInterval(() => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        setPosition(currentTime);
        setSavedPosition(currentTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentEpisode, setPosition, setSavedPosition]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPosition(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Mark episode as completed and remove saved position
      removePosition();
      
      // Auto-play next episode
      if (playlist.length > 1) {
        playNext();
      } else {
        setPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      // Apply saved settings
      audio.volume = volume;
      audio.playbackRate = playbackSpeed;
      
      // Restore position if available
      if (savedPosition > 0 && savedPosition < audio.duration) {
        audio.currentTime = savedPosition;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [volume, playbackSpeed, savedPosition, removePosition, playlist.length, playNext, setPlaying, setPosition, setDuration]);

  // Control functions
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPosition(time);
      setSavedPosition(time);
    }
  };

  const changeVolume = (newVolume) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const changePlaybackSpeed = (speed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const skipForward = (seconds = 30) => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + seconds, duration);
      seek(newTime);
    }
  };

  const skipBackward = (seconds = 15) => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
      seek(newTime);
    }
  };

  return {
    audioRef,
    
    // State
    currentEpisode,
    isPlaying,
    position,
    duration,
    volume,
    playbackSpeed,
    
    // Controls
    play,
    pause,
    seek,
    changeVolume,
    changePlaybackSpeed,
    skipForward,
    skipBackward,
    playNext,
    playPrevious,
    
    // Utilities
    formatTime: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
};
