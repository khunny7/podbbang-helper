
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getEpisodes, getChannelInfo } from '../data/repository';

const pageSize = 20;

const useChannel = () => {
  const { channelId } = useParams();
  const [keyword, setSearchKeyword] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState();
  const [curPage, setCurPage] = useState(1);

  useEffect(() => {
    const keywordQuery = keyword ? `&keyword=${keyword}` : '';
    const getEpisodesPromise = getEpisodes(channelId, {
      offset,
      keyword: keywordQuery,
    });
    const getChannleInfoPromise = getChannelInfo(channelId);
    Promise.all([getEpisodesPromise, getChannleInfoPromise])
      .then(([episodesData, channelData]) => {
        // console.log(episodesData);
        // console.log(channelData);
        setEpisodes(episodesData.data);
        setOffset(episodesData.offset);
        setChannelInfo(channelData);

        if (episodesData.summary && episodesData.summary.totalCount) {
          setTotalCount(episodesData.summary.totalCount);
        }

        if (episodesData.summary && episodesData.summary.total_count) {
          setTotalCount(episodesData.summary.total_count);
        }
      });
  }, [channelId, offset, setEpisodes, setOffset, setTotalCount, setChannelInfo, keyword]);

  const onPageChange = useCallback((event, value) => {
    setCurPage(value);
    setOffset(value - 1);
  }, [setCurPage, setOffset]);

  const totalPageCount = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount]);

  const onSearch = useCallback((val) => {
    setOffset(0);
    setSearchKeyword(val);
  }, [setOffset, setSearchKeyword]);

  return { episodes, curPage, totalPageCount, channelInfo, onPageChange, onSearch };
};

export { useChannel };
