import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { getCrop, getStage } from '../data/crops.js';
import { buildAdvisory } from '../services/advisory.js';
import { tryGetForecast } from '../services/weather.js';
import { getLatestReading, getHistory } from '../services/readings.js';

const router = Router();

// GET /api/advisory — irrigation recommendation for the user's field right now
router.get('/', async (req, res) => {
  const user = req.user;
  const [reading, history, forecast] = await Promise.all([
    getLatestReading(user),
    getHistory(user, 12),
    tryGetForecast(user),
  ]);
  if (!reading) throw new HttpError(404, 'No sensor readings yet — connect a sensor or run the simulator');

  const crop = getCrop(user.crop);
  res.json(
    buildAdvisory({
      reading: reading.toJSON(),
      history,
      crop,
      stage: getStage(crop, user.sowingDate),
      forecast,
    })
  );
});

export default router;
