import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './storage-cleanup.js'; // Auto-cleanup corrupted storage
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

// Re-enable StrictMode now that persistence is fixed
// Note: Some warnings from react-material-music-player are expected (deprecated lifecycle methods)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
