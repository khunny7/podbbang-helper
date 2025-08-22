import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

// Temporarily disabled StrictMode to check for double API calls
// Re-enable for production: <React.StrictMode><App /></React.StrictMode>
root.render(<App />);
