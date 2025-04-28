import { useCallback,React } from 'react';
import { useNavigate } from 'react-router-dom';

const useNavigation = () => {
  const navigate = useNavigate();

  const onChannelSelected = useCallback((channel) => {
    navigate(`/channel/${channel.id}`);
  }, [navigate]);

  const onNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return { onChannelSelected, onNavigateHome };
};

export { useNavigation };
