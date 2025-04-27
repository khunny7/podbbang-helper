import express from 'express';
import { downloadEpisodes } from '../data/download-utils.js';

const router = express.Router();

router.get('/download/:channelId', async (req, res, next) => {
  const channelId = req.params.channelId;
  const session = await downloadEpisodes(channelId);
  res.send(session);
});


export default router;
