import express from 'express';
import { getEpisodes, getChannels } from '../data/podbbang-repo.js';
const router = express.Router();

router.get('/episodes/:episodeId', async (req, res, next) => {
  const episodeId = req.params.episodeId;
  const data = await getEpisodes(episodeId);
  res.send(data);
});

router.get('/ranking', async (req, res, next) => {
  const data = await getChannels();
  res.send(data);
});

export default router;
