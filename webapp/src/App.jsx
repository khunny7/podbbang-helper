import { useState } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import ChannelList from './components/channel-list';
import { Channel } from './components/channel';
import { AudioListsProvider } from './contexts/audio-list-context.jsx';
import NavContext from './contexts/nav-context';
import HeaderAppBar from './components/app-bar';
import ModernAudioPlayer from './components/modern-audio-player';
import Library from './components/library';
import Downloads from './components/downloads';
import { DownloadsProvider } from './contexts/downloads-context';
import { LanguageProvider } from './contexts/language-context';
import { isElectron } from './common';
import './layout.css';

const Router = isElectron() ? HashRouter : BrowserRouter;

function App() {
  const [currentPage, setCurrentPage] = useState('Discover');

  return (
    <LanguageProvider>
      <div className="app-container">
        <NavContext.Provider value={{ currentPage, setCurrentPage }}>
          <AudioListsProvider>
            <DownloadsProvider>
              <Router>
                <HeaderAppBar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<ChannelList />} />
                    <Route path="/channel/:channelId" element={<Channel />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/downloads" element={<Downloads />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <ModernAudioPlayer />
              </Router>
            </DownloadsProvider>
          </AudioListsProvider>
        </NavContext.Provider>
      </div>
    </LanguageProvider>
  );
}

export default App;
