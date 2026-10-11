import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import sensorRoutes from './routes/sensors.js';
import advisoryRoutes from './routes/advisory.js';
import irrigationRoutes from './routes/irrigation.js';
import alertRoutes from './routes/alerts.js';
import cropRoutes from './routes/crops.js';
import weatherRoutes from './routes/weather.js';

const app = express();

app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: 'ok', database: states[mongoose.connection.readyState] ?? 'unknown', time: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/sensors', requireAuth, sensorRoutes);
app.use('/api/advisory', requireAuth, advisoryRoutes);
app.use('/api/irrigation', requireAuth, irrigationRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);
app.use('/api/weather', requireAuth, weatherRoutes);

// When the React app has been built (npm run build -> dist/), serve it from
// here too, so the whole site runs as a single service when hosted.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
const indexHtml = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(distDir));
  // Any other GET (e.g. /app/dashboard) is a React Router page.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(indexHtml);
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
