import { useCallback, useContext } from 'react';
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'
import AudioListsContext from '../audio-list-context';
import './player.css';

const Player = (props) => {
    const {
        audioLists,
        clearPriorAudioLists,
        setAudioListsWithClear
    } = useContext(AudioListsContext);

    const onAudioListsChange = useCallback((currentPlayId,updatedAudioLists,audioInfo) => {
        if (audioLists.length !== updatedAudioLists.length) {
            setAudioListsWithClear(updatedAudioLists, true);
        } else {
        for (let i = 0; i < updatedAudioLists.length; i+= 1) {
            if (updatedAudioLists[i].id !== audioLists[i].id) {
                setAudioListsWithClear(updatedAudioLists, true);
                break;
            }
        }
        }
    }, [audioLists, setAudioListsWithClear]);

    return (
        <ReactJkMusicPlayer
            audioLists={audioLists}
            theme='light'
            mode='full'
            showLyric={false}
            showPlayMode={false}
            showThemeSwitch={false}
            showReload={false}
            showDownload={false}
            defaultPosition={{left: 0, top: 100}}
            onAudioListsChange={onAudioListsChange}
            showMediaSession
            quietUpdate
            clearPriorAudioLists={clearPriorAudioLists}
            autoplayInitLoadPlayList
          />
    )
};

export default Player;
