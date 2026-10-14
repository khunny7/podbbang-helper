import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react';

const DownloadsContext = createContext(null);
const DownloadActionsContext = createContext(null);
const DownloadSelectionContext = createContext(null);
const DownloadSummaryContext = createContext(0);
const DownloadJobStoreContext = createContext(null);
const nativeDownloads = () => (typeof window !== 'undefined' ? window.electronAPI?.downloads : null);
const episodeKey = episode => `${episode.channelId}:${episode.id}`;

const DownloadsProvider = ({ children }) => {
  const [state, setState] = useState({ revision: 0, folder: '', maxParallel: 3, jobs: [] });
  const [selection, setSelection] = useState({ channelId: null, episodes: {} });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const stateRef = useRef(state);
  const revisionRef = useRef(0);
  const jobListeners = useRef(new Map());

  const applySnapshot = useCallback(snapshot => {
    if (snapshot.revision < revisionRef.current) return;
    revisionRef.current = snapshot.revision;
    const previousJobs = latestJobsByKey(stateRef.current.jobs);
    const nextJobs = latestJobsByKey(snapshot.jobs || []);
    stateRef.current = snapshot;
    setState(snapshot);
    const keys = new Set([...previousJobs.keys(), ...nextJobs.keys()]);
    keys.forEach(key => {
      if (jobSignature(previousJobs.get(key)) === jobSignature(nextJobs.get(key))) return;
      jobListeners.current.get(key)?.forEach(listener => listener());
    });
  }, []);

  useEffect(() => {
    const api = nativeDownloads();
    if (!api) return undefined;
    const unsubscribe = api.onUpdate(update => {
      if (update?.message) setNotice(update.message);
      if (update?.state) applySnapshot(update.state);
    });
    api.getState().then(snapshot => {
      applySnapshot(snapshot);
    }).catch(requestError => setError(requestError.message || 'Could not load download status.'));
    return unsubscribe;
  }, [applySnapshot]);

  const run = useCallback(async action => {
    setError('');
    const api = nativeDownloads();
    if (!api) {
      const message = 'Managed downloads are available in the Windows app.';
      setError(message);
      throw new Error(message);
    }
    try {
      const result = await action(api);
      if (result?.jobs && result.revision >= stateRef.current.revision) applySnapshot(result);
      return result;
    } catch (requestError) {
      setError(requestError.message || 'The download action could not be completed.');
      throw requestError;
    }
  }, [applySnapshot]);

  const enqueue = useCallback(episode => run(api => api.enqueue(toDownloadRecord(episode))), [run]);
  const enqueueMany = useCallback(episodes => run(api => api.enqueueMany(episodes.map(toDownloadRecord))), [run]);
  const cancel = useCallback(jobId => run(api => api.cancel(jobId)), [run]);
  const retry = useCallback(jobId => run(api => api.retry(jobId)), [run]);
  const chooseFolder = useCallback(() => run(api => api.chooseFolder()), [run]);
  const showFile = useCallback(jobId => run(api => api.showFile(jobId)), [run]);
  const clearFinished = useCallback(() => run(api => api.clearFinished()), [run]);
  const clearError = useCallback(() => setError(''), []);
  const clearNotice = useCallback(() => setNotice(''), []);

  const startSelection = useCallback(channelId => {
    setSelection(current => current.channelId === String(channelId)
      ? current
      : { channelId: String(channelId), episodes: {} });
  }, []);
  const toggleSelected = useCallback(episode => {
    const key = episodeKey(episode);
    setSelection(current => {
      const episodes = { ...current.episodes };
      if (episodes[key]) delete episodes[key];
      else episodes[key] = toDownloadRecord(episode);
      return { channelId: String(episode.channelId), episodes };
    });
  }, []);
  const setPageSelection = useCallback((channelId, episodes, selected) => {
    setSelection(current => {
      const next = current.channelId === String(channelId) ? { ...current.episodes } : {};
      episodes.forEach(episode => {
        const key = episodeKey(episode);
        if (selected) next[key] = toDownloadRecord(episode);
        else delete next[key];
      });
      return { channelId: String(channelId), episodes: next };
    });
  }, []);
  const clearSelection = useCallback(channelId => {
    setSelection(current => current.channelId === String(channelId)
      ? { channelId: null, episodes: {} }
      : current);
  }, []);

  const subscribeJob = useCallback((key, listener) => {
    if (!jobListeners.current.has(key)) jobListeners.current.set(key, new Set());
    const listeners = jobListeners.current.get(key);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) jobListeners.current.delete(key);
    };
  }, []);
  const getJobSnapshot = useCallback(key => latestJobsByKey(stateRef.current.jobs).get(key), []);
  const jobStore = useMemo(() => ({ subscribeJob, getJobSnapshot }), [subscribeJob, getJobSnapshot]);

  const actions = useMemo(() => ({
    error, notice, clearError, clearNotice, enqueue, enqueueMany, cancel, retry,
    chooseFolder, showFile, clearFinished, isNative: Boolean(nativeDownloads()),
  }), [error, notice, clearError, clearNotice, enqueue, enqueueMany, cancel, retry, chooseFolder, showFile, clearFinished]);
  const selectionValue = useMemo(() => ({
    selectedEpisodes: Object.values(selection.episodes),
    selectedCount: Object.keys(selection.episodes).length,
    isSelected: episode => Boolean(selection.episodes[episodeKey(episode)]),
    toggleSelected, setPageSelection, startSelection, clearSelection,
  }), [selection, toggleSelected, setPageSelection, startSelection, clearSelection]);
  const pendingCount = state.jobs.filter(job => ['queued', 'downloading'].includes(job.status)).length;
  const value = useMemo(() => ({
    ...state, ...actions, ...selectionValue,
    getJob: episode => latestJobsByKey(state.jobs).get(episodeKey(episode)),
  }), [state, actions, selectionValue]);

  return <DownloadJobStoreContext.Provider value={jobStore}>
    <DownloadSummaryContext.Provider value={pendingCount}>
      <DownloadSelectionContext.Provider value={selectionValue}>
        <DownloadActionsContext.Provider value={actions}>
          <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>
        </DownloadActionsContext.Provider>
      </DownloadSelectionContext.Provider>
    </DownloadSummaryContext.Provider>
  </DownloadJobStoreContext.Provider>;
};

