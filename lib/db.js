import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const file = process.env.DB_FILE || new URL('../data/base.db', import.meta.url).pathname;
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;');

const norm = (p) => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? +v : v));
export const all = (sql, ...p) => db.prepare(sql).all(...norm(p));
export const get = (sql, ...p) => db.prepare(sql).get(...norm(p));
export const run = (sql, ...p) => db.prepare(sql).run(...norm(p));
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pass_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS fichas(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, subtitle TEXT DEFAULT '', summary TEXT DEFAULT '', body TEXT DEFAULT '', kind TEXT DEFAULT 'Ficha', year INTEGER, source TEXT DEFAULT '', tags TEXT DEFAULT '', ord INTEGER DEFAULT 0, published INTEGER DEFAULT 1, updated_at TEXT);
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, summary TEXT DEFAULT '', level TEXT DEFAULT 'Introductorio', free INTEGER DEFAULT 1, published INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', kind TEXT NOT NULL DEFAULT 'digital', price INTEGER NOT NULL DEFAULT 0, stock INTEGER, file TEXT DEFAULT '', course_id INTEGER REFERENCES courses(id), ficha_id INTEGER REFERENCES fichas(id), published INTEGER DEFAULT 1, ord INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS stock_moves(id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, delta INTEGER NOT NULL, reason TEXT, order_id INTEGER, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cart_items(cart_key TEXT NOT NULL, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, qty INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(cart_key, product_id));
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id), email TEXT NOT NULL, name TEXT NOT NULL, address TEXT DEFAULT '', total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_ref TEXT, card_last4 TEXT, failure TEXT, created_at TEXT NOT NULL, paid_at TEXT);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL, price INTEGER NOT NULL, qty INTEGER NOT NULL, download_token TEXT UNIQUE, downloads INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS downloads_log(id INTEGER PRIMARY KEY, order_item_id INTEGER, user_id INTEGER, ip TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', starts_at TEXT NOT NULL, ends_at TEXT, location TEXT DEFAULT '', mode TEXT DEFAULT 'Virtual', capacity INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS event_regs(id INTEGER PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(event_id, email));
CREATE TABLE IF NOT EXISTS subscribers(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', token TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, confirmed_at TEXT);
CREATE TABLE IF NOT EXISTS campaigns(id INTEGER PRIMARY KEY, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT DEFAULT 'draft', sent_at TEXT, recipients INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT DEFAULT '', body TEXT NOT NULL, status TEXT DEFAULT 'nuevo', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS outbox(id INTEGER PRIMARY KEY, to_email TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, kind TEXT DEFAULT '', status TEXT DEFAULT 'logged', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS modules(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, ord INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE, title TEXT NOT NULL, kind TEXT DEFAULT 'Lectura', body TEXT DEFAULT '', minutes INTEGER DEFAULT 10, quiz TEXT DEFAULT '', ord INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS resources(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL, title TEXT NOT NULL, url TEXT NOT NULL, kind TEXT DEFAULT 'Enlace');
CREATE TABLE IF NOT EXISTS enrollments(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, created_at TEXT NOT NULL, UNIQUE(user_id, course_id));
CREATE TABLE IF NOT EXISTS progress(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, score INTEGER, completed_at TEXT NOT NULL, PRIMARY KEY(user_id, lesson_id));
CREATE TABLE IF NOT EXISTS hits(id INTEGER PRIMARY KEY, ts TEXT NOT NULL, sid TEXT, user_id INTEGER, path TEXT NOT NULL, ref TEXT);
CREATE TABLE IF NOT EXISTS track(id INTEGER PRIMARY KEY, ts TEXT NOT NULL, sid TEXT, user_id INTEGER, type TEXT NOT NULL, label TEXT, meta TEXT);
CREATE TABLE IF NOT EXISTS blocks(id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, title TEXT DEFAULT '', body TEXT DEFAULT '', title_en TEXT DEFAULT '', body_en TEXT DEFAULT '', title_pt TEXT DEFAULT '', body_pt TEXT DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_hits_ts ON hits(ts); CREATE INDEX IF NOT EXISTS idx_track_type ON track(type, ts);
`);
