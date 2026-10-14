import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/use-persisted-state';
import { useTranslation } from '../contexts/language-context';
import fallbackArtwork from '../assets/fallback-podcast.svg';
import './favorite-toggle.css';

const ChannelCard = ({ channel }) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { language, t } = useTranslation();
  const id = channel.id;
  const favorite = isFavorite(id, 'channel');
  const subscriberCount = Number(channel.subscribeCount);
  const subscriberLabel = Number.isFinite(subscriberCount) && channel.subscribeCount !== null
    ? t('{count} subscribers', {
      count: new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(subscriberCount),
    })
    : channel.subscribeCountText;
  const updatedLabel = channel.updatedAtText === '오늘' ? t('Today') : channel.updatedAtText;

  return (
    <article className="channel-card card">
      <Link
        className="channel-card-link"
        to={`/channel/${encodeURIComponent(id)}`}
        aria-label={t('Open {title}', { title: channel.title })}
      >
        <div className="card-media">
          {channel.image ? (
            <img
              src={channel.image}
              alt={t('{title} Podbbang artwork', { title: channel.title })}
              loading="lazy"
              onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackArtwork; }}
            />
          ) : (
            <div className="placeholder-image"><span className="placeholder-icon" aria-hidden="true">🎧</span></div>
          )}
          {Number.isFinite(Number(channel.rank)) && Number(channel.rank) > 0 && (
            <span className="channel-rank-badge" aria-label={t('Rank {rank}', { rank: channel.rank })}>
              #{channel.rank}
            </span>
          )}
          {channel.onAir === true && <span className="channel-live-badge">{t('LIVE')}</span>}
          <div className="card-overlay" aria-hidden="true">
            <span className="play-button">▶</span>
          </div>
        </div>
        <div className="card-body">
          <h3 className="card-title">{channel.title}</h3>
          <p className="card-description">
            {channel.description || t('Discover episodes from this Podbbang channel')}
          </p>
          {(subscriberLabel || updatedLabel || channel.rankChange !== undefined) && (
            <div className="channel-ranking-details" aria-label={t('Ranking details')}>
              {subscriberLabel && <span>{subscriberLabel}</span>}
              {updatedLabel && <span>{t('Updated {date}', { date: updatedLabel })}</span>}
              {channel.rankChange !== undefined && channel.rankChange !== null && (
                <span className="channel-rank-change">
                  {Number(channel.rankChange) === 0
                    ? t('No rank change')
                    : t('Rank change {change}', {
                      change: `${Number(channel.rankChange) > 0 ? '+' : ''}${channel.rankChange}`,
                    })}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      <button
        type="button"
        className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`}
        onClick={() => favorite
          ? removeFavorite(id, 'channel')
          : addFavorite({ ...channel, type: 'channel' })}
        aria-pressed={favorite}
        aria-label={favorite
          ? t('Remove {title} from favorites', { title: channel.title })
          : t('Add {title} to favorites', { title: channel.title })}
      >
        {favorite ? '♥' : '♡'}
      </button>
    </article>
  );
};

export default ChannelCard;
