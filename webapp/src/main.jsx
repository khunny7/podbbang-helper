import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './storage-cleanup.js'; // Auto-cleanup corrupted storage
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

// Temporarily disable StrictMode to reduce double rendering during development
// Note: Re-enable for production builds
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
