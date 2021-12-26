import { useState, useEffect } from 'react';
import { getChannels } from '../data/repository';

const useChannelList = () => {
  const [channels, setChannels] = useState([]);
  const [next, setNext] = useState();

  useEffect(() => {
    getChannels()
      .then((data) => {
        console.log(data);
        setChannels(data.data);
        setNext(data.next);
      });
  }, [setChannels, setNext]);

  return { channels, next };
};

export { useChannelList };
