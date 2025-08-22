import { useEffect, useContext, React } from 'react';
import NavContext from '../contexts/nav-context';
import { useChannelList } from '../hooks/use-channel-list';
import { useNavigation } from '../hooks/use-navigation';
import './channel-list.css';

const ChannelList = (props) => {
  const { setCurrentPage } = useContext(NavContext);
  const { channels, next } = useChannelList();
  const { onChannelSelected } = useNavigation();

  useEffect(() => {
    setCurrentPage('Discover');
  }, [setCurrentPage]);

  return (
    <div className="channel-list-page">
      <div className="page-header">
        <h1 className="page-title">Discover Podcasts</h1>
        <p className="page-subtitle">
          Explore amazing podcast channels and discover your next favorite show
        </p>
      </div>

      {channels.length > 0 ? (
        <div className="channels-grid">
          {channels.map((channel) => (
            <article 
              key={channel.id} 
              className="channel-card card animate-fade-in"
              onClick={() => onChannelSelected(channel)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChannelSelected(channel);
                }
              }}
            >
              <div className="card-media">
                {channel.image ? (
                  <img 
                    src={channel.image} 
                    alt={`${channel.title} podcast artwork`}
                    loading="lazy"
                  />
                ) : (
                  <div className="placeholder-image">
                    <span className="placeholder-icon">🎧</span>
                  </div>
                )}
                <div className="card-overlay">
                  <button className="play-button" aria-label="View channel">
                    <span>▶</span>
                  </button>
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="card-title">{channel.title}</h3>
                <p className="card-description">
                  {channel.description || 'Discover episodes from this amazing podcast channel'}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎧</div>
          <h3>No Podcasts Found</h3>
          <p>We're having trouble loading podcast channels right now. Please try again later.</p>
        </div>
      )}

      {next && (
        <div className="load-more">
          <p className="load-more-text">{next}</p>
        </div>
      )}
    </div>
  );
};

export default ChannelList;
