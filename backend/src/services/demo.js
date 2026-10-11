import User from '../models/User.js';
import SensorReading from '../models/SensorReading.js';
import Alert from '../models/Alert.js';
import IrrigationEvent from '../models/IrrigationEvent.js';
import { getCrop } from '../data/crops.js';
import { seedHistory } from './simulator.js';
import { evaluateReading, createAlert } from './alertRules.js';

export const DEMO_EMAIL = 'demo@agrisense.com';
export const DEMO_PASSWORD = 'demo1234';

// Creates the demo account with a day of sensor history.
// reset: true  -> delete and recreate it (npm run seed)
// reset: false -> only create it if it doesn't exist yet (server startup)
export async function ensureDemoAccount({ reset = false } = {}) {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing && !reset) return false;
  if (existing) {
    await Promise.all([
      SensorReading.deleteMany({ user: existing._id }),
      Alert.deleteMany({ user: existing._id }),
      IrrigationEvent.deleteMany({ user: existing._id }),
      existing.deleteOne(),
    ]);
  }

  const user = await User.create({
    name: 'Demo Farmer',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    location: 'Pune, Maharashtra',
    crop: 'sugarcane',
    // ~150 days ago puts sugarcane in its Grand Growth stage
    sowingDate: new Date(Date.now() - 150 * 86_400_000),
  });
  const crop = getCrop(user.crop);
  const readings = await seedHistory(user, crop);
  await createAlert(user, 'normal', 'welcome', 'All sensors connected successfully.');
  await evaluateReading(user, readings.at(-1), crop);
  return true;
}
