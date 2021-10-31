import express from 'express';
import { getEpisodes, getChannels } from '../data/podbbang-repo.js';
const router = express.Router();

router.get('/channel/:channelId', async (req, res, next) => {
  const channelId = req.params.channelId;
  const data = await getEpisodes(channelId, req.query.offset);
  res.send(data);
});

router.get('/ranking', async (req, res, next) => {
  const data = await getChannels();
  res.send(data);
});

export default router;
