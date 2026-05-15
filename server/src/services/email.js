import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendSourceNotification(req) {
  const { name, email, fragrance, message, kind, size } = req;
  const to = process.env.SOURCE_NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM;
  if (!resend || !to || !from) {
    console.warn('[email] Resend not configured — logging request instead:', req);
    return { skipped: true };
  }
  const isSample = kind === 'sample';
  const label = isSample ? 'sample order' : 'full-bottle sourcing request';
  const subject = fragrance
    ? `New ${label}: ${fragrance}${isSample && size ? ` (${size})` : ''}`
    : `New ${label}`;
  const html = `
    <h2>New ${escapeHtml(label)} from Scent Layer</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${fragrance ? `<p><strong>Fragrance:</strong> ${escapeHtml(fragrance)}</p>` : ''}
    ${isSample
      ? `<p><strong>Sample size:</strong> ${escapeHtml(size ?? '—')}</p>`
      : (size ? `<p><strong>Bottle size:</strong> ${escapeHtml(size)}</p>` : '')}
    ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
  `;
  return resend.emails.send({ from, to, replyTo: email, subject, html });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
