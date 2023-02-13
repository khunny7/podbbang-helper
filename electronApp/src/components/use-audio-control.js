
import { useContext, useCallback } from 'react';
import AudioListsContext from '../audio-list-context';

const useAudioControl = () => {
  const {
    audioLists,
    setAudioListsWithClear,
  } = useContext(AudioListsContext);

  const onPlay = useCallback((cover, musicSrc, name, singer) => {
    setAudioListsWithClear([{
      cover,
      musicSrc,
      name,
      singer,
    }], true);
  }, [setAudioListsWithClear]);

  const onAddAudio = useCallback((cover, musicSrc, name, singer) => {
    const updatedAudioLists = [
      ...audioLists,
      {
        cover,
        musicSrc,
        name,
        singer,
      },
    ];

    setAudioListsWithClear(updatedAudioLists, false);
  }, [setAudioListsWithClear, audioLists]);

  return { onPlay, onAddAudio };
};

export { useAudioControl };
