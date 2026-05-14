import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendSourceNotification({ name, email, fragrance, message }) {
  const to = process.env.SOURCE_NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM;
  if (!resend || !to || !from) {
    console.warn('[email] Resend not configured — logging source request instead:', { name, email, fragrance, message });
    return { skipped: true };
  }
  const subject = fragrance ? `New source request: ${fragrance}` : 'New source request';
  const html = `
    <h2>New sourcing request from Scent Layer</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${fragrance ? `<p><strong>Fragrance:</strong> ${escapeHtml(fragrance)}</p>` : ''}
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
