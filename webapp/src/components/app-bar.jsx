import { useContext, React, useState, useEffect } from 'react';
import NavContext from '../contexts/nav-context';
import { useNavigation } from '../hooks/use-navigation';
import './app-bar.css';

const HeaderAppBar = () => {
  const { onNavigateHome } = useNavigation();
  const { currentPage } = useContext(NavContext);
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
          <button 
            className="logo-button" 
            onClick={onNavigateHome}
            aria-label="Go to home"
          >
            <div className="logo">
              <span className="logo-icon">🎧</span>
              <span className="logo-text">Podbbang</span>
            </div>
          </button>
          
          <nav className="breadcrumb">
            <span className="breadcrumb-current">{currentPage}</span>
          </nav>
        </div>
        
        <div className="navbar-right">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
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
