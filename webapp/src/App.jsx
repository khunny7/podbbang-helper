import { useState, React } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import ChannelList from './components/channel-list';
import { Channel } from './components/channel';
import { AudioListsProvider } from './contexts/audio-list-context.jsx';
import NavContext from './contexts/nav-context';
import HeaderAppBar from './components/app-bar';
import ModernAudioPlayer from './components/modern-audio-player';
import { isElectron } from './common';
import './layout.css';

const Router = isElectron() ? HashRouter : BrowserRouter;

function App() {
  const [currentPage, setCurrentPage] = useState('Discover');

  return (
    <div className="app-container">
      <NavContext.Provider value={{currentPage, setCurrentPage}}>
        <AudioListsProvider>
          <Router>
            <HeaderAppBar />
            <main className="main-content">
              <Routes>
                <Route path='/' exact element={<ChannelList />} />
                <Route path='/channel/:channelId' exact element={<Channel />} />
              </Routes>
            </main>
            <ModernAudioPlayer />
          </Router>          
        </AudioListsProvider>
      </NavContext.Provider>
    </div>
  );
}

export default App;
