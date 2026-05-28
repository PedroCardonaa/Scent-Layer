// Lifecycle email templates + the runLifecycleEmails() function the
// scheduler (cron / Vercel scheduled function / Railway cron) calls
// periodically. Each email is sent at most once per order via the
// emailed* flags on the Order model.

import { prisma } from '../db.js';
import { sendEmail } from './email.js';

const SITE_URL = process.env.SITE_URL || 'https://scentlayer.example';
const FROM     = process.env.RESEND_FROM || 'Scent Layer <hello@scentlayer.example>';

// ── Templates ──────────────────────────────────────────────────────
function template({ title, eyebrow, lead, body, cta }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: Georgia, serif; background:#faf8f4; color:#1a1612; padding:32px 16px; margin:0;">
  <div style="max-width:520px; margin:0 auto; background:#ffffff; padding:48px 36px; border-radius:12px;">
    <p style="font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#c9a96e; margin:0 0 18px;">${eyebrow}</p>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:28px; line-height:1.2; margin:0 0 16px;">${title}</h1>
    ${lead ? `<p style="font-style:italic; font-size:15px; color:#8b7d6b; margin:0 0 18px;">${lead}</p>` : ''}
    <div style="font-size:15px; line-height:1.7; color:#1a1612; margin:0 0 28px;">${body}</div>
    ${cta ? `<p style="margin:28px 0 0;"><a href="${cta.href}" style="background:#1a1612; color:#f5f0e8; padding:14px 22px; text-decoration:none; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; border-radius:4px; display:inline-block;">${cta.label}</a></p>` : ''}
    <hr style="border:none; border-top:1px solid rgba(0,0,0,0.08); margin:36px 0 18px;">
    <p style="font-size:11px; color:#8b7d6b; letter-spacing:0.1em;">Scent Layer, samples first. <a href="${SITE_URL}" style="color:#c9a96e;">scentlayer.com</a></p>
  </div>
</body></html>`;
}

function itemList(items) {
  return items.map(it =>
    `<div style="padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
       <strong>${it.name}</strong> by ${it.brand}<br>
       <span style="color:#8b7d6b; font-size:13px;">${it.size} × ${it.qty}</span>
     </div>`
  ).join('');
}

function fmtMoney(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

// ── Templates per stage ────────────────────────────────────────────
function confirmationHtml(order) {
  return template({
    eyebrow: 'Order received',
    title: 'Your samples are on the way.',
    lead: 'We\'ll decant them this week and ship Friday.',
    body: `Thanks for ordering, here's what you picked:<br><br>${itemList(order.items)}<br>
           <strong>Total: ${fmtMoney(order.amountTotal, order.currency)}</strong>`,
    cta: { href: `${SITE_URL}/profile`, label: 'View your wardrobe' },
  });
}

function shippedHtml(order) {
  return template({
    eyebrow: 'Shipped',
    title: 'Your decants are on their way.',
    body: `Your order is in the mail. Tracking info will come from the carrier.<br><br>${itemList(order.items)}`,
  });
}

function reviewPromptHtml(order) {
  const first = order.items[0];
  return template({
    eyebrow: 'How did it sit?',
    title: 'A quick read on what you sampled.',
    lead: 'Loved it, liked it, or fought your skin?',
    body: `It's been about ten days. ${first ? `Tell us how <strong>${first.name}</strong> wore.` : ''} Your reviews tune your future recommendations and help the next person decide.`,
    cta: { href: `${SITE_URL}/profile#reviews`, label: 'Leave your review' },
  });
}

function reorderPromptHtml(order) {
  const first = order.items[0];
  return template({
    eyebrow: 'Running low?',
    title: first ? `Reorder ${first.name}.` : 'Time for the next pour.',
    body: `It's been about a month since your samples shipped. If you've worn one consistently, here's the easy reorder.${first ? `<br><br>Most-worn from your last order: <strong>${first.name}</strong> in ${first.size}.` : ''}`,
    cta: { href: `${SITE_URL}/shop`, label: 'Reorder samples' },
  });
}

// ── Scheduler ─────────────────────────────────────────────────────
// Idempotent, runs as often as you like (hourly is plenty). Each email
// path checks its own flag + the time elapsed since the trigger event.
// The Order model's emailed* flags prevent double-sends.
export async function runLifecycleEmails() {
  const now = new Date();
  let sent = 0;

  // T+5 day shipped notification. Real impl: replace this with an
  // actual carrier webhook. For now we mark "shipped" 5 days after
  // order if the operator hasn't flipped shippedAt manually.
  const shippedCandidates = await prisma.order.findMany({
    where: {
      emailedShipped: false,
      shippedAt: null,
      status: 'paid',
      createdAt: { lte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    },
    take: 50,
  });
  for (const o of shippedCandidates) {
    try {
      await sendEmail({ to: o.email, from: FROM, subject: 'Your Scent Layer samples shipped', html: shippedHtml(o) });
      await prisma.order.update({
        where: { id: o.id },
        data: { emailedShipped: true, shippedAt: now },
      });
      sent++;
    } catch (e) { console.error('[lifecycle:shipped]', e); }
  }

  // T+10 review prompt, 10 days after the order was created (5 days
  // after the synthetic ship date above).
  const reviewCandidates = await prisma.order.findMany({
    where: {
      emailedReviewPrompt: false,
      createdAt: { lte: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    },
    take: 50,
  });
  for (const o of reviewCandidates) {
    try {
      await sendEmail({ to: o.email, from: FROM, subject: 'How did your Scent Layer samples wear?', html: reviewPromptHtml(o) });
      await prisma.order.update({ where: { id: o.id }, data: { emailedReviewPrompt: true } });
      sent++;
    } catch (e) { console.error('[lifecycle:review]', e); }
  }

  // T+30 reorder prompt.
  const reorderCandidates = await prisma.order.findMany({
    where: {
      emailedReorder: false,
      createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    take: 50,
  });
  for (const o of reorderCandidates) {
    try {
      await sendEmail({ to: o.email, from: FROM, subject: 'Running low on your samples?', html: reorderPromptHtml(o) });
      await prisma.order.update({ where: { id: o.id }, data: { emailedReorder: true } });
      sent++;
    } catch (e) { console.error('[lifecycle:reorder]', e); }
  }

  return { sent };
}

// Confirmation email is sent inline from the Stripe webhook the moment
// the order is recorded, not from the scheduler.
export async function sendOrderConfirmation(order) {
  await sendEmail({
    to: order.email,
    from: FROM,
    subject: 'Your Scent Layer order is in',
    html: confirmationHtml(order),
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { emailedConfirmation: true },
  });
}
