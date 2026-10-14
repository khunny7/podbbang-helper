import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getEpisodes, getChannelInfo } from '../data/repository';
import { useRecentChannels } from './use-persisted-state';

const pageSize = 20;

const useChannel = () => {
  const { channelId } = useParams();
  const [keyword, setSearchKeyword] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [curPage, setCurPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paginationChannelId, setPaginationChannelId] = useState(channelId);
  const { addRecentChannel } = useRecentChannels();

  useEffect(() => {
    setPaginationChannelId(channelId);
    setSearchKeyword('');
    setEpisodes([]);
    setChannelInfo(null);
    setCurrentPageIndex(0);
    setTotalCount(0);
    setCurPage(1);
    setLoading(true);
    setError(null);
  }, [channelId]);

  useEffect(() => {
    // Do not request a new channel using the previous channel's page/search state.
    if (paginationChannelId !== channelId) return undefined;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [episodesData, channelData] = await Promise.all([
          getEpisodes(channelId, {
            pageIndex: currentPageIndex,
            limit: pageSize,
            keyword,
            signal: controller.signal,
          }),
          getChannelInfo(channelId, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (!Array.isArray(episodesData?.data)) {
          throw new Error('Podbbang returned an unexpected episode list. Please try again.');
        }

        setEpisodes(episodesData.data);
        setChannelInfo(channelData);
        const count = episodesData?.summary?.totalCount ?? episodesData?.summary?.total_count;
        // Podbbang only includes summary.totalCount on the first page. Keep the
        // count from page one while subsequent pages omit the summary object.
        if (count !== undefined && count !== null && Number.isFinite(Number(count))) {
          setTotalCount(Number(count));
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setEpisodes([]);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [channelId, currentPageIndex, keyword, retryCount, paginationChannelId]);

  useEffect(() => {
    if (!channelInfo?.id) return;
    addRecentChannel({
      id: channelInfo.id,
      title: channelInfo.title,
      image: channelInfo.image,
      description: channelInfo.description,
    });
  }, [channelInfo, addRecentChannel]);

  const onPageChange = useCallback((event, value) => {
    setCurPage(value);
    // Podbbang's episode `offset` is a zero-based page index, not an item count.
    setCurrentPageIndex(value - 1);
  }, []);

  const totalPageCount = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount]);

  const onSearch = useCallback((value) => {
    const nextKeyword = value.trim();
    if (nextKeyword !== keyword) setTotalCount(0);
    setCurPage(1);
    setCurrentPageIndex(0);
    setSearchKeyword(nextKeyword);
  }, [keyword]);

  const retry = useCallback(() => setRetryCount(count => count + 1), []);

  return { episodes, curPage, totalPageCount, channelInfo, onPageChange, onSearch, loading, error, retry };
};

export { useChannel };
