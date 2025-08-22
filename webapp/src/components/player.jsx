import { useContext } from 'react';
import Player from "react-material-music-player";
import AudioListsContext from '../contexts/audio-list-context.jsx';
import './player.css';

// Define comprehensive classes for the player components to avoid prop warnings
const playerClasses = {
  // Playlist item template classes
  playlistItem: {
    root: 'playlist-item-root',
    title: 'playlist-item-title',
    artist: 'playlist-item-artist',
    cover: 'playlist-item-cover',
    duration: 'playlist-item-duration',
    delete: 'playlist-item-delete',
  },
  // Playlist classes
  playlist: {
    root: 'playlist-root',
    header: 'playlist-header',
    content: 'playlist-content',
    item: 'playlist-item',
  },
  // Player classes
  player: {
    root: 'player-root',
    controls: 'player-controls',
    progress: 'player-progress',
    volume: 'player-volume',
  },
  // Control classes
  controls: {
    root: 'controls-root',
    play: 'controls-play',
    pause: 'controls-pause',
    next: 'controls-next',
    prev: 'controls-prev',
  }
};

const AudioPlayer = (props) => {
    const { playlist, currentEpisode, volume, playbackSpeed } = useContext(AudioListsContext);
    
    // Debug logging to see what the player receives
    console.log('🎬 AudioPlayer render:', {
        playlistLength: playlist?.length || 0,
        currentEpisode: currentEpisode?.title || 'none',
        volume,
        playbackSpeed
    });
    
    // Convert our episodes to the format expected by react-material-music-player
    const audioLists = playlist.map((episode, index) => {
      console.log(`🎵 Converting episode ${index}:`, {
        id: episode.id,
        title: episode.title,
        mediaUrl: episode.mediaUrl,
        image: episode.image
      });
      
      return {
        name: episode.title,
        singer: 'Podbbang',
        cover: episode.image || '/favicon.ico',
        musicSrc: episode.mediaUrl,
        // Ensure we have a unique key
        key: episode.id?.toString() || index.toString()
      };
    });

    console.log('🎵 Final audioLists for player:', audioLists);

    return (
        <Player
          // Provide required classes prop to avoid warnings
          classes={playerClasses}
          // Connect to our context data
          audioLists={audioLists}
          defaultVolume={volume}
          defaultPlaybackSpeed={playbackSpeed}
          // Keep the drawer for playlist functionality
          // disableDrawer
          sx={{
            left: 0,
          }}
          // Additional props to reduce warnings
          mode="horizontal"
          preload="auto"
          showDownload={false}
          showReload={false}
          showThemeSwitch={false}
          spaceBar={true}
          loop={false}
          autoPlay={false}
          // Force the player to show the playlist
          showPlaylist={true}
          // Try to show the first episode
          defaultPlayIndex={0}
        />
    )
};

export default AudioPlayer;
