import Alert from '../models/Alert.js';

// Don't raise the same kind of alert again within this window.
const DEDUPE_WINDOW_MS = 3 * 3_600_000;
const LOW_WATER_LEVEL = 20;
const HEAVY_RAIN_MM = 10;

function rulesFor(reading, crop) {
  const { moisture: m, temperature: t } = crop;
  const alerts = [];

  if (reading.soilMoisture < m.critical) {
    alerts.push({ type: 'critical', code: 'moisture-critical',
      message: `Soil moisture critically low (${reading.soilMoisture}%). Irrigate today.` });
  } else if (reading.soilMoisture < m.min) {
    alerts.push({ type: 'warning', code: 'moisture-low',
      message: `Low soil moisture detected (${reading.soilMoisture}%, ideal ${m.min}-${m.max}%).` });
  } else if (reading.soilMoisture > m.max + 10) {
    alerts.push({ type: 'warning', code: 'moisture-high',
      message: `Soil is over-saturated (${reading.soilMoisture}%). Risk of waterlogging — check drainage.` });
  }

  if (reading.temperature > t.max) {
    alerts.push({ type: reading.temperature > t.max + 5 ? 'critical' : 'warning', code: 'heat',
      message: `High temperature alert (${reading.temperature}°C). ${crop.name} prefers ${t.min}-${t.max}°C.` });
  }

  if (reading.waterLevel < LOW_WATER_LEVEL) {
    alerts.push({ type: 'critical', code: 'water-low',
      message: `Water reservoir is low (${reading.waterLevel}%). Refill before the next irrigation.` });
  }

  if (reading.rainfall >= HEAVY_RAIN_MM) {
    alerts.push({ type: 'normal', code: 'rain',
      message: `${reading.rainfall} mm of rainfall recorded. Irrigation can be postponed.` });
  }

  return alerts;
}

// Checks a new reading against the crop thresholds and stores any new alerts.
export async function evaluateReading(user, reading, crop) {
  const candidates = rulesFor(reading, crop);
  if (!candidates.length) return [];

  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const recent = await Alert.find({
    user: user._id,
    code: { $in: candidates.map((a) => a.code) },
    createdAt: { $gte: since },
  }).distinct('code');

  const fresh = candidates.filter((a) => !recent.includes(a.code));
  if (!fresh.length) return [];
  return Alert.insertMany(fresh.map((a) => ({ ...a, user: user._id })));
}

export const createAlert = (user, type, code, message) =>
  Alert.create({ user: user._id, type, code, message });
