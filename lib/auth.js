import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { get, run } from './db.js';
import { nowIso } from './util.js';

export const hashPassword = (pw) => { const salt = randomBytes(16); return `scrypt$${salt.toString('hex')}$${scryptSync(pw, salt, 64).toString('hex')}`; };
export function verifyPassword(pw, stored) {
  const [alg, salt, hash] = String(stored).split('$'); if (alg !== 'scrypt') return false;
  const a = Buffer.from(hash, 'hex'), b = scryptSync(pw, Buffer.from(salt, 'hex'), 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
const th = (t) => createHash('sha256').update(t).digest('hex');
export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  run('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)', th(token), userId, new Date(Date.now() + 14 * 864e5).toISOString());
  return token;
}
export function userFromToken(token) {
  if (!token) return null;
  return get('SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', th(token), nowIso()) || null;
}
export const destroySession = (token) => token && run('DELETE FROM sessions WHERE token_hash=?', th(token));
export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Usa letras y números en la contraseña.';
  return null;
}
// Límite simple de intentos (en memoria)
const tries = new Map();
export function rateLimit(key, max = 8, windowMs = 10 * 60e3) {
  const now = Date.now(); const arr = (tries.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { tries.set(key, arr); return false; }
  arr.push(now); tries.set(key, arr); return true;
}
