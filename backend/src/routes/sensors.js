import { Router } from 'express';
import SensorReading from '../models/SensorReading.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getCrop } from '../data/crops.js';
import { evaluateReading } from '../services/alertRules.js';
import { nextReading } from '../services/simulator.js';
import { getLatestReading, getHistory } from '../services/readings.js';

const router = Router();

const FIELDS = ['soilMoisture', 'temperature', 'humidity', 'rainfall', 'waterLevel'];

async function saveReading(user, values, source) {
  const reading = await SensorReading.create({ ...values, user: user._id, source });
  const alerts = await evaluateReading(user, reading, getCrop(user.crop));
  return { reading, alerts };
}

// GET /api/sensors — latest reading
router.get('/', async (req, res) => {
  const reading = await getLatestReading(req.user);
  if (!reading) throw new HttpError(404, 'No sensor readings yet');
  res.json(reading);
});

// GET /api/sensors/history?hours=24
router.get('/history', async (req, res) => {
  const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 24 * 30);
  res.json(await getHistory(req.user, hours));
});

// POST /api/sensors — push a reading from an IoT device (ESP32/Arduino) or by hand.
// Body: { soilMoisture, temperature, humidity, rainfall?, waterLevel?, source? }
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const values = Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, Number(body[f])]));
  const source = body.source === 'manual' ? 'manual' : 'device';
  const result = await saveReading(req.user, values, source);
  res.status(201).json(result);
});

// POST /api/sensors/simulate — generate the next reading from the simulator
router.post('/simulate', async (req, res) => {
  const prev = (await getLatestReading(req.user)) ?? { soilMoisture: 60, waterLevel: 75 };
  const now = new Date();
  const realHours = prev.createdAt ? (now - prev.createdAt) / 3_600_000 : 1;
  // Advance at least an hour per click so the demo visibly changes.
  const hoursElapsed = Math.min(Math.max(realHours, 1), 6);
  const result = await saveReading(req.user, nextReading(prev, now, hoursElapsed), 'simulated');
  res.status(201).json(result);
});

export default router;
