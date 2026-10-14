import { useContext, useEffect, useRef, useState, React } from 'react';
import { useParams } from 'react-router-dom';
import NavContext from '../contexts/nav-context';
import { getEpisodes } from '../data/repository';
import { EpisodeListItem } from './episode-list-item';
import SearchBar from './search-bar';
import { useFavorites, usePersistedState } from '../hooks/use-persisted-state';
import { useDownloadActions, useDownloadSelection } from '../contexts/downloads-context';
import { useTranslation } from '../contexts/language-context';
import ViewModeToggle from './view-mode-toggle';
import { useChannel } from '../hooks/use-channel';
import './channel.css';

const channelDownloadPageSize = 50;
const channelDownloadBatchSize = 500;
const maxChannelDownloadPages = 10000;

const Channel = (props) => {
  const { t } = useTranslation();
  const {
    episodes,
    curPage,
    totalPageCount,
    channelInfo,
    onPageChange,
    onSearch,
    loading,
    error,
    retry,
  } = useChannel();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [viewMode, setViewMode] = usePersistedState('podbbang_episode_view_mode', 'card', false);
  const downloads = useDownloadActions();
  const selection = useDownloadSelection();
  const { channelId: routeChannelId } = useParams();
  const [wholeChannelProgress, setWholeChannelProgress] = useState(null);
  const wholeChannelAbort = useRef(null);
  const channelIsFavorite = channelInfo ? isFavorite(channelInfo.id, 'channel') : false;

  const { setCurrentPage } = useContext(NavContext);

  useEffect(() => {
    if (channelInfo) {
      setCurrentPage(channelInfo.title);
    }
  }, [channelInfo, setCurrentPage]);

  useEffect(() => {
    if (!routeChannelId) return undefined;
    selection.startSelection(routeChannelId);
    return () => selection.clearSelection(routeChannelId);
  }, [routeChannelId, selection.startSelection, selection.clearSelection]);

  useEffect(() => {
    wholeChannelAbort.current?.abort();
    wholeChannelAbort.current = null;
    setWholeChannelProgress(null);
    return () => wholeChannelAbort.current?.abort();
  }, [routeChannelId]);

  const handlePageClick = (page) => {
    onPageChange(null, page);
  };

  const pageEpisodes = episodes.map(episode => ({
    id: episode.id,
    channelId: episode.channel?.id || channelInfo?.id || routeChannelId,
    title: episode.title,
    description: episode.description,
    image: episode.image,
    mediaUrl: episode.media?.url || '',
    channelTitle: episode.channel?.title || channelInfo?.title || 'Podbbang',
    channelImage: channelInfo?.image,
    updatedAt: episode.updatedAt,
  }));
  const allPageSelected = pageEpisodes.length > 0 && pageEpisodes.every(selection.isSelected);
  const selectPage = checked => selection.setPageSelection(routeChannelId, pageEpisodes, checked);
  const downloadSelected = () => downloads.enqueueMany(selection.selectedEpisodes)
    .then(() => selection.clearSelection(routeChannelId))
    .catch(() => {});

  const downloadWholeChannel = async () => {
    if (!channelInfo?.id || wholeChannelAbort.current) return;
    const controller = new AbortController();
    wholeChannelAbort.current = controller;
    downloads.clearError();
    setWholeChannelProgress({ phase: 'fetching', page: 1, totalPages: null });

    const ensureActive = () => {
      if (controller.signal.aborted) {
        const canceled = new Error('Download canceled.');
        canceled.name = 'AbortError';
        throw canceled;
      }
    };

    try {
      const firstPage = await getEpisodes(channelInfo.id, {
        pageIndex: 0,
        limit: channelDownloadPageSize,
        signal: controller.signal,
      });
      if (!Array.isArray(firstPage?.data)) {
        throw new Error('Podbbang returned an unexpected episode list. Please try again.');
      }

      const rawCount = firstPage?.summary?.totalCount ?? firstPage?.summary?.total_count;
      const parsedCount = Number(rawCount);
      const totalPages = rawCount !== undefined && rawCount !== null && Number.isFinite(parsedCount)
        ? Math.max(1, Math.ceil(parsedCount / channelDownloadPageSize))
        : null;
      if (totalPages > maxChannelDownloadPages) {
        throw new Error('This channel has too many episodes to queue at once.');
      }

      const allEpisodes = [];
      let completedPageScan = totalPages !== null;
      for (let pageIndex = 0; pageIndex < (totalPages ?? maxChannelDownloadPages); pageIndex += 1) {
        ensureActive();
        const response = pageIndex === 0
          ? firstPage
          : await getEpisodes(channelInfo.id, {
            pageIndex,
            limit: channelDownloadPageSize,
            signal: controller.signal,
          });
        if (!Array.isArray(response?.data)) {
          throw new Error('Podbbang returned an unexpected episode list. Please try again.');
        }
        allEpisodes.push(...response.data);
        setWholeChannelProgress({
          phase: 'fetching',
          page: pageIndex + 1,
          totalPages,
          found: allEpisodes.length,
        });
        if (totalPages === null && response.data.length < channelDownloadPageSize) {
          completedPageScan = true;
          break;
        }
      }
      if (!completedPageScan) throw new Error('This channel has too many episodes to queue at once.');

      ensureActive();
      const uniqueEpisodes = Array.from(new Map(
        allEpisodes.filter(episode => episode?.id != null).map(episode => [String(episode.id), episode])
      ).values());
      const channelTitle = channelInfo.title || 'Podbbang';
      let unavailableCount = 0;
      const downloadableEpisodes = uniqueEpisodes.flatMap(episode => {
        const mediaUrl = episode.media?.url;
        let mediaProtocol;
        try { mediaProtocol = new URL(mediaUrl).protocol; }
        catch { mediaProtocol = ''; }
        if (!mediaUrl || !['http:', 'https:'].includes(mediaProtocol)) {
          unavailableCount += 1;
          return [];
        }
        return [{
          id: episode.id,
          channelId: episode.channel?.id || channelInfo.id || routeChannelId,
          title: episode.title,
          channelTitle: episode.channel?.title || channelTitle,
          image: episode.image || channelInfo.image || '',
          mediaUrl,
        }];
      });

      if (downloadableEpisodes.length === 0) {
        setWholeChannelProgress({ phase: 'empty' });
        return;
      }

      setWholeChannelProgress({ phase: 'queueing', processed: 0, total: downloadableEpisodes.length });
      let processed = 0;
      for (let start = 0; start < downloadableEpisodes.length; start += channelDownloadBatchSize) {
        ensureActive();
        const batch = downloadableEpisodes.slice(start, start + channelDownloadBatchSize);
        await downloads.enqueueMany(batch);
        processed += batch.length;
        setWholeChannelProgress({
          phase: 'queueing',
          processed,
          total: downloadableEpisodes.length,
          unavailableCount,
        });
      }

      setWholeChannelProgress({
        phase: 'complete',
        count: processed,
        unavailableCount,
      });
    } catch (requestError) {
      if (wholeChannelAbort.current !== controller) return;
      setWholeChannelProgress(controller.signal.aborted || requestError.name === 'AbortError'
        ? { phase: 'canceled' }
        : { phase: 'error', message: requestError.message });
    } finally {
      if (wholeChannelAbort.current === controller) wholeChannelAbort.current = null;
    }
  };

  const cancelWholeChannelDownload = () => wholeChannelAbort.current?.abort();
  const wholeChannelBusy = ['fetching', 'queueing'].includes(wholeChannelProgress?.phase);
  let wholeChannelStatus = null;
  if (wholeChannelProgress?.phase === 'fetching') {
    wholeChannelStatus = wholeChannelProgress.totalPages
      ? t('Fetching channel episodes: page {page} of {total}', {
        page: wholeChannelProgress.page,
        total: wholeChannelProgress.totalPages,
      })
      : t('Fetching channel episodes: page {page}', { page: wholeChannelProgress.page });
  } else if (wholeChannelProgress?.phase === 'queueing') {
    wholeChannelStatus = t('Adding episodes to the download queue: {processed} of {total}', {
      processed: wholeChannelProgress.processed,
      total: wholeChannelProgress.total,
    });
  } else if (wholeChannelProgress?.phase === 'complete') {
    wholeChannelStatus = t('Prepared {count} channel episodes for download. Already queued or downloaded episodes are skipped.', {
      count: wholeChannelProgress.count,
    });
    if (wholeChannelProgress.unavailableCount) {
      wholeChannelStatus += ` ${t('{count} episodes without audio were skipped.', { count: wholeChannelProgress.unavailableCount })}`;
    }
  } else if (wholeChannelProgress?.phase === 'canceled') {
    wholeChannelStatus = t('Channel download canceled. Items already added remain in the queue.');
  } else if (wholeChannelProgress?.phase === 'empty') {
    wholeChannelStatus = t('This channel has no downloadable episodes.');
  } else if (wholeChannelProgress?.phase === 'error') {
    wholeChannelStatus = `${t('Channel download failed')}: ${t(wholeChannelProgress.message)}`;
  }

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
                  {totalPageCount === 1
                    ? t('{count} episodes on this page', { count: episodes.length })
                    : t('Page {page} of {total}', { page: curPage, total: totalPageCount })}
                </span>
                <div className="channel-header-actions">
                  {downloads.isNative && <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={downloadWholeChannel}
                    disabled={!channelInfo.id || wholeChannelBusy}
                  >
                    {t('Download whole channel')}
                  </button>}
                  <button
                    type="button"
                    className={`btn ${channelIsFavorite ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => channelIsFavorite
                      ? removeFavorite(channelInfo.id, 'channel')
                      : addFavorite({ ...channelInfo, type: 'channel' })}
                    aria-pressed={channelIsFavorite}
                  >
                    {channelIsFavorite ? `♥ ${t('Saved')}` : `♡ ${t('Save channel')}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="channel-content">
        {downloads.isNative && wholeChannelProgress && wholeChannelStatus && (
          <div className={`download-message channel-download-status${wholeChannelProgress.phase === 'error' ? ' download-message-error' : ''}`}
            role={wholeChannelProgress.phase === 'error' ? 'alert' : 'status'}>
            <span>{wholeChannelStatus}</span>
            {wholeChannelBusy ? (
              <button type="button" className="channel-download-cancel" onClick={cancelWholeChannelDownload}>
                {t('Cancel')}
              </button>
            ) : (
              <button type="button" onClick={() => setWholeChannelProgress(null)} aria-label={t('Dismiss message')}>×</button>
            )}
          </div>
        )}
        <div className="content-header">
          <SearchBar onSearch={onSearch} />
        </div>

        {error ? (
          <div className="empty-episodes" role="alert">
            <h3>{t('Episodes could not be loaded')}</h3>
            <p>{t(error)}</p>
            <button type="button" className="btn btn-primary" onClick={retry}>{t('Try again')}</button>
          </div>
        ) : loading ? (
          <div className="loading-episodes">
            <div className="loading-spinner"></div>
            <p>{t('Loading episodes...')}</p>
          </div>
        ) : episodes.length > 0 ? (
          <div className="episodes-section">
            <div className="episodes-heading">
              <h2 className="section-title">{t('Episodes')}</h2>
              <div className="episodes-heading-tools">
                <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                {downloads.isNative && <div className="episode-selection-actions">
                  <label className="select-page-control">
                    <input type="checkbox" checked={allPageSelected} onChange={event => selectPage(event.target.checked)} />
                    {t('Select this page')}
                  </label>
                  <span>{t('{count} selected', { count: selection.selectedCount })}</span>
                  <button type="button" className="btn btn-primary" disabled={selection.selectedCount === 0} onClick={downloadSelected}>
                    {selection.selectedCount
                      ? t('Download selected ({count})', { count: selection.selectedCount })
                      : t('Download selected')}
                  </button>
                </div>}
              </div>
            </div>
            {downloads.error && <div className="download-message download-message-error" role="alert">
              <span>{t(downloads.error)}</span><button type="button" onClick={downloads.clearError} aria-label={t('Dismiss message')}>×</button>
            </div>}
            <div className={`episodes-grid${viewMode === 'list' ? ' is-list-view' : ''}`}>
              {episodes.map((episode) => (
                <EpisodeListItem
                  key={episode.id}
                  title={episode.title}
                  description={episode.description}
                  id={episode.id}
                  channelId={episode.channel?.id || channelInfo?.id}
                  channelTitle={episode.channel?.title || channelInfo?.title}
                  channelImage={channelInfo?.image}
                  image={episode.image}
                  mediaUrl={episode.media?.url || ''}
                  updatedAt={episode.updatedAt}
                  selectable={downloads.isNative}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-episodes">
            <div className="empty-icon">🎧</div>
            <h3>{t('No Episodes Found')}</h3>
            <p>{t('Try adjusting your search or check back later for new episodes.')}</p>
          </div>
        )}

        {!error && totalPageCount > 1 && (
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
                    aria-label={t('Go to page {page}', { page })}
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
