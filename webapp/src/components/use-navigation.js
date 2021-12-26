import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

const useNavigation = () => {
  const history = useHistory();

  const onChannelSelected = useCallback((channel) => {
    history.push(`/channel/${channel.id}`);
  }, [history]);

  const onNavigateHome = useCallback(() => {
    history.push('/');
  }, [history]);

  return { onChannelSelected, onNavigateHome };
};

export { useNavigation };
