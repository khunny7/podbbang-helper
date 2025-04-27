import fs from 'fs';
import download from 'download';
import sanitize from 'sanitize-filename';
import NodeID3 from 'node-id3';

const downloadFileNumber = 4;

const downloadSessions = {};

const getDownloadSession = (channelId) => {
  if (!downloadSessions[channelId]) {
    if (fs.existsSync(`./download-${channelId}.json`)) {
      try {
        const obj = fs.readFileSync(`./download-${channelId}.json`, 'utf8');
    
        const data = JSON.parse(obj);
        downloadSessions[channelId] = data;
      } catch (err) {
        // expected.
        console.log(err);
      }
    }
  }  

  return downloadSessions[channelId];
};

const downloadEpisodes = async (channelId = 16898) => {
  let downloadSession = getDownloadSession(channelId);

  if (!downloadSession) {
    downloadSession = {
      id: channelId,
      channelId,
      offset: 0,
      limit: 20,
      queue: [],
      completed: [],
      inprogress: [],
      failed: [],
      total: 0,
    };
  
    const data = await getEpisodes(channelId, {});  
  
    const newItems = data.data.map((item) => ({
      id: item.id,
      title: item.title,
      file: item.media.url,
      date: item.publishedAt,
    }));
  
    downloadSession.queue = [
      ...newItems
    ];
  
    downloadSession.total = data.summary.totalCount;

    updateDownloadSession(downloadSession);
  }  

  processDownloadsAsync(channelId);

  return downloadSession;
};

const fetchMoreQueueAsync = async (downloadSession) => {
  if (downloadSession.isFetching) {
    return downloadSession;
  }

  // check if can get more
  if (downloadSession.total > (downloadSession.offset + 1) * 20) {
    downloadSession.isFetching = true;

    downloadSession.offset += 1;

    const data = await getEpisodes(downloadSession.id, {
      offset: downloadSession.offset,
      limit: 20,
    });

    const newItems = data.data.map((item) => ({
      id: item.id,
      title: item.title,
      file: item.media.url,
      date: item.publishedAt,
    }));

    downloadSession.queue = [
      ...downloadSession.queue,
      ...newItems,
    ];

    downloadSession.isFetching = false;
    updateDownloadSession(downloadSession);
  }

  return downloadSession;
}

const processDownloadsAsync = async (channelId) => {
  let downloadSession = getDownloadSession(channelId);

  // download all done
  if (downloadSession.total === downloadSession.completed.length + downloadSession.failed.length ) {
    return downloadSession;
  }

  // max downloading
  if (downloadSession.inprogress.length === downloadFileNumber) {
    return downloadSession;
  }

  // download and put them in queue.
  if (downloadSession.inprogress.length < downloadFileNumber &&
    (downloadFileNumber - downloadSession.inprogress.length) <= downloadSession.queue.length) {
    while (downloadSession.inprogress.length < downloadFileNumber) {
      const itemToDownload = downloadSession.queue.shift();
      downloadSession.inprogress.push(itemToDownload);
      
      console.log('download starting: ' + itemToDownload.file);
      downloadFileAsync(itemToDownload).then(() => {
        // add to complete
        console.log('download complete: ' + itemToDownload.file);
        downloadSession.completed.push(itemToDownload);
      }).catch((err) => {
        console.error(err);
        downloadSession.failed.push(itemToDownload);
      }).finally(() => {
        downloadSession.inprogress = downloadSession.inprogress.filter((item) => item.id !== itemToDownload.id);
        // update downloadSession
        updateDownloadSession(downloadSession);

        // keep processing
        processDownloadsAsync(channelId);
      });
    }
  } else {
    // add more to the queue.
    fetchMoreQueueAsync(downloadSession).then((downloadSession) => {
      updateDownloadSession(downloadSession);
      if (downloadSession.queue.length > 0) {
        processDownloadsAsync(downloadSession.id);
      }
    })
  }
};

const updateDownloadSession = (downloadSession) => {
  try {
    fs.writeFileSync(`./download-${downloadSession.id}.json`, JSON.stringify(downloadSession));
    downloadSessions[downloadSession.id] = downloadSession;
  } catch (err) {
    console.error(err);
  }
};

const downloadFileAsync = async (item) => {
  const date = item.date.split(' ').shift();
  let fileName = `${date}-${item.title}`
  fileName = sanitize(fileName);
  fs.writeFileSync(`./downloads/${fileName}.mp3`, await download(item.file));
  const tagUpdated = NodeID3.write({
    title: item.title,
    artist: '정영진 최욱',
    album: '불금쇼',
  }, `./downloads/${fileName}.mp3`);
};

const fakeDownloadAsync = (filename) => {
  const downloadPromise = new Promise((resolve) => {
    // fs.writeFileSync(`./download-${filename}.json`, filename);

    setTimeout(() => resolve(`./download-${filename}.json`), 500);
  });

  return downloadPromise;
};

export { downloadEpisodes };

