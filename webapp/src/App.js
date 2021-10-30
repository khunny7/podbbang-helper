import { useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'
import { Ranking } from './components/ranking';
import { Channel } from './components/channel';
import AudioListsContext from './audio-list-context';

function App() {
  const [audioLists, setAudioLists] = useState([]);

  return (
    <div className="App">
      <AudioListsContext.Provider value={{audioLists, setAudioLists}}>
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
        />
      </AudioListsContext.Provider>
    </div>
  );
}

export default App;
