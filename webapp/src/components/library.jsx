import { useEffect, useMemo, useContext } from 'react';
import NavContext from '../contexts/nav-context';
import AudioListsContext from '../contexts/audio-list-context.jsx';
import ChannelCard from './channel-card';
import { EpisodeListItem } from './episode-list-item';
import { useFavorites, useRecentChannels, usePersistedState } from '../hooks/use-persisted-state';
import { useTranslation } from '../contexts/language-context';
import './library.css';

const Library = () => {
  const { setCurrentPage } = useContext(NavContext);
  const { t } = useTranslation();
  const { favorites } = useFavorites();
  const { recentChannels } = useRecentChannels();
  const { playlist } = useContext(AudioListsContext);
  const [savedPositions] = usePersistedState('podbbang_playback_positions', {});

  useEffect(() => setCurrentPage('Library'), [setCurrentPage]);

  const savedChannels = useMemo(
    () => favorites.filter(item => item.type === 'channel'),
    [favorites]
  );
  const savedEpisodes = useMemo(
    () => favorites.filter(item => item.type === 'episode'),
    [favorites]
  );
  const savedProgressEpisodes = useMemo(() => {
    const positions = savedPositions && typeof savedPositions === 'object' ? savedPositions : {};
    return playlist
      .filter(episode => Number(positions[episode.id]) > 0)
      .map(episode => ({ ...episode, resumePosition: Number(positions[episode.id]) }))
      .sort((a, b) => b.resumePosition - a.resumePosition);
  }, [playlist, savedPositions]);

  return (
    <div className="library-page">
      <header className="page-header">
        <h1 className="page-title">{t('Your Library')}</h1>
        <p className="page-subtitle">{t('Saved shows and episodes, with your recently visited channels.')}</p>
      </header>

      <section className="library-section" aria-labelledby="saved-channels-heading">
        <div className="library-section-heading">
          <h2 id="saved-channels-heading" className="section-title">{t('Favorite channels')}</h2>
          <span>{savedChannels.length}</span>
        </div>
        {savedChannels.length ? (
          <div className="channels-grid">
            {savedChannels.map(channel => <ChannelCard key={`channel-${channel.id}`} channel={channel} />)}
          </div>
        ) : <p className="library-empty">{t('Save a channel and it will show up here.')}</p>}
      </section>

      <section className="library-section" aria-labelledby="saved-episodes-heading">
        <div className="library-section-heading">
          <h2 id="saved-episodes-heading" className="section-title">{t('Favorite episodes')}</h2>
          <span>{savedEpisodes.length}</span>
        </div>
        {savedEpisodes.length ? (
          <div className="episodes-grid">
            {savedEpisodes.map(episode => (
              <EpisodeListItem
                key={`episode-${episode.id}`}
                {...episode}
                channelTitle={episode.channelTitle || 'Podbbang'}
              />
            ))}
          </div>
        ) : <p className="library-empty">{t('Save an episode to keep it close at hand.')}</p>}
      </section>

      <section className="library-section" aria-labelledby="continue-listening-heading">
        <div className="library-section-heading">
          <h2 id="continue-listening-heading" className="section-title">{t('Continue listening')}</h2>
          <span>{savedProgressEpisodes.length}</span>
        </div>
        {savedProgressEpisodes.length ? (
          <div className="episodes-grid">
            {savedProgressEpisodes.map(episode => (
              <div className="continue-episode" key={`progress-${episode.id}`}>
                <p className="continue-progress">{t('Resume at {time}', { time: formatTime(episode.resumePosition) })}</p>
                <EpisodeListItem
                  {...episode}
                  channelTitle={episode.channelTitle || 'Podbbang'}
                />
              </div>
            ))}
          </div>
        ) : <p className="library-empty">{t('Episodes with saved progress will appear here.')}</p>}
      </section>

      <section className="library-section" aria-labelledby="recent-channels-heading">
        <div className="library-section-heading">
          <h2 id="recent-channels-heading" className="section-title">{t('Recently visited')}</h2>
          <span>{recentChannels.length}</span>
        </div>
        {recentChannels.length ? (
          <div className="channels-grid">
            {recentChannels.map(channel => <ChannelCard key={`recent-${channel.id}`} channel={channel} />)}
          </div>
        ) : <p className="library-empty">{t('Channels you visit will appear here.')}</p>}
      </section>
    </div>
  );
};

const formatTime = (time) => {
  const seconds = Math.floor(Math.max(0, Number(time) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export default Library;
