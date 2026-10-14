import { useState, useEffect, useCallback } from 'react';
import { getChannels } from '../data/repository';

const pageSize = 50;
const searchFetchPageSize = 100;
const searchPageConcurrency = 3;

const useChannelList = () => {
  const [pageChannels, setPageChannels] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingType, setRankingType] = useState('hourly');
  const [categoryId, setCategoryId] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChannels, setTotalChannels] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (searchQuery) return undefined;

    const controller = new AbortController();
    const fetchChannels = async () => {
      setLoading(true);
      setError(null);
      try {
        // Podbbang's ranking endpoint treats `offset` as a zero-based page index,
        // unlike the episode endpoint which uses an item offset.
        const response = await getChannels(currentPage - 1, pageSize, controller.signal, { rankingType, categoryId });
        if (controller.signal.aborted) return;
        if (!Array.isArray(response?.data)) {
          throw new Error('Podbbang returned an unexpected channel list. Please try again.');
        }
        const data = response.data;
        setPageChannels(data);
        const totalCount = response?.summary?.totalCount ?? response?.summary?.total_count;
        setTotalChannels(Number.isFinite(Number(totalCount)) ? Number(totalCount) : data.length);
        setTotalPages(Number.isFinite(Number(totalCount))
          ? Math.max(1, Math.ceil(Number(totalCount) / pageSize))
          : (data.length === pageSize ? currentPage + 1 : currentPage));
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setPageChannels([]);
          setTotalChannels(0);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchChannels();
    return () => controller.abort();
  }, [currentPage, rankingType, categoryId, retryCount, searchQuery]);

  useEffect(() => {
    if (!searchQuery) return undefined;

    const controller = new AbortController();
    const fetchAndSearchChannels = async () => {
      setLoading(true);
      setError(null);
      try {
        const createTime = String(Math.floor(Date.now() / 1000));
        const options = { rankingType, categoryId, createTime };
        const firstPage = await getChannels(0, searchFetchPageSize, controller.signal, options);
        if (controller.signal.aborted) return;
        if (!Array.isArray(firstPage?.data)) {
          throw new Error('Podbbang returned an unexpected channel list. Please try again.');
        }

        const totalCountValue = firstPage?.summary?.totalCount ?? firstPage?.summary?.total_count;
        const totalCount = Number(totalCountValue);
        const hasTotalCount = totalCountValue !== undefined && totalCountValue !== null && Number.isFinite(totalCount);
        const pageCount = hasTotalCount
          ? Math.ceil(totalCount / searchFetchPageSize)
          : null;
        const allChannels = [...firstPage.data];

        // Keep requests in a few small batches to find all matches without
        // overwhelming the public ranking endpoint.
        let nextOffset = 1;
        let hasMorePages = pageCount === null && firstPage.data.length === searchFetchPageSize;
        while (pageCount === null
          ? hasMorePages && nextOffset < 100
          : nextOffset < pageCount) {
          const offsets = Array.from(
            { length: pageCount === null
              ? searchPageConcurrency
              : Math.min(searchPageConcurrency, pageCount - nextOffset) },
            (_, index) => nextOffset + index
          );
          const pages = await Promise.all(offsets.map(offset =>
            getChannels(offset, searchFetchPageSize, controller.signal, options)
          ));
          if (controller.signal.aborted) return;
          pages.forEach(response => {
            if (!Array.isArray(response?.data)) {
              throw new Error('Podbbang returned an unexpected channel list. Please try again.');
            }
            allChannels.push(...response.data);
          });
          nextOffset += offsets.length;
          if (pageCount === null) {
            hasMorePages = pages.every(response => response.data.length === searchFetchPageSize);
          }
        }

        const normalizedQuery = searchQuery.toLocaleLowerCase();
        const matches = allChannels.filter(channel => [channel.title, channel.description, channel.copyright]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedQuery));

        setSearchResults(matches);
        setTotalChannels(matches.length);
        setTotalPages(Math.max(1, Math.ceil(matches.length / pageSize)));
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setTotalChannels(0);
          setTotalPages(1);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAndSearchChannels();
    return () => controller.abort();
  }, [searchQuery, rankingType, categoryId, retryCount]);

  const channels = searchQuery
    ? searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : pageChannels;

  const onPageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  const onSearch = useCallback(query => {
    const nextQuery = String(query || '').trim();
    if (nextQuery !== searchQuery) {
      setLoading(true);
      setError(null);
    }
    setCurrentPage(1);
    setSearchQuery(nextQuery);
  }, [searchQuery]);

  const retry = useCallback(() => setRetryCount(count => count + 1), []);

  const onRankingTypeChange = useCallback(type => {
    if (!['hourly', 'weekly'].includes(type)) return;
    if (type === rankingType) {
      setCurrentPage(1);
      return;
    }
    if (searchQuery) {
      setLoading(true);
      setError(null);
    }
    setCurrentPage(1);
    setRankingType(type);
  }, [rankingType, searchQuery]);

  const onCategoryChange = useCallback(id => {
    const nextCategoryId = Math.max(0, Math.floor(Number(id) || 0));
    if (nextCategoryId === categoryId) {
      setCurrentPage(1);
      return;
    }
    if (searchQuery) {
      setLoading(true);
      setError(null);
    }
    setCurrentPage(1);
    setCategoryId(nextCategoryId);
  }, [categoryId, searchQuery]);

  return {
    channels, currentPage, totalPages, totalChannels, loading, error, onPageChange, onSearch, retry,
    rankingType, categoryId, onRankingTypeChange, onCategoryChange, searchQuery,
  };
};

export { useChannelList };
