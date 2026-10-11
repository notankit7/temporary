import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { ensureDemoAccount, DEMO_EMAIL } from './services/demo.js';
import app from './app.js';

await connectDB();

// On a fresh database (e.g. a newly hosted site), create the demo account
// automatically so there's nothing to run by hand.
if (env.seedDemo && (await ensureDemoAccount())) {
  console.log(`Created demo account ${DEMO_EMAIL}`);
}

app.listen(env.port, () => {
  console.log(`AgriSense API running on http://localhost:${env.port}/api`);
});
