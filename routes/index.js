import express from 'express';
import { getEpisodes, getChannels } from '../data/podbbang-repo.js';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/episodes/:episodeId', async (req, res, next) => {
  const episodeId = req.params.episodeId;
  const data = await getEpisodes(episodeId);
  res.send(data);
});

router.get('/api/ranking', async (req, res, next) => {
  const data = await getChannels();
  res.send(data);
});

export default router;
