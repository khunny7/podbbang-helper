import React, { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import AudioListsContext from '../contexts/audio-list-context.jsx';
import { useDownloadActions, useDownloadJob, useDownloadSelection } from '../contexts/downloads-context';
import { useFavorites } from '../hooks/use-persisted-state';
import { useTranslation } from '../contexts/language-context';
import fallbackArtwork from '../assets/fallback-podcast.svg';
import './episode-list-item.css';
import './favorite-toggle.css';

const EpisodeListItem = (props) => {
  const {
    id,
    title,
    description,
    image = null,
    mediaUrl,
    updatedAt = null,
    channelId,
    channelTitle = 'Podbbang',
    channelImage = null,
    selectable = false,
  } = props;

  const { addToPlaylist, playEpisode } = useContext(AudioListsContext);
  const { language, t } = useTranslation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const downloads = useDownloadActions();
  const downloadSelection = useDownloadSelection();
  const favorite = isFavorite(id, 'episode');
  const downloadJob = useDownloadJob({ id, channelId });
  const selected = selectable && downloadSelection.isSelected({ id, channelId });

  const episode = {
    id,
    type: 'episode',
    title,
    description,
    image,
    mediaUrl,
    updatedAt,
    channelId,
    channelTitle,
  };

  const onPlayWithInfo = useCallback(() => {
    playEpisode(episode);
  }, [playEpisode, id, title, description, image, mediaUrl, updatedAt, channelId, channelTitle]);

  const onAddAudioWithInfo = useCallback(() => {
    addToPlaylist(episode);
  }, [addToPlaylist, id, title, description, image, mediaUrl, updatedAt, channelId, channelTitle]);

  const onDownload = () => {
    if (downloadJob?.status === 'completed' && !downloadJob.fileMissing) {
      downloads.showFile(downloadJob.id).catch(() => {});
    } else {
      // Re-enqueue with the current API media URL so expired signed links refresh.
      downloads.enqueue(episode).catch(() => {});
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <article className={`episode-card card${selected ? ' is-selected-for-download' : ''}`}>
      <div className="card-media">
        {image ? (
          <img 
            src={image} 
              alt={t('{title} episode artwork', { title })}
            loading="lazy"
            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackArtwork; }}
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
            disabled={!mediaUrl}
            aria-label={t('Play {title}', { title })}
          >
            <span className="play-icon">▶</span>
          </button>
        </div>
        <button
          type="button"
          className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`}
          onClick={() => favorite
            ? removeFavorite(id, 'episode')
            : addFavorite({ ...episode, image: image || channelImage })}
          aria-pressed={favorite}
          aria-label={favorite
            ? t('Remove {title} from favorites', { title })
            : t('Add {title} to favorites', { title })}
        >
          {favorite ? '♥' : '♡'}
        </button>
        {selectable && <label className="episode-select-download">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={() => downloadSelection.toggleSelected(episode)}
            aria-label={t('Select {title} for download', { title })}
          />
          <span>{t('Select')}</span>
        </label>}
      </div>
      
      <div className="card-body">
        <div className="episode-meta">
          {updatedAt && (
            <time className="episode-date" dateTime={updatedAt}>
              {formatDate(updatedAt)}
            </time>
          )}
        </div>
        
        <h3 className="card-title" title={title}>{title}</h3>
        
        {description && (
          <p className="card-description" title={description}>{description}</p>
        )}
      </div>
      
      <div className="card-actions">
        <button 
          className="btn btn-primary action-btn"
          onClick={onPlayWithInfo}
          disabled={!mediaUrl}
            aria-label={t('Play {title}', { title })}
            title={t('Play')}
        >
          <span className="btn-icon">▶</span>
          <span className="action-label">{t('Play')}</span>
        </button>
        
        <button 
          className="btn btn-ghost action-btn"
          onClick={onAddAudioWithInfo}
          disabled={!mediaUrl}
          aria-label={t('Add {title} to queue', { title })}
          title={t('Queue')}
        >
          <span className="btn-icon">+</span>
          <span className="action-label">{t('Queue')}</span>
        </button>
        
        {mediaUrl && downloads.isNative ? <button
          type="button"
          className="btn btn-ghost action-btn"
          onClick={onDownload}
          disabled={['queued', 'downloading'].includes(downloadJob?.status)}
          aria-label={`${downloadActionText(downloadJob, t)} ${title}`}
          title={downloadJob?.status === 'completed'
            ? t('Saved to {folder}', { folder: downloadJob.folder })
            : downloadActionText(downloadJob, t)}
        >
          <span className="btn-icon">⬇</span>
          <span className="action-label">{downloadActionText(downloadJob, t)}</span>
        </button> : mediaUrl ? <a
          className="btn btn-ghost action-btn"
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={t('Open audio for {title}', { title })}
          title={t('Open audio')}
        ><span className="btn-icon">↗</span><span className="action-label">{t('Open audio')}</span></a> : <button className="btn btn-ghost action-btn" type="button" disabled title={t('Episode audio is unavailable')}>
          <span className="btn-icon">×</span><span className="action-label">{t('Unavailable')}</span>
        </button>}
      </div>
    </article>
  );
};

EpisodeListItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  image: PropTypes.string,
  mediaUrl: PropTypes.string,
  updatedAt: PropTypes.string,
  channelId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  channelTitle: PropTypes.string,
  channelImage: PropTypes.string,
  selectable: PropTypes.bool,
};

const downloadActionText = (job, t) => {
  if (!job) return t('Download');
  if (job.status === 'queued') return t('Queued');
  if (job.status === 'downloading') return t('Downloading');
  if (job.status === 'completed') return job.fileMissing ? t('Download again') : t('Downloaded');
  if (['failed', 'canceled', 'interrupted'].includes(job.status)) return t('Retry');
  return t('Download');
};

export { EpisodeListItem }
