import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.RESEND_FROM;
const NOTIFY_TO = process.env.SOURCE_NOTIFY_EMAIL;
const BRAND_NAME = 'Scent Layer';
const BRAND_DOMAIN = 'scentlayer.com';

/**
 * Generic helper used by the lifecycle scheduler. Silent no-op if
 * Resend isn't configured (local dev / preview deploys without keys).
 */
export async function sendEmail({ to, from, subject, html }) {
  if (!resend) {
    console.warn('[email] Resend not configured, skipping', subject);
    return { skipped: true };
  }
  try {
    return await resend.emails.send({
      from: from || FROM,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error('[email] send failed', e);
    return { error: e.message };
  }
}

/**
 * Founder notification, fires on every sample order, sourcing request, or
 * multi-item cart order. Goes to SOURCE_NOTIFY_EMAIL (scentlayer@gmail.com).
 */
export async function sendSourceNotification(req) {
  const { name, email, fragrance, message, kind, size, items, address } = req;
  if (!resend || !NOTIFY_TO || !FROM) {
    console.warn('[email] Resend not configured, logging request instead:', req);
    return { skipped: true };
  }

  const isSample = kind === 'sample';
  const isCart   = kind === 'cart';
  const isBottle = kind === 'bottle';
  const label = isCart ? 'multi-item cart order'
             : isSample ? 'sample order'
             : 'full-bottle sourcing request';

  const subject = fragrance ? `New ${label}: ${fragrance}` : `New ${label}`;

  const itemsTable = isCart && Array.isArray(items) && items.length
    ? `
      <h3 style="font-family: Georgia, serif; margin:18px 0 8px;">Order contents</h3>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
        <tr style="background:#eee;"><th align="left">Fragrance</th><th align="left">Brand</th><th>Size</th><th>Qty</th></tr>
        ${items.map(it => `<tr>
          <td>${escapeHtml(it.name)}</td>
          <td>${escapeHtml(it.brand ?? '')}</td>
          <td align="center">${escapeHtml(it.size)}</td>
          <td align="center">${escapeHtml(String(it.qty))}</td>
        </tr>`).join('')}
      </table>
      <p><strong>Total units:</strong> ${items.reduce((s,i)=>s+i.qty,0)}</p>
    `
    : '';

  const html = `
    <h2>New ${escapeHtml(label)} from ${BRAND_NAME}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${address ? `<p><strong>Shipping address:</strong><br/>${escapeHtml(address).replace(/\n/g,'<br/>')}</p>` : ''}
    ${!isCart && fragrance ? `<p><strong>Fragrance:</strong> ${escapeHtml(fragrance)}</p>` : ''}
    ${isSample
      ? `<p><strong>Sample size:</strong> ${escapeHtml(size ?? ',')}</p>`
      : (isBottle && size ? `<p><strong>Bottle size:</strong> ${escapeHtml(size)}</p>` : '')}
    ${itemsTable}
    ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
  `;
  return resend.emails.send({ from: FROM, to: NOTIFY_TO, replyTo: email, subject, html });
}

/**
 * Customer confirmation, branded HTML email back to the customer after
 * placing any kind of order. Sample / bottle / cart all render here with
 * appropriately differentiated copy.
 */
export async function sendCustomerConfirmation(req) {
  const { name, email, fragrance, kind, size, items } = req;
  if (!resend || !FROM) {
    console.warn('[email] Resend not configured, skipping customer confirmation');
    return { skipped: true };
  }
  if (!email) return { skipped: true };

  const isSample = kind === 'sample';
  const isCart   = kind === 'cart';

  const totalQty = isCart && Array.isArray(items) ? items.reduce((s,i)=>s+i.qty,0) : 0;

  const subject = isCart
    ? `Your order of ${totalQty} sample${totalQty !== 1 ? 's' : ''} is being prepared`
    : isSample
      ? (fragrance ? `Your ${size ?? 'sample'} order for ${fragrance}` : 'Your sample order')
      : (fragrance ? `Your sourcing request for ${fragrance}` : 'Your sourcing request');

  const headline = isCart
    ? `Your order is being prepared.`
    : isSample
      ? `Your ${escapeHtml(size ?? 'sample')} is being prepared.`
      : `We received your sourcing request.`;

  const lede = isCart
    ? `Thank you, ${escapeHtml(firstName(name))}. We've logged your order of ${totalQty} sample${totalQty !== 1 ? 's' : ''} and will authenticate, decant, and ship them together within the week. You'll get tracking once the box leaves the studio.`
    : isSample
      ? `Thank you, ${escapeHtml(firstName(name))}. We've logged your order for ${escapeHtml(fragrance ?? 'your selected fragrance')} and we'll authenticate, decant, and ship it within the week. You'll get tracking once it leaves the studio.`
      : `Thank you, ${escapeHtml(firstName(name))}. We're looking for ${escapeHtml(fragrance ?? 'the fragrance you requested')} through our supplier network now. We'll come back within 24 hours with availability and a confirmed price before any bottle changes hands.`;

  // Order summary block, single item card for sample/bottle, line-item table
  // for cart orders.
  const orderBlock = isCart && Array.isArray(items) && items.length ? `
    <table cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,169,110,0.22);margin:8px 0 22px;width:100%;">
      <tr><td style="padding:14px 18px 8px;">
        <p style="font-family:'Inter',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;margin:0 0 12px;">Order summary</p>
        ${items.map(it => `
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:10px;">
            <tr>
              <td>
                <p style="font-family:'Lora',Georgia,serif;font-size:17px;color:#f5f0e8;margin:0;line-height:1.3;">${escapeHtml(it.name)}</p>
                ${it.brand ? `<p style="font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,240,232,0.5);margin:2px 0 0;">${escapeHtml(it.brand)}</p>` : ''}
              </td>
              <td align="right" valign="top" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:rgba(245,240,232,0.65);white-space:nowrap;">
                ${escapeHtml(it.size)} × ${it.qty}
              </td>
            </tr>
          </table>`).join('')}
      </td></tr>
    </table>`
    : fragrance ? `
    <table cellpadding="14" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,169,110,0.22);margin:8px 0 22px;width:100%;">
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;padding-bottom:6px;">${isSample ? 'Sample' : 'Bottle'}</td></tr>
      <tr><td style="font-family:'Lora',Georgia,serif;font-size:20px;color:#f5f0e8;line-height:1.3;">${escapeHtml(fragrance)}${size ? `<br/><span style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:rgba(245,240,232,0.5);">${escapeHtml(size)}</span>` : ''}</td></tr>
    </table>` : '';

  const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#1a1210;font-family:'Lora', Georgia, serif;color:#f5f0e8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1210;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1a1210;">
        <tr><td style="padding:0 0 40px;border-bottom:1px solid rgba(201,169,110,0.18);">
          <p style="font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin:0 0 14px;">Scent Layer</p>
          <h1 style="font-family:'Lora',Georgia,serif;font-size:30px;font-weight:400;line-height:1.2;color:#f5f0e8;margin:0;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:28px 0;">
          <p style="font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.85;color:rgba(245,240,232,0.7);margin:0 0 22px;">${lede}</p>
          ${orderBlock}
          <p style="font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:1.85;color:rgba(245,240,232,0.55);margin:0;">
            Reply to this email if anything needs changing or you've got questions about the order.
          </p>
        </td></tr>
        <tr><td style="padding:28px 0 0;border-top:1px solid rgba(245,240,232,0.07);">
          <p style="font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:0.06em;color:rgba(245,240,232,0.35);margin:0;">
            ${BRAND_NAME} · curated niche &amp; designer fragrances · sampled, sourced, authenticated
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();

  return resend.emails.send({ from: FROM, to: email, subject, html });
}

function firstName(full) {
  if (!full) return 'there';
  return String(full).trim().split(/\s+/)[0] || 'there';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
