import { useEffect, useContext, React } from 'react';
import NavContext from '../contexts/nav-context';
import { useChannelList } from '../hooks/use-channel-list';
import { useNavigation } from '../hooks/use-navigation';
import './channel-list.css';

const ChannelList = (props) => {
  const { setCurrentPage } = useContext(NavContext);
  const { channels, next, currentPage, totalPages, loading, onPageChange } = useChannelList();
  const { onChannelSelected } = useNavigation();

  useEffect(() => {
    setCurrentPage('Discover');
  }, [setCurrentPage]);

  const handlePageClick = (page) => {
    onPageChange(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="channel-list-page">
      <div className="page-header">
        <h1 className="page-title">Discover Podbbang</h1>
        <p className="page-subtitle">
          Explore amazing Podbbang channels and discover your next favorite show
        </p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Podbbang...</p>
        </div>
      )}

      {!loading && channels.length > 0 ? (
        <>
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
                      alt={`${channel.title} Podbbang artwork`}
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
                    {channel.description || 'Discover episodes from this amazing Podbbang channel'}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <div className="pagination-buttons">
                {/* Previous button */}
                {currentPage > 1 && (
                  <button
                    className="page-btn"
                    onClick={() => handlePageClick(currentPage - 1)}
                    aria-label="Go to previous page"
                  >
                    ‹ Previous
                  </button>
                )}

                {/* Page numbers */}
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  const page = i + 1;
                  // Show pages around current page (5 before, 5 after)
                  const startPage = Math.max(1, currentPage - 5);
                  const endPage = Math.min(totalPages, currentPage + 5);
                  
                  if (page < startPage || page > endPage) return null;
                  
                  return (
                    <button
                      key={page}
                      className={`page-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageClick(page)}
                      aria-label={`Go to page ${page}`}
                    >
                      {page}
                    </button>
                  );
                }).filter(Boolean)}

                {/* Next button */}
                {currentPage < totalPages && (
                  <button
                    className="page-btn"
                    onClick={() => handlePageClick(currentPage + 1)}
                    aria-label="Go to next page"
                  >
                    Next ›
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : !loading ? (
        <div className="empty-state">
          <div className="empty-icon">🎧</div>
          <h3>No Podbbang Found</h3>
          <p>We're having trouble loading Podbbang channels right now. Please try again later.</p>
        </div>
      ) : null}
    </div>
  );
};

export default ChannelList;
