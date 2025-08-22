import { useState, useEffect, useCallback, React } from 'react';
import { getChannels } from '../data/repository';

const pageSize = 50;

const useChannelList = () => {
  const [channels, setChannels] = useState([]);
  const [next, setNext] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchChannels = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const response = await getChannels(offset, pageSize);
      console.log('API Response:', response);
      
      setChannels(response.data || []);
      setCurrentPage(page);
      
      // Calculate total pages based on totalCount from API response
      if (response.summary && response.summary.totalCount) {
        const calculatedTotalPages = Math.ceil(response.summary.totalCount / pageSize);
        setTotalPages(calculatedTotalPages);
        console.log(`Total pages: ${calculatedTotalPages}, Total count: ${response.summary.totalCount}`);
      } else {
        // Fallback: assume more pages exist if we got a full page of results
        setTotalPages(response.data && response.data.length === pageSize ? page + 1 : page);
      }
      
      // Keep next for backward compatibility if needed
      setNext(response.next || null);
      
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onPageChange = useCallback((page) => {
    fetchChannels(page);
  }, [fetchChannels]);

  useEffect(() => {
    fetchChannels(1);
  }, [fetchChannels]);

  return { 
    channels, 
    next, 
    currentPage, 
    totalPages, 
    loading, 
    onPageChange 
  };
};

export { useChannelList };
