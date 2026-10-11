import SensorReading from '../models/SensorReading.js';

export const getLatestReading = (user) =>
  SensorReading.findOne({ user: user._id }).sort({ createdAt: -1 });

// Readings from the last `hours` hours, oldest first (ready for charts).
export async function getHistory(user, hours = 24, limit = 200) {
  const since = new Date(Date.now() - hours * 3_600_000);
  const rows = await SensorReading.find({ user: user._id, createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(limit);
  return rows.reverse();
}
