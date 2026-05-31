import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { stripe, unitPriceFor, STRIPE_WEBHOOK_SECRET } from '../services/stripe.js';
import { optionalAuth } from '../middleware/auth.js';
import { sendOrderConfirmation } from '../services/emails.js';

const router = Router();

const lineItemShape = z.object({
  fragranceId: z.number().int(),
  name:        z.string(),
  brand:       z.string(),
  size:        z.string(),       // "2ml" | "5ml" | "10ml" | "30ml"
  qty:         z.number().int().min(1).max(20),
});

/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout Session for the supplied cart and returns
 * the redirect URL. The session metadata carries the items so the
 * webhook can record the order on completion.
 */
router.post('/checkout', optionalAuth, async (req, res, next) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Payments not configured' });

    const { items, address, promoCode } = z.object({
      items: z.array(lineItemShape).min(1).max(20),
      address: z.string().max(500).optional(),
      promoCode: z.string().max(40).optional(),
    }).parse(req.body);

    const origin = req.headers.origin || process.env.SITE_URL || 'https://scentlayer.example';

    const line_items = items.map(it => ({
      quantity: it.qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitPriceFor(it.size),
        product_data: {
          name: `${it.name} (${it.size})`,
          description: it.brand,
          metadata: { fragranceId: String(it.fragranceId), size: it.size },
        },
      },
    }));

    // Resolve a promo code into its Stripe promotion_code id so we can
    // hand it to Checkout as a server-applied discount (no need for the
    // user to retype it on the Stripe-hosted page).
    let stripeDiscounts = undefined;
    if (promoCode) {
      try {
        const list = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
        if (list.data?.[0]) {
          stripeDiscounts = [{ promotion_code: list.data[0].id }];
        }
      } catch { /* silent, checkout still proceeds at full price */ }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      // Collect shipping during checkout so we don't need our own form.
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'] },
      // Stripe Tax pulls per-jurisdiction rates if enabled in the dashboard.
      automatic_tax: { enabled: false },
      // Either pre-applied promo code (from a referral landing) OR
      // allow the customer to enter one manually on the Stripe page.
      discounts: stripeDiscounts,
      allow_promotion_codes: stripeDiscounts ? undefined : true,
      // Used by the webhook to write the Order row.
      metadata: {
        userId: req.userId || '',
        cart: JSON.stringify(items),
        note: (address || '').slice(0, 400),
      },
      success_url: `${origin}/profile?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?cart=cancelled`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) { next(err); }
});

/**
 * POST /api/payments/webhook
 * Stripe posts here on every event. We only care about the
 * checkout.session.completed event, on which we persist the Order
 * and fire the confirmation email.
 *
 * Mounted with express.raw() so the signature can be verified — the
 * mount in index.js MUST use a raw body parser, not the JSON parser.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).end();
  const sig = req.headers['stripe-signature'];
  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Webhook signature missing');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('[stripe] webhook signature verification failed', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true, type: event.type });
  }

  const session = event.data.object;

  try {
    // Idempotent — if a duplicate event lands we just acknowledge.
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existing) return res.json({ received: true, duplicate: true });

    const meta = session.metadata || {};
    const items = meta.cart ? JSON.parse(meta.cart) : [];

    const order = await prisma.order.create({
      data: {
        userId:          meta.userId || null,
        email:           session.customer_details?.email || session.customer_email,
        stripeSessionId: session.id,
        amountTotal:     session.amount_total,
        currency:        session.currency,
        status:          'paid',
        items,
        address:         session.shipping_details || (meta.note ? { note: meta.note } : null),
      },
    });

    // Confirmation email goes out immediately on order creation.
    sendOrderConfirmation(order).catch(e => console.error('[email]', e));

    res.json({ received: true });
  } catch (e) {
    console.error('[stripe:webhook] processing failed', e);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * POST /api/payments/run-lifecycle
 * Manually triggers the lifecycle email scheduler. Protected by a
 * shared secret in the body, set CRON_SECRET in env and use that as
 * the `secret` field. Useful for hooking up to Vercel Cron or
 * Railway's scheduled jobs.
 */
router.post('/run-lifecycle', async (req, res, next) => {
  try {
    const { secret } = z.object({ secret: z.string() }).parse(req.body);
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { runLifecycleEmails } = await import('../services/emails.js');
    const result = await runLifecycleEmails();
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
