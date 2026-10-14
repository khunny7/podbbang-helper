import { useEffect, useContext, useState } from 'react';
import NavContext from '../contexts/nav-context';
import { useChannelList } from '../hooks/use-channel-list';
import { useTranslation } from '../contexts/language-context';
import { usePersistedState } from '../hooks/use-persisted-state';
import ChannelCard from './channel-card';
import ViewModeToggle from './view-mode-toggle';
import './channel-list.css';

const ChannelList = () => {
  const { setCurrentPage } = useContext(NavContext);
  const { t } = useTranslation();
  const [viewMode, setViewMode] = usePersistedState('podbbang_channel_view_mode', 'card', false);
  const [searchInput, setSearchInput] = useState('');
  const {
    channels, currentPage, totalPages, totalChannels, loading, error, onPageChange, retry,
    rankingType, categoryId, onRankingTypeChange, onCategoryChange, onSearch, searchQuery,
  } = useChannelList();

  useEffect(() => {
    setCurrentPage('Discover');
  }, [setCurrentPage]);

  const handlePageClick = (page) => {
    onPageChange(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitSearch = event => {
    event.preventDefault();
    onSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    onSearch('');
  };

  return (
    <div className="channel-list-page">
      <div className="page-header">
        <div className="page-heading-copy">
          <h1 className="page-title">{t('Podcast rankings')}</h1>
          <p className="page-subtitle">
            {t('Find popular Podbbang shows by ranking period and category')}
          </p>
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <section className="ranking-controls" aria-label={t('Podcast ranking filters')}>
        <div className="ranking-periods" role="group" aria-label={t('Ranking period')}>
          <button
            type="button"
            className={`ranking-period ${rankingType === 'hourly' ? 'is-selected' : ''}`}
            aria-pressed={rankingType === 'hourly'}
            onClick={() => onRankingTypeChange('hourly')}
          >
            {t('Hourly')}
          </button>
          <button
            type="button"
            className={`ranking-period ${rankingType === 'weekly' ? 'is-selected' : ''}`}
            aria-pressed={rankingType === 'weekly'}
            onClick={() => onRankingTypeChange('weekly')}
          >
            {t('Weekly')}
          </button>
        </div>
        <label className="ranking-category-picker">
          <span className="sr-only">{t('Podcast category')}</span>
          <select
            aria-label={t('Podcast category')}
            value={String(categoryId)}
            onChange={event => onCategoryChange(event.target.value)}
          >
          {categories.map(category => (
            <option
              key={category.id}
              value={String(category.id)}
            >
              {t(category.label)}
            </option>
          ))}
          </select>
          <span className="ranking-category-chevron" aria-hidden="true">⌄</span>
        </label>
        <form className="channel-search" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="channel-search-input">{t('Search channels')}</label>
          <input
            id="channel-search-input"
            type="search"
            value={searchInput}
            onChange={event => setSearchInput(event.target.value)}
            placeholder={t('Search channels...')}
            autoComplete="off"
          />
          {(searchInput || searchQuery) && (
            <button
              className="channel-search-clear"
              type="button"
              onClick={clearSearch}
              aria-label={t('Clear search')}
              title={t('Clear search')}
            >
              ×
            </button>
          )}
          <button className="channel-search-submit" type="submit" aria-label={t('Search')} title={t('Search')}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m12.5 12.5 4 4" />
            </svg>
          </button>
        </form>
        {!loading && !error && (
          <p className="ranking-result-count" aria-live="polite">
            {searchQuery
              ? t('{count} results', { count: totalChannels.toLocaleString() })
              : t('{count} shows', { count: (totalChannels || channels.length).toLocaleString() })}
          </p>
        )}
      </section>

      {error && (
        <div className="empty-state" role="alert">
          <h3>{t('Channels could not be loaded')}</h3>
          <p>{t(error)}</p>
          <button className="btn btn-primary" type="button" onClick={retry}>{t('Try again')}</button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{t(searchQuery ? 'Searching channels...' : 'Loading Podbbang...')}</p>
        </div>
      )}

      {!loading && !error && channels.length > 0 ? (
        <>
          <div className={`channels-grid${viewMode === 'list' ? ' is-list-view' : ''}`}>
            {channels.map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                {t('Page {page} of {total}', { page: currentPage, total: totalPages })}
              </div>
              <div className="pagination-buttons">
                {/* Previous button */}
                {currentPage > 1 && (
                  <button
                    className="page-btn"
                    onClick={() => handlePageClick(currentPage - 1)}
                    aria-label={t('Go to previous page')}
                  >
                    ‹ {t('Previous')}
                  </button>
                )}

                {/* Page numbers */}
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  const startPage = Math.min(Math.max(1, currentPage - 4), Math.max(1, totalPages - 9));
                  const page = startPage + i;
                  
                  return (
                    <button
                      key={page}
                      className={`page-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageClick(page)}
                      aria-label={t('Go to page {page}', { page })}
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
                    aria-label={t('Go to next page')}
                  >
                    {t('Next')} ›
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : !loading && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🎧</div>
          <h3>{t(searchQuery ? 'No matching channels' : 'No shows found')}</h3>
          <p>{t(searchQuery
            ? 'No channels match your search. Try another search or clear it.'
            : 'There are no shows in this ranking yet. Try another period or category.')}</p>
          {searchQuery && (
            <button className="btn btn-ghost" type="button" onClick={clearSearch}>{t('Clear search')}</button>
          )}
        </div>
      ) : null}
    </div>
  );
};

const categories = [
  { id: 0, label: 'All' },
  { id: 1029, label: 'Culture' },
  { id: 1024, label: 'Entertainment' },
  { id: 1026, label: 'Current affairs' },
  { id: 1027, label: 'Economy' },
  { id: 1038, label: 'Business' },
  { id: 1039, label: 'Lifestyle & talk' },
  { id: 1025, label: 'Language learning' },
  { id: 1028, label: 'Books' },
  { id: 1031, label: 'Pop culture' },
  { id: 1030, label: 'Sports & leisure' },
  { id: 1032, label: 'Broadcasters' },
  { id: 1033, label: 'Religion' },
];

export default ChannelList;
