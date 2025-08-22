import { useContext, useCallback, React } from 'react';
import PropTypes from 'prop-types';
import NavContext from '../contexts/nav-context';
import { onPlay, onAddAudio } from '../hooks/use-audio-control';
import './episode-list-item.css';

const EpisodeListItem = (props) => {
  const {
    title,
    description,
    image,
    mediaUrl,
    updatedAt,
  } = props;

  const { currentPage } = useContext(NavContext);

  const onPlayWithInfo = useCallback(() => {
    return onPlay(
      image,
      mediaUrl,
      title,
      currentPage,
    );
  }, [image, mediaUrl, title, currentPage]);

  const onAddAudioWithInfo = useCallback(() => {
    return onAddAudio(
      image,
      mediaUrl,
      title,
      currentPage,
    );
  }, [image, mediaUrl, title, currentPage]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="episode-card card">
      <div className="card-media">
        {image ? (
          <img 
            src={image} 
            alt={`${title} episode artwork`}
            loading="lazy"
          />
        ) : (
          <div className="placeholder-artwork">
            <span className="placeholder-icon">🎧</span>
          </div>
        )}
        <div className="media-overlay">
          <button 
            className="play-overlay-btn"
            onClick={onPlayWithInfo}
            aria-label={`Play ${title}`}
          >
            <span className="play-icon">▶</span>
          </button>
        </div>
      </div>
      
      <div className="card-body">
        <div className="episode-meta">
          {updatedAt && (
            <time className="episode-date" dateTime={updatedAt}>
              {formatDate(updatedAt)}
            </time>
          )}
        </div>
        
        <h3 className="card-title">{title}</h3>
        
        {description && (
          <p className="card-description">{description}</p>
        )}
      </div>
      
      <div className="card-actions">
        <button 
          className="btn btn-primary action-btn"
          onClick={onPlayWithInfo}
          aria-label={`Play ${title}`}
        >
          <span className="btn-icon">▶</span>
          <span>Play</span>
        </button>
        
        <button 
          className="btn btn-ghost action-btn"
          onClick={onAddAudioWithInfo}
          aria-label={`Add ${title} to queue`}
        >
          <span className="btn-icon">+</span>
          <span>Queue</span>
        </button>
        
        <a 
          className="btn btn-ghost action-btn"
          href={mediaUrl}
          download
          target="_blank"
          rel="noreferrer"
          aria-label={`Download ${title}`}
        >
          <span className="btn-icon">⬇</span>
          <span>Download</span>
        </a>
      </div>
    </article>
  );
};

EpisodeListItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  image: PropTypes.string,
  mediaUrl: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
};

EpisodeListItem.defaultProps = {
  image: null,
  updatedAt: null,
}

export { EpisodeListItem }