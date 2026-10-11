// Creates (or resets) a demo account with a day of sensor history.
// Usage: npm run seed
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { ensureDemoAccount, DEMO_EMAIL, DEMO_PASSWORD } from './services/demo.js';

await connectDB();
await ensureDemoAccount({ reset: true });
console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
await mongoose.disconnect();
