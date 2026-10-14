import { useContext, useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import NavContext from '../contexts/nav-context';
import { useDownloadSummary } from '../contexts/downloads-context';
import { useTranslation } from '../contexts/language-context';
import './app-bar.css';

const HeaderAppBar = () => {
  const { currentPage } = useContext(NavContext);
  const pendingDownloads = useDownloadSummary();
  const { language, setLanguage, t } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <Link
            className="logo-button" 
            to="/"
            aria-label={`${t('Go to discover')} · Podbbang ${t('Unofficial app')}`}
          >
            <div className="logo">
              <span className="logo-icon">🎧</span>
              <span className="logo-text">{language === 'ko' ? '팟빵' : 'Podbbang'}</span>
              <span className="logo-unofficial">{t('Unofficial')}</span>
            </div>
          </Link>
          
          <nav className="breadcrumb">
            <span className="breadcrumb-current">{t(currentPage)}</span>
          </nav>
        </div>
        
        <div className="navbar-right">
          <nav className="main-nav" aria-label={t('Main navigation')}>
            <NavLink to="/" end>{t('Discover')}</NavLink>
            <NavLink to="/library">{t('Library')}</NavLink>
            <NavLink to="/downloads">{t('Downloads')}{pendingDownloads > 0 ? ` (${pendingDownloads})` : ''}</NavLink>
          </nav>
          <button
            type="button"
            className="language-toggle"
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
            aria-label={t(language === 'en' ? 'Switch language to Korean' : 'Switch language to English')}
            title={t('Language')}
          >
            {language === 'en' ? '한국어' : 'EN'}
          </button>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={t(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
          >
            <span className="theme-icon">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderAppBar;