const toDownloadRecord = episode => ({
  episodeId: episode.episodeId ?? episode.id,
  id: episode.episodeId ?? episode.id,
  channelId: episode.channelId,
  title: episode.title,
  channelTitle: episode.channelTitle || 'Podbbang',
  image: episode.image || episode.channelImage || '',
  mediaUrl: episode.mediaUrl || episode.media?.url || '',
});

const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (!context) throw new Error('useDownloads must be used inside DownloadsProvider.');
  return context;
};

const useDownloadActions = () => {
  const context = useContext(DownloadActionsContext);
  if (!context) throw new Error('useDownloadActions must be used inside DownloadsProvider.');
  return context;
};

const useDownloadSelection = () => {
  const context = useContext(DownloadSelectionContext);
  if (!context) throw new Error('useDownloadSelection must be used inside DownloadsProvider.');
  return context;
};

const useDownloadSummary = () => useContext(DownloadSummaryContext);

const useDownloadJob = episode => {
  const store = useContext(DownloadJobStoreContext);
  if (!store) throw new Error('useDownloadJob must be used inside DownloadsProvider.');
  const key = episodeKey(episode);
  return useSyncExternalStore(
    listener => store.subscribeJob(key, listener),
    () => store.getJobSnapshot(key),
    () => undefined,
  );
};

const latestJobsByKey = jobs => {
  const latest = new Map();
  for (const job of jobs || []) {
    const current = latest.get(job.episodeKey);
    if (!current || String(job.updatedAt).localeCompare(String(current.updatedAt)) > 0) latest.set(job.episodeKey, job);
  }
  return latest;
};

const jobSignature = job => job
  ? [job.id, job.status, job.bytesReceived, job.totalBytes, job.speedBytesPerSecond, job.error, job.filePath, job.fileMissing].join('|')
  : '';

export {
  DownloadsProvider, useDownloads, useDownloadActions, useDownloadSelection,
  useDownloadSummary, useDownloadJob,
};
