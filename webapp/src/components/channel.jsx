import { useContext, useEffect, React } from 'react';
import NavContext from '../contexts/nav-context';
import { EpisodeListItem } from './episode-list-item';
import SearchBar from './search-bar';
import { useChannel } from '../hooks/use-channel';
import './channel.css';

const Channel = (props) => {
  const {
    episodes,
    curPage,
    totalPageCount,
    channelInfo,
    onPageChange,
    onSearch,
    loading,
  } = useChannel();

  const { setCurrentPage } = useContext(NavContext);

  useEffect(() => {
    if (channelInfo) {
      setCurrentPage(channelInfo.title);
    }
  }, [channelInfo, setCurrentPage]);

  const handlePageClick = (page) => {
    onPageChange({}, page);
  };

  return (
    <div className="channel-page">
      {channelInfo && (
        <div className="channel-header">
          <div className="channel-hero">
            {channelInfo.image && (
              <div className="channel-artwork">
                <img 
                  src={channelInfo.image} 
                  alt={`${channelInfo.title} artwork`}
                  loading="eager"
                />
              </div>
            )}
            <div className="channel-info">
              <h1 className="channel-title">{channelInfo.title}</h1>
              {channelInfo.description && (
                <p className="channel-description">{channelInfo.description}</p>
              )}
              <div className="channel-meta">
                <span className="episode-count">
                  {episodes.length} episodes available
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="channel-content">
        <div className="content-header">
          <SearchBar onSearch={onSearch} />
        </div>

        {loading ? (
          <div className="loading-episodes">
            <div className="loading-spinner"></div>
            <p>Loading episodes...</p>
          </div>
        ) : episodes.length > 0 ? (
          <div className="episodes-section">
            <h2 className="section-title">Episodes</h2>
            <div className="episodes-grid">
              {episodes.map((episode) => (
                <EpisodeListItem
                  key={episode.id}
                  title={episode.title}
                  description={episode.description}
                  id={episode.id}
                  channelId={episode.channel.id}
                  image={episode.image}
                  mediaUrl={episode.media.url}
                  updatedAt={episode.updatedAt}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-episodes">
            <div className="empty-icon">🎧</div>
            <h3>No Episodes Found</h3>
            <p>Try adjusting your search or check back later for new episodes.</p>
          </div>
        )}

        {totalPageCount > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Page {curPage} of {totalPageCount}
            </div>
            <div className="pagination-buttons">
              {Array.from({ length: Math.min(totalPageCount, 10) }, (_, i) => {
                let page;
                if (totalPageCount <= 10) {
                  page = i + 1;
                } else {
                  const start = Math.max(1, curPage - 4);
                  const end = Math.min(totalPageCount, start + 9);
                  page = start + i;
                  if (page > end) return null;
                }
                
                return (
                  <button
                    key={page}
                    className={`page-btn ${page === curPage ? 'active' : ''}`}
                    onClick={() => handlePageClick(page)}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </button>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Channel }