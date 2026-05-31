import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { stripe, unitPriceFor, STRIPE_WEBHOOK_SECRET } from '../services/stripe.js';
import { optionalAuth } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';

const router = Router();

const SITE_URL = process.env.SITE_URL || 'https://scentlayer.example';
const FROM     = process.env.RESEND_FROM || 'Scent Layer <hello@scentlayer.example>';

const lineItemShape = z.object({
  fragranceId: z.number().int(),
  name:        z.string(),
  brand:       z.string(),
  size:        z.string(),
  qty:         z.number().int().min(1).max(20),
});

function generateSlug() {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

/**
 * POST /api/gifts/checkout
 * Builds a Stripe Checkout Session for a gift order. Session metadata
 * carries the recipient details so the webhook can persist the
 * GiftOrder + fire the recipient email after payment clears.
 */
router.post('/checkout', optionalAuth, async (req, res, next) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Payments not configured' });

    const body = z.object({
      items: z.array(lineItemShape).min(1).max(20),
      senderName:     z.string().min(1).max(120),
      senderEmail:    z.string().email().max(200),
      recipientName:  z.string().min(1).max(120),
      recipientEmail: z.string().email().max(200),
      message:        z.string().max(800).optional(),
    }).parse(req.body);

    const origin = req.headers.origin || SITE_URL;

    const line_items = body.items.map(it => ({
      quantity: it.qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitPriceFor(it.size),
        product_data: {
          name: `${it.name} (${it.size}) , Gift for ${body.recipientName}`,
          description: it.brand,
          metadata: { fragranceId: String(it.fragranceId), size: it.size },
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'] },
      customer_email: body.senderEmail,
      metadata: {
        kind: 'gift',
        userId: req.userId || '',
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        recipientName: body.recipientName,
        recipientEmail: body.recipientEmail,
        message: (body.message || '').slice(0, 600),
        cart: JSON.stringify(body.items),
      },
      success_url: `${origin}/?gift=sent`,
      cancel_url:  `${origin}/?gift=cancelled`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) { next(err); }
});

/**
 * POST /api/gifts/webhook
 * Stripe posts here for gift checkout completions. We persist the
 * GiftOrder, then fire the recipient email. Mounted with express.raw
 * (see index.js mount order).
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).end();
  const sig = req.headers['stripe-signature'];
  if (!sig || !STRIPE_WEBHOOK_SECRET) return res.status(400).send('Signature missing');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  if (event.type !== 'checkout.session.completed') return res.json({ received: true });

  const session = event.data.object;
  const meta = session.metadata || {};
  if (meta.kind !== 'gift') return res.json({ received: true, skipped: 'not a gift' });

  try {
    const existing = await prisma.giftOrder.findUnique({ where: { stripeSessionId: session.id } });
    if (existing) return res.json({ received: true, duplicate: true });

    const items = meta.cart ? JSON.parse(meta.cart) : [];

    // Generate a unique slug for the reveal page.
    let slug;
    for (let i = 0; i < 8; i++) {
      const candidate = generateSlug();
      const taken = await prisma.giftOrder.findUnique({ where: { slug: candidate } });
      if (!taken) { slug = candidate; break; }
    }
    if (!slug) slug = generateSlug() + Date.now().toString(36).slice(-3);

    const gift = await prisma.giftOrder.create({
      data: {
        slug,
        senderUserId:   meta.userId || null,
        senderName:     meta.senderName,
        senderEmail:    meta.senderEmail,
        recipientName:  meta.recipientName,
        recipientEmail: meta.recipientEmail,
        message:        meta.message || null,
        items,
        amountTotal:    session.amount_total,
        currency:       session.currency,
        stripeSessionId: session.id,
      },
    });

    // Fire the recipient email immediately. Sender confirmation goes
    // through the standard checkout confirmation path (Stripe sends
    // its own receipt; we could layer ours later).
    const revealUrl = `${SITE_URL}/gift/${gift.slug}`;
    const itemList = gift.items.map(it =>
      `<div style="padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);"><strong>${it.name}</strong> by ${it.brand} <span style="color:#8b7d6b; font-size:13px;">, ${it.size}</span></div>`
    ).join('');

    await sendEmail({
      to: gift.recipientEmail,
      from: FROM,
      subject: `${gift.senderName} sent you a Scent Layer gift`,
      html: `<!doctype html><html><body style="font-family: Georgia, serif; background:#faf8f4; padding:32px 16px;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:48px 36px; border-radius:12px;">
    <p style="font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#c9a96e; margin:0 0 18px;">A gift for you</p>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:30px; line-height:1.2; margin:0 0 12px;">${escapeHtml(gift.senderName)} picked you some scent.</h1>
    <p style="font-style:italic; font-size:16px; color:#8b7d6b; margin:0 0 24px;">Open it to see what they chose, and why.</p>
    ${gift.message ? `<blockquote style="border-left:2px solid #c9a96e; padding:8px 16px; margin:24px 0; font-style:italic; color:#1a1612;">${escapeHtml(gift.message)}</blockquote>` : ''}
    <div style="font-size:14px; color:#1a1612; margin:16px 0 28px;">${itemList}</div>
    <p style="margin:0 0 16px;">
      <a href="${revealUrl}" style="background:#1a1612; color:#f5f0e8; padding:14px 22px; text-decoration:none; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; border-radius:4px; display:inline-block;">Open your gift</a>
    </p>
    <hr style="border:none; border-top:1px solid rgba(0,0,0,0.08); margin:36px 0 18px;">
    <p style="font-size:11px; color:#8b7d6b; letter-spacing:0.1em;">Scent Layer, samples first. <a href="${SITE_URL}" style="color:#c9a96e;">scentlayer.com</a></p>
  </div>
</body></html>`,
    });

    await prisma.giftOrder.update({
      where: { id: gift.id },
      data: { emailedRecipient: true },
    });

    res.json({ received: true });
  } catch (e) {
    console.error('[gifts:webhook]', e);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * GET /api/gifts/:slug
 * Public, used by the gift reveal page to fetch the gift details.
 * Marks openedAt the first time it's hit.
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const gift = await prisma.giftOrder.findUnique({ where: { slug } });
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    if (!gift.openedAt) {
      await prisma.giftOrder.update({ where: { slug }, data: { openedAt: new Date() } });
    }
    res.json({
      senderName:    gift.senderName,
      recipientName: gift.recipientName,
      message:       gift.message,
      items:         gift.items,
      createdAt:     gift.createdAt,
    });
  } catch (err) { next(err); }
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default router;
