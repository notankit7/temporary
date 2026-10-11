import { Router } from 'express';
import IrrigationEvent from '../models/IrrigationEvent.js';
import SensorReading from '../models/SensorReading.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getCrop } from '../data/crops.js';
import { waterNeeded } from '../services/advisory.js';
import { createAlert } from '../services/alertRules.js';
import { getLatestReading } from '../services/readings.js';

const router = Router();

// GET /api/irrigation — past irrigation events
router.get('/', async (req, res) => {
  const events = await IrrigationEvent.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(events);
});

// POST /api/irrigation — log that the field was irrigated.
// Body: { waterMm?, note? } — waterMm defaults to the advised amount.
router.post('/', async (req, res) => {
  const user = req.user;
  const crop = getCrop(user.crop);
  const latest = await getLatestReading(user);
  if (!latest) throw new HttpError(404, 'No sensor readings yet');

  const advisedMm = waterNeeded(crop, latest.soilMoisture).mm;
  const waterMm = Number(req.body?.waterMm) || advisedMm;
  if (!waterMm) throw new HttpError(400, 'Soil moisture is already at target — no irrigation needed');

  const moistureAfter = Math.min(100, Math.round(latest.soilMoisture + (waterMm / crop.rootZoneMm) * 100));

  const event = await IrrigationEvent.create({
    user: user._id,
    waterMm,
    moistureBefore: latest.soilMoisture,
    moistureAfter,
    note: req.body?.note,
  });

  // Record the post-irrigation state as a new reading.
  const reading = await SensorReading.create({
    user: user._id,
    soilMoisture: moistureAfter,
    temperature: latest.temperature,
    humidity: latest.humidity,
    rainfall: 0,
    waterLevel: Math.max(0, Math.round(latest.waterLevel - waterMm * 0.5)),
    source: 'manual',
  });

  await createAlert(user, 'normal', 'irrigated',
    `Irrigation completed: ${waterMm} mm applied. Soil moisture now ${moistureAfter}%.`);

  res.status(201).json({ event, reading });
});

export default router;
