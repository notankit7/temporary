import mongoose from 'mongoose';
import { env } from './env.js';

// Hide the password when printing the connection string.
const redact = (uri) => uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:****@');

export async function connectDB() {
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${redact(env.mongoUri)}`);
  } catch (err) {
    console.error(`Could not connect to MongoDB at ${redact(env.mongoUri)}`);
    console.error(err.message);
    console.error(
      'If MongoDB runs on another laptop, check that both are on the same network, ' +
      'mongod has bindIp 0.0.0.0, and port 27017 is allowed through its firewall.'
    );
    process.exit(1);
  }
}
