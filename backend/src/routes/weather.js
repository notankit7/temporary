import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { getForecast } from '../services/weather.js';

const router = Router();

// GET /api/weather — live conditions + 3-day forecast for the farm location
router.get('/', async (req, res) => {
  if (!req.user.location) {
    return res.json({ available: false, message: 'Add a farm location to your profile to see the forecast' });
  }
  let forecast;
  try {
    forecast = await getForecast(req.user);
  } catch (err) {
    throw new HttpError(502, `Weather service unavailable: ${err.message}`);
  }
  if (!forecast) {
    return res.json({ available: false, message: `Could not find "${req.user.location}" on the map` });
  }
  res.json({ available: true, ...forecast });
});

export default router;
