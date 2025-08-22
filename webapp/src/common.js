const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check multiple ways to detect Electron
  return (
    userAgent.indexOf(' electron/') > -1 ||
    window.electronAPI?.isElectron === true ||
    typeof window !== 'undefined' && window.process?.type === 'renderer'
  );
}

// Get platform information
const getPlatform = () => {
  if (window.electronAPI?.platform) {
    return window.electronAPI.platform;
  }
  return navigator.platform;
}

export { isElectron, getPlatform };
