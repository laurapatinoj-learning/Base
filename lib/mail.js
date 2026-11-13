// Correos: siempre se registran en la bandeja de salida (tabla `outbox` + archivos .eml).
// Si defines RESEND_API_KEY y MAIL_FROM, además se envían por Resend (https://resend.com).
import { mkdirSync, writeFileSync } from 'node:fs';
import { run } from './db.js';
import { nowIso } from './util.js';

export const SITE = () => process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
const dir = new URL('../data/outbox/', import.meta.url).pathname;

export async function sendMail(to, subject, body, kind = '') {
  let status = 'logged';
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text: body }) });
      status = r.ok ? 'sent' : `error ${r.status}`;
    } catch { status = 'error red'; }
  }
  const info = run('INSERT INTO outbox(to_email,subject,body,kind,status,created_at) VALUES(?,?,?,?,?,?)', to, subject, body, kind, status, nowIso());
  if (process.env.DB_FILE !== ':memory:') {
    try { mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}${info.lastInsertRowid}-${kind || 'mail'}.eml`, `To: ${to}\nSubject: ${subject}\nDate: ${new Date().toUTCString()}\nContent-Type: text/plain; charset=utf-8\n\n${body}\n`); } catch { /* opcional */ }
  }
  return status;
}
const sign = '\n\n—\nBase Parkway · Editorial y aula académica\n';
export const mails = {
  welcome: (n) => ['Bienvenida/o a Base Parkway', `Hola ${n},\n\nTu cuenta está lista. Puedes explorar el archivo del Hueso de Ishango, comprar en el catálogo y matricularte en el Aula.\n\n${SITE()}/aula${sign}`],
  order: (o, items) => [`Pedido ${o.code} confirmado`, `Hola ${o.name},\n\nRecibimos tu pago (${o.card_last4 ? 'tarjeta •••• ' + o.card_last4 : 'sin costo'}). Resumen:\n\n${items.map((i) => `· ${i.qty} × ${i.title} — $${(i.price * i.qty).toLocaleString('es-CO')} COP`).join('\n')}\n\nTotal: $${o.total.toLocaleString('es-CO')} COP\n\nSigue tu pedido: ${SITE()}/pedidos/${o.code}${sign}`],
  delivery: (o, items) => [`Tu entrega digital — pedido ${o.code}`, `Hola ${o.name},\n\nTus archivos están listos. Inicia sesión con esta cuenta y descárgalos (máx. 5 descargas por archivo):\n\n${items.map((i) => `· ${i.title}: ${SITE()}/descargas/${i.download_token}`).join('\n')}${sign}`],
  enroll: (n, c) => [`Matrícula confirmada: ${c}`, `Hola ${n},\n\nYa estás matriculada/o en «${c}». Tu avance se guarda automáticamente.\n\n${SITE()}/aula${sign}`],
  confirmNews: (t) => ['Confirma tu suscripción al boletín', `Para recibir el boletín de Base Parkway, confirma tu correo:\n\n${SITE()}/newsletter/confirmar?token=${t}\n\nSi no fuiste tú, ignora este mensaje.${sign}`],
  welcomeNews: (t) => ['Suscripción confirmada', `Listo: recibirás novedades del archivo, la agenda y el aula.\n\nPara darte de baja: ${SITE()}/newsletter/baja?token=${t}${sign}`],
  event: (n, e) => [`Inscripción a «${e.title}»`, `Hola ${n},\n\nTu cupo está confirmado.\nCuándo: ${new Date(e.starts_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' })}\nDónde: ${e.location || e.mode}\n\nAgrégalo a tu calendario: ${SITE()}/agenda/${e.slug}.ics${sign}`],
  contact: (n) => ['Recibimos tu mensaje', `Hola ${n},\n\nGracias por escribirnos. Te responderemos en un máximo de 2 días hábiles.${sign}`],
};
