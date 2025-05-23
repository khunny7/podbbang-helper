import { useState, useCallback,React } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import Container from '@mui/material/Container';
import ChannelList from './components/channel-list';
import { Channel } from './components/channel';
import AudioListsContext from './contexts/audio-list-context';
import NavContext from './contexts/nav-context';
import HeaderAppBar from './components/app-bar';
import AudioPlayer from './components/player';
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
            <Routes>
              <Route path='/' exact element={<ChannelList />} />
              <Route path='/channel/:channelId' exact element={<Channel />} />
            </Routes>
            <AudioPlayer />
          </Router>          
        </AudioListsContext.Provider>
      </NavContext.Provider>
    </Container>
  );
}

export default App;
