import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { CROPS, getCrop, getStage } from '../data/crops.js';

const router = Router();

// GET /api/crops — all supported crops (public)
router.get('/', (_req, res) => {
  res.json(Object.values(CROPS).map(({ id, name, description }) => ({ id, name, description })));
});

// GET /api/crops/mine — the logged-in farmer's crop and its current growth stage
router.get('/mine', requireAuth, (req, res) => {
  const crop = getCrop(req.user.crop);
  res.json({ ...crop, currentStage: getStage(crop, req.user.sowingDate), sowingDate: req.user.sowingDate });
});

// GET /api/crops/:id (public)
router.get('/:id', (req, res) => {
  const crop = CROPS[req.params.id];
  if (!crop) throw new HttpError(404, 'Crop not found');
  res.json(crop);
});

export default router;
