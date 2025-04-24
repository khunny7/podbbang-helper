import { useState, useCallback,React } from 'react';
import { BrowserRouter, HashRouter, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import ChannelList from './components/channel-list';
import { Channel } from './components/channel';
import AudioListsContext from './audio-list-context';
import NavContext from './nav-context';
import HeaderAppBar from './components/app-bar';
import Player from './components/player';
import { isElectron } from './common';

const Router = isElectron() ? HashRouter : BrowserRouter;

function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [audioLists, setAudioLists] = useState([]);
  const [clearPriorAudioLists, setClearPriorAudioLists] = useState(false);

  const setAudioListsWithClear = useCallback((audioLists, clearLists = false) => {
    setAudioLists(audioLists);
    setClearPriorAudioLists(clearLists);
  }, [setAudioLists, setClearPriorAudioLists]);

  return (
    <Container style={{paddingTop: 65}}>
      <NavContext.Provider value={{currentPage, setCurrentPage}}>
        <AudioListsContext.Provider value={{audioLists, clearPriorAudioLists, setAudioListsWithClear}}>
          <Router>
            <HeaderAppBar />
            <Route path='/' exact component={ChannelList} />
            <Route path='/channel/:channelId' exact component={Channel} />
          </Router>
          {
            audioLists.length > 0 &&
            <Player />
          }
          
        </AudioListsContext.Provider>
      </NavContext.Provider>
    </Container>
  );
}

export default App;
