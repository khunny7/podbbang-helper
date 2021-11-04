const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  return (userAgent.indexOf(' electron/') > -1);
}

const fetchShim = ((url) => {
  if (isElectron()) {

  } else {
    return fetch(url);
  }
});

export { isElectron, fetchShim };
