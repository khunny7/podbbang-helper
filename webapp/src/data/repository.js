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

// Electron app directly gets from podbbang, and web uses proxy server running on node
const baseUrl = isElectron() ? 'https://app-api6.podbbang.com' : '/proxy';

const getEpisodes = async (channelId = 16898, options = {
  offset: 0,
  limit: 20,
  keyword: null,
}) => {
  const { offset, keyword } = options;
  const keywordQuery = keyword ? `&keyword=${keyword}` : '';
  const response = await fetch(`${baseUrl}/channels/${channelId}/episodes?offset=${offset}&limit=20&sort=desc${keywordQuery}`, podbbangOptions);

  return response.json();
};

const getChannelInfo = async (channelId = 16898) => {
  const response = await fetch(`${baseUrl}/channels/${channelId}/`, podbbangOptions);

  return response.json();
};

const getChannels = async (offset = 0, limit = 20) => {
  const createTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const response = await fetch(`${baseUrl}/ranking-new?type=hourly&category_id=0&create_time=${createTime}&offset=${offset}&limit=${limit}`, podbbangOptions);

  return response.json();
};

export { getEpisodes, getChannelInfo, getChannels };
