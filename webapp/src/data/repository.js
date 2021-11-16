import { isElectron } from "../common";

const podbbangOptions = {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    "refcode": "null",
    "sec-ch-ua": "\"Chromium\";v=\"94\", \"Microsoft Edge\";v=\"94\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site"
  },
  "referrer": "https://www.podbbang.com/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
};

const electronRepo = {
  getEpisodes: async (channelId = 16898, options = {
    offset: 0,
    limit: 20,
    keyword: null,
  }) => {
    const {offset, keyword } = options;
    const keywordQuery = keyword ? `&keyword=${keyword}` : '';
    const response = await fetch(`https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=${offset}&limit=20&sort=desc${keywordQuery}`, podbbangOptions);

    return response.json();
  },

  getChannels: async (offset = 0) => {
    const response = await fetch(`https://app-api6.podbbang.com/ranking?type=hourly&next=0&limit=20&category_id=0`, podbbangOptions);

    return response.json();
  }
}

const webRepo = {
  getEpisodes: async (channelId = 16898, options = {
    offset: 0,
    limit: 20,
    keyword: null,
  }) => {
    const {offset, keyword } = options;
    const keywordQuery = keyword ? `&keyword=${keyword}` : '';
    return (await fetch(`/api/channel/${channelId}?offset=${offset}${keywordQuery}`)).json();
  },

  getChannels: async (offset = 0) => {
    return (await fetch('/api/ranking')).json();
  }
}

const getRepository = () => {
  if (isElectron()) {
    return electronRepo;
  }

  return webRepo;
};

export { getRepository };
