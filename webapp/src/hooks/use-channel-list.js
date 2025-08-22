import { useState, useEffect, useCallback, useRef, React } from 'react';
import { getChannels } from '../data/repository';

const pageSize = 50;

const useChannelList = () => {
  const [channels, setChannels] = useState([]);
  const [next, setNext] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const initializeRef = useRef(false);

  const fetchChannels = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      console.log('📡 Fetching channels for page:', page, 'offset:', offset);
      const response = await getChannels(offset, pageSize);
      console.log('✅ Channel list API response received');
      
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
      console.error('❌ Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onPageChange = useCallback((page) => {
    console.log('🔄 Page change requested:', page, 'current:', currentPage);
    if (page !== currentPage) {
      fetchChannels(page);
    }
  }, [fetchChannels, currentPage]);

  useEffect(() => {
    if (!initializeRef.current) {
      console.log('🚀 Initializing channel list');
      initializeRef.current = true;
      fetchChannels(1);
    }
  }, []); // Empty dependency array to run only once

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
