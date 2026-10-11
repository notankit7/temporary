// Generates realistic sensor readings for demos when no physical IoT
// device is connected. Each reading drifts from the previous one: soil dries
// faster when it's hot, temperature follows the time of day, and it
// occasionally rains.

import SensorReading from '../models/SensorReading.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;

export function nextReading(prev, at, hoursElapsed) {
  const hour = at.getHours() + at.getMinutes() / 60;
  // Coolest around 3 AM, hottest around 3 PM.
  const temperature = round1(26 + 6 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + jitter(1));
  const humidity = Math.round(clamp(88 - (temperature - 20) * 2.2 + jitter(3), 20, 100));
  const rainfall = Math.random() < 0.06 ? round1(2 + Math.random() * 18) : 0;

  const dryingPerHour = 0.3 + Math.max(0, temperature - 20) * 0.04;
  const soilMoisture = Math.round(
    clamp(prev.soilMoisture - dryingPerHour * hoursElapsed + rainfall * 0.8 + jitter(0.5), 5, 100)
  );
  const waterLevel = Math.round(clamp(prev.waterLevel - 0.2 * hoursElapsed + rainfall * 0.5, 0, 100));

  return { soilMoisture, temperature, humidity, rainfall, waterLevel };
}

// Fills a new account with the last 24 hours of readings so the dashboard
// and charts have something to show right away.
export async function seedHistory(user, crop, { hours = 24, stepHours = 2 } = {}) {
  const now = Date.now();
  let prev = { soilMoisture: crop.moisture.min + 2, waterLevel: 78 };
  const docs = [];

  for (let h = hours - stepHours; h >= 0; h -= stepHours) {
    const at = new Date(now - h * 3_600_000);
    const values = nextReading(prev, at, stepHours);
    values.rainfall = 0; // keep the seeded day dry so the trend is clear
    docs.push({ ...values, user: user._id, source: 'simulated', createdAt: at });
    prev = values;
  }

  return SensorReading.insertMany(docs);
}
