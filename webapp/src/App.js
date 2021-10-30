import { useState, useCallback } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'
import { Ranking } from './components/ranking';
import { Channel } from './components/channel';
import AudioListsContext from './audio-list-context';

function App() {
  const [audioLists, setAudioLists] = useState([]);
  const [clearPriorAudioLists, setClearPriorAudioLists] = useState(false);

  const addAudio = useCallback((audioItem) => {
    const updatedAudioLists = [
      ...audioLists,
      audioItem
    ];

    setAudioLists(updatedAudioLists);
    setClearPriorAudioLists(false);
  }, [audioLists, setAudioLists, setClearPriorAudioLists]);

  const playAudio = useCallback((audioItem) => {
    setAudioLists([audioItem]);
    setClearPriorAudioLists(true);
  }, [setAudioLists, setClearPriorAudioLists]);

  const onAudioListsChange = useCallback((currentPlayId,updatedAudioLists,audioInfo) => {
    if (audioLists.length !== updatedAudioLists.length) {
      setClearPriorAudioLists(true);
      setAudioLists(updatedAudioLists);
    } else {
      for (let i = 0; i < updatedAudioLists.length; i+= 1) {
        if (updatedAudioLists[i].id !== audioLists[i].id) {
          setClearPriorAudioLists(true);
          setAudioLists(updatedAudioLists);
          break;
        }
      }
    }
  }, [audioLists, setAudioLists]);

  return (
    <div className="App">
      <AudioListsContext.Provider value={{audioLists, addAudio, playAudio}}>
        <BrowserRouter>
          <Route path='/' exact component={Ranking} />
          <Route path='/channel/:channelId' exact component={Channel} />
        </BrowserRouter>
        <ReactJkMusicPlayer
          audioLists={audioLists}
          theme='light'
          mode='full'
          showLyric={false}
          showPlayMode={false}
          showThemeSwitch={false}
          showReload={false}
          showDownload={false}
          onAudioListsChange={onAudioListsChange}
          showMediaSession
          quietUpdate
          clearPriorAudioLists={clearPriorAudioLists}
          autoplayInitLoadPlayList
        />
      </AudioListsContext.Provider>
    </div>
  );
}

export default App;
