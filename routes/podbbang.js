import express from 'express';
import { getEpisodes } from '../data/podbbang-repo.js';
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
    const data = await getEpisodes();
  res.send(data);
});

export default router;
