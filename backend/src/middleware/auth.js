import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Requires "Authorization: Bearer <token>" and attaches the user to req.user.
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Not logged in');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account no longer exists');

  req.user = user;
  next();
}
