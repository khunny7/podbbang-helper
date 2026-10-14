import { useContext, useEffect } from 'react';
import NavContext from '../contexts/nav-context';
import { useDownloads } from '../contexts/downloads-context';
import { useTranslation } from '../contexts/language-context';
import './downloads.css';

const Downloads = () => {
  const { setCurrentPage } = useContext(NavContext);
  const { t } = useTranslation();
  const {
    jobs, folder, maxParallel = 3, isNative, error, notice, clearError, clearNotice,
    chooseFolder, cancel, retry, showFile, clearFinished,
  } = useDownloads();

  useEffect(() => setCurrentPage('Downloads'), [setCurrentPage]);

  const orderedJobs = [...jobs].sort((a, b) => {
    const aActive = ['queued', 'downloading'].includes(a.status);
    const bActive = ['queued', 'downloading'].includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (a.status === 'queued' && b.status === 'queued') return String(a.queuedAt || a.createdAt).localeCompare(String(b.queuedAt || b.createdAt));
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
  const queued = orderedJobs.filter(job => job.status === 'queued');
  const active = orderedJobs.filter(job => job.status === 'downloading');
  const finished = jobs.filter(job => ['completed', 'failed', 'canceled'].includes(job.status));

  return (
    <div className="downloads-page">
      <header className="downloads-header">
        <div>
          <h1 className="page-title">{t('Downloads')}</h1>
          <p className="page-subtitle">
            {isNative
              ? t('{active} downloading · {queued} waiting · Up to {max} at once', {
                active: active.length, queued: queued.length, max: maxParallel,
              })
              : t('Managed downloads and folder selection are available in the Windows app.')}
          </p>
        </div>
        {isNative && <button type="button" className="btn btn-primary" onClick={() => chooseFolder().catch(() => {})}>
          {t('Choose folder')}
        </button>}
      </header>

      {error && <div className="download-message download-message-error" role="alert">
        <span>{t(error)}</span><button type="button" onClick={clearError} aria-label={t('Dismiss message')}>×</button>
      </div>}
      {notice && <div className="download-message" role="status">
        <span>{t(notice)}</span><button type="button" onClick={clearNotice} aria-label={t('Dismiss message')}>×</button>
      </div>}

      {isNative && <section className="download-folder" aria-label={t('Download destination')}>
        <span className="download-folder-icon" aria-hidden="true">📁</span>
        <div><strong>{t('Save new downloads to')}</strong><span>{folder || t('Loading folder…')}</span></div>
      </section>}

      {!isNative ? <section className="download-empty">
        <div className="download-empty-icon" aria-hidden="true">⬇</div>
        <h2>{t('Use the Windows app for managed downloads')}</h2>
        <p>{t('The browser version cannot keep a background queue or choose a download folder for the app.')}</p>
      </section> : orderedJobs.length === 0 ? <section className="download-empty">
        <div className="download-empty-icon" aria-hidden="true">⬇</div>
        <h2>{t('No downloads yet')}</h2>
        <p>{t('Choose Download on an episode, or select several episodes in a channel.')}</p>
      </section> : <section className="download-list" aria-label={t('Download queue and history')}>
        {orderedJobs.map(job => <DownloadRow
          key={job.id}
          job={job}
          queuePosition={job.status === 'queued' ? queued.findIndex(item => item.id === job.id) + 1 : null}
          onCancel={() => cancel(job.id).catch(() => {})}
          onRetry={() => retry(job.id).catch(() => {})}
          onShow={() => showFile(job.id).catch(() => {})}
          t={t}
        />)}
      </section>}

      {isNative && finished.length > 0 && <div className="download-history-actions">
        <span>{t('{count} finished items', { count: finished.length })}</span>
        <button type="button" className="btn btn-ghost" onClick={() => clearFinished().catch(() => {})}>
          {t('Clear finished history')}
        </button>
      </div>}
    </div>
  );
};

const DownloadRow = ({ job, queuePosition, onCancel, onRetry, onShow, t }) => {
  const hasTotal = Number(job.totalBytes) > 0;
  const percent = hasTotal ? Math.min(100, Math.floor((job.bytesReceived / job.totalBytes) * 100)) : null;
  const statusText = {
    queued: queuePosition ? t('Waiting · #{position} in queue', { position: queuePosition }) : t('Waiting'),
    downloading: t('Downloading'),
    completed: job.fileMissing ? t('Downloaded file missing') : t('Completed'),
    failed: t('Failed'),
    canceled: t('Canceled'),
    interrupted: t('Interrupted'),
  }[job.status] || t(job.status);

  return <article className={`download-row download-status-${job.status}`}>
    <div className="download-artwork">
      {job.image ? <img src={job.image} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /> : '🎧'}
    </div>
    <div className="download-main">
      <div className="download-row-heading">
        <div className="download-row-title">
          <strong title={job.title}>{job.title}</strong>
          <span>{job.channelTitle}</span>
        </div>
        <span className={`download-status-pill status-${job.status}`}>{statusText}</span>
      </div>
      {job.status === 'downloading' && <div className="download-progress-block">
        {hasTotal
          ? <progress aria-label={`${t('Downloading')} ${job.title}`} value={percent} max="100" />
          : <progress className="progress-indeterminate" aria-label={`${t('Downloading')} ${job.title}`} />}
        <div className="download-progress-meta">
          <span>{hasTotal
            ? t('{received} of {total} · {percent}%', {
              received: formatBytes(job.bytesReceived), total: formatBytes(job.totalBytes), percent,
            })
            : `${formatBytes(job.bytesReceived)} ${t('downloaded · total size unknown')}`}</span>
          {job.speedBytesPerSecond > 0 && <span>{formatBytes(job.speedBytesPerSecond)}/s{hasTotal ? ` · ${formatDuration((job.totalBytes - job.bytesReceived) / job.speedBytesPerSecond, t)}` : ''}</span>}
        </div>
      </div>}
      {job.status === 'failed' && <p className="download-job-error">{t(job.error || 'The download failed.')}</p>}
      {job.status === 'interrupted' && <p className="download-job-error">{t('The app closed before this download finished. Restart it to try again.')}</p>}
      {job.status === 'completed' && job.folder && <p className="download-destination">{t('Saved to {folder}', { folder: job.folder })}</p>}
    </div>
    <div className="download-row-actions">
      {['queued', 'downloading'].includes(job.status) && <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('Cancel')}</button>}
      {['failed', 'canceled', 'interrupted'].includes(job.status) && <button type="button" className="btn btn-ghost" onClick={onRetry}>{t('Retry')}</button>}
      {job.status === 'completed' && !job.fileMissing && <button type="button" className="btn btn-ghost" onClick={onShow}>{t('Show file')}</button>}
      {job.status === 'completed' && job.fileMissing && <button type="button" className="btn btn-ghost" onClick={onRetry}>{t('Download again')}</button>}
    </div>
  </article>;
};

const formatBytes = bytes => {
  const amount = Math.max(0, Number(bytes) || 0);
  if (amount < 1024) return `${Math.round(amount)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = amount / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
};

const formatDuration = (seconds, t) => {
  const amount = Math.max(0, Math.ceil(Number(seconds) || 0));
  if (amount < 60) return t('about {amount}s left', { amount });
  if (amount < 3600) return t('about {amount}m left', { amount: Math.ceil(amount / 60) });
  return t('about {hours}h {minutes}m left', {
    hours: Math.floor(amount / 3600), minutes: Math.ceil((amount % 3600) / 60),
  });
};

export default Downloads;
