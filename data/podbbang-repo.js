import fetch from 'node-fetch';

const getEpisodes = async (channelId = 16898, offset = 0, limit = 5) => {
    const response = await fetch(`https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=${offset}&limit=${limit}&sort=desc`, {
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
      });

    return response.text();
}

export { getEpisodes };
