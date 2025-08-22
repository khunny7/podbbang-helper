
import { useEffect, useState, useCallback, useMemo, React } from 'react';
import { useParams } from 'react-router-dom';
import { getEpisodes, getChannelInfo } from '../data/repository';
import { useRecentChannels } from './use-persisted-state';

const pageSize = 20;

const useChannel = () => {
  const { channelId } = useParams();
  const [keyword, setSearchKeyword] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState();
  const [curPage, setCurPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addRecentChannel } = useRecentChannels();

  // Reset state when channel changes
  useEffect(() => {
    setEpisodes([]);
    setChannelInfo(null);
    setCurrentOffset(0);
    setCurPage(1);
    setTotalCount(undefined);
  }, [channelId]);

  // Add to recent channels when channel info is loaded
  useEffect(() => {
    if (channelInfo) {
      addRecentChannel({
        id: channelInfo.id,
        title: channelInfo.title,
        image: channelInfo.image,
        description: channelInfo.description
      });
    }
  }, [channelInfo, addRecentChannel]);

  useEffect(() => {
    console.log('🔍 Channel Effect Triggered:', { channelId, currentOffset, keyword });
    
    const fetchData = async () => {
      setLoading(true);
      // Reset episodes when starting a new fetch to prevent showing old data
      if (currentOffset === 0) {
        setEpisodes([]);
      }
      
      try {
        console.log('📡 Making API calls for channel:', channelId);
        const [episodesData, channelData] = await Promise.all([
          getEpisodes(channelId, {
            offset: currentOffset,
            keyword: keyword,
          }),
          getChannelInfo(channelId)
        ]);

        console.log('✅ API calls completed for channel:', channelId);
        setEpisodes(episodesData.data);
        setChannelInfo(channelData);

        if (episodesData.summary && episodesData.summary.totalCount) {
          setTotalCount(episodesData.summary.totalCount);
        } else if (episodesData.summary && episodesData.summary.total_count) {
          setTotalCount(episodesData.summary.total_count);
        }
      } catch (error) {
        console.error('❌ Error fetching channel data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [channelId, currentOffset, keyword]);

  const onPageChange = useCallback((event, value) => {
    setCurPage(value);
    const newOffset = (value - 1) * pageSize;
    setCurrentOffset(newOffset);
  }, []);

  const totalPageCount = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount]);

  const onSearch = useCallback((val) => {
    setCurrentOffset(0);
    setCurPage(1);
    setSearchKeyword(val);
  }, []);

  return { episodes, curPage, totalPageCount, channelInfo, onPageChange, onSearch, loading };
};

export { useChannel };
