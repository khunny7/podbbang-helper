import { useState, useCallback } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import ChannelList from './components/channel-list';
import { Channel } from './components/channel';
import AudioListsContext from './audio-list-context';
import HeaderAppBar from './components/app-bar';
import Player from './components/player';

function App() {
  const [audioLists, setAudioLists] = useState([]);
  const [clearPriorAudioLists, setClearPriorAudioLists] = useState(false);

  const setAudioListsWithClear = useCallback((audioLists, clearLists = false) => {
    setAudioLists(audioLists);
    setClearPriorAudioLists(clearLists);
  }, [setAudioLists, setClearPriorAudioLists]);

  return (
    <Container style={{paddingTop: 65}}>
      <AudioListsContext.Provider value={{audioLists, clearPriorAudioLists, setAudioListsWithClear}}>
        <BrowserRouter>
          <HeaderAppBar />
          <Route path='/' exact component={ChannelList} />
          <Route path='/channel/:channelId' exact component={Channel} />
        </BrowserRouter>
        {
          audioLists.length > 0 &&
          <Player />
        }
        
      </AudioListsContext.Provider>
    </Container>
  );
}

export default App;
