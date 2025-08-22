// Utility to clear corrupted localStorage data
// Run this in the browser console if needed: clearCorruptedStorage()

window.clearCorruptedStorage = function() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  
  keys.forEach(key => {
    if (key && key.startsWith('podbbang_')) {
      const value = localStorage.getItem(key);
      if (value === 'undefined' || value === 'null' || value === '') {
        console.log(`🧹 Removing corrupted key: ${key} (value: ${value})`);
        localStorage.removeItem(key);
      }
    }
  });
  
  console.log('✅ Cleared corrupted storage');
};

// Auto-run the cleanup
if (typeof window !== 'undefined') {
  window.clearCorruptedStorage();
}
