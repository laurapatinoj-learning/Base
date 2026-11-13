import { all, get, run, tx } from './db.js';
import { hashPassword } from './auth.js';
import { fichas, products, course, events } from './content.js';
import { nowIso, slugify } from './util.js';

export const DEMO = {
  admin: { email: 'admin@baseparkway.test', pass: process.env.ADMIN_PASSWORD || 'Admin#2026', name: 'Administración Base Parkway' },
  student: { email: 'estudiante@baseparkway.test', pass: 'Estudiante#2026', name: 'Estudiante de Prueba' },
};

export function seedIfEmpty() {
  if (get('SELECT COUNT(*) n FROM users').n) return false;
  tx(() => {
    const now = nowIso();
    const u = (x, role) => run('INSERT INTO users(email,name,pass_hash,role,created_at) VALUES(?,?,?,?,?)', x.email, x.name, hashPassword(x.pass), role, now).lastInsertRowid;
    u(DEMO.admin, 'admin'); const sid = u(DEMO.student, 'user');
    for (const f of fichas) run('INSERT INTO fichas(slug,title,subtitle,summary,body,kind,year,source,tags,ord,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', f.slug, f.title, f.subtitle, f.summary, f.body, f.kind, f.year, 'Almonacid Sierra (2025), Periódico UNAL', f.tags, f.ord, now);
    const cid = run('INSERT INTO courses(slug,title,summary,level,free) VALUES(?,?,?,?,?)', course.slug, course.title, course.summary, course.level, course.free).lastInsertRowid;
    const lessonIds = [];
    course.modules.forEach((m, mi) => {
      const mid = run('INSERT INTO modules(course_id,title,ord) VALUES(?,?,?)', cid, m.title, mi + 1).lastInsertRowid;
      m.lessons.forEach((l, li) => lessonIds.push(run('INSERT INTO lessons(module_id,title,kind,body,minutes,quiz,ord) VALUES(?,?,?,?,?,?,?)', mid, l.title, l.kind, l.body, l.minutes, l.quiz ? JSON.stringify(l.quiz) : '', li + 1).lastInsertRowid));
    });
    for (const r of course.resources) run('INSERT INTO resources(course_id,title,url,kind) VALUES(?,?,?,?)', cid, r.title, r.url, r.kind);
    products.forEach((p, i) => run('INSERT INTO products(slug,title,description,kind,price,stock,file,course_id,ficha_id,ord) VALUES(?,?,?,?,?,?,?,?,?,?)', p.slug, p.title, p.description, p.kind, p.price, p.stock ?? null, p.file || '', p.course ? cid : null, p.ficha ? get('SELECT id FROM fichas WHERE ord=?', p.ficha).id : null, i + 1));
    for (const p of all("SELECT id,stock FROM products WHERE stock IS NOT NULL")) run("INSERT INTO stock_moves(product_id,delta,reason,created_at) VALUES(?,?,'Inventario inicial',?)", p.id, p.stock, now);
    for (const e of events) {
      const d = new Date(); d.setUTCDate(d.getUTCDate() + e.days); d.setUTCHours(e.hour + 5, 0, 0, 0);
      run('INSERT INTO events(slug,title,description,starts_at,ends_at,location,mode,capacity) VALUES(?,?,?,?,?,?,?,?)', e.slug, e.title, e.description, d.toISOString(), new Date(d.getTime() + e.dur * 36e5).toISOString(), e.location, e.mode, e.capacity);
    }
    // Matrícula de prueba con avance registrado (3 de 8 lecciones)
    run('INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?)', sid, cid, now);
    lessonIds.slice(0, 3).forEach((l, i) => run('INSERT INTO progress(user_id,lesson_id,score,completed_at) VALUES(?,?,?,?)', sid, l, i === 2 ? 100 : null, now));
    run("INSERT INTO subscribers(email,name,status,token,created_at,confirmed_at) VALUES('lector@baseparkway.test','Lector de prueba','active','seed-token-lector',?,?)", now, now);
    run("INSERT INTO campaigns(subject,body,status) VALUES('Bienvenida a la Colección Ishango','Hola,\n\nYa están disponibles las cinco fichas editoriales y el curso piloto «Ishango y los números primos».\n\nExplora el archivo y matricúlate en el aula.','draft')");
  });
  return true;
}
export { slugify };
