import { writeFileSync } from 'node:fs';
import { fichas, course, ISHANGO, SRC, SRC_URL } from '../lib/content.js';
writeFileSync(new URL('../storage/content.json', import.meta.url), JSON.stringify({ fichas, course, ISHANGO, SRC, SRC_URL }, null, 1));
console.log('storage/content.json listo');
