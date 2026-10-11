import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getCrop } from '../data/crops.js';
import { seedHistory } from '../services/simulator.js';
import { evaluateReading, createAlert } from '../services/alertRules.js';

const router = Router();

function parseSowingDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Invalid sowing date');
  if (date > new Date()) throw new HttpError(400, 'Sowing date cannot be in the future');
  return date;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, location, crop, sowingDate } = req.body ?? {};
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (String(password).length < 4) throw new HttpError(400, 'Password must be at least 4 characters');

  const user = await User.create({
    name, email, password, location, crop,
    sowingDate: parseSowingDate(sowingDate),
  });

  // Give the new account a day of sensor history so the dashboard isn't empty.
  try {
    const cropInfo = getCrop(user.crop);
    const readings = await seedHistory(user, cropInfo);
    await createAlert(user, 'normal', 'welcome', 'All sensors connected successfully.');
    await evaluateReading(user, readings.at(-1), cropInfo);
  } catch (err) {
    console.warn(`Could not seed demo data for ${user.email}: ${err.message}`);
  }

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: user.toPublic() });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user.toPublic());
});

// PUT /api/auth/me — update profile (name, location, crop, sowing date)
router.put('/me', requireAuth, async (req, res) => {
  const { name, location, crop, sowingDate } = req.body ?? {};
  const user = req.user;
  if (name !== undefined) user.name = name;
  if (location !== undefined) user.location = location;
  if (crop !== undefined) user.crop = crop;
  if (sowingDate !== undefined) user.sowingDate = parseSowingDate(sowingDate) ?? new Date();
  await user.save();
  res.json(user.toPublic());
});

export default router;
