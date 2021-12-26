import express from 'express';
import fetch from 'node-fetch';

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

const router = express.Router();

const podbbangBaseUrl = 'https://app-api6.podbbang.com';

const proxyToPodbbang = async (req) => {
  const response = await fetch(podbbangBaseUrl + req.url, podbbangOptions);

  return response.json();
};

router.get('/ranking', async (req, res, next) => {
  var data = await proxyToPodbbang(req);

  res.send(data);
});

router.get('/channels/:channelId/episodes', async (req, res, next) => {
  var data = await proxyToPodbbang(req);

  res.send(data);
});

router.get('/channels/:channelId/', async (req, res, next) => {
  var data = await proxyToPodbbang(req);

  res.send(data);
});


export default router;
