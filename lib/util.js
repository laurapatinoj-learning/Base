// Utilidades: plantillas HTML con escape automático, formato y markdown mínimo.
export class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s ?? ''));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(val).join('') : v == null || v === false ? '' : esc(v));
export function html(strs, ...vals) { let o = strs[0]; vals.forEach((v, i) => { o += val(v) + strs[i + 1]; }); return new Raw(o); }

export const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
export const fdate = (iso, opts = { dateStyle: 'long', timeStyle: 'short' }) => iso ? new Intl.DateTimeFormat('es-CO', { ...opts, timeZone: 'America/Bogota' }).format(new Date(iso)) : '';
export const fday = (iso) => fdate(iso, { dateStyle: 'long' });
export const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
export const nowIso = () => new Date().toISOString();
export const isEmail = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

// Markdown mínimo y seguro: ## títulos, listas "- ", **negrita**, *cursiva*, [txt](url)
export function md(src) {
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (_, a, u) => `<a href="${u.replace(/"/g, '%22')}">${a}</a>`);
  const out = [];
  for (const block of String(src || '').replace(/\r/g, '').split(/\n{2,}/)) {
    const b = block.trim(); if (!b) continue;
    if (/^#{2,3} /.test(b)) { const l = b.startsWith('###') ? 3 : 2; out.push(`<h${l + 1}>${inline(b.replace(/^#+\s/, ''))}</h${l + 1}>`); }
    else if (/^- /.test(b)) out.push('<ul>' + b.split('\n').map((x) => `<li>${inline(x.replace(/^- /, ''))}</li>`).join('') + '</ul>');
    else if (/^> /.test(b)) out.push(`<blockquote>${inline(b.replace(/^> ?/gm, ' ').trim())}</blockquote>`);
    else out.push(`<p>${inline(b).replace(/\n/g, '<br>')}</p>`);
  }
  return raw(out.join('\n'));
}
export const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
