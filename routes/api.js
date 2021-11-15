import express from 'express';
import { getEpisodes, getChannels } from '../data/podbbang-repo.js';
import { downloadEpisodes } from '../data/download-utils.js';

const router = express.Router();

router.get('/channel/:channelId', async (req, res, next) => {
  const channelId = req.params.channelId;
  const data = await getEpisodes(channelId, {
    offset: req.query.offset ? req.query.offset : 0,
    limit: 20,
    keyword: req.query.keyword,
  });
  res.send(data);
});

router.get('/download/:channelId', async (req, res, next) => {
  const channelId = req.params.channelId;
  const session = await downloadEpisodes(channelId);
  res.send(session);
});

router.get('/ranking', async (req, res, next) => {
  const data = await getChannels();
  res.send(data);
});

export default router;
