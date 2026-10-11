import { Router } from 'express';
import Alert from '../models/Alert.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();
const TYPES = ['critical', 'warning', 'normal'];

// GET /api/alerts?type=critical&unread=true&limit=50
router.get('/', async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) {
    if (!TYPES.includes(req.query.type)) throw new HttpError(400, `type must be one of ${TYPES.join(', ')}`);
    filter.type = req.query.type;
  }
  if (req.query.unread === 'true') filter.read = false;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  res.json(await Alert.find(filter).sort({ createdAt: -1 }).limit(limit));
});

// GET /api/alerts/summary — counts for badges
router.get('/summary', async (req, res) => {
  const rows = await Alert.aggregate([
    { $match: { user: req.user._id, read: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const byType = Object.fromEntries(TYPES.map((t) => [t, 0]));
  for (const r of rows) byType[r._id] = r.count;
  res.json({ unread: rows.reduce((a, r) => a + r.count, 0), ...byType });
});

// PATCH /api/alerts/read-all
router.patch('/read-all', async (req, res) => {
  const { modifiedCount } = await Alert.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ updated: modifiedCount });
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { returnDocument: 'after' }
  );
  if (!alert) throw new HttpError(404, 'Alert not found');
  res.json(alert);
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  const result = await Alert.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new HttpError(404, 'Alert not found');
  res.status(204).end();
});

export default router;
