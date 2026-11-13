// Pasarela de pago. Proveedor por defecto: "sandbox" (simulado, para pruebas).
// Nunca se guarda el número completo de la tarjeta: solo los últimos 4 dígitos.
// Para producción, implementa otro proveedor con la misma interfaz `charge()` (p. ej. Wompi, Stripe o PayU)
// y selecciónalo con PAYMENT_PROVIDER.
import { randomBytes } from 'node:crypto';

const luhn = (n) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return s % 10 === 0; };

export const gateway = {
  name: process.env.PAYMENT_PROVIDER || 'sandbox',
  testCards: [{ number: '4242 4242 4242 4242', result: 'Aprobada' }, { number: '4000 0000 0000 0002', result: 'Rechazada' }, { number: '4000 0000 0000 9995', result: 'Fondos insuficientes' }],
  async charge({ amount, card, exp, cvc }) {
    const num = String(card || '').replace(/\D/g, '');
    if (num.length < 13 || num.length > 19 || !luhn(num)) return { ok: false, reason: 'Número de tarjeta inválido.' };
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(exp || '').trim());
    if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) < new Date()) return { ok: false, reason: 'Fecha de vencimiento inválida.' };
    if (!/^\d{3,4}$/.test(String(cvc || ''))) return { ok: false, reason: 'CVC inválido.' };
    if (this.name !== 'sandbox') return { ok: false, reason: 'Proveedor de pago no configurado.' };
    if (num === '4000000000000002') return { ok: false, reason: 'La tarjeta fue rechazada por el emisor.' };
    if (num === '4000000000009995') return { ok: false, reason: 'Fondos insuficientes.' };
    return { ok: true, ref: 'SBX-' + randomBytes(5).toString('hex').toUpperCase(), last4: num.slice(-4), amount };
  },
};
